/**
 * Typed Electron IPC Layer
 *
 * Provides type-safe wrappers for Electron IPC communication.
 * Eliminates `(window as any).electron.invoke` throughout the codebase.
 */

// Extend Window interface to include electron
declare global {
  interface Window {
    electron?: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    };
  }
}

import type { Template } from '@/types';
import type {
  Study,
  Step,
  Improvement,
  Standard,
  StudyStatistics,
  ChangeoverLog,
} from '@/types/smed';
import type {
  OptimizationRun,
  OptimizationRunInput,
  OptimizationTrendData,
  OptimizationOverviewStats,
  SmedOverviewStats,
  StudyComparisonData,
  ImprovementTrendData,
  ImprovementTypeStats,
  OperationTypeBreakdown,
} from '@/types/analytics';
import type {
  ChangeoverAttribute,
  ChangeoverAttributeInput,
  ChangeoverMatrixEntry,
  ChangeoverMatrixEntryInput,
  ChangeoverLookup,
  SmedImportArgs,
} from '@/types/changeover';
import type {
  SavedConfiguration,
  SavedConfigurationInput,
} from '@/types/configurations';

// ============================================================================
// Channel Type Mapping
// ============================================================================

/**
 * Maps IPC channels to their argument and return types.
 * This enables type-safe IPC calls across the application.
 */
interface IpcChannelMap {
  // File operations
  greet: { args: { name: string }; result: string };
  read_file: { args: { path: string }; result: number[] };
  write_file: { args: { path: string; data: number[] }; result: void };
  list_templates: { args: void; result: Template[] };
  save_template: { args: { template: Template }; result: void };
  delete_template: { args: { id: string }; result: void };
  open_dialog: {
    args: { filters?: { name: string; extensions: string[] }[] };
    result: string | null;
  };
  save_dialog: {
    args: {
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    };
    result: string | null;
  };

  // SMED Study operations
  'smed:get_all_studies': { args: void; result: Study[] };
  'smed:get_study_by_id': { args: string; result: Study | null };
  'smed:create_study': { args: Partial<Study>; result: Study };
  'smed:update_study': { args: { id: string; data: Partial<Study> }; result: void };
  'smed:delete_study': { args: { id: string }; result: void };

  // SMED Step operations
  'smed:get_steps': { args: string; result: Step[] };
  'smed:create_step': { args: Partial<Step>; result: Step };
  'smed:update_step': { args: { id: string; data: Partial<Step> }; result: void };
  'smed:delete_step': { args: { id: string }; result: void };

  // SMED Improvement operations
  'smed:get_improvements': { args: string; result: Improvement[] };
  'smed:create_improvement': { args: Partial<Improvement>; result: Improvement };
  'smed:update_improvement': { args: { id: string; data: Partial<Improvement> }; result: void };

  // SMED Standard operations
  'smed:get_standards': { args: { studyId: string }; result: Standard[] };
  'smed:get_active_standard': { args: { studyId: string }; result: Standard | null };
  'smed:create_standard': { args: { data: Partial<Standard> }; result: Standard };
  'smed:update_standard': { args: { id: string; data: Partial<Standard> }; result: void };
  'smed:publish_standard': { args: { standardId: string; updateOptimizer?: boolean }; result: void };
  'smed:deactivate_standard': { args: { standardId: string }; result: void };

  // SMED Log operations
  'smed:get_logs': { args: { studyId: string; limit?: number }; result: ChangeoverLog[] };
  'smed:create_log': { args: Partial<ChangeoverLog>; result: ChangeoverLog };

  // SMED Statistics
  'smed:get_statistics': { args: string; result: StudyStatistics };

  // Analytics - Optimization History
  'analytics:save_optimization_run': { args: { data: OptimizationRunInput }; result: OptimizationRun };
  'analytics:get_optimization_runs': { args: { limit?: number }; result: OptimizationRun[] };
  'analytics:get_optimization_run_by_id': { args: { id: string }; result: OptimizationRun | null };
  'analytics:delete_optimization_run': { args: { id: string }; result: void };
  'analytics:get_optimization_trends': { args: { months?: number }; result: OptimizationTrendData[] };
  'analytics:get_top_optimization_runs': { args: { limit?: number }; result: OptimizationRun[] };
  'analytics:get_optimization_overview': { args: void; result: OptimizationOverviewStats };

