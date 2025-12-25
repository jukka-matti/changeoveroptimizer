/**
 * Analytics IPC handlers
 *
 * Handles: optimization history, SMED analytics
 */

import { registerHandler } from '../registry';
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
} from '../../db/queries/analytics';

export function registerAnalyticsHandlers(): void {
  // Optimization runs
  registerHandler<{ data: Parameters<typeof saveOptimizationRun>[0] }, ReturnType<typeof saveOptimizationRun>>(
    'analytics:save_optimization_run',
    (args) => saveOptimizationRun(args.data),
    'Failed to save optimization run'
  );

  registerHandler<{ limit?: number }, ReturnType<typeof getOptimizationRuns>>(
    'analytics:get_optimization_runs',
    (args) => getOptimizationRuns(args.limit),
    'Failed to get optimization runs'
  );

  registerHandler<{ id: string }, ReturnType<typeof getOptimizationRunById>>(
    'analytics:get_optimization_run_by_id',
    (args) => getOptimizationRunById(args.id),
    'Failed to get optimization run'
  );

  registerHandler<{ id: string }, void>(
    'analytics:delete_optimization_run',
    (args) => deleteOptimizationRun(args.id),
    'Failed to delete optimization run'
  );

  registerHandler<{ months?: number }, ReturnType<typeof getOptimizationSavingsTrend>>(
    'analytics:get_optimization_trends',
    (args) => getOptimizationSavingsTrend(args.months),
    'Failed to get optimization trends'
  );

  registerHandler<{ limit?: number }, ReturnType<typeof getTopOptimizationRuns>>(
    'analytics:get_top_optimization_runs',
    (args) => getTopOptimizationRuns(args.limit),
    'Failed to get top optimization runs'
  );

  registerHandler<void, ReturnType<typeof getOptimizationOverviewStats>>(
    'analytics:get_optimization_overview',
    () => getOptimizationOverviewStats(),
    'Failed to get optimization overview'
  );

  // SMED analytics
  registerHandler<void, ReturnType<typeof getSmedOverviewStats>>(
    'analytics:get_smed_overview',
    () => getSmedOverviewStats(),
    'Failed to get SMED overview'
  );

  registerHandler<void, ReturnType<typeof getStudyComparisonData>>(
    'analytics:get_study_comparison',
    () => getStudyComparisonData(),
    'Failed to get study comparison data'
  );

  registerHandler<{ months?: number }, ReturnType<typeof getImprovementTrends>>(
    'analytics:get_improvement_trends',
    (args) => getImprovementTrends(args.months),
    'Failed to get improvement trends'
  );

  registerHandler<void, ReturnType<typeof getImprovementTypeDistribution>>(
    'analytics:get_improvement_types',
    () => getImprovementTypeDistribution(),
    'Failed to get improvement type distribution'
  );

  registerHandler<void, ReturnType<typeof getOperationTypeBreakdown>>(
    'analytics:get_operation_breakdown',
    () => getOperationTypeBreakdown(),
    'Failed to get operation type breakdown'
  );
}
