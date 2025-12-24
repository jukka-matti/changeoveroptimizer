import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

/**
 * Templates table - Stores changeover configuration templates
 * Replaces the JSON file-based storage
 */
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  name: text('name').notNull(),
  description: text('description'),

  // Configuration stored as JSON
  orderIdColumn: text('order_id_column').notNull(),
  attributesJson: text('attributes_json').notNull(), // JSON array of AttributeConfig

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .$defaultFn(() => new Date()),
});
