import { IpcMainInvokeEvent, dialog, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import { listTemplates, saveTemplate, deleteTemplate } from './storage';
import type { StoredTemplate } from './types';

export async function handleGreet(
  event: IpcMainInvokeEvent,
  args: { name: string }
): Promise<string> {
  return `Hello, ${args.name}! You've been greeted from Electron!`;
}

export async function handleReadFile(
  event: IpcMainInvokeEvent,
  args: { path: string }
): Promise<number[]> {
  try {
    const buffer = await fs.readFile(args.path);
    return Array.from(buffer);
  } catch (err) {
    throw new Error(`Failed to read file: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleWriteFile(
  event: IpcMainInvokeEvent,
  args: { path: string; data: number[] }
): Promise<void> {
  try {
    const buffer = Buffer.from(args.data);
    await fs.writeFile(args.path, buffer);
  } catch (err) {
    throw new Error(`Failed to write file: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleListTemplates(
  event: IpcMainInvokeEvent
): Promise<StoredTemplate[]> {
  try {
    return await listTemplates();
  } catch (err) {
    throw new Error(`Failed to list templates: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleSaveTemplate(
  event: IpcMainInvokeEvent,
  args: { template: StoredTemplate }
): Promise<void> {
  try {
    await saveTemplate(args.template);
  } catch (err) {
    throw new Error(`Failed to save template: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleDeleteTemplate(
  event: IpcMainInvokeEvent,
  args: { id: string }
): Promise<void> {
  try {
    await deleteTemplate(args.id);
  } catch (err) {
    throw new Error(`Failed to delete template: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleOpenDialog(
  event: IpcMainInvokeEvent,
  args: { filters?: { name: string; extensions: string[] }[] }
): Promise<string | null> {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;

  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: args.filters,
  });

  return result.canceled ? null : result.filePaths[0];
}

export async function handleSaveDialog(
  event: IpcMainInvokeEvent,
  args: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }
): Promise<string | null> {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;

  const result = await dialog.showSaveDialog(win, {
    defaultPath: args.defaultPath,
    filters: args.filters,
  });

  return result.canceled ? null : result.filePath || null;
}
