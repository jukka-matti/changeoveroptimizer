/**
 * Changeover Matrix IPC handlers
 *
 * Handles: changeover attributes, matrix entries, bulk operations
 */

import { registerHandler } from '../registry';
import {
  getAllChangeoverAttributes,
  getActiveChangeoverAttributes,
  getChangeoverAttributeById,
  upsertChangeoverAttribute,
  deleteChangeoverAttribute,
  getMatrixByAttribute,
  upsertMatrixEntry,
  deleteMatrixEntry,
  batchGetChangeoverTimes,
  prefetchMatrixData,
  importFromSmedStandard,
} from '../../db/queries/changeovers';

export function registerChangeoverHandlers(): void {
  // Attributes
  registerHandler<void, ReturnType<typeof getAllChangeoverAttributes>>(
    'changeover:get_all_attributes',
    () => getAllChangeoverAttributes(),
    'Failed to get changeover attributes'
  );

  registerHandler<void, ReturnType<typeof getActiveChangeoverAttributes>>(
    'changeover:get_active_attributes',
    () => getActiveChangeoverAttributes(),
    'Failed to get active changeover attributes'
  );

  registerHandler<{ id: string }, ReturnType<typeof getChangeoverAttributeById>>(
    'changeover:get_attribute_by_id',
    (args) => getChangeoverAttributeById(args.id),
    'Failed to get changeover attribute'
  );

  registerHandler<{ data: Parameters<typeof upsertChangeoverAttribute>[0] }, ReturnType<typeof upsertChangeoverAttribute>>(
    'changeover:upsert_attribute',
    (args) => upsertChangeoverAttribute(args.data),
    'Failed to upsert changeover attribute'
  );

  registerHandler<{ id: string }, void>(
    'changeover:delete_attribute',
    (args) => deleteChangeoverAttribute(args.id),
    'Failed to delete changeover attribute'
  );

  // Matrix entries
  registerHandler<{ attributeId: string }, ReturnType<typeof getMatrixByAttribute>>(
    'changeover:get_matrix',
    (args) => getMatrixByAttribute(args.attributeId),
    'Failed to get matrix entries'
  );

  registerHandler<{ data: Parameters<typeof upsertMatrixEntry>[0] }, ReturnType<typeof upsertMatrixEntry>>(
    'changeover:upsert_entry',
    (args) => upsertMatrixEntry(args.data),
    'Failed to upsert matrix entry'
  );

  registerHandler<{ id: string }, void>(
    'changeover:delete_entry',
    (args) => deleteMatrixEntry(args.id),
    'Failed to delete matrix entry'
  );

  // Bulk operations
  registerHandler<
    { lookups: Array<{ attributeName: string; fromValue: string; toValue: string }> },
    Record<string, number | null>
  >(
    'changeover:batch_lookup',
    (args) => {
      const result = batchGetChangeoverTimes(args.lookups);
      // Convert Map to object for IPC serialization
      return Object.fromEntries(result);
    },
    'Failed to batch get changeover times'
  );

  registerHandler<
    { attributeNames: string[]; valuesByAttribute: Record<string, string[]> },
    Record<string, number | null>
  >(
    'changeover:prefetch_matrix',
    (args) => {
      // Convert object to Map of Sets
      const valuesMap = new Map<string, Set<string>>();
      for (const [name, values] of Object.entries(args.valuesByAttribute)) {
        valuesMap.set(name, new Set(values));
      }
      const result = prefetchMatrixData(args.attributeNames, valuesMap);
      // Convert Map to object for IPC serialization
      return Object.fromEntries(result);
    },
    'Failed to prefetch matrix data'
  );

  // SMED integration
  registerHandler<
    {
      attributeId: string;
      fromValue: string;
      toValue: string;
      timeMinutes: number;
      smedStudyId: string;
      notes?: string;
    },
    ReturnType<typeof importFromSmedStandard>
  >(
    'changeover:import_smed',
    (args) =>
      importFromSmedStandard(
        args.attributeId,
        args.fromValue,
        args.toValue,
        args.timeMinutes,
        args.smedStudyId,
        args.notes
      ),
    'Failed to import from SMED standard'
  );
}
