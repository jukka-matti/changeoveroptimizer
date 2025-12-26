import { useState, useEffect, useCallback } from 'react';

const STORAGE_PREFIX = 'hint_dismissed_';

/**
 * Hook for managing first-time hints that can be dismissed by users.
 * Uses localStorage to persist dismissal state.
 */
export function useFirstTimeHint(hintKey: string) {
  const [showHint, setShowHint] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const isDismissed = localStorage.getItem(`${STORAGE_PREFIX}${hintKey}`);
    setShowHint(!isDismissed);
  }, [hintKey]);

  const dismissHint = useCallback(() => {
    localStorage.setItem(`${STORAGE_PREFIX}${hintKey}`, 'true');
    setShowHint(false);
  }, [hintKey]);

  return { showHint, dismissHint };
}
