import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

/**
 * Saved Configurations table
 *
 * Stores file structure configurations that can be automatically applied
 * when importing files with matching column structures.
 *
 * The fingerprint is a pipe-delimited sorted list of column names,
 * enabling quick matching of imported files to saved configurations.
 */
export const savedConfigurations = sqliteTable('saved_configurations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // Column fingerprint for matching (e.g., "Color|Material|Order_ID|Size")
  fingerprint: text('fingerprint').notNull().unique(),

  // User-friendly name (auto-generated or user-defined)
  name: text('name').notNull(),

  // Configuration
  orderIdColumn: text('order_id_column').notNull(),
  attributesJson: text('attributes_json').notNull(), // JSON array of AttributeConfig

  // Export preferences (remembers last export format)
  lastExportFormat: text('last_export_format'), // 'xlsx' | 'csv' | 'pdf'

  // Usage tracking
  usageCount: integer('usage_count').notNull().default(0),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
}, (table) => ({
  fingerprintIdx: index('saved_configurations_fingerprint_idx').on(table.fingerprint),
  lastUsedIdx: index('saved_configurations_last_used_idx').on(table.lastUsedAt),
}));

// Type exports for use in queries
export type SavedConfiguration = typeof savedConfigurations.$inferSelect;
export type SavedConfigurationInsert = typeof savedConfigurations.$inferInsert;
