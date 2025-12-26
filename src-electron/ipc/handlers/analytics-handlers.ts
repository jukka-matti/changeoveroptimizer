
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

export function registerAnalyticsHandlers() {
    /**
     * Analytics: Optimization runs
     */
    registerHandler('analytics:save_run', ({ data }: { data: any }) => saveOptimizationRun(data), 'Failed to save optimization run');
    registerHandler('analytics:get_runs', ({ limit }: { limit?: number }) => getOptimizationRuns(limit), 'Failed to get optimization runs');
    registerHandler('analytics:get_run_by_id', ({ id }: { id: string }) => getOptimizationRunById(id), 'Failed to get optimization run');
    registerHandler('analytics:delete_run', ({ id }: { id: string }) => deleteOptimizationRun(id), 'Failed to delete optimization run');

    /**
     * Analytics: Optimization stats
     */
    registerHandler('analytics:get_savings_trend', ({ months }: { months?: number }) => getOptimizationSavingsTrend(months), 'Failed to get savings trend');
    registerHandler('analytics:get_top_runs', ({ limit }: { limit?: number }) => getTopOptimizationRuns(limit), 'Failed to get top runs');
    registerHandler('analytics:get_overview', () => getOptimizationOverviewStats(), 'Failed to get optimization overview');

    /**
     * Analytics: SMED stats
     */
    registerHandler('analytics:get_smed_overview', () => getSmedOverviewStats(), 'Failed to get SMED overview');
    registerHandler('analytics:get_study_comparison', () => getStudyComparisonData(), 'Failed to get study comparison');
    registerHandler('analytics:get_improvement_trends', ({ months }: { months?: number }) => getImprovementTrends(months), 'Failed to get improvement trends');
    registerHandler('analytics:get_improvement_distribution', () => getImprovementTypeDistribution(), 'Failed to get improvement distribution');
    registerHandler('analytics:get_operation_breakdown', () => getOperationTypeBreakdown(), 'Failed to get operation breakdown');
}
