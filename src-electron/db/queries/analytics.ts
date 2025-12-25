import { eq, desc, sql, gte, and, ne } from 'drizzle-orm';
import { getDatabase } from '../index';
import { optimizationRuns, type OptimizationRunInsert } from '../schema/analytics';
import { smedStudies, smedSteps, smedImprovements } from '../schema/smed';

// ============================================================================
// Optimization Run operations
// ============================================================================

export function saveOptimizationRun(data: OptimizationRunInsert) {
  const db = getDatabase();
  const result = db.insert(optimizationRuns).values(data).returning().get();
  return result;
}

export function getOptimizationRuns(limit: number = 50) {
  const db = getDatabase();
  return db.select()
    .from(optimizationRuns)
    .orderBy(desc(optimizationRuns.runAt))
    .limit(limit)
    .all();
}

export function getOptimizationRunById(id: string) {
  const db = getDatabase();
  return db.select()
    .from(optimizationRuns)
    .where(eq(optimizationRuns.id, id))
    .get();
}

export function deleteOptimizationRun(id: string) {
  const db = getDatabase();
  db.delete(optimizationRuns).where(eq(optimizationRuns.id, id)).run();
}

export function getOptimizationRunsByDateRange(startDate: Date, endDate: Date) {
  const db = getDatabase();
  return db.select()
    .from(optimizationRuns)
    .where(and(
      gte(optimizationRuns.runAt, startDate),
      sql`${optimizationRuns.runAt} <= ${endDate}`
    ))
    .orderBy(desc(optimizationRuns.runAt))
    .all();
}

// ============================================================================
// Optimization Analytics
// ============================================================================

export interface OptimizationTrendData {
  month: string;
  runCount: number;
  totalOrdersOptimized: number;
  averageSavingsPercent: number;
  totalSavingsMinutes: number;
  totalDowntimeSavingsMinutes: number;
}

