export type Screen =
  | "welcome"
  | "data-preview"
  | "column-mapping"
  | "changeover-config"
  | "optimizing"
  | "results"
  | "export"
  | "settings";

export interface Order {
  id: string;
  originalIndex: number;
  values: Record<string, string>;
}

export interface AttributeConfig {
  column: string;
  changeoverTime: number;
  parallelGroup: string; // Group ID for parallel changeover activities (e.g., "A", "B", "default")
}

export interface OptimizedOrder extends Order {
  sequenceNumber: number;
  changeoverTime: number; // Legacy: same as workTime for backward compatibility
  changeoverReasons: string[];
  workTime: number; // Sum of all attribute changeover times (labor cost)
  downtime: number; // Max per parallel group, sum across groups (production impact)
}

export interface OptimizationResult {
  sequence: OptimizedOrder[];
  // Work time metrics (sum of all changeover times - labor cost)
  totalBefore: number;
  totalAfter: number;
  savings: number;
  savingsPercent: number;
  // Downtime metrics (considering parallel groups - production impact)
  totalDowntimeBefore: number;
  totalDowntimeAfter: number;
  downtimeSavings: number;
  downtimeSavingsPercent: number;
  attributeStats: AttributeStat[];
}

export interface AttributeStat {
  column: string;
  changeoverCount: number;
  totalTime: number;
  parallelGroup: string;
}

export interface ParsedFile {
  name: string;
  path: string;
  sheets: string[];
  activeSheet: string;
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
}

export interface Template {
  id: string;
  name: string;
  created: string;
  modified: string;
  config: {
    orderIdColumn: string;
    attributes: AttributeConfig[];
  };
}

