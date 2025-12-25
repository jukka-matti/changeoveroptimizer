/**
 * IPC Handler Registry
 *
 * Provides a declarative way to register IPC handlers with consistent error handling.
 * Eliminates the repeated try-catch boilerplate across 55+ handlers.
 */

import { IpcMainInvokeEvent, ipcMain } from 'electron';

type HandlerFn<TArgs = unknown, TResult = unknown> = (
  event: IpcMainInvokeEvent,
  args: TArgs
) => Promise<TResult> | TResult;

interface HandlerConfig {
  channel: string;
  handler: HandlerFn;
}

/**
 * Formats an error for consistent error messages
 */
function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Creates a wrapped handler with consistent error handling
 */
export function createHandler<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult> | TResult,
  errorMessage: string
): HandlerFn<TArgs, TResult> {
  return async (_event: IpcMainInvokeEvent, args: TArgs): Promise<TResult> => {
    try {
      return await fn(args);
    } catch (err) {
      throw new Error(`${errorMessage}: ${formatError(err)}`);
    }
  };
}

/**
 * Creates a handler that passes the event (for dialogs, window access)
 */
export function createHandlerWithEvent<TArgs, TResult>(
  fn: (event: IpcMainInvokeEvent, args: TArgs) => Promise<TResult> | TResult,
  errorMessage: string
): HandlerFn<TArgs, TResult> {
  return async (event: IpcMainInvokeEvent, args: TArgs): Promise<TResult> => {
    try {
      return await fn(event, args);
    } catch (err) {
      throw new Error(`${errorMessage}: ${formatError(err)}`);
    }
  };
}

// Registry storage
const handlers: HandlerConfig[] = [];

/**
 * Registers a handler for an IPC channel.
 *
 * @example
 * registerHandler(
 *   'smed:get_all_studies',
 *   () => getAllStudies(),
 *   'Failed to get studies'
 * );
 */
export function registerHandler<TArgs, TResult>(
  channel: string,
  fn: (args: TArgs) => Promise<TResult> | TResult,
  errorMessage: string
): void {
  handlers.push({
    channel,
    handler: createHandler(fn, errorMessage),
  });
}

/**
 * Registers a handler that needs access to the IPC event (for dialogs, etc.)
 */
export function registerHandlerWithEvent<TArgs, TResult>(
  channel: string,
  fn: (event: IpcMainInvokeEvent, args: TArgs) => Promise<TResult> | TResult,
  errorMessage: string
): void {
  handlers.push({
    channel,
    handler: createHandlerWithEvent(fn, errorMessage),
  });
}

/**
 * Initializes all registered handlers with Electron's IPC main.
 * Call this once during app startup after all handlers are registered.
 */
export function initializeIpcHandlers(): void {
  for (const { channel, handler } of handlers) {
    ipcMain.handle(channel, handler);
  }
  console.log(`[IPC Registry] Registered ${handlers.length} handlers`);
}

/**
 * Returns a list of all registered channel names.
 * Useful for generating the preload whitelist.
 */
export function getRegisteredChannels(): string[] {
  return handlers.map((h) => h.channel);
}

/**
 * Clears all registered handlers (useful for testing)
 */
export function clearRegistry(): void {
  handlers.length = 0;
}
