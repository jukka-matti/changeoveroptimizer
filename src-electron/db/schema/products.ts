import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

/**
 * Products table - Stores product catalog information
 */
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // Basic info
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),

  // Classification
  family: text('family'),
  category: text('category'),

  // Production
  standardTimeMinutes: real('standard_time_minutes'),
  packQuantity: integer('pack_quantity').default(1),

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .$defaultFn(() => new Date()),
});

/**
 * Product attributes table - Stores attribute values for products
 * Example: Product "Widget A" has Color: "Red", Size: "Large"
 */
export const productAttributes = sqliteTable('product_attributes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').notNull()
    .references(() => products.id, { onDelete: 'cascade' }),

  attributeName: text('attribute_name').notNull(), // e.g., "color", "size"
  attributeValue: text('attribute_value').notNull(), // e.g., "red", "large"

  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});
