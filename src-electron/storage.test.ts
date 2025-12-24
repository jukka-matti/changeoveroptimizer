import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStorageDir,
  getTemplatesDir,
  ensureDir,
  listTemplates,
  saveTemplate,
  deleteTemplate,
} from './storage';
import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import type { StoredTemplate } from './types';

// Mock dependencies
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(),
  },
}));

vi.mock('fs/promises');

describe('Storage', () => {
  const mockUserDataPath = '/mock/userData';
  const mockTemplatesPath = path.join(mockUserDataPath, 'templates');

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock app.getPath to return mock userData path
    vi.mocked(app.getPath).mockReturnValue(mockUserDataPath);
  });

  describe('getStorageDir', () => {
    it('should return userData path', () => {
      const result = getStorageDir();

      expect(result).toBe(mockUserDataPath);
      expect(app.getPath).toHaveBeenCalledWith('userData');
    });

    it('should call app.getPath exactly once', () => {
      getStorageDir();

      expect(app.getPath).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTemplatesDir', () => {
    it('should return templates subdirectory', () => {
      const result = getTemplatesDir();

      expect(result).toBe(mockTemplatesPath);
    });

    it('should use correct path separator', () => {
      const result = getTemplatesDir();

      expect(result).toContain('templates');
      expect(result.endsWith('templates')).toBe(true);
    });
  });

  describe('ensureDir', () => {
    it('should not create directory if it exists', async () => {
      // Mock directory exists (access succeeds)
      vi.mocked(fs.access).mockResolvedValue(undefined);

      await ensureDir('/existing/dir');

      expect(fs.access).toHaveBeenCalledWith('/existing/dir');
      expect(fs.mkdir).not.toHaveBeenCalled();
    });

    it('should create directory if it does not exist', async () => {
      // Mock directory doesn't exist (access fails)
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      await ensureDir('/new/dir');

      expect(fs.access).toHaveBeenCalledWith('/new/dir');
      expect(fs.mkdir).toHaveBeenCalledWith('/new/dir', { recursive: true });
    });

    it('should create nested directories recursively', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      await ensureDir('/deep/nested/directory/path');

      expect(fs.mkdir).toHaveBeenCalledWith(
        '/deep/nested/directory/path',
        { recursive: true }
      );
    });
  });

  describe('listTemplates', () => {
    it('should return empty array when no templates exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const result = await listTemplates();

      expect(result).toEqual([]);
      expect(fs.readdir).toHaveBeenCalledWith(mockTemplatesPath);
    });

    it('should list and parse template files', async () => {
      const mockTemplate1: StoredTemplate = {
        id: 'template-1',
        name: 'Template 1',
        created: '2025-12-23T10:00:00Z',
        modified: '2025-12-23T12:00:00Z',
        config: {
          orderIdColumn: 'OrderID',
          attributes: [
            { column: 'Color', changeoverTime: 15, parallelGroup: 'default' },
          ],
        },
      };

      const mockTemplate2: StoredTemplate = {
        id: 'template-2',
        name: 'Template 2',
        created: '2025-12-22T10:00:00Z',
        modified: '2025-12-23T10:00:00Z',
        config: {
          orderIdColumn: 'ID',
          attributes: [
            { column: 'Size', changeoverTime: 10, parallelGroup: 'A' },
            { column: 'Material', changeoverTime: 20, parallelGroup: 'B' },
          ],
        },
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue([
        'template-1.json',
        'template-2.json',
        'not-a-template.txt', // Should be ignored
      ] as any);

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.includes('template-1.json')) {
          return JSON.stringify(mockTemplate1);
        }
        if (filePath.includes('template-2.json')) {
          return JSON.stringify(mockTemplate2);
        }
        throw new Error('File not found');
      });

      const result = await listTemplates();

      expect(result).toHaveLength(2);
      expect(fs.readFile).toHaveBeenCalledTimes(2);
      expect(result).toContainEqual(mockTemplate1);
      expect(result).toContainEqual(mockTemplate2);
    });

    it('should sort templates by modified date descending', async () => {
      const template1: StoredTemplate = {
        id: '1',
        name: 'Older',
        created: '2025-12-20T00:00:00Z',
        modified: '2025-12-21T00:00:00Z',
        config: { orderIdColumn: 'ID', attributes: [] },
      };

      const template2: StoredTemplate = {
        id: '2',
        name: 'Newer',
        created: '2025-12-22T00:00:00Z',
        modified: '2025-12-23T00:00:00Z',
        config: { orderIdColumn: 'ID', attributes: [] },
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue(['1.json', '2.json'] as any);

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.includes('1.json')) {
          return JSON.stringify(template1);
        }
        if (filePath.includes('2.json')) {
          return JSON.stringify(template2);
        }
        throw new Error('File not found');
      });

      const result = await listTemplates();

      // Newer template should be first
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('should handle invalid JSON gracefully', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue([
        'valid.json',
        'invalid.json',
      ] as any);

      const validTemplate: StoredTemplate = {
        id: 'valid',
        name: 'Valid',
        created: '2025-12-23T00:00:00Z',
        modified: '2025-12-23T00:00:00Z',
        config: { orderIdColumn: 'ID', attributes: [] },
      };

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.includes('valid.json')) {
          return JSON.stringify(validTemplate);
        }
        if (filePath.includes('invalid.json')) {
          // Return truly invalid JSON that will cause JSON.parse to throw
          return '{invalid json content';
        }
        throw new Error('File not found');
      });

      // Mock console.error to suppress error output in tests
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw despite invalid JSON
      const result = await listTemplates();

      // Should return at least the valid template
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some(t => t.id === 'valid')).toBe(true);
    });

    it('should ignore non-JSON files', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue([
        'template.json',
        'readme.txt',
        'image.png',
        '.DS_Store',
      ] as any);

      const mockTemplate: StoredTemplate = {
        id: 'template',
        name: 'Template',
        created: '2025-12-23T00:00:00Z',
        modified: '2025-12-23T00:00:00Z',
        config: { orderIdColumn: 'ID', attributes: [] },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockTemplate));

      const result = await listTemplates();

      // Only JSON file should be read
      expect(result).toHaveLength(1);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should create templates directory if it does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue([]);

      await listTemplates();

      expect(fs.mkdir).toHaveBeenCalledWith(mockTemplatesPath, { recursive: true });
    });
  });

  describe('saveTemplate', () => {
    it('should save template to file', async () => {
      const mockTemplate: StoredTemplate = {
        id: 'test-template',
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

      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await saveTemplate(mockTemplate);

      const expectedPath = path.join(mockTemplatesPath, 'test-template.json');
      const expectedContent = JSON.stringify(mockTemplate, null, 2);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expectedPath,
        expectedContent,
        'utf-8'
      );
    });

    it('should create templates directory if it does not exist', async () => {
      const mockTemplate: StoredTemplate = {
        id: 'test',
        name: 'Test',
        created: '2025-12-23T00:00:00Z',
        modified: '2025-12-23T00:00:00Z',
        config: { orderIdColumn: 'ID', attributes: [] },
      };

      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await saveTemplate(mockTemplate);

      expect(fs.mkdir).toHaveBeenCalledWith(mockTemplatesPath, { recursive: true });
    });

    it('should overwrite existing template', async () => {
      const mockTemplate: StoredTemplate = {
        id: 'existing',
        name: 'Updated Template',
        created: '2025-12-22T00:00:00Z',
        modified: '2025-12-23T00:00:00Z',
        config: {
          orderIdColumn: 'NewColumn',
          attributes: [],
        },
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await saveTemplate(mockTemplate);

      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should format JSON with 2-space indentation', async () => {
      const mockTemplate: StoredTemplate = {
        id: 'formatted',
        name: 'Formatted',
        created: '2025-12-23T00:00:00Z',
        modified: '2025-12-23T00:00:00Z',
        config: {
          orderIdColumn: 'ID',
          attributes: [
            { column: 'A', changeoverTime: 5, parallelGroup: 'default' },
          ],
        },
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await saveTemplate(mockTemplate);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const savedContent = writeCall[1] as string;

      // Check formatting (should have indentation)
      expect(savedContent).toContain('\n  ');
      expect(savedContent).toContain('"id": "formatted"');
    });

    it('should save template with special characters in name', async () => {
      const mockTemplate: StoredTemplate = {
        id: 'special-chars',
        name: 'Jükkä-Mätti\'s Template!',
        created: '2025-12-23T00:00:00Z',
        modified: '2025-12-23T00:00:00Z',
        config: { orderIdColumn: 'ID', attributes: [] },
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await saveTemplate(mockTemplate);

      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const savedContent = writeCall[1] as string;

      // JSON.stringify preserves Unicode and escapes double quotes (not single quotes)
      expect(savedContent).toContain('Jükkä-Mätti');
      expect(savedContent).toContain('\'s Template!');

      // Verify it can be parsed back
      const parsed = JSON.parse(savedContent);
      expect(parsed.name).toBe('Jükkä-Mätti\'s Template!');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template file', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await deleteTemplate('test-template');

      const expectedPath = path.join(mockTemplatesPath, 'test-template.json');
      expect(fs.access).toHaveBeenCalledWith(expectedPath);
      expect(fs.unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should not throw error if file does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      // Should not throw
      await expect(deleteTemplate('non-existent')).resolves.not.toThrow();

      // Should check if file exists
      expect(fs.access).toHaveBeenCalled();

      // Should not attempt to delete
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    it('should handle deletion of template with special ID', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await deleteTemplate('template-with-dashes-123');

      const expectedPath = path.join(mockTemplatesPath, 'template-with-dashes-123.json');
      expect(fs.unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should silently ignore permission errors', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockRejectedValue(
        Object.assign(new Error('EACCES'), { code: 'EACCES' })
      );

      // Should not throw (swallows error)
      await expect(deleteTemplate('protected')).resolves.not.toThrow();
    });

    it('should verify file exists before deleting', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await deleteTemplate('verify-test');

      // Should check file exists first
      expect(fs.access).toHaveBeenCalled();

      // Then delete it
      expect(fs.unlink).toHaveBeenCalled();

      // Access should be called before unlink
      const accessCallOrder = vi.mocked(fs.access).mock.invocationCallOrder[0];
      const unlinkCallOrder = vi.mocked(fs.unlink).mock.invocationCallOrder[0];
      expect(accessCallOrder).toBeLessThan(unlinkCallOrder);
    });
  });
});
