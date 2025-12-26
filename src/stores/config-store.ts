import { create } from 'zustand';
import { configurationsIpc } from '@/lib/electron-ipc';
import type { SavedConfiguration, ParsedSavedConfiguration } from '@/types/configurations';

interface ConfigStoreState {
  // The matched configuration when importing a file
  matchedConfig: ParsedSavedConfiguration | null;

  // Whether the recognition prompt should be shown
  showRecognitionPrompt: boolean;

  // Currently loaded configuration ID (for export preferences)
  activeConfigId: string | null;

  // All saved configurations (for settings page)
  configurations: SavedConfiguration[];
  isLoading: boolean;

  // Actions
  checkForMatchingConfig: (columns: string[]) => Promise<void>;
  dismissRecognitionPrompt: () => void;
  setActiveConfig: (id: string | null) => void;
  loadConfigurations: () => Promise<void>;
  deleteConfiguration: (id: string) => Promise<void>;
  updateConfigurationName: (id: string, name: string) => Promise<void>;
  recordConfigUsage: (id: string) => Promise<void>;
  saveCurrentConfig: (
    columns: string[],
    orderIdColumn: string,
    attributesJson: string,
    name?: string
  ) => Promise<SavedConfiguration | undefined>;
  reset: () => void;
}

// Helper to parse configuration from database format
function parseConfig(config: SavedConfiguration): ParsedSavedConfiguration {
  return {
    ...config,
    attributes: JSON.parse(config.attributesJson),
  };
}

export const useConfigStore = create<ConfigStoreState>((set, get) => ({
  matchedConfig: null,
  showRecognitionPrompt: false,
  activeConfigId: null,
  configurations: [],
  isLoading: false,

  checkForMatchingConfig: async (columns: string[]) => {
    try {
      const config = await configurationsIpc.findByColumns(columns);
      if (config) {
        set({
          matchedConfig: parseConfig(config),
          showRecognitionPrompt: true,
          activeConfigId: config.id,
        });
      } else {
        set({
          matchedConfig: null,
          showRecognitionPrompt: false,
          activeConfigId: null,
        });
      }
    } catch (error) {
      console.error('[ConfigStore] Failed to check for matching config:', error);
      set({
        matchedConfig: null,
        showRecognitionPrompt: false,
      });
    }
  },

  dismissRecognitionPrompt: () => {
    set({ showRecognitionPrompt: false });
  },

  setActiveConfig: (id) => {
    set({ activeConfigId: id });
  },

  loadConfigurations: async () => {
    set({ isLoading: true });
    try {
      const configs = await configurationsIpc.getAll();
      set({ configurations: configs ?? [], isLoading: false });
    } catch (error) {
      console.error('[ConfigStore] Failed to load configurations:', error);
      set({ configurations: [], isLoading: false });
    }
  },

  deleteConfiguration: async (id: string) => {
    try {
      await configurationsIpc.delete(id);
      // Remove from local state
      set((state) => ({
        configurations: state.configurations.filter((c) => c.id !== id),
        // Clear active config if it was deleted
        activeConfigId: state.activeConfigId === id ? null : state.activeConfigId,
        matchedConfig: state.matchedConfig?.id === id ? null : state.matchedConfig,
      }));
    } catch (error) {
      console.error('[ConfigStore] Failed to delete configuration:', error);
      throw error;
    }
  },

  updateConfigurationName: async (id: string, name: string) => {
    try {
      await configurationsIpc.update(id, { name });
      // Update local state
      set((state) => ({
        configurations: state.configurations.map((c) =>
          c.id === id ? { ...c, name } : c
        ),
        matchedConfig:
          state.matchedConfig?.id === id
            ? { ...state.matchedConfig, name }
            : state.matchedConfig,
      }));
    } catch (error) {
      console.error('[ConfigStore] Failed to update configuration name:', error);
      throw error;
    }
  },

  recordConfigUsage: async (id: string) => {
    try {
      await configurationsIpc.recordUsage(id);
      // Update local state
      set((state) => ({
        configurations: state.configurations.map((c) =>
          c.id === id
            ? { ...c, usageCount: c.usageCount + 1, lastUsedAt: new Date() }
            : c
        ),
      }));
    } catch (error) {
      console.error('[ConfigStore] Failed to record config usage:', error);
    }
  },

  saveCurrentConfig: async (columns, orderIdColumn, attributesJson, name) => {
    try {
      const config = await configurationsIpc.saveOrUpdate(
        columns,
        orderIdColumn,
        attributesJson,
        name
      );
      if (config) {
        set({ activeConfigId: config.id });
        // Refresh configurations list
        get().loadConfigurations();
      }
      return config;
    } catch (error) {
      console.error('[ConfigStore] Failed to save configuration:', error);
      return undefined;
    }
  },

  reset: () => {
    set({
      matchedConfig: null,
      showRecognitionPrompt: false,
      activeConfigId: null,
    });
  },
}));
