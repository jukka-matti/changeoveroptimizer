import { useState, useMemo, useCallback, useEffect } from "react";
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
  const [isDismissed, setIsDismissed] = useState(false);

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

  // Check session storage on mount
  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  // Reset dismissed state when result changes (new optimization)
  useEffect(() => {
    if (result) {
      // New result, allow celebration to show again
      setIsDismissed(false);
      sessionStorage.removeItem(DISMISSED_KEY);
    }
  }, [result?.downtimeSavingsPercent, result?.downtimeSavings]);

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
