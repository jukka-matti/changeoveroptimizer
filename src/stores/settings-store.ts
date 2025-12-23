import { create } from "zustand";

export type Theme = "light" | "dark" | "system";
export type ExportFormat = "xlsx" | "csv" | "pdf";

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: string;
}

export interface ExportDefaults {
  format: ExportFormat;
  includeOriginal: boolean;
  includeSummary: boolean;
}

interface SettingsState {
  language: string;
  theme: Theme;
  exportDefaults: ExportDefaults;
  recentFiles: RecentFile[];
  telemetryEnabled: boolean;
  
  setLanguage: (language: string) => void;
  setTheme: (theme: Theme) => void;
  setExportDefaults: (defaults: Partial<ExportDefaults>) => void;
  addRecentFile: (file: RecentFile) => void;
  removeRecentFile: (path: string) => void;
  clearRecentFiles: () => void;
  setTelemetry: (enabled: boolean) => void;
  hydrate: (settings: Partial<SettingsState>) => void;
}

const MAX_RECENT_FILES = 10;

const defaultExportDefaults: ExportDefaults = {
  format: "xlsx",
  includeOriginal: true,
  includeSummary: true,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  language: "en",
  theme: "system",
  exportDefaults: defaultExportDefaults,
  recentFiles: [],
  telemetryEnabled: false,
  
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setExportDefaults: (defaults) => set((state) => ({
    exportDefaults: { ...state.exportDefaults, ...defaults },
  })),
  addRecentFile: (file) => set((state) => {
    const filtered = state.recentFiles.filter(f => f.path !== file.path);
    const updated = [file, ...filtered].slice(0, MAX_RECENT_FILES);
    return { recentFiles: updated };
  }),
  removeRecentFile: (path) => set((state) => ({
    recentFiles: state.recentFiles.filter(f => f.path !== path),
  })),
  clearRecentFiles: () => set({ recentFiles: [] }),
  setTelemetry: (enabled) => set({ telemetryEnabled: enabled }),
  hydrate: (settings) => set(settings),
}));


