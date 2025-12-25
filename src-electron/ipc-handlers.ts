import { IpcMainInvokeEvent, dialog, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import {
  getAllTemplates as listTemplates,
  saveTemplate,
  deleteTemplate,
} from './db/queries/templates';
import {
  getAllStudies,
  getStudyById,
  createStudy,
  updateStudy,
  deleteStudy,
  getStepsByStudyId,
  createStep,
  updateStep,
  deleteStep,
  getImprovementsByStudyId,
  createImprovement,
  updateImprovement,
  getStandardsByStudyId,
  getActiveStandard,
  createStandard,
  updateStandard,
  publishStandard,
  deactivateStandard,
  getLogsByStudyId,
  createChangeoverLog,
  getStudyStatistics,
} from './db/queries/smed';
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

// ============================================================================
// SMED Study handlers
// ============================================================================

export async function handleGetAllStudies(event: IpcMainInvokeEvent) {
  try {
    return getAllStudies();
  } catch (err) {
    throw new Error(`Failed to get studies: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetStudyById(event: IpcMainInvokeEvent, args: { id: string }) {
  try {
    return getStudyById(args.id);
  } catch (err) {
    throw new Error(`Failed to get study: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleCreateStudy(event: IpcMainInvokeEvent, args: { data: any }) {
  try {
    return createStudy(args.data);
  } catch (err) {
    throw new Error(`Failed to create study: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleUpdateStudy(event: IpcMainInvokeEvent, args: { id: string; data: any }) {
  try {
    return updateStudy(args.id, args.data);
  } catch (err) {
    throw new Error(`Failed to update study: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleDeleteStudy(event: IpcMainInvokeEvent, args: { id: string }) {
  try {
    return deleteStudy(args.id);
  } catch (err) {
    throw new Error(`Failed to delete study: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ============================================================================
// SMED Step handlers
// ============================================================================

export async function handleGetStepsByStudyId(event: IpcMainInvokeEvent, args: { studyId: string }) {
  try {
    return getStepsByStudyId(args.studyId);
  } catch (err) {
    throw new Error(`Failed to get steps: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleCreateStep(event: IpcMainInvokeEvent, args: { data: any }) {
  try {
    return createStep(args.data);
  } catch (err) {
    throw new Error(`Failed to create step: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleUpdateStep(event: IpcMainInvokeEvent, args: { id: string; data: any }) {
  try {
    return updateStep(args.id, args.data);
  } catch (err) {
    throw new Error(`Failed to update step: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleDeleteStep(event: IpcMainInvokeEvent, args: { id: string }) {
  try {
    return deleteStep(args.id);
  } catch (err) {
    throw new Error(`Failed to delete step: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ============================================================================
// SMED Improvement handlers
// ============================================================================

export async function handleGetImprovementsByStudyId(event: IpcMainInvokeEvent, args: { studyId: string }) {
  try {
    return getImprovementsByStudyId(args.studyId);
  } catch (err) {
    throw new Error(`Failed to get improvements: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleCreateImprovement(event: IpcMainInvokeEvent, args: { data: any }) {
  try {
    return createImprovement(args.data);
  } catch (err) {
    throw new Error(`Failed to create improvement: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleUpdateImprovement(event: IpcMainInvokeEvent, args: { id: string; data: any }) {
  try {
    return updateImprovement(args.id, args.data);
  } catch (err) {
    throw new Error(`Failed to update improvement: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ============================================================================
// SMED Standard Work handlers
// ============================================================================

export async function handleGetStandardsByStudyId(event: IpcMainInvokeEvent, args: { studyId: string }) {
  try {
    return getStandardsByStudyId(args.studyId);
  } catch (err) {
    throw new Error(`Failed to get standards: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetActiveStandard(event: IpcMainInvokeEvent, args: { studyId: string }) {
  try {
    return getActiveStandard(args.studyId);
  } catch (err) {
    throw new Error(`Failed to get active standard: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleCreateStandard(event: IpcMainInvokeEvent, args: { data: any }) {
  try {
    return createStandard(args.data);
  } catch (err) {
    throw new Error(`Failed to create standard: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleUpdateStandard(event: IpcMainInvokeEvent, args: { id: string; data: any }) {
  try {
    return updateStandard(args.id, args.data);
  } catch (err) {
    throw new Error(`Failed to update standard: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handlePublishStandard(event: IpcMainInvokeEvent, args: { standardId: string }) {
  try {
    return publishStandard(args.standardId);
  } catch (err) {
    throw new Error(`Failed to publish standard: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleDeactivateStandard(event: IpcMainInvokeEvent, args: { standardId: string }) {
  try {
    return deactivateStandard(args.standardId);
  } catch (err) {
    throw new Error(`Failed to deactivate standard: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ============================================================================
// SMED Changeover Log handlers
// ============================================================================

export async function handleGetLogsByStudyId(event: IpcMainInvokeEvent, args: { studyId: string; limit?: number }) {
  try {
    return getLogsByStudyId(args.studyId, args.limit);
  } catch (err) {
    throw new Error(`Failed to get logs: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleCreateChangeoverLog(event: IpcMainInvokeEvent, args: { data: any }) {
  try {
    return createChangeoverLog(args.data);
  } catch (err) {
    throw new Error(`Failed to create changeover log: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ============================================================================
// SMED Analytics handlers
// ============================================================================

export async function handleGetStudyStatistics(event: IpcMainInvokeEvent, args: { studyId: string }) {
  try {
    return getStudyStatistics(args.studyId);
  } catch (err) {
    throw new Error(`Failed to get study statistics: ${err instanceof Error ? err.message : String(err)}`);
  }
}
