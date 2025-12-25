import { eq, and, inArray } from 'drizzle-orm';
import { getDatabase } from '../index';
import {
  changeoverAttributes,
  changeoverMatrix,
  type ChangeoverAttributeInsert,
  type ChangeoverMatrixEntryInsert,
} from '../schema/changeovers';

// ============================================================================
// Changeover Attribute operations
// ============================================================================

export function getAllChangeoverAttributes() {
  const db = getDatabase();
  return db.select()
    .from(changeoverAttributes)
    .orderBy(changeoverAttributes.sortOrder)
    .all();
}

export function getActiveChangeoverAttributes() {
  const db = getDatabase();
  return db.select()
    .from(changeoverAttributes)
    .where(eq(changeoverAttributes.isActive, true))
    .orderBy(changeoverAttributes.sortOrder)
    .all();
}

export function getChangeoverAttributeById(id: string) {
  const db = getDatabase();
  return db.select()
    .from(changeoverAttributes)
    .where(eq(changeoverAttributes.id, id))
    .get();
}

export function getChangeoverAttributeByName(name: string) {
  const db = getDatabase();
  return db.select()
    .from(changeoverAttributes)
    .where(eq(changeoverAttributes.name, name))
    .get();
}

export function createChangeoverAttribute(data: ChangeoverAttributeInsert) {
  const db = getDatabase();
  return db.insert(changeoverAttributes).values(data).returning().get();
}

export function updateChangeoverAttribute(id: string, data: Partial<ChangeoverAttributeInsert>) {
  const db = getDatabase();
  return db.update(changeoverAttributes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(changeoverAttributes.id, id))
    .returning()
    .get();
}

export function upsertChangeoverAttribute(data: ChangeoverAttributeInsert) {
  const db = getDatabase();

  // Check if attribute with this name exists
  const existing = getChangeoverAttributeByName(data.name);

  if (existing) {
    return updateChangeoverAttribute(existing.id, data);
  } else {
    return createChangeoverAttribute(data);
  }
}

export function deleteChangeoverAttribute(id: string) {
  const db = getDatabase();
  db.delete(changeoverAttributes).where(eq(changeoverAttributes.id, id)).run();
}

// ============================================================================
// Changeover Matrix operations
// ============================================================================

export function getMatrixByAttribute(attributeId: string) {
  const db = getDatabase();
  return db.select()
    .from(changeoverMatrix)
    .where(eq(changeoverMatrix.attributeId, attributeId))
    .all();
}

export function getMatrixEntry(attributeId: string, fromValue: string, toValue: string) {
  const db = getDatabase();
  return db.select()
    .from(changeoverMatrix)
    .where(and(
      eq(changeoverMatrix.attributeId, attributeId),
      eq(changeoverMatrix.fromValue, fromValue),
      eq(changeoverMatrix.toValue, toValue)
    ))
    .get();
}

export function createMatrixEntry(data: ChangeoverMatrixEntryInsert) {
  const db = getDatabase();
  return db.insert(changeoverMatrix).values(data).returning().get();
}

export function updateMatrixEntry(id: string, data: Partial<ChangeoverMatrixEntryInsert>) {
  const db = getDatabase();
  return db.update(changeoverMatrix)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(changeoverMatrix.id, id))
    .returning()
    .get();
}

export function upsertMatrixEntry(data: ChangeoverMatrixEntryInsert) {
  const db = getDatabase();

  // Check if entry exists
  const existing = getMatrixEntry(data.attributeId, data.fromValue, data.toValue);

  if (existing) {
    return updateMatrixEntry(existing.id, data);
  } else {
    return createMatrixEntry(data);
  }
}

export function deleteMatrixEntry(id: string) {
  const db = getDatabase();
  db.delete(changeoverMatrix).where(eq(changeoverMatrix.id, id)).run();
}

export function deleteMatrixEntriesByAttribute(attributeId: string) {
  const db = getDatabase();
  db.delete(changeoverMatrix).where(eq(changeoverMatrix.attributeId, attributeId)).run();
}

// ============================================================================
// Lookup operations (for optimizer)
// ============================================================================

/**
 * Get a single changeover time lookup
 * Returns null if no specific matrix entry exists
 */
