/**
 * Celebration tier based on optimization savings percentage.
 */
export type CelebrationTier = "none" | "good" | "great" | "exceptional";

/**
 * Configuration for celebration display based on tier.
 */
export interface CelebrationConfig {
  tier: CelebrationTier;
  headline: string;
  description: string;
  iconName: "TrendingDown" | "Award" | "Trophy";
}

/**
 * Thresholds for celebration tiers (based on downtimeSavingsPercent).
 */
export const CELEBRATION_THRESHOLDS = {
  good: 5,
  great: 15,
  exceptional: 25,
} as const;

/**
 * Determine the celebration tier based on savings metrics.
 *
 * @param savingsPercent - The percentage of downtime savings
 * @param savingsMinutes - The absolute minutes saved
 * @returns The celebration tier
 */
export function getCelebrationTier(
  savingsPercent: number,
  savingsMinutes: number
): CelebrationTier {
  // No celebration if no actual savings
  if (savingsMinutes <= 0 || savingsPercent <= 0) {
    return "none";
  }

  if (savingsPercent >= CELEBRATION_THRESHOLDS.exceptional) {
    return "exceptional";
  }
  if (savingsPercent >= CELEBRATION_THRESHOLDS.great) {
    return "great";
  }
  if (savingsPercent >= CELEBRATION_THRESHOLDS.good) {
    return "good";
  }

  return "none";
}

/**
 * Get the celebration configuration for a given tier.
 *
 * @param tier - The celebration tier
 * @param savingsPercent - The savings percentage (for dynamic messaging)
 * @returns Configuration object or null if no celebration
 */
export function getCelebrationConfig(
  tier: CelebrationTier,
  savingsPercent: number
): CelebrationConfig | null {
  switch (tier) {
    case "good":
      return {
        tier: "good",
        headline: "Nice Improvement!",
        description: `You've achieved a ${Math.round(savingsPercent)}% reduction in changeover time. Keep optimizing!`,
        iconName: "TrendingDown",
      };
    case "great":
      return {
        tier: "great",
        headline: "Great Results!",
        description: `Impressive! A ${Math.round(savingsPercent)}% reduction in changeover time will boost your productivity.`,
        iconName: "Award",
      };
    case "exceptional":
      return {
        tier: "exceptional",
        headline: "Exceptional Optimization!",
        description: `Outstanding! You've achieved a ${Math.round(savingsPercent)}% reduction - that's a significant improvement!`,
        iconName: "Trophy",
      };
    default:
      return null;
  }
}
