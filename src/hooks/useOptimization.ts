import { useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useDataStore, useOrders } from '@/stores/data-store';
import { optimize, OptimizeOptions } from '@/services/optimizer';
import { telemetry } from '@/services/telemetry';
import type { Order } from '@/types';

/**
 * Prefetch changeover matrix data for optimization.
 * Extracts unique values from orders and fetches corresponding matrix entries.
 */
async function prefetchMatrixData(
  orders: Order[],
  attributeNames: string[]
): Promise<Record<string, number>> {
  // Build map of unique values per attribute
  const valuesByAttribute: Record<string, string[]> = {};

  for (const attrName of attributeNames) {
    const values = new Set<string>();
    for (const order of orders) {
      const value = order.values[attrName];
      if (value) values.add(value);
    }
    valuesByAttribute[attrName] = Array.from(values);
  }

  try {
    const result = await (window as any).electron.invoke('changeover:prefetch_matrix', {
      attributeNames,
      valuesByAttribute,
    });
    return result as Record<string, number>;
  } catch (err) {
    console.error('Failed to prefetch matrix data:', err);
    return {};
  }
}

export function useOptimization() {
  const { navigateTo, setError } = useAppStore();
  const { config, setResult, setOptimizing } = useDataStore();
  const orders = useOrders();

  const runOptimization = useCallback(async () => {
    try {
      setOptimizing(true);
      navigateTo('optimizing');

      // Build optimizer options
      const options: OptimizeOptions = {
        useMatrixLookup: config.useMatrixLookup,
      };

      // If matrix lookup is enabled, prefetch the data
      if (config.useMatrixLookup) {
        const attributeNames = config.attributes.map(a => a.column);
        const matrixData = await prefetchMatrixData(orders, attributeNames);
        options.matrixData = matrixData;
      }

      // Add a small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 800));

      const result = optimize(orders, config.attributes, options);

      telemetry.trackEvent('optimization_completed', {
        orderCount: orders.length,
        attributeCount: config.attributes.length,
        savingsPercent: result.savingsPercent,
        useMatrixLookup: config.useMatrixLookup,
      });

      setResult(result);
      navigateTo('results');
    } catch (err) {
      console.error('Optimization error:', err);
      setError({
        code: 'OPTIMIZATION_FAILED',
        message: 'An error occurred during optimization.',
        details: err instanceof Error ? err.message : String(err),
      });
      navigateTo('changeover-config');
    } finally {
      setOptimizing(false);
    }
  }, [orders, config.attributes, config.useMatrixLookup, navigateTo, setResult, setOptimizing, setError]);

  return { runOptimization };
}

