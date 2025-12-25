import { create } from 'zustand';
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
  AnalyticsTab,
} from '@/types/analytics';
import { analyticsIpc } from '@/lib/electron-ipc';

interface AnalyticsState {
  // Active tab
  activeTab: AnalyticsTab;

  // Optimization History data
  optimizationRuns: OptimizationRun[];
  optimizationTrends: OptimizationTrendData[];
  optimizationOverview: OptimizationOverviewStats | null;
  topRuns: OptimizationRun[];

  // SMED Analytics data
  smedOverview: SmedOverviewStats | null;
  studyComparison: StudyComparisonData[];
  improvementTrends: ImprovementTrendData[];
  improvementTypes: ImprovementTypeStats[];
  operationBreakdown: OperationTypeBreakdown | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Tab actions
  setActiveTab: (tab: AnalyticsTab) => void;

  // Optimization History actions
  loadOptimizationHistory: () => Promise<void>;
  saveOptimizationRun: (input: OptimizationRunInput) => Promise<OptimizationRun>;
  deleteOptimizationRun: (id: string) => Promise<void>;

  // SMED Analytics actions
  loadSmedAnalytics: () => Promise<void>;

  // Load all analytics data
  loadAllAnalytics: () => Promise<void>;

  // Utility
  clearError: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  // Initial state
  activeTab: 'smed',

  optimizationRuns: [],
  optimizationTrends: [],
  optimizationOverview: null,
  topRuns: [],

  smedOverview: null,
  studyComparison: [],
  improvementTrends: [],
  improvementTypes: [],
  operationBreakdown: null,

  isLoading: false,
  error: null,

  // Tab actions
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  // Optimization History actions
  loadOptimizationHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const [runs, trends, overview, topRuns] = await Promise.all([
        analyticsIpc.getOptimizationRuns(50),
        analyticsIpc.getOptimizationTrends(12),
        analyticsIpc.getOptimizationOverview(),
        analyticsIpc.getTopOptimizationRuns(5),
      ]);

      set({
        optimizationRuns: runs || [],
        optimizationTrends: trends || [],
        optimizationOverview: overview,
        topRuns: topRuns || [],
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load optimization history',
        isLoading: false,
      });
    }
  },

  saveOptimizationRun: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const result = await analyticsIpc.saveOptimizationRun(input);

      // Refresh the list
      await get().loadOptimizationHistory();

      set({ isLoading: false });
      return result;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to save optimization run',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteOptimizationRun: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await analyticsIpc.deleteOptimizationRun(id);

      // Remove from local state
      set((state) => ({
        optimizationRuns: state.optimizationRuns.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete optimization run',
        isLoading: false,
      });
      throw err;
    }
  },

  // SMED Analytics actions
  loadSmedAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const [overview, comparison, trends, types, breakdown] = await Promise.all([
        analyticsIpc.getSmedOverview(),
        analyticsIpc.getStudyComparison(),
        analyticsIpc.getImprovementTrends(12),
        analyticsIpc.getImprovementTypes(),
        analyticsIpc.getOperationBreakdown(),
      ]);

      set({
        smedOverview: overview,
        studyComparison: comparison || [],
        improvementTrends: trends || [],
        improvementTypes: types || [],
        operationBreakdown: breakdown,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load SMED analytics',
        isLoading: false,
      });
    }
  },

  // Load all analytics
  loadAllAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().loadSmedAnalytics(),
        get().loadOptimizationHistory(),
      ]);
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load analytics',
        isLoading: false,
      });
    }
  },

  // Utility
  clearError: () => {
    set({ error: null });
  },
}));
