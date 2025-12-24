import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Electron IPC API
const mockInvoke = vi.fn();

// Expose mock to global window object
global.window = Object.create(window);
Object.defineProperty(window, 'electron', {
  value: {
    invoke: mockInvoke,
  },
  writable: true,
  configurable: true,
});

// Helper to mock specific IPC channels
export function mockElectronIPC(channel: string, returnValue: any): void {
  mockInvoke.mockImplementation((ch: string, ...args: any[]) => {
    if (ch === channel) {
      return Promise.resolve(typeof returnValue === 'function' ? returnValue(...args) : returnValue);
    }
    return Promise.reject(new Error(`Unmocked IPC channel: ${ch}`));
  });
}

// Reset mock between tests
export function resetElectronMocks(): void {
  mockInvoke.mockReset();
}

// Export for use in tests
export { mockInvoke };


