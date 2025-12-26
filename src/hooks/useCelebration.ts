import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  getCelebrationTier,
  getCelebrationConfig,
  type CelebrationTier,
  type CelebrationConfig,
} from "@/lib/celebration-utils";
import type { OptimizationResult } from "@/types";

/**
 * Session storage key for dismissed celebration.
 * Using session storage so celebration reappears on new session.
 */
const DISMISSED_KEY = "celebration-dismissed";

export interface UseCelebrationResult {
  /** The celebration tier (none, good, great, exceptional) */
  tier: CelebrationTier;
  /** Configuration for displaying the celebration */
  config: CelebrationConfig | null;
  /** Whether the user has dismissed the celebration */
  isDismissed: boolean;
  /** Function to dismiss the celebration */
  dismiss: () => void;
  /** Whether to show the celebration (tier > none && !dismissed) */
  shouldShow: boolean;
}

/**
 * Hook for managing celebration state based on optimization results.
 *
 * @param result - The optimization result (or null if not available)
 * @returns Celebration state and controls
 *
 * @example
 * const { tier, config, shouldShow, dismiss } = useCelebration(result);
 *
 * {shouldShow && config && (
 *   <SuccessBanner
 *     tier={tier}
 *     headline={config.headline}
 *     onDismiss={dismiss}
 *   />
 * )}
 */
export function useCelebration(
  result: OptimizationResult | null
): UseCelebrationResult {
  // Initialize from session storage
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem(DISMISSED_KEY) === "true";
  });

  // Track previous result key to detect changes
  const prevResultKeyRef = useRef<string | null>(null);
  const currentResultKey = result
    ? `${result.downtimeSavingsPercent}-${result.downtimeSavings}`
    : null;

  // Reset dismissed state when result changes (new optimization)
  useEffect(() => {
    if (currentResultKey && currentResultKey !== prevResultKeyRef.current) {
      prevResultKeyRef.current = currentResultKey;
      // New result - allow celebration to show again
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDismissed(false);
      sessionStorage.removeItem(DISMISSED_KEY);
    }
  }, [currentResultKey]);

  // Calculate tier from result
  const tier = useMemo<CelebrationTier>(() => {
    if (!result) return "none";
    return getCelebrationTier(
      result.downtimeSavingsPercent,
      result.downtimeSavings
    );
  }, [result]);

  // Get config for the tier
  const config = useMemo<CelebrationConfig | null>(() => {
    if (!result || tier === "none") return null;
    return getCelebrationConfig(tier, result.downtimeSavingsPercent);
  }, [tier, result]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, "true");
  }, []);

  const shouldShow = tier !== "none" && !isDismissed;

  return {
    tier,
    config,
    isDismissed,
    dismiss,
    shouldShow,
  };
}
