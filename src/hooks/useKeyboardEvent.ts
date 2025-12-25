import { useEffect, useCallback, useMemo } from 'react';

/**
 * Defines a keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  /** The key value (e.g., 'o', 's', 'Escape') */
  key?: string;
  /** The key code (e.g., 'Space', 'Enter') - use for keys without clear key values */
  code?: string;
  /** Modifier key requirements */
  modifiers?: {
    ctrl?: boolean;
    meta?: boolean;
    alt?: boolean;
    shift?: boolean;
    /** Matches either Ctrl or Cmd (for cross-platform shortcuts) */
    cmdOrCtrl?: boolean;
  };
  /** The handler to call when the shortcut is triggered */
  handler: (event: KeyboardEvent) => void;
  /** Whether to prevent default behavior (default: true) */
  preventDefault?: boolean;
}

interface UseKeyboardEventOptions {
  /** Whether the shortcuts are enabled (default: true) */
  enabled?: boolean;
  /** Whether to ignore events when focused on input elements (default: true) */
  ignoreInputElements?: boolean;
}

/**
 * Unified keyboard event hook that provides consistent keyboard shortcut handling.
 *
 * @example
 * // Basic usage with shortcuts array
 * useKeyboardEvent([
 *   { key: 'o', modifiers: { cmdOrCtrl: true }, handler: () => openFile() },
 *   { key: 's', modifiers: { cmdOrCtrl: true }, handler: () => saveFile() },
 *   { code: 'Space', handler: () => togglePause() },
 *   { key: 'Escape', handler: () => goBack() },
 * ]);
 *
 * @example
 * // With options
 * useKeyboardEvent(shortcuts, { enabled: isTimerRunning, ignoreInputElements: true });
 */
export function useKeyboardEvent(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardEventOptions = {}
): void {
  const { enabled = true, ignoreInputElements = true } = options;

  // Memoize shortcuts to avoid unnecessary re-renders
  const stableShortcuts = useMemo(() => shortcuts, [shortcuts]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if disabled
      if (!enabled) return;

      // Skip if typing in input/textarea
      if (
        ignoreInputElements &&
        (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement ||
          (e.target instanceof HTMLElement && e.target.isContentEditable))
      ) {
        return;
      }

      for (const shortcut of stableShortcuts) {
        // Check key or code match
        const keyMatch = shortcut.code
          ? e.code === shortcut.code
          : shortcut.key
            ? e.key.toLowerCase() === shortcut.key.toLowerCase()
            : false;

        if (!keyMatch) continue;

        // Check modifiers
        const mods = shortcut.modifiers || {};

        // Handle cmdOrCtrl (matches either Ctrl or Cmd for cross-platform)
        if (mods.cmdOrCtrl) {
          if (!e.ctrlKey && !e.metaKey) continue;
        } else {
          // Check individual modifiers
          if (mods.ctrl !== undefined && e.ctrlKey !== mods.ctrl) continue;
          if (mods.meta !== undefined && e.metaKey !== mods.meta) continue;
        }

        if (mods.alt !== undefined && e.altKey !== mods.alt) continue;
        if (mods.shift !== undefined && e.shiftKey !== mods.shift) continue;

        // All conditions met - trigger handler
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        shortcut.handler(e);
        return; // Only trigger first matching shortcut
      }
    },
    [enabled, ignoreInputElements, stableShortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Helper to create a shortcut configuration
 */
export function shortcut(
  keyOrCode: string,
  handler: (event: KeyboardEvent) => void,
  options?: {
    modifiers?: KeyboardShortcut['modifiers'];
    useCode?: boolean;
    preventDefault?: boolean;
  }
): KeyboardShortcut {
  return {
    ...(options?.useCode ? { code: keyOrCode } : { key: keyOrCode }),
    handler,
    modifiers: options?.modifiers,
    preventDefault: options?.preventDefault,
  };
}
