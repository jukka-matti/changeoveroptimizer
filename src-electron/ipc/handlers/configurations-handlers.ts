/**
 * Saved Configurations IPC handlers
 *
 * Handles: auto-configuration detection and management
 */

import { registerHandler } from '../registry';
import {
  findByFingerprint,
  findByColumns,
  getAllConfigurations,
  getConfigurationById,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
  recordConfigurationUsage,
  updateExportPreference,
  saveOrUpdateConfiguration,
  generateFingerprint,
} from '../../db/queries/configurations';
import type { SavedConfigurationInsert } from '../../db/schema/configurations';

export function registerConfigurationsHandlers(): void {
  // Find configuration by column fingerprint
  registerHandler<{ fingerprint: string }, ReturnType<typeof findByFingerprint>>(
    'configurations:find_by_fingerprint',
    (args) => findByFingerprint(args.fingerprint),
    'Failed to find configuration by fingerprint'
  );

  // Find configuration by columns array
  registerHandler<{ columns: string[] }, ReturnType<typeof findByColumns>>(
    'configurations:find_by_columns',
    (args) => findByColumns(args.columns),
    'Failed to find configuration by columns'
  );

  // Generate fingerprint from columns (utility)
  registerHandler<{ columns: string[] }, string>(
    'configurations:generate_fingerprint',
    (args) => generateFingerprint(args.columns),
    'Failed to generate fingerprint'
  );

  // Get all configurations
  registerHandler<void, ReturnType<typeof getAllConfigurations>>(
    'configurations:get_all',
    () => getAllConfigurations(),
    'Failed to get configurations'
  );

  // Get configuration by ID
  registerHandler<{ id: string }, ReturnType<typeof getConfigurationById>>(
    'configurations:get_by_id',
    (args) => getConfigurationById(args.id),
    'Failed to get configuration'
  );

  // Create new configuration
  registerHandler<{ data: SavedConfigurationInsert }, ReturnType<typeof createConfiguration>>(
    'configurations:create',
    (args) => createConfiguration(args.data),
    'Failed to create configuration'
  );

  // Update configuration
  registerHandler<{ id: string; data: Partial<SavedConfigurationInsert> }, void>(
    'configurations:update',
    (args) => updateConfiguration(args.id, args.data),
    'Failed to update configuration'
  );

  // Delete configuration
  registerHandler<{ id: string }, void>(
    'configurations:delete',
    (args) => deleteConfiguration(args.id),
    'Failed to delete configuration'
  );

  // Record configuration usage (increment count, update lastUsedAt)
  registerHandler<{ id: string }, void>(
    'configurations:record_usage',
    (args) => recordConfigurationUsage(args.id),
    'Failed to record configuration usage'
  );

  // Update export preference for a configuration
  registerHandler<{ id: string; format: string }, void>(
    'configurations:update_export_preference',
    (args) => updateExportPreference(args.id, args.format),
    'Failed to update export preference'
  );

  // Save or update configuration (auto-save on optimization run)
  registerHandler<{
    columns: string[];
    orderIdColumn: string;
    attributesJson: string;
    name?: string;
  }, ReturnType<typeof saveOrUpdateConfiguration>>(
    'configurations:save_or_update',
    (args) => saveOrUpdateConfiguration(args),
    'Failed to save or update configuration'
  );
}
