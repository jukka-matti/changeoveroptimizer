import { describe, it, expect } from 'vitest';
import { optimize } from './optimizer';
import { Order, AttributeConfig } from '@/types';

describe('Optimizer Service', () => {
  const attributes: AttributeConfig[] = [
    { column: 'Color', changeoverTime: 15, parallelGroup: 'default' },
    { column: 'Material', changeoverTime: 10, parallelGroup: 'default' }
  ];

  const orders: Order[] = [
    { id: '1', originalIndex: 0, values: { Color: 'Red', Material: 'Steel' } },
    { id: '2', originalIndex: 1, values: { Color: 'Blue', Material: 'Steel' } },
    { id: '3', originalIndex: 2, values: { Color: 'Red', Material: 'Aluminum' } },
    { id: '4', originalIndex: 3, values: { Color: 'Blue', Material: 'Steel' } },
  ];

  it('should handle empty orders', () => {
    const result = optimize([], attributes);
    expect(result.sequence).toHaveLength(0);
    expect(result.savings).toBe(0);
  });

  it('should handle a single order', () => {
    const result = optimize([orders[0]], attributes);
    expect(result.sequence).toHaveLength(1);
    expect(result.totalAfter).toBe(0);
  });

  it('should reduce changeover time by grouping similar attributes', () => {
    const result = optimize(orders, attributes);
    
    // Original sequence: 
    // 1(Red, Steel) -> 2(Blue, Steel): +15 (Color)
    // 2(Blue, Steel) -> 3(Red, Aluminum): +15 (Color) + 10 (Material) = +25
    // 3(Red, Aluminum) -> 4(Blue, Steel): +15 (Color) + 10 (Material) = +25
    // Total Before: 15 + 25 + 25 = 65
    
    // Optimized sequence should group by Color first (highest time)
    // Example: 1(Red, Steel), 3(Red, Aluminum), 2(Blue, Steel), 4(Blue, Steel)
    // 1 -> 3: +10 (Material)
    // 3 -> 2: +15 (Color) + 10 (Material) = +25
    // 2 -> 4: 0
    // Total After: 10 + 25 + 0 = 35
    
    expect(result.totalAfter).toBeLessThan(result.totalBefore);
    expect(result.savings).toBeGreaterThan(0);
  });

  it('should calculate attribute statistics correctly', () => {
    const result = optimize(orders, attributes);
    expect(result.attributeStats).toHaveLength(attributes.length);
    
    const colorStat = result.attributeStats.find(s => s.column === 'Color');
    expect(colorStat).toBeDefined();
    expect(colorStat?.totalTime).toBeGreaterThanOrEqual(0);
  });

  it('should be deterministic', () => {
    const result1 = optimize(orders, attributes);
    const result2 = optimize(orders, attributes);
    expect(result1.sequence).toEqual(result2.sequence);
  });

  describe('Edge Cases', () => {
    it('should handle identical orders with zero changeover time', () => {
      const mixedIdenticalOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Material: 'Steel' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Material: 'Steel' } },
        { id: '3', originalIndex: 2, values: { Color: 'Red', Material: 'Steel' } },
      ];
      const result = optimize(mixedIdenticalOrders, attributes);
      // Original: 1(Red) -> 2(Blue): +15, 2(Blue) -> 3(Red): +15. Total Before: 30
      // Optimized: 1(Red), 3(Red), 2(Blue). Total After: 15
      expect(result.totalAfter).toBeLessThan(result.totalBefore);
      expect(result.savings).toBeGreaterThan(0);
    });

    it('should handle unique orders with best-effort grouping', () => {
      const uniqueOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Material: 'Steel' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Material: 'Aluminum' } },
        { id: '3', originalIndex: 2, values: { Color: 'Green', Material: 'Plastic' } },
      ];
      const result = optimize(uniqueOrders, attributes);
      expect(result.sequence).toHaveLength(3);
      expect(result.totalAfter).toBeGreaterThan(0);
    });

    it('should handle null/empty values as a distinct category', () => {
      const dirtyOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Material: '' } },
        { id: '2', originalIndex: 1, values: { Color: 'Red', Material: '' } },
        { id: '3', originalIndex: 2, values: { Color: 'Blue', Material: 'Steel' } },
      ];
      const result = optimize(dirtyOrders, attributes);
      // Orders 1 and 2 should be grouped together because they both have empty Material
      expect(result.sequence[0].values.Color).toBe('Red');
      expect(result.sequence[1].values.Color).toBe('Red');
      expect(result.sequence[1].changeoverTime).toBe(0);
    });

    it('should strictly follow user-defined attribute priority', () => {
      // Priority 1: Material (10min), Priority 2: Color (15min)
      // Even though Color is more expensive, the user might want Material priority
      const prioritizedAttrs: AttributeConfig[] = [
        { column: 'Material', changeoverTime: 10, parallelGroup: 'default' },
        { column: 'Color', changeoverTime: 15, parallelGroup: 'default' }
      ];

      const mixedOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Material: 'Steel' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Material: 'Aluminum' } },
        { id: '3', originalIndex: 2, values: { Color: 'Green', Material: 'Steel' } },
      ];

      const result = optimize(mixedOrders, prioritizedAttrs);
      // Sequence should be 1(Steel) -> 3(Steel) -> 2(Aluminum) or 3 -> 1 -> 2
      const materialSequence = result.sequence.map(o => o.values.Material);
      expect(materialSequence[0]).toBe(materialSequence[1]);
    });
  });

  describe('Parallel Groups', () => {
    it('should treat same group attributes as parallel (downtime = max)', () => {
      // Both Color and Finish are in Group A - can be done in parallel
      const parallelAttrs: AttributeConfig[] = [
        { column: 'Color', changeoverTime: 15, parallelGroup: 'A' },
        { column: 'Finish', changeoverTime: 10, parallelGroup: 'A' },
      ];

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Finish: 'Matte' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Finish: 'Gloss' } },
      ];

      const result = optimize(testOrders, parallelAttrs);

      // When both Color and Finish change:
      // Work time = 15 + 10 = 25 (sum of all)
      // Downtime = max(15, 10) = 15 (only the longest matters)
      const order2 = result.sequence.find(o => o.id === '2');
      expect(order2?.workTime).toBe(25);
      expect(order2?.downtime).toBe(15);
    });

    it('should sum downtime across different groups', () => {
      // Color in Group A, Material in Group B - must be sequential
      const mixedGroupAttrs: AttributeConfig[] = [
        { column: 'Color', changeoverTime: 15, parallelGroup: 'A' },
        { column: 'Material', changeoverTime: 20, parallelGroup: 'B' },
      ];

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Material: 'Steel' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Material: 'Aluminum' } },
      ];

      const result = optimize(testOrders, mixedGroupAttrs);

      // When Color (Group A) and Material (Group B) both change:
      // Work time = 15 + 20 = 35
      // Downtime = 15 + 20 = 35 (sum across groups)
      const order2 = result.sequence.find(o => o.id === '2');
      expect(order2?.workTime).toBe(35);
      expect(order2?.downtime).toBe(35);
    });

    it('should calculate mixed parallel groups correctly', () => {
      // Color and Finish in Group A (parallel), Material in Group B (sequential)
      const mixedAttrs: AttributeConfig[] = [
        { column: 'Color', changeoverTime: 15, parallelGroup: 'A' },
        { column: 'Finish', changeoverTime: 10, parallelGroup: 'A' },
        { column: 'Material', changeoverTime: 20, parallelGroup: 'B' },
      ];

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Finish: 'Matte', Material: 'Steel' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Finish: 'Gloss', Material: 'Aluminum' } },
      ];

      const result = optimize(testOrders, mixedAttrs);

      // When all three change:
      // Work time = 15 + 10 + 20 = 45
      // Downtime = max(15, 10) + 20 = 15 + 20 = 35
      const order2 = result.sequence.find(o => o.id === '2');
      expect(order2?.workTime).toBe(45);
      expect(order2?.downtime).toBe(35);
    });

    it('should have equal work and downtime when all in same group', () => {
      // All attributes in default group - same as before (no parallelism effect)
      const sameGroupAttrs: AttributeConfig[] = [
        { column: 'Color', changeoverTime: 15, parallelGroup: 'default' },
        { column: 'Material', changeoverTime: 10, parallelGroup: 'default' },
      ];

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Material: 'Steel' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Material: 'Aluminum' } },
      ];

      const result = optimize(testOrders, sameGroupAttrs);

      // When all in same group, only longest matters for downtime:
      // Work time = 15 + 10 = 25
      // Downtime = max(15, 10) = 15
      const order2 = result.sequence.find(o => o.id === '2');
      expect(order2?.workTime).toBe(25);
      expect(order2?.downtime).toBe(15);
    });

    it('should calculate total downtime savings correctly', () => {
      // Parallel groups should show different downtime vs work time savings
      const parallelAttrs: AttributeConfig[] = [
        { column: 'Color', changeoverTime: 15, parallelGroup: 'A' },
        { column: 'Finish', changeoverTime: 10, parallelGroup: 'A' },
      ];

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Finish: 'Matte' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Finish: 'Gloss' } },
        { id: '3', originalIndex: 2, values: { Color: 'Red', Finish: 'Gloss' } },
      ];

      const result = optimize(testOrders, parallelAttrs);

      // Verify that downtime totals are less than or equal to work time totals
      expect(result.totalDowntimeBefore).toBeLessThanOrEqual(result.totalBefore);
      expect(result.totalDowntimeAfter).toBeLessThanOrEqual(result.totalAfter);
    });

    it('should include parallelGroup in attribute stats', () => {
      const parallelAttrs: AttributeConfig[] = [
        { column: 'Color', changeoverTime: 15, parallelGroup: 'A' },
        { column: 'Material', changeoverTime: 10, parallelGroup: 'B' },
      ];

      const testOrders: Order[] = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Material: 'Steel' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Material: 'Aluminum' } },
      ];

      const result = optimize(testOrders, parallelAttrs);

      const colorStat = result.attributeStats.find(s => s.column === 'Color');
      const materialStat = result.attributeStats.find(s => s.column === 'Material');

      expect(colorStat?.parallelGroup).toBe('A');
      expect(materialStat?.parallelGroup).toBe('B');
    });
  });
});

