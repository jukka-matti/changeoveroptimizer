import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publishStandard } from './smed';
import * as changeovers from './changeovers';
import * as dbModule from '../index';

// Mock schema tables to avoid import errors during test execution
vi.mock('../schema/smed', () => ({
    smedStandards: { id: 'smedStandards_id', studyId: 'smedStandards_studyId' },
    smedStudies: { id: 'smedStudies_id', changeoverType: 'smedStudies_changeoverType' },
    smedChangeoverLogs: {},
    smedSteps: {},
    smedImprovements: {},
}));

vi.mock('../schema/changeovers', () => ({
    changeoverAttributes: { id: 'changeoverAttributes_id' },
}));

vi.mock('../schema/products', () => ({
    products: {},
}));

// Mock changeover operations
vi.mock('./changeovers', () => ({
    upsertMatrixEntry: vi.fn(),
    upsertChangeoverAttribute: vi.fn(),
    getChangeoverAttributeByName: vi.fn(),
    updateChangeoverAttribute: vi.fn(),
    createChangeoverAttribute: vi.fn(),
}));

describe('publishStandard', () => {
    let mockDb: any;
    let mockSelect: any;
    let mockUpdate: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Create a chainable mock DB
        mockSelect = vi.fn().mockReturnThis();
        const mockFrom = vi.fn().mockReturnThis();
        const mockWhere = vi.fn().mockReturnThis();
        const mockGet = vi.fn();

        // Chain setup for select
        mockSelect.mockReturnValue({
            from: mockFrom,
        });
        mockFrom.mockReturnValue({
            where: mockWhere,
        });
        mockWhere.mockReturnValue({
            get: mockGet,
        });

        // Chain setup for update
        mockUpdate = vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    run: vi.fn(),
                    returning: vi.fn().mockReturnValue({
                        get: vi.fn().mockReturnValue({ id: 'std-1', isActive: true }) // Mock published standard
                    })
                })
            })
        });

        mockDb = {
            select: mockSelect,
            update: mockUpdate,
        };

        vi.spyOn(dbModule, 'getDatabase').mockReturnValue(mockDb);

        // Default mock data handling
        mockGet.mockImplementation(() => {
            // This is tricky because multiple selects happen.
            // We can just rely on mocking specific select sequences or return basic objects
            return {
                id: 'std-1',
                studyId: 'study-1',
                standardTimeMinutes: 25,
                changeoverType: 'Color'
            };
        });
    });

    it('should update optimizer attributes when updateOptimizer is true', () => {
        // Setup mocks
        // 1. Get Standard -> returns mock standard
        // 2. Get Study -> returns mock study with changeoverType

        // Mock getChangeoverAttributeByName to return an attribute
        vi.mocked(changeovers.getChangeoverAttributeByName).mockReturnValue({
            id: 'attr-1',
            name: 'Color',
            hierarchyLevel: 1,
            parallelGroup: 'A'
        } as any);

        publishStandard('std-1', true);

        // Verification
        // Expect updateChangeoverAttribute to be called with correct data
        expect(changeovers.updateChangeoverAttribute).toHaveBeenCalledWith('attr-1', expect.objectContaining({
            defaultMinutes: 25,
        }));
    });

    it('should NOT update optimizer when updateOptimizer is false', () => {
        publishStandard('std-1', false);
        expect(changeovers.updateChangeoverAttribute).not.toHaveBeenCalled();
        expect(changeovers.createChangeoverAttribute).not.toHaveBeenCalled();
    });
});
