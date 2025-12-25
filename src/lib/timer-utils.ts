/**
 * Timer utility functions for formatting time values
 */

/**
 * Format seconds into MM:SS or HH:MM:SS format
 */
export function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format seconds into human-readable format (e.g., "5m 30s", "1h 15m")
 */
export function formatTimeHuman(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }

  if (minutes > 0) {
    if (seconds > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * Calculate variance between actual and standard time
 * Returns positive if ahead of schedule, negative if behind
 */
export function calculateVariance(actualSeconds: number, standardSeconds: number): {
  varianceSeconds: number;
  variancePercent: number;
  status: 'ahead' | 'on_track' | 'behind';
} {
  const varianceSeconds = standardSeconds - actualSeconds;
  const variancePercent = standardSeconds > 0
    ? (varianceSeconds / standardSeconds) * 100
    : 0;

  let status: 'ahead' | 'on_track' | 'behind';
  if (actualSeconds <= standardSeconds * 0.9) {
    status = 'ahead'; // More than 10% faster
  } else if (actualSeconds <= standardSeconds * 1.1) {
    status = 'on_track'; // Within 10%
  } else {
    status = 'behind'; // More than 10% slower
  }

  return {
    varianceSeconds,
    variancePercent,
    status,
  };
}

/**
 * Format variance for display (e.g., "+2:30" or "-1:45")
 */
export function formatVariance(varianceSeconds: number): string {
  const absSeconds = Math.abs(varianceSeconds);
  const minutes = Math.floor(absSeconds / 60);
  const seconds = absSeconds % 60;
  const sign = varianceSeconds >= 0 ? '+' : '-';

  return `${sign}${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

// ============================================================================
// Time Conversion Utilities (for form inputs)
// ============================================================================

export interface MinSecDuration {
  minutes: number;
  seconds: number;
}

/**
 * Convert total seconds to { minutes, seconds } tuple.
 * Used by form inputs that have separate minute/second fields.
 *
 * @example
 * secondsToMinSec(150) // { minutes: 2, seconds: 30 }
 */
export function secondsToMinSec(totalSeconds: number): MinSecDuration {
  if (!totalSeconds || totalSeconds < 0) {
    return { minutes: 0, seconds: 0 };
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return { minutes, seconds };
}

/**
 * Convert { minutes, seconds } to total seconds.
 * Used when saving form data that has separate minute/second fields.
 *
 * @example
 * minSecToSeconds(2, 30) // 150
 */
export function minSecToSeconds(minutes: number, seconds: number): number {
  return (minutes * 60) + seconds;
}

/**
 * Clamp a time input value to valid range.
 * Minutes: 0-999, Seconds: 0-59
 *
 * @example
 * clampTimeValue(65, 'seconds') // 59
 * clampTimeValue(-5, 'minutes') // 0
 */
export function clampTimeValue(
  value: number,
  field: 'minutes' | 'seconds'
): number {
  const maxValue = field === 'seconds' ? 59 : 999;
  return Math.min(Math.max(Math.round(value) || 0, 0), maxValue);
}

/**
 * Parse a string input to a clamped time value.
 * Useful for handling onChange events from number inputs.
 *
 * @example
 * parseTimeInput('45', 'seconds') // 45
 * parseTimeInput('', 'minutes')   // 0
 * parseTimeInput('abc', 'seconds') // 0
 */
export function parseTimeInput(
  value: string,
  field: 'minutes' | 'seconds'
): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return 0;
  return clampTimeValue(parsed, field);
}
