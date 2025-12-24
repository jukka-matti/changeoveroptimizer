# Testing Examples

Ready-to-use test templates for ChangeoverOptimizer. Copy, paste, and customize for your needs.

## Table of Contents

1. [Component Test Template](#1-component-test-template)
2. [Service Test Template](#2-service-test-template)
3. [Store Test Template](#3-store-test-template)
4. [IPC Handler Test Template](#4-ipc-handler-test-template)
5. [Integration Test Template](#5-integration-test-template)
6. [E2E Test Template](#6-e2e-test-template)

---

## 1. Component Test Template

**Use for:** Testing React screens and UI components

**File:** `src/screens/MyScreen.test.tsx` or `src/components/MyComponent.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockElectronIPC, resetElectronMocks } from '@/test/setup';
import { useDataStore } from '@/stores/data-store';
import { MyComponent } from './MyComponent';

// Mock hooks if needed
vi.mock('@/hooks/useMyHook', () => ({
  useMyHook: () => ({
    myFunction: vi.fn(),
    myValue: 'test-value',
  }),
}));

describe('MyComponent', () => {
  beforeEach(() => {
    // Reset mocks between tests
    resetElectronMocks();
    useDataStore.getState().reset();
  });

  describe('Rendering', () => {
    it('should render component with correct elements', () => {
      render(<MyComponent />);

      // Test for headings
      expect(screen.getByRole('heading', { name: /my title/i })).toBeInTheDocument();

      // Test for buttons
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();

      // Test for text content
      expect(screen.getByText(/welcome message/i)).toBeInTheDocument();
    });

    it('should render with props', () => {
      render(<MyComponent title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle button click', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(<MyComponent onSubmit={onSubmit} />);

      // Click button
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Verify callback was called
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should handle form input', async () => {
      const user = userEvent.setup();

      render(<MyComponent />);

      // Type into input
      const input = screen.getByLabelText(/name/i);
      await user.type(input, 'John Doe');

      // Verify input value
      expect(input).toHaveValue('John Doe');
    });

    it('should handle dropdown selection', async () => {
      const user = userEvent.setup();

      render(<MyComponent />);

      // Select from dropdown
      const select = screen.getByLabelText(/category/i);
      await user.selectOptions(select, 'option-value');

      // Verify selection
      expect(select).toHaveValue('option-value');
    });
  });

  describe('Store Integration', () => {
    it('should display data from Zustand store', () => {
      // Set store state
      useDataStore.setState({
        myData: { name: 'Test', value: 42 },
      });

      render(<MyComponent />);

      // Verify data is displayed
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should update store when user submits', async () => {
      const user = userEvent.setup();

      render(<MyComponent />);

      // Fill form and submit
      await user.type(screen.getByLabelText(/name/i), 'New Value');
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Verify store was updated
      const state = useDataStore.getState();
      expect(state.myData.name).toBe('New Value');
    });
  });

  describe('Electron IPC Integration', () => {
    it('should call IPC when button clicked', async () => {
      mockElectronIPC('my:channel', { success: true });
      const user = userEvent.setup();

      render(<MyComponent />);

      await user.click(screen.getByRole('button', { name: /import/i }));

      // Verify IPC was called
      expect(window.electron.invoke).toHaveBeenCalledWith('my:channel', expect.any(Object));
    });

    it('should display IPC response', async () => {
      mockElectronIPC('my:channel', { data: 'Response Data' });
      const user = userEvent.setup();

      render(<MyComponent />);

      await user.click(screen.getByRole('button', { name: /load/i }));

      // Wait for async update
      await waitFor(() => {
        expect(screen.getByText('Response Data')).toBeInTheDocument();
      });
    });

    it('should handle IPC errors', async () => {
      mockElectronIPC('my:channel', () => {
        throw new Error('Operation failed');
      });
      const user = userEvent.setup();

      render(<MyComponent />);

      await user.click(screen.getByRole('button', { name: /load/i }));

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/operation failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Conditional Rendering', () => {
    it('should show loading state', () => {
      useDataStore.setState({ isLoading: true });

      render(<MyComponent />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should show error state', () => {
      useDataStore.setState({ error: 'Something went wrong' });

      render(<MyComponent />);

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should show empty state', () => {
      useDataStore.setState({ data: [] });

      render(<MyComponent />);

      expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });

    it('should show data when available', () => {
      useDataStore.setState({ data: [{ id: 1, name: 'Item 1' }] });

      render(<MyComponent />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });
});
```

---

## 2. Service Test Template

**Use for:** Testing business logic in services (parser, optimizer, exporter)

**File:** `src/services/myService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction, MyServiceClass } from './myService';

describe('myService', () => {
  describe('myFunction', () => {
    it('should process input correctly', () => {
      const input = { data: 'test' };

      const result = myFunction(input);

      expect(result).toEqual({
        processed: true,
        data: 'test',
      });
    });

    it('should handle empty input', () => {
      const result = myFunction({ data: '' });

      expect(result.processed).toBe(false);
    });

    it('should throw error for invalid input', () => {
      expect(() => {
        myFunction(null as any);
      }).toThrow('Input cannot be null');
    });

    it('should handle edge cases', () => {
      const edgeCases = [
        { input: { data: 'a'.repeat(1000) }, expected: true },
        { input: { data: '123' }, expected: true },
        { input: { data: '   ' }, expected: false },
      ];

      edgeCases.forEach(({ input, expected }) => {
        const result = myFunction(input);
        expect(result.processed).toBe(expected);
      });
    });
  });

  describe('MyServiceClass', () => {
    let service: MyServiceClass;

    beforeEach(() => {
      service = new MyServiceClass({ config: 'test' });
    });

    it('should initialize with config', () => {
      expect(service.config).toBe('test');
    });

    it('should process data', () => {
      const data = ['item1', 'item2', 'item3'];

      const result = service.process(data);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ processed: true, value: 'item1' });
    });

    it('should maintain state across calls', () => {
      service.process(['item1']);
      service.process(['item2']);

      expect(service.getProcessedCount()).toBe(2);
    });

    it('should handle errors gracefully', () => {
      const invalidData = [null, undefined, ''];

      expect(() => {
        service.process(invalidData as any);
      }).toThrow('Invalid data');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      }));

      const startTime = performance.now();
      const result = myFunction({ data: largeDataset });
      const duration = performance.now() - startTime;

      expect(result.processed).toBe(true);
      expect(duration).toBeLessThan(1000); // Should process in <1s
    });

    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) =>
        myFunction({ data: `item-${i}` })
      );

      const results = await Promise.all(operations);

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.data).toBe(`item-${i}`);
      });
    });
  });
});
```

---

## 3. Store Test Template

**Use for:** Testing Zustand stores

**File:** `src/stores/myStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useMyStore } from './myStore';

describe('MyStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useMyStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      const state = useMyStore.getState();

      expect(state.data).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Actions', () => {
    it('should set data', () => {
      const store = useMyStore.getState();

      store.setData({ id: 1, name: 'Test' });

      const state = useMyStore.getState();
      expect(state.data).toEqual({ id: 1, name: 'Test' });
    });

    it('should set loading state', () => {
      const store = useMyStore.getState();

      store.setLoading(true);

      expect(useMyStore.getState().isLoading).toBe(true);
    });

    it('should set error', () => {
      const store = useMyStore.getState();

      store.setError('Something went wrong');

      expect(useMyStore.getState().error).toBe('Something went wrong');
    });

    it('should clear error when setting data', () => {
      const store = useMyStore.getState();

      // Set error first
      store.setError('Error');
      expect(useMyStore.getState().error).toBe('Error');

      // Set data should clear error
      store.setData({ id: 1 });

      expect(useMyStore.getState().error).toBeNull();
    });

    it('should reset store', () => {
      const store = useMyStore.getState();

      // Modify state
      store.setData({ id: 1 });
      store.setLoading(true);
      store.setError('Error');

      // Reset
      store.reset();

      // Verify reset to initial state
      const state = useMyStore.getState();
      expect(state.data).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Computed Selectors', () => {
    it('should compute hasData correctly', () => {
      const store = useMyStore.getState();

      expect(store.hasData()).toBe(false);

      store.setData({ id: 1 });

      expect(useMyStore.getState().hasData()).toBe(true);
    });

    it('should compute validationErrors', () => {
      const store = useMyStore.getState();

      store.setData({ id: 1, name: '' }); // Invalid: empty name

      const errors = useMyStore.getState().getValidationErrors();

      expect(errors).toContain('Name is required');
    });
  });

  describe('Complex Workflows', () => {
    it('should handle async data loading workflow', async () => {
      const store = useMyStore.getState();

      // Start loading
      store.setLoading(true);
      expect(useMyStore.getState().isLoading).toBe(true);

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Set data
      store.setData({ id: 1, name: 'Loaded' });
      store.setLoading(false);

      // Verify final state
      const state = useMyStore.getState();
      expect(state.data).toEqual({ id: 1, name: 'Loaded' });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle error workflow', async () => {
      const store = useMyStore.getState();

      store.setLoading(true);

      // Simulate error
      await new Promise(resolve => setTimeout(resolve, 10));

      store.setError('Failed to load');
      store.setLoading(false);

      // Verify error state
      const state = useMyStore.getState();
      expect(state.error).toBe('Failed to load');
      expect(state.isLoading).toBe(false);
      expect(state.data).toBeNull();
    });
  });

  describe('Store Integration', () => {
    it('should update multiple stores correctly', () => {
      const myStore = useMyStore.getState();
      const otherStore = useOtherStore.getState();

      myStore.setData({ id: 1 });
      otherStore.setRelatedData({ myId: 1, value: 'test' });

      expect(useMyStore.getState().data?.id).toBe(1);
      expect(useOtherStore.getState().relatedData?.myId).toBe(1);
    });
  });
});
```

---

## 4. IPC Handler Test Template

**Use for:** Testing Electron backend IPC handlers

**File:** `src-electron/myHandlers.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMyOperation } from './myHandlers';
import fs from 'fs/promises';
import { dialog, BrowserWindow } from 'electron';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn(),
  },
  BrowserWindow: {
    fromWebContents: vi.fn(() => ({ id: 1 })),
  },
  app: {
    getPath: vi.fn(() => '/mock/path'),
  },
}));

describe('IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleMyOperation', () => {
    it('should perform operation successfully', async () => {
      // Mock filesystem operation
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('test data'));

      const mockEvent = { sender: { id: 1 } } as any;
      const result = await handleMyOperation(mockEvent, { path: '/test.txt' });

      expect(result).toEqual({ success: true, data: 'test data' });
      expect(fs.readFile).toHaveBeenCalledWith('/test.txt', 'utf-8');
    });

    it('should handle file not found error', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(
        Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      );

      const mockEvent = { sender: { id: 1 } } as any;

      await expect(
        handleMyOperation(mockEvent, { path: '/nonexistent.txt' })
      ).rejects.toThrow('File not found');
    });

    it('should handle permission denied error', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(
        Object.assign(new Error('EACCES'), { code: 'EACCES' })
      );

      const mockEvent = { sender: { id: 1 } } as any;

      await expect(
        handleMyOperation(mockEvent, { path: '/protected.txt' })
      ).rejects.toThrow('Permission denied');
    });

    it('should handle generic errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Unexpected error'));

      const mockEvent = { sender: { id: 1 } } as any;

      await expect(
        handleMyOperation(mockEvent, { path: '/test.txt' })
      ).rejects.toThrow('Failed to read file');
    });
  });

  describe('Dialog Handlers', () => {
    it('should handle open dialog', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/selected/file.xlsx'],
      });

      const mockEvent = { sender: { id: 1 } } as any;
      const result = await handleOpenDialog(mockEvent, {
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      });

      expect(result).toBe('/selected/file.xlsx');
      expect(dialog.showOpenDialog).toHaveBeenCalled();
    });

    it('should return null when dialog is cancelled', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      const mockEvent = { sender: { id: 1 } } as any;
      const result = await handleOpenDialog(mockEvent, {});

      expect(result).toBeNull();
    });

    it('should handle save dialog', async () => {
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        canceled: false,
        filePath: '/save/location.xlsx',
      });

      const mockEvent = { sender: { id: 1 } } as any;
      const result = await handleSaveDialog(mockEvent, {
        defaultPath: 'export.xlsx',
      });

      expect(result).toBe('/save/location.xlsx');
    });
  });

  describe('Write Operations', () => {
    it('should write file successfully', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const mockEvent = { sender: { id: 1 } } as any;
      const result = await handleWriteFile(mockEvent, {
        path: '/output.txt',
        data: 'test content',
      });

      expect(result).toEqual({ success: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output.txt',
        'test content',
        'utf-8'
      );
    });

    it('should handle write errors', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));

      const mockEvent = { sender: { id: 1 } } as any;

      await expect(
        handleWriteFile(mockEvent, { path: '/output.txt', data: 'test' })
      ).rejects.toThrow('Failed to write file');
    });
  });
});
```

---

## 5. Integration Test Template

**Use for:** Testing multi-layer interactions (service + store + IPC)

**File:** `src/test/integration/myFlow.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from '@/stores/data-store';
import { useMyStore } from '@/stores/myStore';
import { processData } from '@/services/myService';
import { mockElectronIPC, resetElectronMocks } from '@/test/setup';

describe('My Workflow Integration', () => {
  beforeEach(() => {
    useDataStore.getState().reset();
    useMyStore.getState().reset();
    resetElectronMocks();
  });

  it('should complete full workflow successfully', async () => {
    // Mock IPC responses
    mockElectronIPC('file:read', { data: [1, 2, 3] });
    mockElectronIPC('file:write', { success: true });

    // Step 1: Load data via IPC
    const dataStore = useDataStore.getState();
    const fileData = await window.electron.invoke('file:read', { path: '/test.json' });
    dataStore.setData(fileData.data);

    // Step 2: Process data with service
    const myStore = useMyStore.getState();
    const processed = processData(dataStore.data!);
    myStore.setProcessedData(processed);

    // Step 3: Save result via IPC
    const saveResult = await window.electron.invoke('file:write', {
      path: '/output.json',
      data: myStore.processedData,
    });

    // Verify final state
    expect(useDataStore.getState().data).toEqual([1, 2, 3]);
    expect(useMyStore.getState().processedData).toBeDefined();
    expect(saveResult.success).toBe(true);
  });

  it('should handle errors at each step', async () => {
    // Test error in step 1 (file read)
    mockElectronIPC('file:read', () => {
      throw new Error('File not found');
    });

    const dataStore = useDataStore.getState();

    await expect(
      window.electron.invoke('file:read', { path: '/missing.json' })
    ).rejects.toThrow('File not found');

    expect(dataStore.data).toBeNull();
  });

  it('should handle validation errors', () => {
    const dataStore = useDataStore.getState();

    // Set invalid data
    dataStore.setData([]);

    // Process should fail validation
    expect(() => {
      processData(dataStore.data!);
    }).toThrow('Data cannot be empty');
  });

  it('should maintain state consistency across operations', async () => {
    mockElectronIPC('file:read', { data: [1, 2, 3] });

    const dataStore = useDataStore.getState();
    const myStore = useMyStore.getState();

    // Operation 1
    const data1 = await window.electron.invoke('file:read', { path: '/file1.json' });
    dataStore.setData(data1.data);
    myStore.setProcessedData(processData(data1.data));

    // Operation 2 (should not interfere with operation 1)
    const data2 = await window.electron.invoke('file:read', { path: '/file2.json' });

    // Verify states are correct
    expect(useDataStore.getState().data).toEqual(data2.data);
    expect(useMyStore.getState().processedData).toBeDefined();
  });
});
```

---

## 6. E2E Test Template

**Use for:** Testing full user journeys in Electron app

**File:** `tests/e2e/myFlow.spec.ts`

```typescript
import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'path';

test.describe('My User Flow E2E', () => {
  let app: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    // Launch Electron app
    app = await electron.launch({
      args: [path.join(__dirname, '../../')],
    });

    page = await app.firstWindow();
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    // Always close app to prevent memory leaks
    await app.close();
  });

  test('should complete full user journey', async () => {
    // Step 1: Navigate to screen
    await page.getByRole('button', { name: /start/i }).click();

    // Step 2: Verify navigation
    await expect(page.locator('h2')).toContainText('My Screen');

    // Step 3: Fill form
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');

    // Step 4: Submit
    await page.getByRole('button', { name: /submit/i }).click();

    // Step 5: Verify result
    await expect(page.locator('h2')).toContainText('Success');
    await expect(page.getByText(/test user/i)).toBeVisible();
  });

  test('should handle file import', async () => {
    // Note: File dialogs require special handling in Electron E2E tests
    // You may need to mock the IPC channel or use a different approach

    await page.getByRole('button', { name: /import/i }).click();

    // Verify import was triggered (check for loading state)
    await expect(page.getByRole('progressbar')).toBeVisible();

    // Wait for import to complete
    await expect(page.locator('h2')).toContainText('Data Loaded');
  });

  test('should navigate between screens', async () => {
    // Navigate forward
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.locator('h2')).toContainText('Screen 2');

    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.locator('h2')).toContainText('Screen 3');

    // Navigate back
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.locator('h2')).toContainText('Screen 2');
  });

  test('should persist settings across app restart', async () => {
    // Navigate to settings
    await page.getByRole('button', { name: /settings/i }).click();

    // Change theme
    await page.getByRole('button', { name: /dark/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Close and relaunch app
    await app.close();
    app = await electron.launch({ args: [path.join(__dirname, '../../')] });
    page = await app.firstWindow();

    // Verify setting persisted
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should handle errors gracefully', async () => {
    // Trigger error condition (e.g., invalid input)
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByRole('button', { name: /submit/i }).click();

    // Verify error message
    await expect(page.getByText(/invalid email/i)).toBeVisible();

    // Verify app didn't crash
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display loading states', async () => {
    await page.getByRole('button', { name: /load data/i }).click();

    // Verify loading indicator appears
    await expect(page.getByRole('progressbar')).toBeVisible();

    // Wait for loading to complete
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 10000 });

    // Verify data is displayed
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should support keyboard navigation', async () => {
    // Tab through form fields
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/name/i)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/email/i)).toBeFocused();

    // Submit with Enter
    await page.keyboard.press('Enter');

    await expect(page.locator('h2')).toContainText('Submitted');
  });

  test('should handle concurrent operations', async () => {
    // Start multiple operations
    const button1 = page.getByRole('button', { name: /operation 1/i });
    const button2 = page.getByRole('button', { name: /operation 2/i });

    await button1.click();
    await button2.click();

    // Verify both operations complete
    await expect(page.getByText(/operation 1 complete/i)).toBeVisible();
    await expect(page.getByText(/operation 2 complete/i)).toBeVisible();
  });
});
```

---

## Usage Tips

### How to Use These Templates

1. **Copy the template** that matches your testing need
2. **Rename** the file and test descriptions
3. **Replace placeholders** (MyComponent, myFunction, etc.) with your actual names
4. **Customize test cases** for your specific logic
5. **Remove unused sections** to keep tests focused
6. **Add edge cases** specific to your code

### Common Customizations

**For Components:**
- Add tests for all props
- Test error boundaries
- Test loading/error/empty states
- Test accessibility (aria labels, keyboard navigation)

**For Services:**
- Test all public methods
- Test edge cases (empty input, large datasets, null values)
- Test error handling
- Add performance tests if needed

**For Stores:**
- Test all actions
- Test computed selectors
- Test state reset
- Test inter-store dependencies

**For IPC Handlers:**
- Test all IPC channels
- Test file operations (read, write, delete)
- Test dialog interactions
- Test error codes (ENOENT, EACCES, etc.)

**For Integration:**
- Test happy path (full workflow)
- Test error at each step
- Test state consistency
- Test concurrent operations

**For E2E:**
- Test critical user journeys
- Test cross-screen navigation
- Test data persistence
- Test error recovery

---

## Related Documentation

- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)** - High-level testing approach and coverage targets
- **[TESTING_PATTERNS.md](./TESTING_PATTERNS.md)** - Detailed patterns with explanations
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture reference
- **[DATA_MODEL.md](./DATA_MODEL.md)** - Data structures for mock data

---

**Last Updated:** 2025-12-23
