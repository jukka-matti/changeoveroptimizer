/**
 * SMED (Single-Minute Exchange of Dies) TypeScript Type Definitions
 *
 * These types match the database schema and are used throughout the frontend
 */

// Study status workflow
export type StudyStatus = 'draft' | 'analyzing' | 'improving' | 'standardized' | 'archived';

// Step categories for changeover analysis
export type StepCategory =
  | 'preparation'
  | 'removal'
  | 'installation'
  | 'adjustment'
  | 'cleanup'
  | 'other';

// Operation type - critical for SMED analysis
export type OperationType = 'internal' | 'external';

// Improvement types
export type ImprovementType =
  | 'convert_to_external'
  | 'streamline_internal'
  | 'parallelize'
  | 'eliminate'
  | 'standardize'
  | 'quick_release'
  | 'other';

// Improvement status workflow
export type ImprovementStatus =
  | 'idea'
  | 'planned'
  | 'in_progress'
  | 'implemented'
  | 'verified';

/**
 * SMED Study - Main record for changeover improvement
 */
export interface Study {
  id: string;
  name: string;
  description: string | null;

  // Changeover type - either product references or free text
  fromProductId: string | null;
  toProductId: string | null;
  changeoverType: string | null;

  // Location
  lineName: string | null;
  machineName: string | null;

  // Status
  status: StudyStatus;

  // Times (in minutes)
  baselineMinutes: number | null;
  targetMinutes: number | null;
  currentMinutes: number | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SMED Step - Individual changeover step for analysis
 */
export interface Step {
  id: string;
  studyId: string;
  sequenceNumber: number;
  description: string;
  durationSeconds: number;
  category: StepCategory;
  operationType: OperationType;
  notes: string | null;
  videoTimestamp: string | null; // HH:MM:SS format
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SMED Improvement - Improvement idea and tracking
 */
export interface Improvement {
  id: string;
  studyId: string;
  description: string;
  improvementType: ImprovementType;
  status: ImprovementStatus;

  // Metrics
  estimatedSavingsSeconds: number | null;
  actualSavingsSeconds: number | null;
  estimatedCost: number | null;
  actualCost: number | null;

  // Tracking
  assignedTo: string | null;
  dueDate: Date | null;
  completedDate: Date | null;
  notes: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SMED Standard - Published standard work procedure
 */
export interface Standard {
  id: string;
  studyId: string;
  version: number;
  standardTimeMinutes: number;

  // Standard procedure (parsed from JSON)
  steps: StandardStep[];

  // Documentation
  toolsRequired: string[];
  safetyPrecautions: string | null;
  visualAids: string[];

  // Status
  isActive: boolean;
  publishedAt: Date | null;
  publishedBy: string | null;
  notes: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Standard Step - Step in a published standard procedure
 */
export interface StandardStep {
  stepId: string;
  description: string;
  durationSeconds: number;
  category: StepCategory;
  operationType: OperationType;
}

/**
 * SMED Changeover Log - Actual changeover execution record
 */
export interface ChangeoverLog {
  id: string;
  studyId: string;
  standardId: string | null;

  // Execution details
  operator: string | null;
  totalSeconds: number;

  // Step-by-step timing (parsed from JSON)
  stepTimings: StepTiming[];

  // Variance analysis
  varianceSeconds: number | null;
  variancePercent: number | null;

  // Notes
  notes: string | null;
  issues: string | null;

  // Metadata
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
}

/**
 * Step Timing - Timing for a specific step in a changeover log
 */
export interface StepTiming {
  stepId: string;
  seconds: number;
}

/**
 * Study Statistics - Calculated metrics for a study
 */
export interface StudyStatistics {
  totalSteps: number;
  internalSteps: number;
  externalSteps: number;
  totalTimeSeconds: number;
  internalTimeSeconds: number;
  externalTimeSeconds: number;
  internalPercentage: number;
  externalPercentage: number;
  recentLogCount: number;
  averageLogTimeSeconds: number | null;
}

/**
 * Form data for creating/updating a study
 */
export interface StudyFormData {
  name: string;
  description?: string;
  fromProductId?: string;
  toProductId?: string;
  changeoverType?: string;
  lineName?: string;
  machineName?: string;
  baselineMinutes?: number;
  targetMinutes?: number;
}

/**
 * Form data for creating/updating a step
 */
export interface StepFormData {
  description: string;
  minutes: number;
  seconds: number;
  category: StepCategory;
  operationType: OperationType;
  notes?: string;
  videoTimestamp?: string;
}

/**
 * Form data for creating/updating an improvement
 */
export interface ImprovementFormData {
  description: string;
  improvementType: ImprovementType;
  estimatedSavingsSeconds?: number;
  estimatedCost?: number;
  assignedTo?: string;
  dueDate?: Date;
  notes?: string;
}

/**
 * Form data for publishing a new standard
 */
export interface StandardPublishData {
  toolsRequired?: string[];
  safetyPrecautions?: string;
  visualAids?: string[];
  publishedBy?: string;
  notes?: string;
}
