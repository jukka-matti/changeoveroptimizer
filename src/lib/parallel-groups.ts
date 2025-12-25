/**
 * Parallel Group Utilities
 *
 * Centralized constants and utilities for parallel changeover groups.
 * Used for color coding and grouping changeover activities.
 */

/**
 * Available parallel group identifiers.
 * Groups allow activities to be performed simultaneously by different crews.
 */
export const PARALLEL_GROUPS = ["default", "A", "B", "C", "D"] as const;

export type ParallelGroup = (typeof PARALLEL_GROUPS)[number];

/**
 * Color classes for each parallel group.
 * Provides consistent styling across the application.
 */
export const PARALLEL_GROUP_COLORS: Record<
  ParallelGroup,
  {
    /** Left border color class */
    border: string;
    /** Background color class (subtle) */
    bg: string;
    /** Text color class */
    text: string;
    /** Badge/chip color class */
    badge: string;
  }
> = {
  default: {
    border: "border-l-gray-300",
    bg: "bg-gray-50",
    text: "text-gray-600",
    badge: "bg-gray-100 text-gray-700",
  },
  A: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },
  B: {
    border: "border-l-green-500",
    bg: "bg-green-50",
    text: "text-green-600",
    badge: "bg-green-100 text-green-700",
  },
  C: {
    border: "border-l-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
  },
  D: {
    border: "border-l-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
  },
};

/**
 * Get the border color class for a parallel group.
 *
 * @example
 * getParallelGroupBorder('A') // 'border-l-blue-500'
 * getParallelGroupBorder('unknown') // 'border-l-gray-300' (default)
 */
export function getParallelGroupBorder(group: string): string {
  const colors = PARALLEL_GROUP_COLORS[group as ParallelGroup];
  return colors?.border ?? PARALLEL_GROUP_COLORS.default.border;
}

/**
 * Get all color classes for a parallel group.
 *
 * @example
 * const colors = getParallelGroupColors('B');
 * // { border: 'border-l-green-500', bg: 'bg-green-50', ... }
 */
export function getParallelGroupColors(group: string): (typeof PARALLEL_GROUP_COLORS)[ParallelGroup] {
  return PARALLEL_GROUP_COLORS[group as ParallelGroup] ?? PARALLEL_GROUP_COLORS.default;
}

/**
 * Check if a string is a valid parallel group.
 */
export function isParallelGroup(value: string): value is ParallelGroup {
  return PARALLEL_GROUPS.includes(value as ParallelGroup);
}

/**
 * Get display name for a parallel group.
 *
 * @example
 * getParallelGroupName('default') // 'Default'
 * getParallelGroupName('A') // 'Group A'
 */
export function getParallelGroupName(group: string): string {
  if (group === "default") return "Default";
  return `Group ${group}`;
}
