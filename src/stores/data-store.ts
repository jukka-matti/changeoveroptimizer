import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { ParsedFile, AttributeConfig, OptimizationResult } from "@/types";

interface DataConfig {
  orderIdColumn: string | null;
  attributes: AttributeConfig[];
}

interface DataState {
  sourceFile: ParsedFile | null;
  config: DataConfig;
  result: OptimizationResult | null;
  isOptimizing: boolean;
  
  setSourceFile: (file: ParsedFile) => void;
  clearSourceFile: () => void;
  setOrderIdColumn: (column: string) => void;
  addAttribute: (column: string, changeoverTime: number) => void;
  removeAttribute: (column: string) => void;
  updateAttributeTime: (column: string, time: number) => void;
  setAttributeParallelGroup: (column: string, group: string) => void;
  reorderAttributes: (fromIndex: number, toIndex: number) => void;
  setResult: (result: OptimizationResult) => void;
  setOptimizing: (isOptimizing: boolean) => void;
  clearResult: () => void;
  reset: () => void;
}

const initialConfig: DataConfig = {
  orderIdColumn: null,
  attributes: [],
};

export const useDataStore = create<DataState>()(
  immer((set) => ({
    sourceFile: null,
    config: initialConfig,
    result: null,
    isOptimizing: false,
    
    setSourceFile: (file) => set((state) => {
      state.sourceFile = file;
      state.config = initialConfig;
      state.result = null;
    }),
    
    clearSourceFile: () => set((state) => {
      state.sourceFile = null;
      state.config = initialConfig;
      state.result = null;
    }),
    
    setOrderIdColumn: (column) => set((state) => {
      state.config.orderIdColumn = column;
    }),
    
    addAttribute: (column, changeoverTime) => set((state) => {
      if (state.config.attributes.some(a => a.column === column)) return;
      state.config.attributes.push({ column, changeoverTime, parallelGroup: 'default' });
    }),
    
    removeAttribute: (column) => set((state) => {
      state.config.attributes = state.config.attributes.filter(
        a => a.column !== column
      );
    }),
    
    updateAttributeTime: (column, time) => set((state) => {
      const attr = state.config.attributes.find(a => a.column === column);
      if (attr) attr.changeoverTime = time;
    }),

    setAttributeParallelGroup: (column, group) => set((state) => {
      const attr = state.config.attributes.find(a => a.column === column);
      if (attr) attr.parallelGroup = group;
    }),

    reorderAttributes: (fromIndex, toIndex) => set((state) => {
      const attrs = state.config.attributes;
      const [removed] = attrs.splice(fromIndex, 1);
      attrs.splice(toIndex, 0, removed);
    }),
    
    setResult: (result) => set({ result }),
    setOptimizing: (isOptimizing) => set({ isOptimizing }),
    clearResult: () => set({ result: null }),
    reset: () => set({
      sourceFile: null,
      config: initialConfig,
      result: null,
      isOptimizing: false,
    }),
  }))
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Get orders ready for optimization.
 */
export function useOrders() {
  const { sourceFile, config } = useDataStore();
  
  if (!sourceFile || !config.orderIdColumn) return [];
  
  return sourceFile.rows.map((row, index) => ({
    id: String(row[config.orderIdColumn!] ?? `row-${index}`),
    originalIndex: index,
    values: Object.fromEntries(
      config.attributes.map(attr => [
        attr.column,
        String(row[attr.column] ?? ''),
      ])
    ),
  }));
}

/**
 * Check if config is valid for optimization.
 */
export function useIsConfigValid() {
  const { sourceFile, config } = useDataStore();
  
  return (
    sourceFile !== null &&
    config.orderIdColumn !== null &&
    config.attributes.length > 0 &&
    config.attributes.every(a => a.changeoverTime > 0)
  );
}

