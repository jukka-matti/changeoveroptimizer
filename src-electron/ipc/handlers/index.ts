/**
 * IPC Handler Registration
 *
 * Central module that registers all IPC handlers from domain-specific modules.
 */

import { registerFileHandlers } from './files';
import { registerSmedHandlers } from './smed';
import { registerAnalyticsHandlers } from './analytics';
import { registerChangeoverHandlers } from './changeovers';

/**
 * Register all IPC handlers.
 * Call this once during app initialization before creating the window.
 */
export function registerAllHandlers(): void {
  registerFileHandlers();
  registerSmedHandlers();
  registerAnalyticsHandlers();
  registerChangeoverHandlers();
}

// Re-export for granular access if needed
export { registerFileHandlers } from './files';
export { registerSmedHandlers } from './smed';
export { registerAnalyticsHandlers } from './analytics';
export { registerChangeoverHandlers } from './changeovers';
