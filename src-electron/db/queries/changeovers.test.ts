import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChangeoverAttribute, ChangeoverMatrixEntry } from '../schema/changeovers';

// Mock the database module before importing the query functions
vi.mock('../index', () => ({
  getDatabase: vi.fn(),
}));

// Import after mock is set up
import { getDatabase } from '../index';
import {
  getAllChangeoverAttributes,
  getActiveChangeoverAttributes,
  getChangeoverAttributeById,
  getChangeoverAttributeByName,
  createChangeoverAttribute,
  updateChangeoverAttribute,
  upsertChangeoverAttribute,
  deleteChangeoverAttribute,
  getMatrixByAttribute,
  getMatrixEntry,
  createMatrixEntry,
  updateMatrixEntry,
  upsertMatrixEntry,
  deleteMatrixEntry,
  deleteMatrixEntriesByAttribute,
  getChangeoverTime,
  batchGetChangeoverTimes,
  prefetchMatrixData,
  importFromSmedStandard,
  getMatrixEntriesBySmedStudy,
} from './changeovers';

describe('Changeover Queries', () => {
  // Mock database query builder chain
  let mockDb: any;
  let mockSelect: any;
  let mockFrom: any;
  let mockWhere: any;
  let mockOrderBy: any;
  let mockInsert: any;
  let mockUpdate: any;
  let mockDelete: any;
  let mockValues: any;
  let mockSet: any;
  let mockReturning: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create chainable mock methods
    mockReturning = {
      get: vi.fn(),
      all: vi.fn(),
    };
    mockValues = {
      returning: vi.fn().mockReturnValue(mockReturning),
    };
    mockSet = {
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue(mockReturning),
      }),
    };
    mockOrderBy = {
      all: vi.fn(),
    };
    mockWhere = {
      get: vi.fn(),
      all: vi.fn(),
      orderBy: vi.fn().mockReturnValue(mockOrderBy),
      run: vi.fn(),
    };
    mockFrom = {
      where: vi.fn().mockReturnValue(mockWhere),
      orderBy: vi.fn().mockReturnValue({
        all: vi.fn(),
      }),
      all: vi.fn(),
    };
    mockSelect = {
      from: vi.fn().mockReturnValue(mockFrom),
    };
    mockInsert = {
      values: vi.fn().mockReturnValue(mockValues),
    };
    mockUpdate = {
      set: vi.fn().mockReturnValue(mockSet),
    };
    mockDelete = {
      where: vi.fn().mockReturnValue({
        run: vi.fn(),
      }),
    };

    mockDb = {
      select: vi.fn().mockReturnValue(mockSelect),
      insert: vi.fn().mockReturnValue(mockInsert),
      update: vi.fn().mockReturnValue(mockUpdate),
      delete: vi.fn().mockReturnValue(mockDelete),
    };

    vi.mocked(getDatabase).mockReturnValue(mockDb);
  });

  describe('getAllChangeoverAttributes', () => {
    it('should return all attributes ordered by sortOrder', () => {
      const mockAttributes: ChangeoverAttribute[] = [
        {
          id: 'attr-1',
          name: 'color',
          displayName: 'Color',
          hierarchyLevel: 0,
          defaultMinutes: 15,
          parallelGroup: 'default',
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'attr-2',
          name: 'size',
          displayName: 'Size',
          hierarchyLevel: 1,
          defaultMinutes: 10,
          parallelGroup: 'A',
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFrom.orderBy.mockReturnValue({
        all: vi.fn().mockReturnValue(mockAttributes),
      });

      const result = getAllChangeoverAttributes();

      expect(result).toEqual(mockAttributes);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return empty array when no attributes exist', () => {
      mockFrom.orderBy.mockReturnValue({
        all: vi.fn().mockReturnValue([]),
      });

      const result = getAllChangeoverAttributes();

      expect(result).toEqual([]);
    });
  });

  describe('getActiveChangeoverAttributes', () => {
    it('should return only active attributes', () => {
      const mockActiveAttributes: ChangeoverAttribute[] = [
        {
          id: 'attr-1',
          name: 'color',
          displayName: 'Color',
          hierarchyLevel: 0,
          defaultMinutes: 15,
          parallelGroup: 'default',
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWhere.orderBy.mockReturnValue({
        all: vi.fn().mockReturnValue(mockActiveAttributes),
      });

      const result = getActiveChangeoverAttributes();

      expect(result).toEqual(mockActiveAttributes);
      expect(mockFrom.where).toHaveBeenCalled();
    });
  });

  describe('getChangeoverAttributeById', () => {
    it('should return attribute by id', () => {
      const mockAttribute: ChangeoverAttribute = {
        id: 'attr-1',
        name: 'color',
        displayName: 'Color',
        hierarchyLevel: 0,
        defaultMinutes: 15,
        parallelGroup: 'default',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWhere.get.mockReturnValue(mockAttribute);

      const result = getChangeoverAttributeById('attr-1');

      expect(result).toEqual(mockAttribute);
    });

    it('should return undefined when attribute not found', () => {
      mockWhere.get.mockReturnValue(undefined);

      const result = getChangeoverAttributeById('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('getChangeoverAttributeByName', () => {
    it('should return attribute by name', () => {
      const mockAttribute: ChangeoverAttribute = {
        id: 'attr-1',
        name: 'color',
        displayName: 'Color',
        hierarchyLevel: 0,
        defaultMinutes: 15,
        parallelGroup: 'default',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWhere.get.mockReturnValue(mockAttribute);

      const result = getChangeoverAttributeByName('color');

      expect(result).toEqual(mockAttribute);
    });
  });

  describe('createChangeoverAttribute', () => {
    it('should create and return new attribute', () => {
      const input = {
        name: 'material',
        displayName: 'Material',
        hierarchyLevel: 2,
        defaultMinutes: 20,
      };

      const mockCreated: ChangeoverAttribute = {
        id: 'new-attr-id',
        ...input,
        parallelGroup: 'default',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReturning.get.mockReturnValue(mockCreated);

      const result = createChangeoverAttribute(input);

      expect(result).toEqual(mockCreated);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('updateChangeoverAttribute', () => {
    it('should update and return modified attribute', () => {
      const mockUpdated: ChangeoverAttribute = {
        id: 'attr-1',
        name: 'color',
        displayName: 'Updated Color',
        hierarchyLevel: 0,
        defaultMinutes: 20,
        parallelGroup: 'default',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSet.where.mockReturnValue({
        returning: vi.fn().mockReturnValue({
          get: vi.fn().mockReturnValue(mockUpdated),
        }),
      });

      const result = updateChangeoverAttribute('attr-1', { displayName: 'Updated Color', defaultMinutes: 20 });

      expect(result).toEqual(mockUpdated);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('upsertChangeoverAttribute', () => {
    it('should create attribute if it does not exist', () => {
      mockWhere.get.mockReturnValue(undefined); // Attribute doesn't exist

      const input = {
        name: 'new_attr',
        displayName: 'New Attribute',
        hierarchyLevel: 0,
        defaultMinutes: 10,
      };

      const mockCreated: ChangeoverAttribute = {
        id: 'new-id',
        ...input,
        parallelGroup: 'default',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReturning.get.mockReturnValue(mockCreated);

      const result = upsertChangeoverAttribute(input);

      expect(result).toEqual(mockCreated);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should update attribute if it exists', () => {
      const existingAttr: ChangeoverAttribute = {
        id: 'existing-id',
        name: 'existing_attr',
        displayName: 'Existing',
        hierarchyLevel: 0,
        defaultMinutes: 5,
        parallelGroup: 'default',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWhere.get.mockReturnValue(existingAttr);

      const input = {
        name: 'existing_attr',
        displayName: 'Updated',
        hierarchyLevel: 0,
        defaultMinutes: 15,
      };

      const mockUpdated: ChangeoverAttribute = {
        ...existingAttr,
        ...input,
        updatedAt: new Date(),
      };

      mockSet.where.mockReturnValue({
        returning: vi.fn().mockReturnValue({
          get: vi.fn().mockReturnValue(mockUpdated),
        }),
      });

      const result = upsertChangeoverAttribute(input);

      expect(result).toEqual(mockUpdated);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('deleteChangeoverAttribute', () => {
    it('should delete attribute by id', () => {
      deleteChangeoverAttribute('attr-1');

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('getMatrixByAttribute', () => {
    it('should return all matrix entries for an attribute', () => {
      const mockEntries: ChangeoverMatrixEntry[] = [
        {
          id: 'entry-1',
          attributeId: 'attr-1',
          fromValue: 'Red',
          toValue: 'Blue',
          timeMinutes: 20,
          source: 'manual',
          smedStudyId: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'entry-2',
          attributeId: 'attr-1',
          fromValue: 'Blue',
          toValue: 'Red',
          timeMinutes: 18,
          source: 'manual',
          smedStudyId: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWhere.all.mockReturnValue(mockEntries);

      const result = getMatrixByAttribute('attr-1');

      expect(result).toEqual(mockEntries);
    });

    it('should return empty array when no entries exist', () => {
      mockWhere.all.mockReturnValue([]);

      const result = getMatrixByAttribute('attr-with-no-entries');

      expect(result).toEqual([]);
    });
  });

  describe('getMatrixEntry', () => {
    it('should return specific matrix entry', () => {
      const mockEntry: ChangeoverMatrixEntry = {
        id: 'entry-1',
        attributeId: 'attr-1',
        fromValue: 'Red',
        toValue: 'Blue',
        timeMinutes: 20,
        source: 'manual',
        smedStudyId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWhere.get.mockReturnValue(mockEntry);

      const result = getMatrixEntry('attr-1', 'Red', 'Blue');

      expect(result).toEqual(mockEntry);
    });

    it('should return undefined when entry not found', () => {
      mockWhere.get.mockReturnValue(undefined);

      const result = getMatrixEntry('attr-1', 'Red', 'Green');

      expect(result).toBeUndefined();
    });
  });

  describe('createMatrixEntry', () => {
    it('should create and return new matrix entry', () => {
      const input = {
        attributeId: 'attr-1',
        fromValue: 'Red',
        toValue: 'Blue',
        timeMinutes: 20,
      };

      const mockCreated: ChangeoverMatrixEntry = {
        id: 'new-entry-id',
        ...input,
        source: 'manual',
        smedStudyId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReturning.get.mockReturnValue(mockCreated);

      const result = createMatrixEntry(input);

      expect(result).toEqual(mockCreated);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('upsertMatrixEntry', () => {
    it('should create entry if it does not exist', () => {
      mockWhere.get.mockReturnValue(undefined);

      const input = {
        attributeId: 'attr-1',
        fromValue: 'Green',
        toValue: 'Yellow',
        timeMinutes: 12,
      };

      const mockCreated: ChangeoverMatrixEntry = {
        id: 'new-id',
        ...input,
        source: 'manual',
        smedStudyId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReturning.get.mockReturnValue(mockCreated);

      const result = upsertMatrixEntry(input);

      expect(result).toEqual(mockCreated);
    });

    it('should update entry if it exists', () => {
      const existingEntry: ChangeoverMatrixEntry = {
        id: 'existing-id',
        attributeId: 'attr-1',
        fromValue: 'Red',
        toValue: 'Blue',
        timeMinutes: 15,
        source: 'manual',
        smedStudyId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWhere.get.mockReturnValue(existingEntry);

      const input = {
        attributeId: 'attr-1',
        fromValue: 'Red',
        toValue: 'Blue',
        timeMinutes: 20,
      };

      const mockUpdated: ChangeoverMatrixEntry = {
        ...existingEntry,
        timeMinutes: 20,
        updatedAt: new Date(),
      };

      mockSet.where.mockReturnValue({
        returning: vi.fn().mockReturnValue({
          get: vi.fn().mockReturnValue(mockUpdated),
        }),
      });

      const result = upsertMatrixEntry(input);

      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteMatrixEntry', () => {
    it('should delete matrix entry by id', () => {
      deleteMatrixEntry('entry-1');

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('deleteMatrixEntriesByAttribute', () => {
    it('should delete all entries for an attribute', () => {
      deleteMatrixEntriesByAttribute('attr-1');

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('getChangeoverTime', () => {
    it('should return time from matrix entry', () => {
      const mockAttr: ChangeoverAttribute = {
        id: 'attr-1',
        name: 'color',
        displayName: 'Color',
        hierarchyLevel: 0,
        defaultMinutes: 15,
        parallelGroup: 'default',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEntry: ChangeoverMatrixEntry = {
        id: 'entry-1',
        attributeId: 'attr-1',
        fromValue: 'Red',
        toValue: 'Blue',
        timeMinutes: 20,
        source: 'manual',
        smedStudyId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First call returns attribute, second call returns entry
      mockWhere.get.mockReturnValueOnce(mockAttr).mockReturnValueOnce(mockEntry);

      const result = getChangeoverTime('color', 'Red', 'Blue');

      expect(result).toBe(20);
    });

    it('should return null when attribute not found', () => {
      mockWhere.get.mockReturnValue(undefined);

      const result = getChangeoverTime('unknown', 'A', 'B');

      expect(result).toBeNull();
    });

    it('should return null when matrix entry not found', () => {
      const mockAttr: ChangeoverAttribute = {
        id: 'attr-1',
        name: 'color',
        displayName: 'Color',
        hierarchyLevel: 0,
        defaultMinutes: 15,
        parallelGroup: 'default',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWhere.get.mockReturnValueOnce(mockAttr).mockReturnValueOnce(undefined);

      const result = getChangeoverTime('color', 'Red', 'Green');

      expect(result).toBeNull();
    });
  });

  describe('batchGetChangeoverTimes', () => {
    it('should return map of changeover times', () => {
      const mockAttributes: ChangeoverAttribute[] = [
        {
          id: 'attr-1',
          name: 'color',
          displayName: 'Color',
          hierarchyLevel: 0,
          defaultMinutes: 15,
          parallelGroup: 'default',
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockEntries: ChangeoverMatrixEntry[] = [
        {
          id: 'entry-1',
          attributeId: 'attr-1',
          fromValue: 'Red',
          toValue: 'Blue',
          timeMinutes: 20,
          source: 'manual',
          smedStudyId: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock for getActiveChangeoverAttributes
      mockWhere.orderBy.mockReturnValue({
        all: vi.fn().mockReturnValue(mockAttributes),
      });

      // Mock for matrix entries query
      mockWhere.all.mockReturnValue(mockEntries);

      const lookups = [
        { attributeName: 'color', fromValue: 'Red', toValue: 'Blue' },
      ];

      const result = batchGetChangeoverTimes(lookups);

      expect(result instanceof Map).toBe(true);
      expect(result.get('color:Red:Blue')).toBe(20);
    });

    it('should return empty map when no lookups provided', () => {
      // Even with empty lookups, getActiveChangeoverAttributes is called
      mockWhere.orderBy.mockReturnValue({
        all: vi.fn().mockReturnValue([]),
      });

      const result = batchGetChangeoverTimes([]);

      expect(result instanceof Map).toBe(true);
      expect(result.size).toBe(0);
    });

    it('should return empty map when no attributes match', () => {
      mockWhere.orderBy.mockReturnValue({
        all: vi.fn().mockReturnValue([]),
      });

      const lookups = [
        { attributeName: 'unknown', fromValue: 'A', toValue: 'B' },
      ];

      const result = batchGetChangeoverTimes(lookups);

      expect(result instanceof Map).toBe(true);
      expect(result.size).toBe(0);
    });
  });

  describe('prefetchMatrixData', () => {
    it('should return all relevant matrix entries', () => {
      const mockAttributes: ChangeoverAttribute[] = [
        {
          id: 'attr-1',
          name: 'color',
          displayName: 'Color',
          hierarchyLevel: 0,
          defaultMinutes: 15,
          parallelGroup: 'default',
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockEntries: ChangeoverMatrixEntry[] = [
        {
          id: 'entry-1',
          attributeId: 'attr-1',
          fromValue: 'Red',
          toValue: 'Blue',
          timeMinutes: 20,
          source: 'manual',
          smedStudyId: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'entry-2',
          attributeId: 'attr-1',
          fromValue: 'Blue',
          toValue: 'Red',
          timeMinutes: 18,
          source: 'manual',
          smedStudyId: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWhere.orderBy.mockReturnValue({
        all: vi.fn().mockReturnValue(mockAttributes),
      });
      mockWhere.all.mockReturnValue(mockEntries);

      const valuesByAttribute = new Map([
        ['color', new Set(['Red', 'Blue'])],
      ]);

      const result = prefetchMatrixData(['color'], valuesByAttribute);

      expect(result instanceof Map).toBe(true);
      expect(result.get('color:Red:Blue')).toBe(20);
      expect(result.get('color:Blue:Red')).toBe(18);
    });

    it('should return empty map when no attributes provided', () => {
      mockWhere.orderBy.mockReturnValue({
        all: vi.fn().mockReturnValue([]),
      });

      const result = prefetchMatrixData([], new Map());

      expect(result instanceof Map).toBe(true);
      expect(result.size).toBe(0);
    });
  });

  describe('importFromSmedStandard', () => {
    it('should create matrix entry with smed_standard source', () => {
      mockWhere.get.mockReturnValue(undefined); // Entry doesn't exist

      const mockCreated: ChangeoverMatrixEntry = {
        id: 'new-entry',
        attributeId: 'attr-1',
        fromValue: 'Red',
        toValue: 'Blue',
        timeMinutes: 18,
        source: 'smed_standard',
        smedStudyId: 'smed-1',
        notes: 'Imported from SMED study',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReturning.get.mockReturnValue(mockCreated);

      const result = importFromSmedStandard(
        'attr-1',
        'Red',
        'Blue',
        18,
        'smed-1',
        'Imported from SMED study'
      );

      expect(result).toEqual(mockCreated);
      expect(result.source).toBe('smed_standard');
      expect(result.smedStudyId).toBe('smed-1');
    });
  });

  describe('getMatrixEntriesBySmedStudy', () => {
    it('should return all entries linked to a SMED study', () => {
      const mockEntries: ChangeoverMatrixEntry[] = [
        {
          id: 'entry-1',
          attributeId: 'attr-1',
          fromValue: 'Red',
          toValue: 'Blue',
          timeMinutes: 18,
          source: 'smed_standard',
          smedStudyId: 'smed-1',
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWhere.all.mockReturnValue(mockEntries);

      const result = getMatrixEntriesBySmedStudy('smed-1');

      expect(result).toEqual(mockEntries);
      expect(result[0].smedStudyId).toBe('smed-1');
    });

    it('should return empty array when no entries linked to study', () => {
      mockWhere.all.mockReturnValue([]);

      const result = getMatrixEntriesBySmedStudy('smed-no-entries');

      expect(result).toEqual([]);
    });
  });
});
