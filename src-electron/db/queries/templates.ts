import { eq, desc } from 'drizzle-orm';
import { getDatabase } from '../index';
import { templates } from '../schema';
import type { StoredTemplate } from '../../types';

/**
 * Get all templates, sorted by most recently updated first
 */
export async function getAllTemplates(): Promise<StoredTemplate[]> {
  const db = getDatabase();
  const rows = db.select().from(templates).orderBy(desc(templates.updatedAt)).all();

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    created: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    modified: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString(),
    config: {
      orderIdColumn: row.orderIdColumn,
      attributes: JSON.parse(row.attributesJson),
    },
  }));
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(id: string): Promise<StoredTemplate | null> {
  const db = getDatabase();
  const row = db.select().from(templates).where(eq(templates.id, id)).get();

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    created: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    modified: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString(),
    config: {
      orderIdColumn: row.orderIdColumn,
      attributes: JSON.parse(row.attributesJson),
    },
  };
}

/**
 * Save a template (insert or update)
 */
export async function saveTemplate(template: StoredTemplate): Promise<void> {
  const db = getDatabase();

  const values = {
    id: template.id,
    name: template.name,
    orderIdColumn: template.config.orderIdColumn,
    attributesJson: JSON.stringify(template.config.attributes),
    updatedAt: new Date(),
  };

  // Try to insert, if conflict (existing ID) then update
  db.insert(templates)
    .values(values)
    .onConflictDoUpdate({
      target: templates.id,
      set: {
        name: values.name,
        orderIdColumn: values.orderIdColumn,
        attributesJson: values.attributesJson,
        updatedAt: values.updatedAt,
      },
    })
    .run();
}

/**
 * Delete a template by ID
 */
export async function deleteTemplate(id: string): Promise<void> {
  const db = getDatabase();
  db.delete(templates).where(eq(templates.id, id)).run();
}
