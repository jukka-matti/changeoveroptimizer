import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from '@/stores/data-store';
import { optimize } from '@/services/optimizer';
import { ParsedFile } from '@/types';

describe('Optimization Flow Integration', () => {
  beforeEach(() => {
    useDataStore.getState().reset();
  });

  it('should complete a full optimization cycle from store data', () => {
    const store = useDataStore.getState();

    // 1. Mock parsed file
    const mockFile: ParsedFile = {
      name: 'production.xlsx',
      path: '/mock/path',
      sheets: ['Sheet1'],
      activeSheet: 'Sheet1',
      rows: [
        { ID: 'ORD-1', Color: 'Red', Size: 'Large' },
        { ID: 'ORD-2', Color: 'Blue', Size: 'Small' },
        { ID: 'ORD-3', Color: 'Red', Size: 'Small' },
      ],
      columns: ['ID', 'Color', 'Size'],
      rowCount: 3,
    };

    // 2. Set file in store
    store.setSourceFile(mockFile);
    
    // 3. Configure columns
    store.setOrderIdColumn('ID');
    store.addAttribute('Color', 20);
    store.addAttribute('Size', 10);

    // 4. Extract orders from store (mimicking useOrders hook logic)
    const { sourceFile, config } = useDataStore.getState();
    const orders = sourceFile!.rows.map((row, index) => ({
      id: String(row[config.orderIdColumn!] ?? `row-${index}`),
      originalIndex: index,
      values: Object.fromEntries(
        config.attributes.map(attr => [
          attr.column,
          String(row[attr.column] ?? ''),
        ])
      ),
    }));

    // 5. Run optimizer
    const result = optimize(orders, config.attributes);
    store.setResult(result);

    // 6. Verify result
    const finalState = useDataStore.getState();
    expect(finalState.result).not.toBeNull();
    expect(finalState.result?.sequence).toHaveLength(3);
    expect(finalState.result?.savings).toBeGreaterThanOrEqual(0);
    
    // The optimized sequence should group Red orders together
    const redOrders = finalState.result?.sequence.filter(o => o.values.Color === 'Red');
    expect(redOrders).toHaveLength(2);
    
    // Check if they are adjacent in the optimized sequence
    const firstRedIndex = finalState.result?.sequence.findIndex(o => o.values.Color === 'Red') ?? -1;
    expect(finalState.result?.sequence[firstRedIndex + 1].values.Color).toBe('Red');
  });
});

