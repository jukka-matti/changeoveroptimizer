
import { InferSelectModel } from 'drizzle-orm';
import * as schema from '../src-electron/db/schema';

// ============================================================================
// Database Types (Inferred from Drizzle Schema)
// ============================================================================

// SMED
export type SmedStudy = InferSelectModel<typeof schema.smedStudies>;
export type SmedStep = InferSelectModel<typeof schema.smedSteps>;
export type SmedImprovement = InferSelectModel<typeof schema.smedImprovements>;
export type StandardWork = InferSelectModel<typeof schema.smedStandards>;
export type ChangeoverLog = InferSelectModel<typeof schema.smedChangeoverLogs>;

// Changeovers
export type ChangeoverAttribute = InferSelectModel<typeof schema.changeoverAttributes>;
export type ChangeoverMatrixEntry = InferSelectModel<typeof schema.changeoverMatrix>;

// Analytics
export type OptimizationRun = InferSelectModel<typeof schema.optimizationRuns>;

// Templates
export type Template = InferSelectModel<typeof schema.templates>;

// ============================================================================
// Derived / UI Types
// ============================================================================

export type Screen =
    | "welcome"
    | "data-preview"
    | "column-mapping"
    | "changeover-config"
    | "optimizing"
    | "results"
    | "export"
    | "settings"
    | "smed"
    | "timer"
    | "analytics"
    | "changeover-matrix";

export interface AppError {
    code: string;
    message: string;
    details?: string;
}

// Optimization specific types (Frontend logic)
export interface Order {
    id: string;
    originalIndex: number;
    values: Record<string, string>;
}

export interface AttributeConfig {
    column: string;
    changeoverTime: number;
    parallelGroup: string;
}
