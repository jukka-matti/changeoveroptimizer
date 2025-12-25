import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleGreet,
  handleReadFile,
  handleWriteFile,
  handleListTemplates,
  handleSaveTemplate,
  handleDeleteTemplate,
  handleOpenDialog,
  handleSaveDialog,
} from './ipc-handlers';
import fs from 'fs/promises';
import { dialog, BrowserWindow } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import type { StoredTemplate } from './types';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn(),
  },
  BrowserWindow: {
    fromWebContents: vi.fn(),
  },
}));
vi.mock('./db/queries/templates', () => ({
  getAllTemplates: vi.fn(),
  saveTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
}));

// Import mocked template functions
import { getAllTemplates, saveTemplate, deleteTemplate } from './db/queries/templates';

describe('IPC Handlers', () => {
  let mockEvent: IpcMainInvokeEvent;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock event object
    mockEvent = {
      sender: {
        id: 1,
        // Add other properties that might be accessed
      },
    } as any;

    // Mock BrowserWindow.fromWebContents to return a window
    vi.mocked(BrowserWindow.fromWebContents).mockReturnValue({
      id: 1,
    } as any);
  });

  describe('handleGreet', () => {
    it('should return greeting with name', async () => {
      const result = await handleGreet(mockEvent, { name: 'John' });

      expect(result).toBe('Hello, John! You\'ve been greeted from Electron!');
    });

    it('should work with empty name', async () => {
      const result = await handleGreet(mockEvent, { name: '' });

      expect(result).toBe('Hello, ! You\'ve been greeted from Electron!');
    });

    it('should work with special characters in name', async () => {
      const result = await handleGreet(mockEvent, { name: 'Jükkä-Mätti' });

      expect(result).toContain('Jükkä-Mätti');
    });
  });

  describe('handleReadFile', () => {
    it('should read file and return array buffer', async () => {
      const mockBuffer = Buffer.from([1, 2, 3, 4, 5]);
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

      const result = await handleReadFile(mockEvent, { path: '/test/file.xlsx' });

      expect(result).toEqual([1, 2, 3, 4, 5]);
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.xlsx');
    });

    it('should handle empty file', async () => {
      const mockBuffer = Buffer.from([]);
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

      const result = await handleReadFile(mockEvent, { path: '/test/empty.txt' });

      expect(result).toEqual([]);
    });

    it('should throw error when file not found', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(
        Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' })
      );

      await expect(
        handleReadFile(mockEvent, { path: '/nonexistent.xlsx' })
      ).rejects.toThrow('Failed to read file');
    });

    it('should throw error on permission denied', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(
        Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })
      );

      await expect(
        handleReadFile(mockEvent, { path: '/protected/file.xlsx' })
      ).rejects.toThrow('Failed to read file');
    });

    it('should handle large files', async () => {
      const largeBuffer = Buffer.alloc(1024 * 1024); // 1MB
      vi.mocked(fs.readFile).mockResolvedValue(largeBuffer);

      const result = await handleReadFile(mockEvent, { path: '/large/file.bin' });

      expect(result).toHaveLength(1024 * 1024);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('handleWriteFile', () => {
    it('should write array buffer to file', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await handleWriteFile(mockEvent, {
        path: '/test/output.xlsx',
        data: [1, 2, 3, 4, 5],
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/output.xlsx',
        Buffer.from([1, 2, 3, 4, 5])
      );
    });

    it('should handle empty data', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await handleWriteFile(mockEvent, {
        path: '/test/empty.bin',
        data: [],
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/empty.bin',
        Buffer.from([])
      );
    });

    it('should throw error when write fails', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));

      await expect(
        handleWriteFile(mockEvent, {
          path: '/test/output.xlsx',
          data: [1, 2, 3],
        })
      ).rejects.toThrow('Failed to write file');
    });

    it('should throw error on permission denied', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(
        Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })
      );

      await expect(
        handleWriteFile(mockEvent, {
          path: '/protected/output.xlsx',
          data: [1, 2, 3],
        })
      ).rejects.toThrow('Failed to write file: EACCES: permission denied');
    });
  });

  describe('handleListTemplates', () => {
    it('should return list of templates', async () => {
      const mockTemplates: StoredTemplate[] = [
        {
          id: '1',
          name: 'Template 1',
          created: '2025-12-23T00:00:00Z',
          modified: '2025-12-23T00:00:00Z',
          config: {
            orderIdColumn: 'OrderID',
            attributes: [
              { column: 'Color', changeoverTime: 15, parallelGroup: 'default' },
            ],
          },
        },
        {
          id: '2',
          name: 'Template 2',
          created: '2025-12-22T00:00:00Z',
          modified: '2025-12-22T00:00:00Z',
          config: {
            orderIdColumn: 'ID',
            attributes: [
              { column: 'Size', changeoverTime: 10, parallelGroup: 'default' },
            ],
          },
        },
      ];

      vi.mocked(getAllTemplates).mockResolvedValue(mockTemplates);

      const result = await handleListTemplates(mockEvent);

      expect(result).toEqual(mockTemplates);
      expect(getAllTemplates).toHaveBeenCalled();
    });

    it('should return empty array when no templates exist', async () => {
      vi.mocked(getAllTemplates).mockResolvedValue([]);

      const result = await handleListTemplates(mockEvent);

      expect(result).toEqual([]);
    });

    it('should throw error when listing fails', async () => {
      vi.mocked(getAllTemplates).mockRejectedValue(new Error('Directory not accessible'));

      await expect(handleListTemplates(mockEvent)).rejects.toThrow(
        'Failed to list templates'
      );
    });
  });

  describe('handleSaveTemplate', () => {
    it('should save template successfully', async () => {
      const mockTemplate: StoredTemplate = {
        id: 'test-1',
        name: 'Test Template',
        created: '2025-12-23T00:00:00Z',
        modified: '2025-12-23T00:00:00Z',
        config: {
          orderIdColumn: 'OrderID',
          attributes: [
            { column: 'Color', changeoverTime: 15, parallelGroup: 'default' },
            { column: 'Size', changeoverTime: 10, parallelGroup: 'A' },
          ],
        },
      };

      vi.mocked(saveTemplate).mockResolvedValue(undefined);

      await handleSaveTemplate(mockEvent, { template: mockTemplate });

      expect(saveTemplate).toHaveBeenCalledWith(mockTemplate);
    });

    it('should throw error when save fails', async () => {
      const mockTemplate: StoredTemplate = {
        id: 'test-1',
        name: 'Test',
        created: '2025-12-23T00:00:00Z',
        modified: '2025-12-23T00:00:00Z',
        config: {
          orderIdColumn: 'ID',
          attributes: [],
        },
      };

      vi.mocked(saveTemplate).mockRejectedValue(new Error('Write error'));

      await expect(
        handleSaveTemplate(mockEvent, { template: mockTemplate })
      ).rejects.toThrow('Failed to save template');
    });
  });

  describe('handleDeleteTemplate', () => {
    it('should delete template successfully', async () => {
      vi.mocked(deleteTemplate).mockResolvedValue(undefined);

      await handleDeleteTemplate(mockEvent, { id: 'test-1' });

      expect(deleteTemplate).toHaveBeenCalledWith('test-1');
    });

    it('should handle deletion of non-existent template', async () => {
      vi.mocked(deleteTemplate).mockResolvedValue(undefined);

      await handleDeleteTemplate(mockEvent, { id: 'non-existent' });

      expect(deleteTemplate).toHaveBeenCalledWith('non-existent');
    });

    it('should throw error when deletion fails', async () => {
      vi.mocked(deleteTemplate).mockRejectedValue(new Error('Permission denied'));

      await expect(
        handleDeleteTemplate(mockEvent, { id: 'test-1' })
      ).rejects.toThrow('Failed to delete template');
    });
  });

  describe('handleOpenDialog', () => {
    it('should return selected file path', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/selected/file.xlsx'],
      } as any);

      const result = await handleOpenDialog(mockEvent, {
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      });

      expect(result).toBe('/selected/file.xlsx');
      expect(dialog.showOpenDialog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          properties: ['openFile'],
          filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
        })
      );
    });

    it('should return null when user cancels', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: true,
        filePaths: [],
      } as any);

      const result = await handleOpenDialog(mockEvent, {});

      expect(result).toBeNull();
    });

    it('should return null when no window found', async () => {
      vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

      const result = await handleOpenDialog(mockEvent, {});

      expect(result).toBeNull();
      expect(dialog.showOpenDialog).not.toHaveBeenCalled();
    });

    it('should work with multiple file filters', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/selected/data.csv'],
      } as any);

      const result = await handleOpenDialog(mockEvent, {
        filters: [
          { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      expect(result).toBe('/selected/data.csv');
    });

    it('should work without filters', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/selected/file.txt'],
      } as any);

      const result = await handleOpenDialog(mockEvent, {});

      expect(result).toBe('/selected/file.txt');
      expect(dialog.showOpenDialog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          properties: ['openFile'],
          filters: undefined,
        })
      );
    });
  });

  describe('handleSaveDialog', () => {
    it('should return selected save path', async () => {
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        canceled: false,
        filePath: '/save/location/export.xlsx',
      } as any);

      const result = await handleSaveDialog(mockEvent, {
        defaultPath: 'export.xlsx',
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
      });

      expect(result).toBe('/save/location/export.xlsx');
      expect(dialog.showSaveDialog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          defaultPath: 'export.xlsx',
          filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
        })
      );
    });

    it('should return null when user cancels', async () => {
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        canceled: true,
        filePath: undefined,
      } as any);

      const result = await handleSaveDialog(mockEvent, {});

      expect(result).toBeNull();
    });

    it('should return null when no window found', async () => {
      vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

      const result = await handleSaveDialog(mockEvent, {});

      expect(result).toBeNull();
      expect(dialog.showSaveDialog).not.toHaveBeenCalled();
    });

    it('should work with default path and filters', async () => {
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        canceled: false,
        filePath: '/save/my-export.pdf',
      } as any);

      const result = await handleSaveDialog(mockEvent, {
        defaultPath: 'export.pdf',
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      expect(result).toBe('/save/my-export.pdf');
    });

    it('should handle undefined filePath in response', async () => {
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        canceled: false,
        filePath: undefined,
      } as any);

      const result = await handleSaveDialog(mockEvent, {});

      expect(result).toBeNull();
    });
  });
});
