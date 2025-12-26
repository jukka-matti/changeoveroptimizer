import { eq, desc, and } from 'drizzle-orm';
import { getDatabase } from '../index';
import {
  smedStudies,
  smedSteps,
  smedImprovements,
  smedStandards,
  smedChangeoverLogs,
} from '../schema/smed';

// ============================================================================
// Study operations
// ============================================================================

export function getAllStudies() {
  const db = getDatabase();
  return db.select()
    .from(smedStudies)
    .orderBy(desc(smedStudies.updatedAt))
    .all();
}

export function getStudyById(id: string) {
  const db = getDatabase();
  return db.select()
    .from(smedStudies)
    .where(eq(smedStudies.id, id))
    .get();
}

export function createStudy(data: typeof smedStudies.$inferInsert) {
  const db = getDatabase();
  const result = db.insert(smedStudies).values(data).returning().get();
  return result;
}

export function updateStudy(id: string, data: Partial<typeof smedStudies.$inferInsert>) {
  const db = getDatabase();
  return db.update(smedStudies)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(smedStudies.id, id))
    .returning()
    .get();
}

export function deleteStudy(id: string) {
  const db = getDatabase();
  db.delete(smedStudies).where(eq(smedStudies.id, id)).run();
}

// ============================================================================
// Step operations
// ============================================================================

export function getStepsByStudyId(studyId: string) {
  const db = getDatabase();
  return db.select()
    .from(smedSteps)
    .where(eq(smedSteps.studyId, studyId))
    .orderBy(smedSteps.sequenceNumber)
    .all();
}

export function createStep(data: typeof smedSteps.$inferInsert) {
  const db = getDatabase();
  const result = db.insert(smedSteps).values(data).returning().get();
  return result;
}

export function updateStep(id: string, data: Partial<typeof smedSteps.$inferInsert>) {
  const db = getDatabase();
  return db.update(smedSteps)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(smedSteps.id, id))
    .returning()
    .get();
}

export function deleteStep(id: string) {
  const db = getDatabase();
  db.delete(smedSteps).where(eq(smedSteps.id, id)).run();
}

// ============================================================================
// Improvement operations
// ============================================================================

export function getImprovementsByStudyId(studyId: string) {
  const db = getDatabase();
  return db.select()
    .from(smedImprovements)
    .where(eq(smedImprovements.studyId, studyId))
    .orderBy(desc(smedImprovements.createdAt))
    .all();
}

export function createImprovement(data: typeof smedImprovements.$inferInsert) {
  const db = getDatabase();
  const result = db.insert(smedImprovements).values(data).returning().get();
  return result;
}

export function updateImprovement(id: string, data: Partial<typeof smedImprovements.$inferInsert>) {
  const db = getDatabase();
  return db.update(smedImprovements)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(smedImprovements.id, id))
    .returning()
    .get();
}

// ============================================================================
// Standard work operations
// ============================================================================

export function getStandardsByStudyId(studyId: string) {
  const db = getDatabase();
  return db.select()
    .from(smedStandards)
    .where(eq(smedStandards.studyId, studyId))
    .orderBy(desc(smedStandards.version))
    .all();
}

export function getActiveStandard(studyId: string) {
  const db = getDatabase();
  return db.select()
    .from(smedStandards)
    .where(and(
      eq(smedStandards.studyId, studyId),
      eq(smedStandards.isActive, true)
    ))
    .get();
}

export function createStandard(data: typeof smedStandards.$inferInsert) {
  const db = getDatabase();
  const result = db.insert(smedStandards).values(data).returning().get();
  return result;
}

export function updateStandard(id: string, data: Partial<typeof smedStandards.$inferInsert>) {
  const db = getDatabase();
  const result = db.update(smedStandards)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(smedStandards.id, id))
    .returning()
    .get();
  return result;
}

import { products } from '../schema/products';
import {
  changeoverAttributes,
  upsertMatrixEntry,
  upsertChangeoverAttribute,
  getChangeoverAttributeByName,
  updateChangeoverAttribute,
  createChangeoverAttribute
} from './changeovers';

