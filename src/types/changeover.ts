// ============================================================================
// Changeover Attribute types
// ============================================================================

export interface ChangeoverAttribute {
  id: string;
  name: string;
  displayName: string;
  hierarchyLevel: number;
  defaultMinutes: number;
  parallelGroup: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date | number | null;
  updatedAt: Date | number | null;
}

export interface ChangeoverAttributeInput {
  name: string;
  displayName: string;
  hierarchyLevel: number;
  defaultMinutes?: number;
  parallelGroup?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================================================
// Changeover Matrix types
// ============================================================================

export type ChangeoverSource = 'manual' | 'smed_standard' | 'smed_average' | 'imported';

export interface ChangeoverMatrixEntry {
  id: string;
  attributeId: string;
  fromValue: string;
  toValue: string;
  timeMinutes: number;
  source: ChangeoverSource;
  smedStudyId: string | null;
  notes: string | null;
  createdAt: Date | number | null;
  updatedAt: Date | number | null;
}

export interface ChangeoverMatrixEntryInput {
  attributeId: string;
  fromValue: string;
  toValue: string;
  timeMinutes: number;
  source?: ChangeoverSource;
  smedStudyId?: string;
  notes?: string;
}

// ============================================================================
// Lookup types for optimizer integration
// ============================================================================

export interface ChangeoverLookup {
  attributeName: string;
  fromValue: string;
  toValue: string;
}

export interface PrefetchMatrixArgs {
  attributeNames: string[];
  valuesByAttribute: Record<string, string[]>;
}

// ============================================================================
// SMED Import types
// ============================================================================

export interface SmedImportArgs {
  attributeId: string;
  fromValue: string;
  toValue: string;
  timeMinutes: number;
  smedStudyId: string;
  notes?: string;
}
