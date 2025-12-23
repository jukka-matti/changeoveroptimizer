import { describe, it, expect } from 'vitest';
import { optimize } from './optimizer';
import { Order, AttributeConfig } from '@/types';

describe('Optimizer Performance Benchmark', () => {
  const generateLargeDataset = (count: number) => {
    const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Black'];
    const sizes = ['S', 'M', 'L', 'XL'];
    const materials = ['Steel', 'Aluminum', 'Plastic', 'Wood'];

    const orders: Order[] = [];
    for (let i = 0; i < count; i++) {
      orders.push({
        id: `ORD-${i}`,
        originalIndex: i,
        values: {
          Color: colors[i % colors.length],
          Size: sizes[i % sizes.length],
          Material: materials[i % materials.length],
        },
      });
    }
    return orders;
  };

  const attributes: AttributeConfig[] = [
    { column: 'Color', changeoverTime: 30, parallelGroup: 'default' },
    { column: 'Material', changeoverTime: 20, parallelGroup: 'default' },
    { column: 'Size', changeoverTime: 10, parallelGroup: 'default' },
  ];

  it('should optimize 1,000 orders in under 5 seconds', () => {
    const orders = generateLargeDataset(1000);
    const start = performance.now();
    const result = optimize(orders, attributes);
    const end = performance.now();
    const duration = end - start;

    console.log(`Optimization of 1,000 orders took ${duration.toFixed(2)}ms`);
    expect(result.sequence).toHaveLength(1000);
    expect(duration).toBeLessThan(5000);
  });

  it('should optimize 5,000 orders in under 60 seconds', () => {
    const orders = generateLargeDataset(5000);
    const start = performance.now();
    const result = optimize(orders, attributes);
    const end = performance.now();
    const duration = end - start;

    console.log(`Optimization of 5,000 orders took ${(duration / 1000).toFixed(2)}s`);
    expect(result.sequence).toHaveLength(5000);
    expect(duration).toBeLessThan(60000);
  });
});