export function getChangeoverTime(
  attributeName: string,
  fromValue: string,
  toValue: string
): number | null {
  const db = getDatabase();

  // First find the attribute by name
  const attr = getChangeoverAttributeByName(attributeName);
  if (!attr) return null;

  // Look up in matrix
  const entry = getMatrixEntry(attr.id, fromValue, toValue);
  return entry ? entry.timeMinutes : null;
}

/**
 * Batch lookup for optimizer efficiency
 * Returns a Map of "attributeName:fromValue:toValue" -> timeMinutes
 */
export function batchGetChangeoverTimes(
  lookups: Array<{ attributeName: string; fromValue: string; toValue: string }>
): Map<string, number> {
  const db = getDatabase();
  const result = new Map<string, number>();

  // Get all active attributes
  const attributes = getActiveChangeoverAttributes();
  const attrByName = new Map(attributes.map(a => [a.name, a]));

  // Get attribute IDs we need
  const attrIds = new Set<string>();
  for (const lookup of lookups) {
    const attr = attrByName.get(lookup.attributeName);
    if (attr) attrIds.add(attr.id);
  }

  if (attrIds.size === 0) return result;

  // Fetch all matrix entries for these attributes
  const entries = db.select()
    .from(changeoverMatrix)
    .where(inArray(changeoverMatrix.attributeId, Array.from(attrIds)))
    .all();

  // Build lookup map by attribute ID
  const matrixByAttr = new Map<string, Map<string, number>>();
  for (const entry of entries) {
    if (!matrixByAttr.has(entry.attributeId)) {
      matrixByAttr.set(entry.attributeId, new Map());
    }
    const key = `${entry.fromValue}:${entry.toValue}`;
    matrixByAttr.get(entry.attributeId)!.set(key, entry.timeMinutes);
  }

  // Build result map
  for (const lookup of lookups) {
    const attr = attrByName.get(lookup.attributeName);
    if (!attr) continue;

    const attrMatrix = matrixByAttr.get(attr.id);
    if (!attrMatrix) continue;

    const key = `${lookup.fromValue}:${lookup.toValue}`;
    const time = attrMatrix.get(key);
    if (time !== undefined) {
      const resultKey = `${lookup.attributeName}:${lookup.fromValue}:${lookup.toValue}`;
      result.set(resultKey, time);
    }
  }

  return result;
}

/**
 * Prefetch all matrix data for a set of attribute names and values
 * Used before optimization to load all relevant data in one query
 */
export function prefetchMatrixData(
  attributeNames: string[],
  valuesByAttribute: Map<string, Set<string>>
): Map<string, number> {
  const db = getDatabase();
  const result = new Map<string, number>();

  // Get attributes by name
  const attributes = getActiveChangeoverAttributes()
    .filter(a => attributeNames.includes(a.name));

  if (attributes.length === 0) return result;

  const attrIds = attributes.map(a => a.id);
  const attrByIdToName = new Map(attributes.map(a => [a.id, a.name]));

  // Fetch all matrix entries for these attributes
  const entries = db.select()
    .from(changeoverMatrix)
    .where(inArray(changeoverMatrix.attributeId, attrIds))
    .all();

  // Build result map with full keys
  for (const entry of entries) {
    const attrName = attrByIdToName.get(entry.attributeId);
    if (!attrName) continue;

    // Check if these values are in our set
    const values = valuesByAttribute.get(attrName);
    if (values && values.has(entry.fromValue) && values.has(entry.toValue)) {
      const key = `${attrName}:${entry.fromValue}:${entry.toValue}`;
      result.set(key, entry.timeMinutes);
    }
  }

  return result;
}

// ============================================================================
// SMED Import operations
// ============================================================================

/**
 * Import changeover time from SMED study standard
 */
export function importFromSmedStandard(
  attributeId: string,
  fromValue: string,
  toValue: string,
  timeMinutes: number,
  smedStudyId: string,
  notes?: string
) {
  return upsertMatrixEntry({
    attributeId,
    fromValue,
    toValue,
    timeMinutes,
    source: 'smed_standard',
    smedStudyId,
    notes,
  });
}

/**
 * Get all matrix entries linked to a specific SMED study
 */
export function getMatrixEntriesBySmedStudy(smedStudyId: string) {
  const db = getDatabase();
  return db.select()
    .from(changeoverMatrix)
    .where(eq(changeoverMatrix.smedStudyId, smedStudyId))
    .all();
}
