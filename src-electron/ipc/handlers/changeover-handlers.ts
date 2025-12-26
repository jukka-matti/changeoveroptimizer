
import { registerHandler } from '../registry';
import {
    getAllChangeoverAttributes,
    getActiveChangeoverAttributes,
    getChangeoverAttributeById,
    getChangeoverAttributeByName,
    upsertChangeoverAttribute,
    deleteChangeoverAttribute,
    getMatrixByAttribute,
    upsertMatrixEntry,
    deleteMatrixEntry,
    batchGetChangeoverTimes,
    prefetchMatrixData,
    importFromSmedStandard,
} from '../../db/queries/changeovers';

export function registerChangeoverHandlers() {
    /**
     * Changeovers: Attributes
     */
    registerHandler('changeovers:get_all_attributes', () => getAllChangeoverAttributes(), 'Failed to get changeover attributes');
    registerHandler('changeovers:get_active_attributes', () => getActiveChangeoverAttributes(), 'Failed to get active changeover attributes');
    registerHandler('changeovers:get_attribute_by_id', ({ id }: { id: string }) => getChangeoverAttributeById(id), 'Failed to get changeover attribute');
    registerHandler('changeovers:get_attribute_by_name', ({ name }: { name: string }) => getChangeoverAttributeByName(name), 'Failed to get changeover attribute by name');
    registerHandler('changeovers:upsert_attribute', ({ data }: { data: any }) => upsertChangeoverAttribute(data), 'Failed to upsert changeover attribute');
    registerHandler('changeovers:delete_attribute', ({ id }: { id: string }) => deleteChangeoverAttribute(id), 'Failed to delete changeover attribute');

    /**
     * Changeovers: Matrix
     */
    registerHandler('changeovers:get_matrix', ({ attributeId }: { attributeId: string }) => getMatrixByAttribute(attributeId), 'Failed to get matrix entries');
    registerHandler('changeovers:upsert_matrix_entry', ({ data }: { data: any }) => upsertMatrixEntry(data), 'Failed to upsert matrix entry');
    registerHandler('changeovers:delete_matrix_entry', ({ id }: { id: string }) => deleteMatrixEntry(id), 'Failed to delete matrix entry');

    registerHandler(
        'changeovers:batch_get_times',
        ({ lookups }: { lookups: Array<{ attributeName: string; fromValue: string; toValue: string }> }) => {
            const result = batchGetChangeoverTimes(lookups);
            return Object.fromEntries(result);
        },
        'Failed to batch get changeover times'
    );

    registerHandler(
        'changeovers:prefetch_matrix',
        ({ attributeNames, valuesByAttribute }: { attributeNames: string[]; valuesByAttribute: Record<string, string[]> }) => {
            const valuesMap = new Map<string, Set<string>>();
            for (const [name, values] of Object.entries(valuesByAttribute)) {
                valuesMap.set(name, new Set(values));
            }
            const result = prefetchMatrixData(attributeNames, valuesMap);
            return Object.fromEntries(result);
        },
        'Failed to prefetch matrix data'
    );

    registerHandler(
        'changeovers:import_smed',
        ({
            attributeId,
            fromValue,
            toValue,
            timeMinutes,
            smedStudyId,
            notes,
        }: {
            attributeId: string;
            fromValue: string;
            toValue: string;
            timeMinutes: number;
            smedStudyId: string;
            notes?: string;
        }) =>
            importFromSmedStandard(attributeId, fromValue, toValue, timeMinutes, smedStudyId, notes),
        'Failed to import from SMED standard'
    );
}
