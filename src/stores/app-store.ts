import { create } from "zustand";
import { Screen } from "@/types";

export interface AppError {
  code: string;
  message: string;
  details?: string;
}

interface AppState {
  currentScreen: Screen;
  isLoading: boolean;
  loadingMessage: string | null;
  error: AppError | null;
  isSaveTemplateDialogOpen: boolean;
  showAdvancedConfig: boolean;

  navigateTo: (screen: Screen) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  setError: (error: AppError) => void;
  clearError: () => void;
  setSaveTemplateDialogOpen: (open: boolean) => void;
  setShowAdvancedConfig: (show: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentScreen: "welcome",
  isLoading: false,
  loadingMessage: null,
  error: null,
  isSaveTemplateDialogOpen: false,
  showAdvancedConfig: false,

  navigateTo: (screen) => set({ currentScreen: screen, error: null }),

  setLoading: (isLoading, message) => set({
    isLoading,
    loadingMessage: message ?? null
  }),

  setError: (error) => set({ error, isLoading: false }),

  clearError: () => set({ error: null }),

  setSaveTemplateDialogOpen: (open) => set({ isSaveTemplateDialogOpen: open }),

  setShowAdvancedConfig: (show) => set({ showAdvancedConfig: show }),

  reset: () => set({
    currentScreen: "welcome",
    isLoading: false,
    loadingMessage: null,
    error: null,
    isSaveTemplateDialogOpen: false,
    // Keep showAdvancedConfig preference across resets
  }),
}));