  // Analytics - SMED
  'analytics:get_smed_overview': { args: void; result: SmedOverviewStats };
  'analytics:get_study_comparison': { args: void; result: StudyComparisonData[] };
  'analytics:get_improvement_trends': { args: { months?: number }; result: ImprovementTrendData[] };
  'analytics:get_improvement_types': { args: void; result: ImprovementTypeStats[] };
  'analytics:get_operation_breakdown': { args: void; result: OperationTypeBreakdown };

  // Changeover Matrix
  'changeovers:get_all_attributes': { args: void; result: ChangeoverAttribute[] };
  'changeovers:get_active_attributes': { args: void; result: ChangeoverAttribute[] };
  'changeovers:get_attribute_by_id': { args: { id: string }; result: ChangeoverAttribute | null };
  'changeovers:get_attribute_by_name': { args: { name: string }; result: ChangeoverAttribute | null };
  'changeovers:upsert_attribute': { args: { data: ChangeoverAttributeInput }; result: ChangeoverAttribute };
  'changeovers:delete_attribute': { args: { id: string }; result: void };
  'changeovers:get_matrix': { args: { attributeId: string }; result: ChangeoverMatrixEntry[] };
  'changeovers:upsert_entry': { args: { data: ChangeoverMatrixEntryInput }; result: ChangeoverMatrixEntry };
  'changeovers:delete_entry': { args: { id: string }; result: void };
  'changeovers:batch_lookup': { args: { lookups: ChangeoverLookup[] }; result: Record<string, number> };
  'changeovers:prefetch_matrix': {
    args: { attributeNames: string[]; valuesByAttribute: Record<string, string[]> };
    result: Record<string, number>;
  };
  'changeovers:import_smed': { args: SmedImportArgs; result: ChangeoverMatrixEntry };

  // Saved Configurations
  'configurations:find_by_fingerprint': { args: { fingerprint: string }; result: SavedConfiguration | undefined };
  'configurations:find_by_columns': { args: { columns: string[] }; result: SavedConfiguration | undefined };
  'configurations:generate_fingerprint': { args: { columns: string[] }; result: string };
  'configurations:get_all': { args: void; result: SavedConfiguration[] };
  'configurations:get_by_id': { args: { id: string }; result: SavedConfiguration | undefined };
  'configurations:create': { args: { data: SavedConfigurationInput }; result: SavedConfiguration };
  'configurations:update': { args: { id: string; data: Partial<SavedConfigurationInput> }; result: void };
  'configurations:delete': { args: { id: string }; result: void };
  'configurations:record_usage': { args: { id: string }; result: void };
  'configurations:update_export_preference': { args: { id: string; format: string }; result: void };
  'configurations:save_or_update': {
    args: { columns: string[]; orderIdColumn: string; attributesJson: string; name?: string };
    result: SavedConfiguration;
  };
}

type IpcChannel = keyof IpcChannelMap;

// ============================================================================
// Core IPC Function
// ============================================================================

/**
 * Type-safe IPC invoke function.
 * Replaces `(window as any).electron.invoke` with proper typing.
 *
 * @example
 * const studies = await ipcInvoke('smed:get_all_studies');
 * const study = await ipcInvoke('smed:get_study_by_id', 'study-123');
 */
export async function ipcInvoke<C extends IpcChannel>(
  channel: C,
  ...args: IpcChannelMap[C]['args'] extends void ? [] : [IpcChannelMap[C]['args']]
): Promise<IpcChannelMap[C]['result']> {
  // Handle non-Electron environment (development in browser)
  if (typeof window === 'undefined' || !window.electron) {
    console.warn(`[Electron Shim] IPC not available for: ${channel}`);

    // Mocks for browser testing
    if (channel === 'changeovers:get_all_attributes') {
      return [
        { id: 'mock-1', name: 'Color', displayName: 'Color Change', hierarchyLevel: 1, defaultMinutes: 15, parallelGroup: 'A', isActive: true },
        { id: 'mock-2', name: 'Material', displayName: 'Material Change', hierarchyLevel: 2, defaultMinutes: 45, parallelGroup: 'B', isActive: true },
      ] as any;
    }
    if (channel === 'changeovers:get_attribute_by_name') {
      const argsTyped = args[0] as any;
      if (argsTyped?.name === 'Color' || argsTyped?.name === 'Material') {
        return { id: 'mock-1', name: argsTyped.name, displayName: argsTyped.name + ' Change', defaultMinutes: 15, parallelGroup: 'A' } as any;
      }
      return null as any;
    }

    if (channel === 'smed:publish_standard') {
      console.log('[Electron Shim] Mocking publish_standard', args);
      return undefined as any;
    }

    // Configurations shims for browser testing
    if (channel === 'configurations:find_by_columns' || channel === 'configurations:find_by_fingerprint') {
      return undefined as any;
    }
    if (channel === 'configurations:get_all') {
      return [] as any;
    }
    if (channel === 'configurations:generate_fingerprint') {
      const argsTyped = args[0] as { columns: string[] };
      return [...argsTyped.columns].sort().join('|') as any;
    }

    return undefined as IpcChannelMap[C]['result'];
  }

  return window.electron.invoke(channel, ...args) as Promise<IpcChannelMap[C]['result']>;
}

