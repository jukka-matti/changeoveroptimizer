import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { templates } from './templates';

/**
 * Optimization Runs - History of optimization executions
 * Tracks each optimization run with its results for analytics
 */
export const optimizationRuns = sqliteTable('optimization_runs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // Optional metadata
  name: text('name'), // User-defined name for the run
  fileName: text('file_name'), // Source file name

  // Run metrics
  orderCount: integer('order_count').notNull(),
  attributeCount: integer('attribute_count').notNull(),

  // Work time metrics (labor cost)
  totalBefore: real('total_before').notNull(),
  totalAfter: real('total_after').notNull(),
  savings: real('savings').notNull(),
  savingsPercent: real('savings_percent').notNull(),

  // Downtime metrics (production impact)
  totalDowntimeBefore: real('total_downtime_before').notNull(),
  totalDowntimeAfter: real('total_downtime_after').notNull(),
  downtimeSavings: real('downtime_savings').notNull(),
  downtimeSavingsPercent: real('downtime_savings_percent').notNull(),

  // Configuration snapshot (JSON)
  attributesJson: text('attributes_json').notNull(), // JSON of AttributeConfig[]
  attributeStatsJson: text('attribute_stats_json').notNull(), // JSON of AttributeStat[]

  // Reference to template used (optional)
  templateId: text('template_id')
    .references(() => templates.id, { onDelete: 'set null' }),

  // Timestamp
  runAt: integer('run_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
}, (table) => ({
  runAtIdx: index('optimization_runs_run_at_idx').on(table.runAt),
  templateIdIdx: index('optimization_runs_template_id_idx').on(table.templateId),
}));

// Type exports for use in queries
export type OptimizationRun = typeof optimizationRuns.$inferSelect;
export type OptimizationRunInsert = typeof optimizationRuns.$inferInsert;
