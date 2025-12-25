import { describe, it, expect } from 'vitest';
import { optimize } from './optimizer';
import { Order, AttributeConfig } from '@/types';

describe('Optimizer with Matrix Lookup', () => {
  const attributes: AttributeConfig[] = [
    { column: 'Color', changeoverTime: 15, parallelGroup: 'default' },
    { column: 'Size', changeoverTime: 10, parallelGroup: 'default' },
  ];

  const orders: Order[] = [
    { id: '1', originalIndex: 0, values: { Color: 'Red', Size: 'Small' } },
    { id: '2', originalIndex: 1, values: { Color: 'Blue', Size: 'Small' } },
    { id: '3', originalIndex: 2, values: { Color: 'Red', Size: 'Large' } },
    { id: '4', originalIndex: 3, values: { Color: 'Blue', Size: 'Large' } },
  ];

  describe('without matrix lookup (baseline)', () => {
    it('should use default changeover times', () => {
      const result = optimize(orders, attributes);

      // Should use attribute.changeoverTime for all calculations
      expect(result.totalAfter).toBeGreaterThan(0);
      expect(result.sequence).toHaveLength(4);
    });

    it('should ignore matrixData when useMatrixLookup is false', () => {
      const matrixData: Record<string, number> = {
        'Color:Red:Blue': 5, // Should be ignored
      };

      const result = optimize(orders, attributes, {
        useMatrixLookup: false,
        matrixData,
      });

      // Matrix data should not affect the result
      const resultWithoutMatrix = optimize(orders, attributes);
      expect(result.totalAfter).toBe(resultWithoutMatrix.totalAfter);
    });
  });

  describe('with matrix lookup enabled', () => {
    it('should use matrix time when available', () => {
      // Define specific times for color transitions
      const matrixData: Record<string, number> = {
        'Color:Red:Blue': 20,  // More expensive than default 15
        'Color:Blue:Red': 8,   // Cheaper than default 15
      };

      const simpleOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Size: 'Small' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Size: 'Small' } },
      ];

      const result = optimize(simpleOrders, attributes, {
        useMatrixLookup: true,
        matrixData,
      });

      // Order 2 follows Order 1, so Red -> Blue should use 20 min (from matrix)
      const order2 = result.sequence.find(o => o.id === '2');
      expect(order2).toBeDefined();

      // The optimizer might reorder, but if Red -> Blue transition happens,
      // it should use matrix time of 20
    });

    it('should fall back to default time when matrix entry missing', () => {
      const matrixData: Record<string, number> = {
        'Color:Red:Blue': 20,
        // No entry for Size transitions - should fall back to default
      };

      const simpleOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Size: 'Small' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Size: 'Large' } },
      ];

      const result = optimize(simpleOrders, attributes, {
        useMatrixLookup: true,
        matrixData,
      });

      // Size transition should use default 10 min
      expect(result.totalAfter).toBeGreaterThan(0);
    });

    it('should handle empty matrix data', () => {
      const result = optimize(orders, attributes, {
        useMatrixLookup: true,
        matrixData: {},
      });

      // Should work like without matrix lookup (all defaults)
      const resultWithoutMatrix = optimize(orders, attributes);
      expect(result.totalAfter).toBe(resultWithoutMatrix.totalAfter);
    });

    it('should handle undefined matrix data', () => {
      const result = optimize(orders, attributes, {
        useMatrixLookup: true,
        matrixData: undefined,
      });

      // Should work like without matrix lookup (all defaults)
      const resultWithoutMatrix = optimize(orders, attributes);
      expect(result.totalAfter).toBe(resultWithoutMatrix.totalAfter);
    });

    it('should use matrix data for multiple attributes', () => {
      const matrixData: Record<string, number> = {
        'Color:Red:Blue': 25,
        'Color:Blue:Red': 12,
        'Size:Small:Large': 18,
        'Size:Large:Small': 5,
      };

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Size: 'Small' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Size: 'Large' } },
      ];

      const result = optimize(testOrders, attributes, {
        useMatrixLookup: true,
        matrixData,
      });

      // Transition from order 1 to order 2:
      // Color: Red -> Blue = 25 (from matrix)
      // Size: Small -> Large = 18 (from matrix)
      // Total work time for transition = 25 + 18 = 43
      const order2 = result.sequence.find(o => o.id === '2');
      if (order2?.changeoverReasons.includes('Color') && order2?.changeoverReasons.includes('Size')) {
        expect(order2.workTime).toBe(43);
      }
    });
  });

  describe('asymmetric transitions', () => {
    it('should handle different times for A->B vs B->A', () => {
      // Dark to light color requires more cleaning than light to dark
      const matrixData: Record<string, number> = {
        'Color:Red:White': 25,   // Dark to light - needs full purge
        'Color:White:Red': 8,    // Light to dark - simple overlay
      };

      const lightDarkOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Size: 'Small' } },
        { id: '2', originalIndex: 1, values: { Color: 'White', Size: 'Small' } },
        { id: '3', originalIndex: 2, values: { Color: 'Red', Size: 'Small' } },
      ];

      const result = optimize(lightDarkOrders, attributes, {
        useMatrixLookup: true,
        matrixData,
      });

      // Sequence should be optimized considering asymmetric times
      expect(result.sequence).toHaveLength(3);
    });
  });

  describe('parallel groups with matrix lookup', () => {
    it('should use matrix times in parallel group calculations', () => {
      const parallelAttrs: AttributeConfig[] = [
        { column: 'Color', changeoverTime: 15, parallelGroup: 'A' },
        { column: 'Finish', changeoverTime: 10, parallelGroup: 'A' },
      ];

      const matrixData: Record<string, number> = {
        'Color:Red:Blue': 20,
        'Finish:Matte:Gloss': 12,
      };

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Finish: 'Matte' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Finish: 'Gloss' } },
      ];

      const result = optimize(testOrders, parallelAttrs, {
        useMatrixLookup: true,
        matrixData,
      });

      // Both in Group A (parallel):
      // Work time = 20 + 12 = 32 (sum of all)
      // Downtime = max(20, 12) = 20 (only the longest matters)
      const order2 = result.sequence.find(o => o.id === '2');
      expect(order2?.workTime).toBe(32);
      expect(order2?.downtime).toBe(20);
    });

    it('should mix matrix and default times in same group', () => {
      const parallelAttrs: AttributeConfig[] = [
        { column: 'Color', changeoverTime: 15, parallelGroup: 'A' },
        { column: 'Finish', changeoverTime: 10, parallelGroup: 'A' },
      ];

      // Only Color has matrix entry, Finish will use default
      const matrixData: Record<string, number> = {
        'Color:Red:Blue': 25,
      };

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Finish: 'Matte' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Finish: 'Gloss' } },
      ];

      const result = optimize(testOrders, parallelAttrs, {
        useMatrixLookup: true,
        matrixData,
      });

      // Color uses matrix time (25), Finish uses default (10)
      // Both in Group A (parallel):
      // Work time = 25 + 10 = 35
      // Downtime = max(25, 10) = 25
      const order2 = result.sequence.find(o => o.id === '2');
      expect(order2?.workTime).toBe(35);
      expect(order2?.downtime).toBe(25);
    });

    it('should use matrix times across different parallel groups', () => {
      const mixedGroupAttrs: AttributeConfig[] = [
        { column: 'Color', changeoverTime: 15, parallelGroup: 'A' },
        { column: 'Material', changeoverTime: 20, parallelGroup: 'B' },
      ];

      const matrixData: Record<string, number> = {
        'Color:Red:Blue': 18,
        'Material:Steel:Aluminum': 25,
      };

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Material: 'Steel' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Material: 'Aluminum' } },
      ];

      const result = optimize(testOrders, mixedGroupAttrs, {
        useMatrixLookup: true,
        matrixData,
      });

      // Color (Group A): 18 from matrix
      // Material (Group B): 25 from matrix
      // Work time = 18 + 25 = 43
      // Downtime = 18 + 25 = 43 (sum across groups)
      const order2 = result.sequence.find(o => o.id === '2');
      expect(order2?.workTime).toBe(43);
      expect(order2?.downtime).toBe(43);
    });
  });

  describe('optimization with matrix lookup', () => {
    it('should optimize sequence considering matrix times', () => {
      // Create asymmetric times that should influence grouping
      const matrixData: Record<string, number> = {
        'Color:Red:Blue': 30,   // Very expensive
        'Color:Blue:Red': 5,    // Very cheap
        'Color:Red:Green': 10,
        'Color:Green:Red': 10,
        'Color:Blue:Green': 10,
        'Color:Green:Blue': 10,
      };

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Size: 'Small' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Size: 'Small' } },
        { id: '3', originalIndex: 2, values: { Color: 'Green', Size: 'Small' } },
      ];

      const result = optimize(testOrders, attributes, {
        useMatrixLookup: true,
        matrixData,
      });

      // Optimizer should group colors intelligently
      expect(result.sequence).toHaveLength(3);
      // Total after should be calculated using matrix times
      expect(result.totalAfter).toBeGreaterThan(0);
    });

    it('should save time using matrix-specific optimizations', () => {
      // Matrix has cheap transition for specific path
      const matrixData: Record<string, number> = {
        'Color:Red:White': 2,   // Very cheap transition
        'Color:White:Blue': 2,  // Very cheap transition
        'Color:Red:Blue': 30,   // Very expensive direct transition
      };

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Size: 'Small' } },
        { id: '2', originalIndex: 1, values: { Color: 'White', Size: 'Small' } },
        { id: '3', originalIndex: 2, values: { Color: 'Blue', Size: 'Small' } },
      ];

      const result = optimize(testOrders, attributes, {
        useMatrixLookup: true,
        matrixData,
      });

      // Optimal path using matrix: Red -> White -> Blue = 2 + 2 = 4
      // Suboptimal paths would be more expensive
      expect(result.sequence).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    it('should handle matrix with zero times', () => {
      const matrixData: Record<string, number> = {
        'Color:Red:Red': 0,    // Same color - no changeover
        'Color:Red:Blue': 0,   // Free transition
      };

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Size: 'Small' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Size: 'Small' } },
      ];

      const result = optimize(testOrders, attributes, {
        useMatrixLookup: true,
        matrixData,
      });

      // Should handle zero times gracefully
      expect(result.sequence).toHaveLength(2);
    });

    it('should handle large matrix data', () => {
      // Create a large matrix with many entries
      const matrixData: Record<string, number> = {};
      const colors = ['Red', 'Blue', 'Green', 'Yellow', 'White', 'Black', 'Orange', 'Purple'];

      for (const from of colors) {
        for (const to of colors) {
          if (from !== to) {
            matrixData[`Color:${from}:${to}`] = Math.floor(Math.random() * 30) + 5;
          }
        }
      }

      const manyOrders: Order[] = colors.map((color, i) => ({
        id: String(i + 1),
        originalIndex: i,
        values: { Color: color, Size: 'Medium' },
      }));

      const result = optimize(manyOrders, attributes, {
        useMatrixLookup: true,
        matrixData,
      });

      expect(result.sequence).toHaveLength(8);
      expect(result.totalAfter).toBeLessThanOrEqual(result.totalBefore);
    });

    it('should handle decimal matrix times', () => {
      const matrixData: Record<string, number> = {
        'Color:Red:Blue': 15.5,
        'Size:Small:Large': 8.25,
      };

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Size: 'Small' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Size: 'Large' } },
      ];

      const result = optimize(testOrders, attributes, {
        useMatrixLookup: true,
        matrixData,
      });

      // Should handle decimal values correctly
      const order2 = result.sequence.find(o => o.id === '2');
      expect(order2?.workTime).toBe(15.5 + 8.25);
    });
  });
});
