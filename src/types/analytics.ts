import type { AttributeConfig, AttributeStat } from './index';

// ============================================================================
// Optimization Run types
// ============================================================================

export interface OptimizationRun {
  id: string;
  name: string | null;
  fileName: string | null;
  orderCount: number;
  attributeCount: number;
  // Work time metrics
  totalBefore: number;
  totalAfter: number;
  savings: number;
  savingsPercent: number;
  // Downtime metrics
  totalDowntimeBefore: number;
  totalDowntimeAfter: number;
  downtimeSavings: number;
  downtimeSavingsPercent: number;
  // Configuration snapshots (stored as JSON in DB)
  attributesJson: string;
  attributeStatsJson: string;
  // Metadata
  templateId: string | null;
  runAt: Date | number;
  createdAt: Date | number | null;
}

export interface OptimizationRunInput {
  name?: string;
  fileName?: string;
  orderCount: number;
  attributeCount: number;
  totalBefore: number;
  totalAfter: number;
  savings: number;
  savingsPercent: number;
  totalDowntimeBefore: number;
  totalDowntimeAfter: number;
  downtimeSavings: number;
  downtimeSavingsPercent: number;
  attributes: AttributeConfig[];
  attributeStats: AttributeStat[];
  templateId?: string;
}

export interface OptimizationTrendData {
  month: string;
  runCount: number;
  totalOrdersOptimized: number;
  averageSavingsPercent: number;
  totalSavingsMinutes: number;
  totalDowntimeSavingsMinutes: number;
}

export interface OptimizationOverviewStats {
  totalRuns: number;
  totalOrdersOptimized: number;
  averageSavingsPercent: number;
  bestSavingsPercent: number;
  totalSavingsMinutes: number;
  totalDowntimeSavingsMinutes: number;
}

// ============================================================================
// SMED Analytics types
// ============================================================================

export interface SmedOverviewStats {
  totalStudies: number;
  activeStudies: number;
  studiesByStatus: Record<string, number>;
  totalBaselineMinutes: number;
  totalCurrentMinutes: number;
  totalSavingsMinutes: number;
  totalSavingsPercent: number;
}

export interface StudyComparisonData {
  id: string;
  name: string;
  status: string;
  baselineMinutes: number | null;
  currentMinutes: number | null;
  targetMinutes: number | null;
  savingsPercent: number;
  internalTimePercent: number;
  externalTimePercent: number;
}

export interface ImprovementTrendData {
  month: string;
  ideasCreated: number;
  implementedCount: number;
  verifiedCount: number;
  estimatedSavingsSeconds: number;
  actualSavingsSeconds: number;
}

export interface ImprovementTypeStats {
  type: string;
  count: number;
  totalEstimatedSavings: number;
  totalActualSavings: number;
}

export interface OperationTypeBreakdown {
  totalInternalSeconds: number;
  totalExternalSeconds: number;
  internalPercent: number;
  externalPercent: number;
  studyBreakdowns: Array<{
    studyId: string;
    studyName: string;
    internalSeconds: number;
    externalSeconds: number;
  }>;
}

// ============================================================================
// Analytics Tab types
// ============================================================================

export type AnalyticsTab = 'smed' | 'optimization';
