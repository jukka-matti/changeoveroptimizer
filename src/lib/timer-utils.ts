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