export function publishStandard(standardId: string, updateOptimizer: boolean = true) {
  const db = getDatabase();

  // Get the standard to find its studyId
  const standard = db.select()
    .from(smedStandards)
    .where(eq(smedStandards.id, standardId))
    .get();

  if (!standard) throw new Error('Standard not found');

  // Deactivate all other standards for this study
  db.update(smedStandards)
    .set({ isActive: false })
    .where(eq(smedStandards.studyId, standard.studyId))
    .run();

  // Activate this standard
  const result = db.update(smedStandards)
    .set({
      isActive: true,
      publishedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(smedStandards.id, standardId))
    .returning()
    .get();

  // --- Live Link: Update Optimizer Rules ---
  if (updateOptimizer) {
    try {
      const study = db.select()
        .from(smedStudies)
        .where(eq(smedStudies.id, standard.studyId))
        .get();

      if (study) {
        // Scenario A: Specific Product Changeover (Matrix Update)
        if (study.fromProductId && study.toProductId) {
          const fromProduct = db.select().from(products).where(eq(products.id, study.fromProductId)).get();
          const toProduct = db.select().from(products).where(eq(products.id, study.toProductId)).get();

          // We need to know WHICH Attribute this product changeover belongs to.
          // In V1, this link is weak. We usually define Matrix entries by "Attribute Name -> Value".
          // If the Study is linked to Products, we need to know the Product's Attribute Values (e.g. Color=Red).
          // Currently `products` schema might not hold this. 
          // Fallback: Check if `changeoverType` matches an Attribute Name (e.g. "Color").

          if (fromProduct && toProduct && study.changeoverType) {
            const attribute = getChangeoverAttributeByName(study.changeoverType);
            if (attribute) {
              // We assume the Product Name OR a specific field is the "Value". 
              // For V1, let's assume `fromProduct.name` as the value? Or do products have attributes column?
              // Let's assume simpler: standard.changeoverType IS the attribute, and we need values.
              // Actually, if it's product-to-product, it's a "SKU Transition".
              // The Matrix supports `attribute_id`... maybe we need a "SKU" attribute?

              // SIMPLIFICATION for V1:
              // If `changeoverType` is an Attribute (e.g. "Color"), update the Default Time for that Attribute.
              // Complex Matrix updates (Red->Blue) require knowing Red and Blue.

              // Let's implement Scenario B (Generic) first as it's safer.
              upsertChangeoverAttribute({
                name: study.changeoverType,
                displayName: study.changeoverType, // Keep existing display name or update?
                defaultMinutes: standard.standardTimeMinutes,
                hierarchyLevel: attribute.hierarchyLevel, // Preserve
                parallelGroup: attribute.parallelGroup, // Preserve
                isActive: true
              });
            }
          }
        }

        // Scenario B: Generic / Attribute-based Changeover
        // If the Study Name or Changeover Type matches an Attribute Name
        else if (study.changeoverType) {
          const attribute = getChangeoverAttributeByName(study.changeoverType);
          // If attribute exists, update its default time ONLY (preserve other config)
          if (attribute) {
            updateChangeoverAttribute(attribute.id, {
              defaultMinutes: standard.standardTimeMinutes
            });
          } else {
            // Auto-learn: Create new attribute with intelligent defaults
            createChangeoverAttribute({
              name: study.changeoverType,
              displayName: study.changeoverType,
              defaultMinutes: standard.standardTimeMinutes,
              hierarchyLevel: 99, // Low priority for auto-created
              parallelGroup: 'default',
              isActive: true,
              sortOrder: 0
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to update optimizer rules via Live Link:', err);
      // We don't fail the publish action if the optimizer update fails
    }
  }

  return result;
}

export function deactivateStandard(standardId: string) {
  const db = getDatabase();
  const result = db.update(smedStandards)
    .set({
      isActive: false,
      updatedAt: new Date()
    })
    .where(eq(smedStandards.id, standardId))
    .returning()
    .get();
  return result;
}

// ============================================================================
// Changeover log operations
// ============================================================================

export function getLogsByStudyId(studyId: string, limit: number = 50) {
  const db = getDatabase();
  return db.select()
    .from(smedChangeoverLogs)
    .where(eq(smedChangeoverLogs.studyId, studyId))
    .orderBy(desc(smedChangeoverLogs.startedAt))
    .limit(limit)
    .all();
}

export function createChangeoverLog(data: typeof smedChangeoverLogs.$inferInsert) {
  const db = getDatabase();
  const result = db.insert(smedChangeoverLogs).values(data).returning().get();
  return result;
}

// ============================================================================
// Analytics helpers
// ============================================================================

export function getStudyStatistics(studyId: string) {
  // Get all steps
  const steps = getStepsByStudyId(studyId);

  // Get recent logs
  const logs = getLogsByStudyId(studyId, 10);

  // Calculate metrics
  const totalSteps = steps.length;
  const internalSteps = steps.filter(s => s.operationType === 'internal').length;
  const externalSteps = steps.filter(s => s.operationType === 'external').length;

  const totalTime = steps.reduce((sum, s) => sum + s.durationSeconds, 0);
  const internalTime = steps
    .filter(s => s.operationType === 'internal')
    .reduce((sum, s) => sum + s.durationSeconds, 0);
  const externalTime = steps
    .filter(s => s.operationType === 'external')
    .reduce((sum, s) => sum + s.durationSeconds, 0);

  const avgLogTime = logs.length > 0
    ? logs.reduce((sum, l) => sum + l.totalSeconds, 0) / logs.length
    : null;

  return {
    totalSteps,
    internalSteps,
    externalSteps,
    totalTimeSeconds: totalTime,
    internalTimeSeconds: internalTime,
    externalTimeSeconds: externalTime,
    internalPercentage: totalTime > 0 ? (internalTime / totalTime) * 100 : 0,
    externalPercentage: totalTime > 0 ? (externalTime / totalTime) * 100 : 0,
    recentLogCount: logs.length,
    averageLogTimeSeconds: avgLogTime,
  };
}
