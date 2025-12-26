import { eq, desc } from 'drizzle-orm';
import { getDatabase } from '../index';
import {
  savedConfigurations,
  type SavedConfiguration,
  type SavedConfigurationInsert,
} from '../schema/configurations';

// ============================================================================
// Fingerprint Utilities
// ============================================================================

/**
 * Generate a column fingerprint from an array of column names.
 * The fingerprint is a pipe-delimited sorted list of column names.
 *
 * @example
 * generateFingerprint(['Size', 'Color', 'Order_ID']) // "Color|Order_ID|Size"
 */
export function generateFingerprint(columns: string[]): string {
  return [...columns].sort().join('|');
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Find a configuration by its column fingerprint.
 * Returns null if no matching configuration exists.
 */
export function findByFingerprint(fingerprint: string): SavedConfiguration | undefined {
  const db = getDatabase();
  return db.select()
    .from(savedConfigurations)
    .where(eq(savedConfigurations.fingerprint, fingerprint))
    .get();
}

/**
 * Find a configuration by columns (convenience wrapper).
 */
export function findByColumns(columns: string[]): SavedConfiguration | undefined {
  const fingerprint = generateFingerprint(columns);
  return findByFingerprint(fingerprint);
}

/**
 * Get all saved configurations, ordered by last used date.
 */
export function getAllConfigurations(): SavedConfiguration[] {
  const db = getDatabase();
  return db.select()
    .from(savedConfigurations)
    .orderBy(desc(savedConfigurations.lastUsedAt))
    .all();
}

/**
 * Get a configuration by ID.
 */
export function getConfigurationById(id: string): SavedConfiguration | undefined {
  const db = getDatabase();
  return db.select()
    .from(savedConfigurations)
    .where(eq(savedConfigurations.id, id))
    .get();
}

/**
 * Create a new saved configuration.
 */
export function createConfiguration(data: SavedConfigurationInsert): SavedConfiguration {
  const db = getDatabase();
  return db.insert(savedConfigurations)
    .values(data)
    .returning()
    .get();
}

/**
 * Update an existing configuration.
 */
export function updateConfiguration(
  id: string,
  data: Partial<SavedConfigurationInsert>
): void {
  const db = getDatabase();
  db.update(savedConfigurations)
    .set(data)
    .where(eq(savedConfigurations.id, id))
    .run();
}

/**
 * Delete a configuration.
 */
export function deleteConfiguration(id: string): void {
  const db = getDatabase();
  db.delete(savedConfigurations)
    .where(eq(savedConfigurations.id, id))
    .run();
}

/**
 * Record that a configuration was used.
 * Increments usage count and updates lastUsedAt.
 */
export function recordConfigurationUsage(id: string): void {
  const db = getDatabase();
  const config = getConfigurationById(id);
  if (!config) return;

  db.update(savedConfigurations)
    .set({
      usageCount: config.usageCount + 1,
      lastUsedAt: new Date(),
    })
    .where(eq(savedConfigurations.id, id))
    .run();
}

/**
 * Update export preferences for a configuration.
 */
export function updateExportPreference(id: string, format: string): void {
  const db = getDatabase();
  db.update(savedConfigurations)
    .set({ lastExportFormat: format })
    .where(eq(savedConfigurations.id, id))
    .run();
}

// ============================================================================
// Auto-Save Configuration
// ============================================================================

export interface AutoSaveConfigurationInput {
  columns: string[];
  orderIdColumn: string;
  attributesJson: string;
  name?: string;
}

/**
 * Save or update a configuration based on column fingerprint.
 * If a matching configuration exists, updates it.
 * If not, creates a new one.
 */
export function saveOrUpdateConfiguration(
  input: AutoSaveConfigurationInput
): SavedConfiguration {
  const fingerprint = generateFingerprint(input.columns);
  const existing = findByFingerprint(fingerprint);

  if (existing) {
    // Update existing configuration
    updateConfiguration(existing.id, {
      orderIdColumn: input.orderIdColumn,
      attributesJson: input.attributesJson,
      lastUsedAt: new Date(),
    });
    recordConfigurationUsage(existing.id);
    return getConfigurationById(existing.id)!;
  } else {
    // Create new configuration
    const name = input.name || `Configuration ${new Date().toLocaleDateString()}`;
    return createConfiguration({
      fingerprint,
      name,
      orderIdColumn: input.orderIdColumn,
      attributesJson: input.attributesJson,
    });
  }
}
