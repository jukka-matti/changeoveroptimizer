import { useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useDataStore } from '@/stores/data-store';
import { useSettingsStore } from '@/stores/settings-store';
import { openFileDialog, invoke } from '@/lib/electron';
import { parseFile, detectOrderIdColumn, detectAttributeColumns } from '@/services/parser';
import { telemetry } from '@/services/telemetry';

export function useFileImport() {
  const { setLoading, setError, navigateTo } = useAppStore();
  const { setSourceFile, setOrderIdColumn, addAttribute } = useDataStore();
  const { addRecentFile } = useSettingsStore();

  const handleFileImport = useCallback(async (customBuffer?: ArrayBuffer, filename?: string, customPath?: string) => {
    try {
      setLoading(true, 'Reading file...');

      let buffer: ArrayBuffer;
      let name: string;
      let path: string = '';

      if (customBuffer && filename) {
        // Drag and drop case
        buffer = customBuffer;
        name = filename;
        path = customPath ?? '';
      } else if (customPath) {
        // Load from path (recent files)
        const data = await invoke<number[]>("read_file", { path: customPath });
        buffer = new Uint8Array(data).buffer as ArrayBuffer;
        name = customPath.split(/[/\\]/).pop() ?? 'unknown';
        path = customPath;
      } else {
        // File dialog case
        const result = await openFileDialog();
        if (!result) {
          setLoading(false);
          return;
        }
        buffer = result.data.buffer as ArrayBuffer;
        name = result.path.split(/[/\\]/).pop() ?? 'unknown';
        path = result.path;
      }

      setLoading(true, 'Parsing data...');
      const parseResult = await parseFile(buffer, name);

      if (!parseResult.ok) {
        setError({
          code: parseResult.error.code,
          message: parseResult.error.message,
        });
        return;
      }

      const parsedFile = parseResult.data;
      parsedFile.path = path;

      // Update store
      setSourceFile(parsedFile);

      // Auto-detect Order ID column
      const orderIdCol = detectOrderIdColumn(parsedFile.columns);
      if (orderIdCol) {
        setOrderIdColumn(orderIdCol);

        // Auto-detect attributes (exclude Order ID)
        const attributeCols = detectAttributeColumns(parsedFile.columns, orderIdCol);
        // Add top 3 attributes as defaults
        attributeCols.slice(0, 3).forEach(col => addAttribute(col, 0));
      }

      // Add to recent files
      if (path) {
        addRecentFile({
          path,
          name,
          lastOpened: new Date().toISOString(),
        });
      }

      telemetry.trackEvent('file_imported', {
        rowCount: parsedFile.rowCount,
        columnCount: parsedFile.columns.length
      });

      setLoading(false);
      navigateTo('data-preview');
    } catch (err) {
      console.error('Import error:', err);
      setError({
        code: 'IMPORT_FAILED',
        message: 'An unexpected error occurred during import.',
        details: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSourceFile, setOrderIdColumn, addAttribute, addRecentFile, navigateTo]);

  const loadSampleData = useCallback(async () => {
    try {
      setLoading(true, 'Loading sample data...');

      // Artificial delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const { SAMPLE_ORDERS, SAMPLE_COLUMNS } = await import('@/services/sampleData');

      const parsedFile = {
        name: 'sample_production_schedule.xlsx',
        path: 'sample',
        sheets: ['Schedule'],
        activeSheet: 'Schedule',
        rows: SAMPLE_ORDERS.map(o => ({
          'Order ID': o.id,
          ...o.values
        })),
        columns: SAMPLE_COLUMNS,
        rowCount: SAMPLE_ORDERS.length,
      };

      setSourceFile(parsedFile);
      setOrderIdColumn('Order ID');

      // Default sample attributes
      addAttribute('Color', 20);
      addAttribute('Material', 45);

      telemetry.trackEvent('sample_data_loaded');
      navigateTo('data-preview');
    } catch (err) {
      console.error('Failed to load sample data:', err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setSourceFile, setOrderIdColumn, addAttribute, navigateTo]);

  return {
    importFile: () => handleFileImport(),
    importBuffer: (buffer: ArrayBuffer, name: string) => handleFileImport(buffer, name),
    importFromPath: (path: string) => handleFileImport(undefined, undefined, path),
    loadSampleData,
  };
}

