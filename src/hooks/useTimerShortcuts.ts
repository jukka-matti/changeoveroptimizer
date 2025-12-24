import { useEffect } from 'react';

interface UseTimerShortcutsProps {
  enabled: boolean;
  isPaused: boolean;
  onPauseResume: () => void;
  onNextStep: () => void;
  onExit: () => void;
}

/**
 * Custom hook to handle keyboard shortcuts for timer control
 *
 * Keyboard shortcuts:
 * - Space: Toggle pause/resume
 * - Enter: Advance to next step (or complete if last step)
 * - Esc: Show exit confirmation dialog
 */
export function useTimerShortcuts({
  enabled,
  isPaused,
  onPauseResume,
  onNextStep,
  onExit,
}: UseTimerShortcutsProps): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onPauseResume();
      }

      if (e.code === 'Enter') {
        e.preventDefault();
        onNextStep();
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isPaused, onPauseResume, onNextStep, onExit]);
}
