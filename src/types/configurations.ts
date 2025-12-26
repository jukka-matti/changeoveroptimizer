/**
 * Saved Configuration Types
 *
 * Types for the auto-configuration system that remembers
 * file structures and applies settings automatically.
 */

import type { AttributeConfig } from './index';

/**
 * Saved configuration record from the database.
 */
export interface SavedConfiguration {
  id: string;
  fingerprint: string;
  name: string;
  orderIdColumn: string;
  attributesJson: string;
  lastExportFormat: string | null;
  usageCount: number;
  createdAt: Date | null;
  lastUsedAt: Date | null;
}

/**
 * Input for creating a new configuration.
 */
export interface SavedConfigurationInput {
  fingerprint: string;
  name: string;
  orderIdColumn: string;
  attributesJson: string;
  lastExportFormat?: string;
}

/**
 * Parsed configuration with attributes as proper objects.
 */
export interface ParsedSavedConfiguration {
  id: string;
  fingerprint: string;
  name: string;
  orderIdColumn: string;
  attributes: AttributeConfig[];
  lastExportFormat: string | null;
  usageCount: number;
  createdAt: Date | null;
  lastUsedAt: Date | null;
}

/**
 * Helper to parse a SavedConfiguration into a ParsedSavedConfiguration.
 */
export function parseConfiguration(config: SavedConfiguration): ParsedSavedConfiguration {
  return {
    ...config,
    attributes: JSON.parse(config.attributesJson) as AttributeConfig[],
  };
}

/**
 * Helper to serialize attributes to JSON for storage.
 */
export function serializeAttributes(attributes: AttributeConfig[]): string {
  return JSON.stringify(attributes);
}
