import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { smedStudies } from './smed';

/**
 * Changeover Attributes - Defines attributes that trigger changeovers
 * These are the master attribute definitions with default times
 */
export const changeoverAttributes = sqliteTable('changeover_attributes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // Attribute identification
  name: text('name').notNull(), // Internal name: "color", "size"
  displayName: text('display_name').notNull(), // UI display: "Color", "Size"

  // Configuration
  hierarchyLevel: integer('hierarchy_level').notNull(), // Priority order (lower = higher priority)
  defaultMinutes: real('default_minutes').notNull().default(0),
  parallelGroup: text('parallel_group').notNull().default('default'), // "default", "A", "B", "C", "D"

  // Ordering and state
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .$defaultFn(() => new Date()),
}, (table) => ({
  nameIdx: index('changeover_attributes_name_idx').on(table.name),
  activeIdx: index('changeover_attributes_active_idx').on(table.isActive),
}));

/**
 * Changeover Matrix - Specific value-to-value changeover times
 * Allows defining exact times for specific transitions (e.g., Red -> Blue = 15 min)
 */
export const changeoverMatrix = sqliteTable('changeover_matrix', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // Reference to attribute
  attributeId: text('attribute_id').notNull()
    .references(() => changeoverAttributes.id, { onDelete: 'cascade' }),

  // Transition definition
  fromValue: text('from_value').notNull(),
  toValue: text('to_value').notNull(),
  timeMinutes: real('time_minutes').notNull(),

  // Data source tracking
  source: text('source', {
    enum: ['manual', 'smed_standard', 'smed_average', 'imported']
  }).notNull().default('manual'),

  // Optional reference to SMED study (for traceability)
  smedStudyId: text('smed_study_id')
    .references(() => smedStudies.id, { onDelete: 'set null' }),

  notes: text('notes'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .$defaultFn(() => new Date()),
}, (table) => ({
  // Composite index for efficient lookups
  attrFromToIdx: index('changeover_matrix_attr_from_to_idx')
    .on(table.attributeId, table.fromValue, table.toValue),
  attributeIdx: index('changeover_matrix_attribute_idx').on(table.attributeId),
}));

// Type exports for use in queries
export type ChangeoverAttribute = typeof changeoverAttributes.$inferSelect;
export type ChangeoverAttributeInsert = typeof changeoverAttributes.$inferInsert;
export type ChangeoverMatrixEntry = typeof changeoverMatrix.$inferSelect;
export type ChangeoverMatrixEntryInsert = typeof changeoverMatrix.$inferInsert;
