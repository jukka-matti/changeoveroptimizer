/**
 * Async action utilities for Zustand stores
 *
 * These utilities eliminate the repeated try-catch pattern across store actions.
 */

import type { AsyncState } from '@/types/base';

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

/**
 * Creates an async action wrapper that handles loading/error states.
 *
 * Eliminates the repeated pattern:
 * ```
 * set({ isLoading: true, error: null });
 * try {
 *   const result = await someAction();
 *   set({ ..., isLoading: false });
 *   return result;
 * } catch (error) {
 *   set({ error: error.message, isLoading: false });
 *   throw error;
 * }
 * ```
 *
 * @example
 * const asyncAction = createAsyncAction(set, 'Operation failed');
 *
 * loadStudies: () => asyncAction(async () => {
 *   const studies = await ipcInvoke('smed:get_all_studies');
 *   set({ studies });
 * }),
 */
export function createAsyncAction<T extends AsyncState>(
  set: SetState<T>,
  defaultErrorPrefix: string = 'Operation failed'
) {
  return async function asyncAction<R>(
    action: () => Promise<R>,
    options?: {
      /** Skip setting loading state (useful for secondary/silent loads) */
      skipLoading?: boolean;
      /** Custom error message prefix */
      errorPrefix?: string;
      /** Callback when error occurs */
      onError?: (error: Error) => void;
    }
  ): Promise<R> {
    const errorPrefix = options?.errorPrefix ?? defaultErrorPrefix;

    if (!options?.skipLoading) {
      set({ isLoading: true, error: null } as Partial<T>);
    }

    try {
      const result = await action();
      if (!options?.skipLoading) {
        set({ isLoading: false } as Partial<T>);
      }
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `${errorPrefix}`;
      set({ error: message, isLoading: false } as Partial<T>);
      options?.onError?.(error instanceof Error ? error : new Error(message));
      throw error;
    }
  };
}

/**
 * Creates a silent action wrapper that only sets error state (no loading).
 * Useful for secondary data loads that shouldn't show loading spinners.
 *
 * @example
 * const silentAction = createSilentAction(set);
 *
 * loadSteps: (studyId) => silentAction(async () => {
 *   const steps = await ipcInvoke('smed:get_steps', studyId);
 *   set({ currentSteps: steps });
 * }, 'Failed to load steps'),
 */
export function createSilentAction<T extends { error: string | null }>(
  set: SetState<T>
) {
  return async function silentAction<R>(
    action: () => Promise<R>,
    errorPrefix: string = 'Operation failed'
  ): Promise<R> {
    try {
      return await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : errorPrefix;
      set({ error: message } as Partial<T>);
      throw error;
    }
  };
}

/**
 * Formats an error for display, extracting the message from various error types.
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
