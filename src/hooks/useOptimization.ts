import { useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useDataStore, useOrders } from '@/stores/data-store';
import { optimize } from '@/services/optimizer';
import { telemetry } from '@/services/telemetry';

export function useOptimization() {
  const { navigateTo, setError } = useAppStore();
  const { config, setResult, setOptimizing } = useDataStore();
  const orders = useOrders();

  const runOptimization = useCallback(async () => {
    try {
      setOptimizing(true);
      navigateTo('optimizing');

      // Add a small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 800));

      const result = optimize(orders, config.attributes);
      
      telemetry.trackEvent('optimization_completed', {
        orderCount: orders.length,
        attributeCount: config.attributes.length,
        savingsPercent: result.savingsPercent
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
  }, [orders, config.attributes, navigateTo, setResult, setOptimizing, setError]);

  return { runOptimization };
}