// ============================================================================
// Convenience Wrappers (Grouped by Domain)
// ============================================================================

/**
 * SMED-related IPC calls
 */
export const smedIpc = {
  // Studies
  getAllStudies: () => ipcInvoke('smed:get_all_studies'),
  getStudyById: (id: string) => ipcInvoke('smed:get_study_by_id', id),
  createStudy: (data: Partial<Study>) => ipcInvoke('smed:create_study', data),
  updateStudy: (id: string, data: Partial<Study>) =>
    ipcInvoke('smed:update_study', { id, data } as any),
  deleteStudy: (id: string) => ipcInvoke('smed:delete_study', { id }),

  // Steps
  getSteps: (studyId: string) => ipcInvoke('smed:get_steps', studyId),
  createStep: (data: Partial<Step>) => ipcInvoke('smed:create_step', data),
  updateStep: (id: string, data: Partial<Step>) =>
    ipcInvoke('smed:update_step', { id, data } as any),
  deleteStep: (id: string) => ipcInvoke('smed:delete_step', { id }),

  // Improvements
  getImprovements: (studyId: string) => ipcInvoke('smed:get_improvements', studyId),
  createImprovement: (data: Partial<Improvement>) =>
    ipcInvoke('smed:create_improvement', data),
  updateImprovement: (id: string, data: Partial<Improvement>) =>
    ipcInvoke('smed:update_improvement', { id, data } as any),

  // Standards
  getStandards: (studyId: string) => ipcInvoke('smed:get_standards', { studyId }),
  getActiveStandard: (studyId: string) =>
    ipcInvoke('smed:get_active_standard', { studyId }),
  createStandard: (data: Partial<Standard>) =>
    ipcInvoke('smed:create_standard', { data }),
  updateStandard: (id: string, data: Partial<Standard>) =>
    ipcInvoke('smed:update_standard', { id, data } as any),
  publishStandard: (standardId: string, updateOptimizer?: boolean) =>
    ipcInvoke('smed:publish_standard', { standardId, updateOptimizer }),
  deactivateStandard: (standardId: string) =>
    ipcInvoke('smed:deactivate_standard', { standardId }),

  // Logs
  getLogs: (studyId: string, limit?: number) =>
    ipcInvoke('smed:get_logs', { studyId, limit }),
  createLog: (data: Partial<ChangeoverLog>) => ipcInvoke('smed:create_log', data),

  // Statistics
  getStatistics: (studyId: string) => ipcInvoke('smed:get_statistics', studyId),
};

/**
 * Analytics-related IPC calls
 */
export const analyticsIpc = {
  // Optimization history
  saveOptimizationRun: (data: OptimizationRunInput) =>
    ipcInvoke('analytics:save_optimization_run', { data }),
  getOptimizationRuns: (limit?: number) =>
    ipcInvoke('analytics:get_optimization_runs', { limit }),
  getOptimizationRunById: (id: string) =>
    ipcInvoke('analytics:get_optimization_run_by_id', { id }),
  deleteOptimizationRun: (id: string) =>
    ipcInvoke('analytics:delete_optimization_run', { id }),
  getOptimizationTrends: (months?: number) =>
    ipcInvoke('analytics:get_optimization_trends', { months }),
  getTopOptimizationRuns: (limit?: number) =>
    ipcInvoke('analytics:get_top_optimization_runs', { limit }),
  getOptimizationOverview: () => ipcInvoke('analytics:get_optimization_overview'),

  // SMED analytics
  getSmedOverview: () => ipcInvoke('analytics:get_smed_overview'),
  getStudyComparison: () => ipcInvoke('analytics:get_study_comparison'),
  getImprovementTrends: (months?: number) =>
    ipcInvoke('analytics:get_improvement_trends', { months }),
  getImprovementTypes: () => ipcInvoke('analytics:get_improvement_types'),
  getOperationBreakdown: () => ipcInvoke('analytics:get_operation_breakdown'),
};

