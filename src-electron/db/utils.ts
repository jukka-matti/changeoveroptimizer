/**
 * Database Query Utilities
 *
 * Reusable utility functions for common database operations and calculations.
 */

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Get a date that is N months ago from now.
 *
 * @example
 * getMonthsCutoffDate(12) // Date 12 months ago
 */
export function getMonthsCutoffDate(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

/**
 * Convert a date or timestamp to a month key (YYYY-MM format).
 *
 * @example
 * toMonthKey(new Date('2024-03-15')) // '2024-03'
 */
export function toMonthKey(date: Date | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ============================================================================
// Aggregation Utilities
// ============================================================================

/**
 * Groups records by month key (YYYY-MM format).
 *
 * @example
 * const grouped = groupByMonth(runs, (run) => run.runAt);
 * // Map { '2024-01' => [...], '2024-02' => [...] }
 */
export function groupByMonth<T>(
  records: T[],
  getDate: (record: T) => Date | number
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const record of records) {
    const monthKey = toMonthKey(getDate(record));

    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(record);
  }

  return grouped;
}

/**
 * Aggregates records by a key with a custom accumulator.
 *
 * @example
 * const totals = aggregateByKey(
 *   improvements,
 *   (imp) => imp.improvementType,
 *   (acc, imp) => ({ count: acc.count + 1, savings: acc.savings + imp.savings }),
 *   () => ({ count: 0, savings: 0 })
 * );
 */
export function aggregateByKey<T, K extends string, V>(
  records: T[],
  getKey: (record: T) => K,
  accumulator: (acc: V, record: T) => V,
  initialValue: () => V
): Map<K, V> {
  const result = new Map<K, V>();

  for (const record of records) {
    const key = getKey(record);
    const current = result.get(key) ?? initialValue();
    result.set(key, accumulator(current, record));
  }

  return result;
}

// ============================================================================
// Calculation Utilities
// ============================================================================

/**
 * Calculate percentage safely, returning 0 for division by zero.
 *
 * @example
 * calculatePercent(25, 100)    // 25
 * calculatePercent(0, 0)       // 0
 * calculatePercent(50, 200, 2) // 25.00
 */
export function calculatePercent(
  part: number,
  total: number,
  decimals?: number
): number {
  if (total === 0) return 0;
  const percent = (part / total) * 100;
  return decimals !== undefined
    ? Math.round(percent * Math.pow(10, decimals)) / Math.pow(10, decimals)
    : percent;
}

/**
 * Calculate average safely, returning 0 for empty arrays.
 *
 * @example
 * calculateAverage([10, 20, 30]) // 20
 * calculateAverage([])           // 0
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Sum values with optional transformation.
 *
 * @example
 * sumBy(items, (item) => item.value)
 */
export function sumBy<T>(
  items: T[],
  getValue: (item: T) => number
): number {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

/**
 * Sum values that match a condition.
 *
 * @example
 * sumByCondition(steps, (s) => s.operationType === 'internal', (s) => s.durationSeconds)
 */
export function sumByCondition<T>(
  items: T[],
  condition: (item: T) => boolean,
  getValue: (item: T) => number
): number {
  return items
    .filter(condition)
    .reduce((sum, item) => sum + getValue(item), 0);
}

// ============================================================================
// Status Count Utilities
// ============================================================================

/**
 * Count occurrences of each status value.
 *
 * @example
 * countByStatus(studies, 'status')
 * // { draft: 3, analyzing: 2, improving: 1 }
 */
export function countByStatus<T, K extends keyof T>(
  items: T[],
  statusKey: K
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const item of items) {
    const status = String(item[statusKey]);
    counts[status] = (counts[status] || 0) + 1;
  }

  return counts;
}

// ============================================================================
// Monthly Trend Helpers
// ============================================================================

interface MonthlyAccumulator<T> {
  month: string;
  records: T[];
}

/**
 * Process records into monthly trend data.
 * Combines groupByMonth with custom processing.
 *
 * @example
 * const trends = processMonthlyTrend(
 *   runs,
 *   (run) => run.runAt,
 *   (month, records) => ({
 *     month,
 *     count: records.length,
 *     total: sumBy(records, r => r.value)
 *   })
 * );
 */
export function processMonthlyTrend<T, R>(
  records: T[],
  getDate: (record: T) => Date | number,
  processor: (month: string, records: T[]) => R
): R[] {
  const grouped = groupByMonth(records, getDate);

  return Array.from(grouped.entries())
    .map(([month, monthRecords]) => processor(month, monthRecords))
    .sort((a, b) => {
      // Assume result has a month property for sorting
      const aMonth = (a as any).month || '';
      const bMonth = (b as any).month || '';
      return aMonth.localeCompare(bMonth);
    });
}
