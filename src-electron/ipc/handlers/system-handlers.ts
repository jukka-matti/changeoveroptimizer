
import { BrowserWindow, dialog } from 'electron';
import fs from 'fs/promises';
import { registerHandler, registerHandlerWithEvent } from '../registry';
import {
  getAllTemplates as listTemplates,
  saveTemplate,
  deleteTemplate,
} from '../../db/queries/templates';
import type { StoredTemplate } from '../../types';

export function registerSystemHandlers() {
  /**
   * System: File I/O
   */
  registerHandler(
    'system:greet',
    ({ name }: { name: string }) => `Hello, ${name}! You've been greeted from Electron!`,
    'Failed to greet'
  );

  registerHandler(
    'system:read_file',
    async ({ path }: { path: string }) => {
      const buffer = await fs.readFile(path);
      return Array.from(buffer);
    },
    'Failed to read file'
  );

  registerHandler(
    'system:write_file',
    async ({ path, data }: { path: string; data: number[] }) => {
      const buffer = Buffer.from(data);
      await fs.writeFile(path, buffer);
    },
    'Failed to write file'
  );

  /**
   * System: Dialogs
   */
  registerHandlerWithEvent(
    'dialog:open',
    async (event, args: { filters?: { name: string; extensions: string[] }[] }) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return null;

      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: args.filters,
      });

      return result.canceled ? null : result.filePaths[0];
    },
    'Failed to open dialog'
  );

  registerHandlerWithEvent(
    'dialog:save',
    async (event, args: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return null;

      const result = await dialog.showSaveDialog(win, {
        defaultPath: args.defaultPath,
        filters: args.filters,
      });

      return result.canceled ? null : result.filePath || null;
    },
    'Failed to save dialog'
  );

  /**
   * Templates
   */
  registerHandler('templates:list', () => listTemplates(), 'Failed to list templates');

  registerHandler(
    'templates:save',
    ({ template }: { template: StoredTemplate }) => saveTemplate(template),
    'Failed to save template'
  );

  registerHandler(
    'templates:delete',
    ({ id }: { id: string }) => deleteTemplate(id),
    'Failed to delete template'
  );
}