export function getOptimizationSavingsTrend(months: number = 12): OptimizationTrendData[] {
  const db = getDatabase();

  // Get cutoff date
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  // Get all runs within date range
  const runs = db.select()
    .from(optimizationRuns)
    .where(gte(optimizationRuns.runAt, cutoffDate))
    .orderBy(optimizationRuns.runAt)
    .all();

  // Group by month
  const monthlyData = new Map<string, {
    runCount: number;
    totalOrders: number;
    totalSavingsPercent: number;
    totalSavings: number;
    totalDowntimeSavings: number;
  }>();

  for (const run of runs) {
    const date = run.runAt instanceof Date ? run.runAt : new Date(run.runAt as number);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const existing = monthlyData.get(monthKey) || {
      runCount: 0,
      totalOrders: 0,
      totalSavingsPercent: 0,
      totalSavings: 0,
      totalDowntimeSavings: 0,
    };

    existing.runCount += 1;
    existing.totalOrders += run.orderCount;
    existing.totalSavingsPercent += run.savingsPercent;
    existing.totalSavings += run.savings;
    existing.totalDowntimeSavings += run.downtimeSavings;

    monthlyData.set(monthKey, existing);
  }

  // Convert to array and calculate averages
  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      runCount: data.runCount,
      totalOrdersOptimized: data.totalOrders,
      averageSavingsPercent: data.runCount > 0 ? data.totalSavingsPercent / data.runCount : 0,
      totalSavingsMinutes: data.totalSavings,
      totalDowntimeSavingsMinutes: data.totalDowntimeSavings,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getTopOptimizationRuns(limit: number = 10) {
  const db = getDatabase();
  return db.select()
    .from(optimizationRuns)
    .orderBy(desc(optimizationRuns.savingsPercent))
    .limit(limit)
    .all();
}

export interface OptimizationOverviewStats {
  totalRuns: number;
  totalOrdersOptimized: number;
  averageSavingsPercent: number;
  bestSavingsPercent: number;
  totalSavingsMinutes: number;
  totalDowntimeSavingsMinutes: number;
}

export function getOptimizationOverviewStats(): OptimizationOverviewStats {
  const db = getDatabase();

  const runs = db.select()
    .from(optimizationRuns)
    .all();

  if (runs.length === 0) {
    return {
      totalRuns: 0,
      totalOrdersOptimized: 0,
      averageSavingsPercent: 0,
      bestSavingsPercent: 0,
      totalSavingsMinutes: 0,
      totalDowntimeSavingsMinutes: 0,
    };
  }

  const totalOrders = runs.reduce((sum, r) => sum + r.orderCount, 0);
  const totalSavingsPercent = runs.reduce((sum, r) => sum + r.savingsPercent, 0);
  const totalSavings = runs.reduce((sum, r) => sum + r.savings, 0);
  const totalDowntimeSavings = runs.reduce((sum, r) => sum + r.downtimeSavings, 0);
  const bestSavings = Math.max(...runs.map(r => r.savingsPercent));

  return {
    totalRuns: runs.length,
    totalOrdersOptimized: totalOrders,
    averageSavingsPercent: totalSavingsPercent / runs.length,
    bestSavingsPercent: bestSavings,
    totalSavingsMinutes: totalSavings,
    totalDowntimeSavingsMinutes: totalDowntimeSavings,
  };
}

// ============================================================================
// SMED Analytics
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

export function getSmedOverviewStats(): SmedOverviewStats {
  const db = getDatabase();

  const studies = db.select()
    .from(smedStudies)
    .all();

  // Count by status
  const studiesByStatus: Record<string, number> = {};
  let activeCount = 0;
  let totalBaseline = 0;
  let totalCurrent = 0;

  for (const study of studies) {
    // Count by status
    studiesByStatus[study.status] = (studiesByStatus[study.status] || 0) + 1;

    // Count active (not archived)
    if (study.status !== 'archived') {
      activeCount += 1;
    }

    // Sum times
    if (study.baselineMinutes) totalBaseline += study.baselineMinutes;
    if (study.currentMinutes) totalCurrent += study.currentMinutes;
  }

  const totalSavings = totalBaseline - totalCurrent;
  const savingsPercent = totalBaseline > 0 ? (totalSavings / totalBaseline) * 100 : 0;

  return {
    totalStudies: studies.length,
    activeStudies: activeCount,
    studiesByStatus,
    totalBaselineMinutes: totalBaseline,
    totalCurrentMinutes: totalCurrent,
    totalSavingsMinutes: totalSavings,
    totalSavingsPercent: savingsPercent,
  };
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

export function getStudyComparisonData(): StudyComparisonData[] {
  const db = getDatabase();

  const studies = db.select()
    .from(smedStudies)
    .where(ne(smedStudies.status, 'archived'))
    .orderBy(desc(smedStudies.updatedAt))
    .all();

  return studies.map(study => {
    // Get steps for this study to calculate internal/external breakdown
    const steps = db.select()
      .from(smedSteps)
      .where(eq(smedSteps.studyId, study.id))
      .all();

    const totalTime = steps.reduce((sum, s) => sum + s.durationSeconds, 0);
    const internalTime = steps
      .filter(s => s.operationType === 'internal')
      .reduce((sum, s) => sum + s.durationSeconds, 0);

    const internalPercent = totalTime > 0 ? (internalTime / totalTime) * 100 : 0;
    const externalPercent = totalTime > 0 ? ((totalTime - internalTime) / totalTime) * 100 : 0;

    const baseline = study.baselineMinutes ?? 0;
    const current = study.currentMinutes ?? 0;
    const savings = baseline > 0 ? ((baseline - current) / baseline) * 100 : 0;

    return {
      id: study.id,
      name: study.name,
      status: study.status,
      baselineMinutes: study.baselineMinutes,
      currentMinutes: study.currentMinutes,
      targetMinutes: study.targetMinutes,
      savingsPercent: savings,
      internalTimePercent: internalPercent,
      externalTimePercent: externalPercent,
    };
  });
}

export interface ImprovementTrendData {
  month: string;
  ideasCreated: number;
  implementedCount: number;
  verifiedCount: number;
  estimatedSavingsSeconds: number;
  actualSavingsSeconds: number;
}

export function getImprovementTrends(months: number = 12): ImprovementTrendData[] {
  const db = getDatabase();

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  const improvements = db.select()
    .from(smedImprovements)
    .where(gte(smedImprovements.createdAt, cutoffDate))
    .orderBy(smedImprovements.createdAt)
    .all();

  // Group by month
  const monthlyData = new Map<string, {
    ideasCreated: number;
    implementedCount: number;
    verifiedCount: number;
    estimatedSavings: number;
    actualSavings: number;
  }>();

  for (const imp of improvements) {
    const date = imp.createdAt instanceof Date ? imp.createdAt : new Date(imp.createdAt as number);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const existing = monthlyData.get(monthKey) || {
      ideasCreated: 0,
      implementedCount: 0,
      verifiedCount: 0,
      estimatedSavings: 0,
      actualSavings: 0,
    };

    existing.ideasCreated += 1;

    if (imp.status === 'implemented' || imp.status === 'verified') {
      existing.implementedCount += 1;
    }
    if (imp.status === 'verified') {
      existing.verifiedCount += 1;
    }

    existing.estimatedSavings += imp.estimatedSavingsSeconds ?? 0;
    existing.actualSavings += imp.actualSavingsSeconds ?? 0;

    monthlyData.set(monthKey, existing);
  }

  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      ideasCreated: data.ideasCreated,
      implementedCount: data.implementedCount,
      verifiedCount: data.verifiedCount,
      estimatedSavingsSeconds: data.estimatedSavings,
      actualSavingsSeconds: data.actualSavings,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export interface ImprovementTypeStats {
  type: string;
  count: number;
  totalEstimatedSavings: number;
  totalActualSavings: number;
}

export function getImprovementTypeDistribution(): ImprovementTypeStats[] {
  const db = getDatabase();

  const improvements = db.select()
    .from(smedImprovements)
    .all();

  // Group by type
  const typeData = new Map<string, {
    count: number;
    estimatedSavings: number;
    actualSavings: number;
  }>();

  for (const imp of improvements) {
    const existing = typeData.get(imp.improvementType) || {
      count: 0,
      estimatedSavings: 0,
      actualSavings: 0,
    };

    existing.count += 1;
    existing.estimatedSavings += imp.estimatedSavingsSeconds ?? 0;
    existing.actualSavings += imp.actualSavingsSeconds ?? 0;

    typeData.set(imp.improvementType, existing);
  }

  return Array.from(typeData.entries())
    .map(([type, data]) => ({
      type,
      count: data.count,
      totalEstimatedSavings: data.estimatedSavings,
      totalActualSavings: data.actualSavings,
    }))
    .sort((a, b) => b.count - a.count);
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

export function getOperationTypeBreakdown(): OperationTypeBreakdown {
  const db = getDatabase();

  // Get all non-archived studies
  const studies = db.select()
    .from(smedStudies)
    .where(ne(smedStudies.status, 'archived'))
    .all();

  let totalInternal = 0;
  let totalExternal = 0;
  const studyBreakdowns: OperationTypeBreakdown['studyBreakdowns'] = [];

  for (const study of studies) {
    const steps = db.select()
      .from(smedSteps)
      .where(eq(smedSteps.studyId, study.id))
      .all();

    const internalTime = steps
      .filter(s => s.operationType === 'internal')
      .reduce((sum, s) => sum + s.durationSeconds, 0);

    const externalTime = steps
      .filter(s => s.operationType === 'external')
      .reduce((sum, s) => sum + s.durationSeconds, 0);

    totalInternal += internalTime;
    totalExternal += externalTime;

    if (steps.length > 0) {
      studyBreakdowns.push({
        studyId: study.id,
        studyName: study.name,
        internalSeconds: internalTime,
        externalSeconds: externalTime,
      });
    }
  }

  const total = totalInternal + totalExternal;

  return {
    totalInternalSeconds: totalInternal,
    totalExternalSeconds: totalExternal,
    internalPercent: total > 0 ? (totalInternal / total) * 100 : 0,
    externalPercent: total > 0 ? (totalExternal / total) * 100 : 0,
    studyBreakdowns,
  };
}