/**
 * Changeover Matrix-related IPC calls
 */
export const changeoverIpc = {
  getAllAttributes: () => ipcInvoke('changeovers:get_all_attributes'),
  getActiveAttributes: () => ipcInvoke('changeovers:get_active_attributes'),
  getAttributeById: (id: string) =>
    ipcInvoke('changeovers:get_attribute_by_id', { id }),
  getAttributeByName: (name: string) =>
    ipcInvoke('changeovers:get_attribute_by_name', { name }),
  upsertAttribute: (data: ChangeoverAttributeInput) =>
    ipcInvoke('changeovers:upsert_attribute', { data }),
  deleteAttribute: (id: string) =>
    ipcInvoke('changeovers:delete_attribute', { id }),
  getMatrix: (attributeId: string) =>
    ipcInvoke('changeovers:get_matrix', { attributeId }),
  upsertEntry: (data: ChangeoverMatrixEntryInput) =>
    ipcInvoke('changeovers:upsert_entry', { data }),
  deleteEntry: (id: string) => ipcInvoke('changeovers:delete_entry', { id }),
  batchLookup: (lookups: ChangeoverLookup[]) =>
    ipcInvoke('changeovers:batch_lookup', { lookups }),
  prefetchMatrix: (
    attributeNames: string[],
    valuesByAttribute: Record<string, string[]>
  ) => ipcInvoke('changeovers:prefetch_matrix', { attributeNames, valuesByAttribute }),
  importFromSmed: (args: SmedImportArgs) =>
    ipcInvoke('changeovers:import_smed', args),
};

/**
 * File and dialog-related IPC calls
 */
export const fileIpc = {
  readFile: (path: string) => ipcInvoke('read_file', { path }),
  writeFile: (path: string, data: number[]) =>
    ipcInvoke('write_file', { path, data }),
  listTemplates: () => ipcInvoke('list_templates'),
  saveTemplate: (template: Template) =>
    ipcInvoke('save_template', { template }),
  deleteTemplate: (id: string) => ipcInvoke('delete_template', { id }),
  openDialog: (filters?: { name: string; extensions: string[] }[]) =>
    ipcInvoke('open_dialog', { filters }),
  saveDialog: (
    defaultPath?: string,
    filters?: { name: string; extensions: string[] }[]
  ) => ipcInvoke('save_dialog', { defaultPath, filters }),
};

/**
 * Saved Configurations-related IPC calls
 */
export const configurationsIpc = {
  findByFingerprint: (fingerprint: string) =>
    ipcInvoke('configurations:find_by_fingerprint', { fingerprint }),
  findByColumns: (columns: string[]) =>
    ipcInvoke('configurations:find_by_columns', { columns }),
  generateFingerprint: (columns: string[]) =>
    ipcInvoke('configurations:generate_fingerprint', { columns }),
  getAll: () => ipcInvoke('configurations:get_all'),
  getById: (id: string) => ipcInvoke('configurations:get_by_id', { id }),
  create: (data: SavedConfigurationInput) =>
    ipcInvoke('configurations:create', { data }),
  update: (id: string, data: Partial<SavedConfigurationInput>) =>
    ipcInvoke('configurations:update', { id, data }),
  delete: (id: string) => ipcInvoke('configurations:delete', { id }),
  recordUsage: (id: string) =>
    ipcInvoke('configurations:record_usage', { id }),
  updateExportPreference: (id: string, format: string) =>
    ipcInvoke('configurations:update_export_preference', { id, format }),
  saveOrUpdate: (
    columns: string[],
    orderIdColumn: string,
    attributesJson: string,
    name?: string
  ) => ipcInvoke('configurations:save_or_update', { columns, orderIdColumn, attributesJson, name }),
};
