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
import {
  saveOptimizationRun,
  getOptimizationRuns,
  getOptimizationRunById,
  deleteOptimizationRun,
  getOptimizationSavingsTrend,
  getTopOptimizationRuns,
  getOptimizationOverviewStats,
  getSmedOverviewStats,
  getStudyComparisonData,
  getImprovementTrends,
  getImprovementTypeDistribution,
  getOperationTypeBreakdown,
} from './db/queries/analytics';
import {
  getAllChangeoverAttributes,
  getActiveChangeoverAttributes,
  getChangeoverAttributeById,
  upsertChangeoverAttribute,
  deleteChangeoverAttribute,
  getMatrixByAttribute,
  upsertMatrixEntry,
  deleteMatrixEntry,
  batchGetChangeoverTimes,
  prefetchMatrixData,
  importFromSmedStandard,
} from './db/queries/changeovers';
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

// ============================================================================
// Analytics handlers - Optimization History
// ============================================================================

export async function handleSaveOptimizationRun(event: IpcMainInvokeEvent, args: { data: any }) {
  try {
    return saveOptimizationRun(args.data);
  } catch (err) {
    throw new Error(`Failed to save optimization run: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetOptimizationRuns(event: IpcMainInvokeEvent, args: { limit?: number }) {
  try {
    return getOptimizationRuns(args.limit);
  } catch (err) {
    throw new Error(`Failed to get optimization runs: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetOptimizationRunById(event: IpcMainInvokeEvent, args: { id: string }) {
  try {
    return getOptimizationRunById(args.id);
  } catch (err) {
    throw new Error(`Failed to get optimization run: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleDeleteOptimizationRun(event: IpcMainInvokeEvent, args: { id: string }) {
  try {
    return deleteOptimizationRun(args.id);
  } catch (err) {
    throw new Error(`Failed to delete optimization run: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetOptimizationSavingsTrend(event: IpcMainInvokeEvent, args: { months?: number }) {
  try {
    return getOptimizationSavingsTrend(args.months);
  } catch (err) {
    throw new Error(`Failed to get optimization trends: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetTopOptimizationRuns(event: IpcMainInvokeEvent, args: { limit?: number }) {
  try {
    return getTopOptimizationRuns(args.limit);
  } catch (err) {
    throw new Error(`Failed to get top optimization runs: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetOptimizationOverviewStats(event: IpcMainInvokeEvent) {
  try {
    return getOptimizationOverviewStats();
  } catch (err) {
    throw new Error(`Failed to get optimization overview: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ============================================================================
// Analytics handlers - SMED Analytics
// ============================================================================

export async function handleGetSmedOverviewStats(event: IpcMainInvokeEvent) {
  try {
    return getSmedOverviewStats();
  } catch (err) {
    throw new Error(`Failed to get SMED overview: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetStudyComparisonData(event: IpcMainInvokeEvent) {
  try {
    return getStudyComparisonData();
  } catch (err) {
    throw new Error(`Failed to get study comparison data: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetImprovementTrends(event: IpcMainInvokeEvent, args: { months?: number }) {
  try {
    return getImprovementTrends(args.months);
  } catch (err) {
    throw new Error(`Failed to get improvement trends: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetImprovementTypeDistribution(event: IpcMainInvokeEvent) {
  try {
    return getImprovementTypeDistribution();
  } catch (err) {
    throw new Error(`Failed to get improvement type distribution: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetOperationTypeBreakdown(event: IpcMainInvokeEvent) {
  try {
    return getOperationTypeBreakdown();
  } catch (err) {
    throw new Error(`Failed to get operation type breakdown: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ============================================================================
// Changeover Matrix handlers
// ============================================================================

export async function handleGetAllChangeoverAttributes(event: IpcMainInvokeEvent) {
  try {
    return getAllChangeoverAttributes();
  } catch (err) {
    throw new Error(`Failed to get changeover attributes: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetActiveChangeoverAttributes(event: IpcMainInvokeEvent) {
  try {
    return getActiveChangeoverAttributes();
  } catch (err) {
    throw new Error(`Failed to get active changeover attributes: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetChangeoverAttributeById(event: IpcMainInvokeEvent, args: { id: string }) {
  try {
    return getChangeoverAttributeById(args.id);
  } catch (err) {
    throw new Error(`Failed to get changeover attribute: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleUpsertChangeoverAttribute(event: IpcMainInvokeEvent, args: { data: any }) {
  try {
    return upsertChangeoverAttribute(args.data);
  } catch (err) {
    throw new Error(`Failed to upsert changeover attribute: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleDeleteChangeoverAttribute(event: IpcMainInvokeEvent, args: { id: string }) {
  try {
    return deleteChangeoverAttribute(args.id);
  } catch (err) {
    throw new Error(`Failed to delete changeover attribute: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleGetMatrixByAttribute(event: IpcMainInvokeEvent, args: { attributeId: string }) {
  try {
    return getMatrixByAttribute(args.attributeId);
  } catch (err) {
    throw new Error(`Failed to get matrix entries: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleUpsertMatrixEntry(event: IpcMainInvokeEvent, args: { data: any }) {
  try {
    return upsertMatrixEntry(args.data);
  } catch (err) {
    throw new Error(`Failed to upsert matrix entry: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleDeleteMatrixEntry(event: IpcMainInvokeEvent, args: { id: string }) {
  try {
    return deleteMatrixEntry(args.id);
  } catch (err) {
    throw new Error(`Failed to delete matrix entry: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleBatchGetChangeoverTimes(
  event: IpcMainInvokeEvent,
  args: { lookups: Array<{ attributeName: string; fromValue: string; toValue: string }> }
) {
  try {
    const result = batchGetChangeoverTimes(args.lookups);
    // Convert Map to object for IPC serialization
    return Object.fromEntries(result);
  } catch (err) {
    throw new Error(`Failed to batch get changeover times: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handlePrefetchMatrixData(
  event: IpcMainInvokeEvent,
  args: { attributeNames: string[]; valuesByAttribute: Record<string, string[]> }
) {
  try {
    // Convert object to Map of Sets
    const valuesMap = new Map<string, Set<string>>();
    for (const [name, values] of Object.entries(args.valuesByAttribute)) {
      valuesMap.set(name, new Set(values));
    }
    const result = prefetchMatrixData(args.attributeNames, valuesMap);
    // Convert Map to object for IPC serialization
    return Object.fromEntries(result);
  } catch (err) {
    throw new Error(`Failed to prefetch matrix data: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function handleImportFromSmedStandard(
  event: IpcMainInvokeEvent,
  args: {
    attributeId: string;
    fromValue: string;
    toValue: string;
    timeMinutes: number;
    smedStudyId: string;
    notes?: string;
  }
) {
  try {
    return importFromSmedStandard(
      args.attributeId,
      args.fromValue,
      args.toValue,
      args.timeMinutes,
      args.smedStudyId,
      args.notes
    );
  } catch (err) {
    throw new Error(`Failed to import from SMED standard: ${err instanceof Error ? err.message : String(err)}`);
  }
}
