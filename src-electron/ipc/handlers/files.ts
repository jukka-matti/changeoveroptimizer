/**
 * File operation IPC handlers
 *
 * Handles: file read/write, dialogs, templates
 */

import { dialog, BrowserWindow, IpcMainInvokeEvent } from 'electron';
import fs from 'fs/promises';
import { registerHandler, registerHandlerWithEvent } from '../registry';
import {
  getAllTemplates as listTemplates,
  saveTemplate,
  deleteTemplate,
} from '../../db/queries/templates';
import type { StoredTemplate } from '../../types';

export function registerFileHandlers(): void {
  // Greeting (demo endpoint)
  registerHandler<{ name: string }, string>(
    'greet',
    (args) => `Hello, ${args.name}! You've been greeted from Electron!`,
    'Failed to greet'
  );

  // File operations
  registerHandler<{ path: string }, number[]>(
    'read_file',
    async (args) => {
      const buffer = await fs.readFile(args.path);
      return Array.from(buffer);
    },
    'Failed to read file'
  );

  registerHandler<{ path: string; data: number[] }, void>(
    'write_file',
    async (args) => {
      const buffer = Buffer.from(args.data);
      await fs.writeFile(args.path, buffer);
    },
    'Failed to write file'
  );

  // Templates
  registerHandler<void, StoredTemplate[]>(
    'list_templates',
    () => listTemplates(),
    'Failed to list templates'
  );

  registerHandler<{ template: StoredTemplate }, void>(
    'save_template',
    (args) => saveTemplate(args.template),
    'Failed to save template'
  );

  registerHandler<{ id: string }, void>(
    'delete_template',
    (args) => deleteTemplate(args.id),
    'Failed to delete template'
  );

  // Dialogs (need event for window reference)
  registerHandlerWithEvent<{ filters?: { name: string; extensions: string[] }[] }, string | null>(
    'open_dialog',
    async (event, args) => {
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

  registerHandlerWithEvent<{ defaultPath?: string; filters?: { name: string; extensions: string[] }[] }, string | null>(
    'save_dialog',
    async (event, args) => {
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
}
