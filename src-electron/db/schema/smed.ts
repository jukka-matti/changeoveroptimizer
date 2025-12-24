import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { products } from './products';

/**
 * SMED Studies - Main study records for changeover improvement
 */
export const smedStudies = sqliteTable('smed_studies', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // Basic info
  name: text('name').notNull(),
  description: text('description'),

  // Changeover type - either product references OR free text
  fromProductId: text('from_product_id')
    .references(() => products.id, { onDelete: 'set null' }),
  toProductId: text('to_product_id')
    .references(() => products.id, { onDelete: 'set null' }),
  changeoverType: text('changeover_type'), // Free text alternative to product IDs

  // Location
  lineName: text('line_name'),
  machineName: text('machine_name'),

  // Status workflow
  status: text('status', {
    enum: ['draft', 'analyzing', 'improving', 'standardized', 'archived']
  }).default('draft').notNull(),

  // Times (in minutes)
  baselineMinutes: real('baseline_minutes'),
  targetMinutes: real('target_minutes'),
  currentMinutes: real('current_minutes'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .$defaultFn(() => new Date()),
}, (table) => ({
  statusIdx: index('smed_studies_status_idx').on(table.status),
  updatedAtIdx: index('smed_studies_updated_at_idx').on(table.updatedAt),
}));

/**
 * SMED Steps - Individual changeover steps for analysis
 */
export const smedSteps = sqliteTable('smed_steps', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  studyId: text('study_id').notNull()
    .references(() => smedStudies.id, { onDelete: 'cascade' }),

  sequenceNumber: integer('sequence_number').notNull(),
  description: text('description').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),

  category: text('category', {
    enum: ['preparation', 'removal', 'installation', 'adjustment', 'cleanup', 'other']
  }).notNull(),

  operationType: text('operation_type', {
    enum: ['internal', 'external']
  }).notNull(),

  notes: text('notes'),
  videoTimestamp: text('video_timestamp'), // HH:MM:SS format

  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .$defaultFn(() => new Date()),
}, (table) => ({
  studyIdIdx: index('smed_steps_study_id_idx').on(table.studyId),
  sequenceIdx: index('smed_steps_sequence_idx').on(table.studyId, table.sequenceNumber),
}));

/**
 * SMED Improvements - Improvement ideas and tracking
 */
export const smedImprovements = sqliteTable('smed_improvements', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  studyId: text('study_id').notNull()
    .references(() => smedStudies.id, { onDelete: 'cascade' }),

  description: text('description').notNull(),

  improvementType: text('improvement_type', {
    enum: [
      'convert_to_external',
      'streamline_internal',
      'parallelize',
      'eliminate',
      'standardize',
      'quick_release',
      'other'
    ]
  }).notNull(),

  status: text('status', {
    enum: ['idea', 'planned', 'in_progress', 'implemented', 'verified']
  }).default('idea').notNull(),

  // Metrics
  estimatedSavingsSeconds: integer('estimated_savings_seconds'),
  actualSavingsSeconds: integer('actual_savings_seconds'),
  estimatedCost: real('estimated_cost'), // Cost in currency units
  actualCost: real('actual_cost'),

  // Tracking
  assignedTo: text('assigned_to'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  completedDate: integer('completed_date', { mode: 'timestamp' }),

  notes: text('notes'),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .$defaultFn(() => new Date()),
}, (table) => ({
  studyIdIdx: index('smed_improvements_study_id_idx').on(table.studyId),
  statusIdx: index('smed_improvements_status_idx').on(table.status),
}));

/**
 * SMED Standards - Published standard work procedures
 */
export const smedStandards = sqliteTable('smed_standards', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  studyId: text('study_id').notNull()
    .references(() => smedStudies.id, { onDelete: 'cascade' }),

  version: integer('version').notNull().default(1),
  standardTimeMinutes: real('standard_time_minutes').notNull(),

  // Standard procedure (JSON array of steps)
  stepsJson: text('steps_json').notNull(),

  // Documentation
  toolsRequired: text('tools_required'), // JSON array
  safetyPrecautions: text('safety_precautions'),
  visualAidsJson: text('visual_aids_json'), // JSON array of image URLs/paths

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  publishedBy: text('published_by'),

  notes: text('notes'),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .$defaultFn(() => new Date()),
}, (table) => ({
  studyIdIdx: index('smed_standards_study_id_idx').on(table.studyId),
  activeIdx: index('smed_standards_active_idx').on(table.isActive),
}));

/**
 * SMED Changeover Logs - Actual changeover execution records
 */
export const smedChangeoverLogs = sqliteTable('smed_changeover_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  studyId: text('study_id').notNull()
    .references(() => smedStudies.id, { onDelete: 'cascade' }),
  standardId: text('standard_id')
    .references(() => smedStandards.id, { onDelete: 'set null' }),

  // Execution details
  operator: text('operator'),
  totalSeconds: integer('total_seconds').notNull(),

  // Step-by-step timing (JSON array)
  stepTimingsJson: text('step_timings_json'), // [{ stepId, seconds }]

  // Variance analysis
  varianceSeconds: integer('variance_seconds'), // Difference from standard
  variancePercent: real('variance_percent'),

  // Notes
  notes: text('notes'),
  issues: text('issues'), // Problems encountered

  // Metadata
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
}, (table) => ({
  studyIdIdx: index('smed_logs_study_id_idx').on(table.studyId),
  startedAtIdx: index('smed_logs_started_at_idx').on(table.startedAt),
}));
