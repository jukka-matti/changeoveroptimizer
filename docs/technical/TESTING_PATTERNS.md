# Testing Patterns

Detailed testing patterns with code examples for ChangeoverOptimizer.

## Table of Contents

1. [Mocking Electron IPC in Frontend Tests](#1-mocking-electron-ipc-in-frontend-tests)
2. [Testing React Components](#2-testing-react-components)
3. [Testing Zustand Stores](#3-testing-zustand-stores)
4. [Testing Backend IPC Handlers](#4-testing-backend-ipc-handlers)
5. [Testing Database Operations](#5-testing-database-operations)
6. [E2E Testing with Playwright + Electron](#6-e2e-testing-with-playwright--electron)
7. [Performance/Benchmark Testing](#7-performancebenchmark-testing)
8. [Integration Testing](#8-integration-testing)

---

## 1. Mocking Electron IPC in Frontend Tests

### When to Use

Any component, hook, or service that calls `window.electron.invoke()` to communicate with the Electron backend.

### Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mockElectronIPC, resetElectronMocks, mockInvoke } from '@/test/setup';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    resetElectronMocks(); // Reset mocks between tests
  });

  it('should call file dialog when button clicked', async () => {
    // Mock specific IPC channel
    mockElectronIPC('dialog:open', '/path/to/selected/file.xlsx');

    render(<MyComponent />);

    // Simulate user clicking button
    const button = screen.getByRole('button', { name: /import/i });
    await userEvent.click(button);

    // Verify IPC was called
    expect(mockInvoke).toHaveBeenCalledWith('dialog:open', {
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
        { name: 'CSV Files', extensions: ['csv'] },
      ],
    });

    // Verify result is displayed
    await waitFor(() => {
      expect(screen.getByText('/path/to/selected/file.xlsx')).toBeInTheDocument();
    });
  });

  it('should handle IPC errors gracefully', async () => {
    // Mock IPC to reject with error
    mockElectronIPC('dialog:open', () => {
      throw new Error('User cancelled');
    });

    render(<MyComponent />);

    const button = screen.getByRole('button', { name: /import/i });
    await userEvent.click(button);

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
    });
  });

  it('should mock dynamic return values', async () => {
    // Mock IPC with function that returns based on arguments
    mockElectronIPC('file:read', (args: { path: string }) => {
      if (args.path === '/valid/path') {
        return { data: [1, 2, 3] };
      }
      throw new Error('File not found');
    });

    // Test valid path
    const result1 = await window.electron.invoke('file:read', { path: '/valid/path' });
    expect(result1).toEqual({ data: [1, 2, 3] });

    // Test invalid path
    await expect(
      window.electron.invoke('file:read', { path: '/invalid/path' })
    ).rejects.toThrow('File not found');
  });
});
```

### Common Pitfalls

❌ **Forgetting to reset mocks between tests**
```typescript
// BAD: Mocks bleed between tests
describe('MyComponent', () => {
  it('test 1', () => {
    mockElectronIPC('channel', 'value1');
    // ...
  });

  it('test 2', () => {
    // Still has mock from test 1! ⚠️
  });
});
```

✅ **Always reset in beforeEach**
```typescript
// GOOD: Clean slate for each test
beforeEach(() => {
  resetElectronMocks();
});
```

❌ **Wrong channel name (typo)**
```typescript
// BAD: Typo in channel name
mockElectronIPC('dialog:oepn', '/path'); // typo: "oepn"
await window.electron.invoke('dialog:open', ...); // ❌ Unmocked!
```

✅ **Match exact channel names**
```typescript
// GOOD: Exact channel name
mockElectronIPC('dialog:open', '/path');
await window.electron.invoke('dialog:open', ...); // ✅ Works!
```

❌ **Not handling async IPC responses**
```typescript
// BAD: Not awaiting IPC call
it('should load file', () => {
  mockElectronIPC('file:read', { data: [...] });
  component.loadFile(); // async function
  expect(component.data).toBeDefined(); // ❌ Too early!
});
```

✅ **Use waitFor for async updates**
```typescript
// GOOD: Wait for async operation
it('should load file', async () => {
  mockElectronIPC('file:read', { data: [...] });
  component.loadFile();
  await waitFor(() => {
    expect(component.data).toBeDefined(); // ✅ Waits for update
  });
});
```

---

## 2. Testing React Components

### When to Use

Testing screens or UI components for rendering, user interactions, and conditional rendering.

### Pattern: Basic Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeScreen } from './WelcomeScreen';

describe('WelcomeScreen', () => {
  it('should render welcome message', () => {
    render(<WelcomeScreen />);

    expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument();
    expect(screen.getByText(/changeover optimizer/i)).toBeInTheDocument();
  });

  it('should render import and sample data buttons', () => {
    render(<WelcomeScreen />);

    expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load sample/i })).toBeInTheDocument();
  });
});
```

### Pattern: Testing User Interactions

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyForm } from './MyForm';

describe('MyForm', () => {
  it('should call onSubmit when form is submitted', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<MyForm onSubmit={onSubmit} />);

    // Fill out form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Verify callback was called
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<MyForm />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

### Pattern: Testing Conditional Rendering

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsScreen } from './ResultsScreen';
import { useDataStore } from '@/stores/data-store';

describe('ResultsScreen', () => {
  beforeEach(() => {
    useDataStore.getState().reset();
  });

  it('should show "no results" message when result is null', () => {
    useDataStore.setState({ result: null });

    render(<ResultsScreen />);

    expect(screen.getByText(/no optimization results/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should show results table when result exists', () => {
    const mockResult = {
      sequence: [
        { id: '1', sequenceNumber: 1, changeoverTime: 10 },
        { id: '2', sequenceNumber: 2, changeoverTime: 15 },
      ],
      totalBefore: 100,
      totalAfter: 75,
      savings: 25,
      savingsPercent: 25,
    };
    useDataStore.setState({ result: mockResult });

    render(<ResultsScreen />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 data rows
    expect(screen.getByText(/25 minutes/i)).toBeInTheDocument(); // savings
  });
});
```

### Common Pitfalls

❌ **Testing implementation details**
```typescript
// BAD: Testing internal state/methods
expect(component.state.isLoading).toBe(true); // ❌ Implementation detail
```

✅ **Test user-visible behavior**
```typescript
// GOOD: Testing what user sees
expect(screen.getByRole('progressbar')).toBeInTheDocument(); // ✅ User sees loading
```

❌ **Not waiting for async updates**
```typescript
// BAD: Not waiting
it('should show data', () => {
  render(<AsyncComponent />);
  expect(screen.getByText(/data/i)).toBeInTheDocument(); // ❌ Too early!
});
```

✅ **Use findBy or waitFor**
```typescript
// GOOD: Wait for element to appear
it('should show data', async () => {
  render(<AsyncComponent />);
  expect(await screen.findByText(/data/i)).toBeInTheDocument(); // ✅ Waits
});
```

---

## 3. Testing Zustand Stores

### When to Use

Testing state management logic, mutations, computed values, and store reset.

### Pattern: Testing Store Actions

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from './data-store';

describe('Data Store', () => {
  beforeEach(() => {
    useDataStore.getState().reset(); // Clean slate for each test
  });

  it('should add attribute to config', () => {
    const store = useDataStore.getState();

    store.addAttribute('Color', 15, 'default');

    const state = useDataStore.getState();
    expect(state.config.attributes).toHaveLength(1);
    expect(state.config.attributes[0]).toMatchObject({
      column: 'Color',
      changeoverTime: 15,
      parallelGroup: 'default',
    });
  });

  it('should remove attribute from config', () => {
    const store = useDataStore.getState();

    // Add two attributes
    store.addAttribute('Color', 15, 'default');
    store.addAttribute('Size', 10, 'default');

    // Remove first attribute
    store.removeAttribute(0);

    const state = useDataStore.getState();
    expect(state.config.attributes).toHaveLength(1);
    expect(state.config.attributes[0].column).toBe('Size');
  });

  it('should reset config when source file changes', () => {
    const store = useDataStore.getState();

    // Set up existing config
    store.setOrderIdColumn('OrderID');
    store.addAttribute('Color', 15, 'default');

    // Change source file
    store.setSourceFile(new File([], 'new.xlsx'));

    // Verify config was reset
    const state = useDataStore.getState();
    expect(state.config.orderIdColumn).toBeNull();
    expect(state.config.attributes).toHaveLength(0);
  });
});
```

### Pattern: Testing Computed Selectors

```typescript
import { describe, it, expect } from 'vitest';
import { useLicenseStore } from './license-store';

describe('License Store Selectors', () => {
  it('should calculate canOptimize based on tier and order count', () => {
    // Free tier
    useLicenseStore.setState({ tier: 'free' });

    expect(useLicenseStore.getState().canOptimizeOrders(50)).toBe(true); // ✅ At limit
    expect(useLicenseStore.getState().canOptimizeOrders(51)).toBe(false); // ❌ Over limit

    // Pro tier
    useLicenseStore.setState({ tier: 'pro' });

    expect(useLicenseStore.getState().canOptimizeOrders(1000)).toBe(true); // ✅ Unlimited
    expect(useLicenseStore.getState().canOptimizeOrders(10000)).toBe(true); // ✅ Unlimited
  });

  it('should validate attribute count based on tier', () => {
    useLicenseStore.setState({ tier: 'free' });

    expect(useLicenseStore.getState().canAddAttribute(3)).toBe(true); // ✅ At limit
    expect(useLicenseStore.getState().canAddAttribute(4)).toBe(false); // ❌ Over limit

    useLicenseStore.setState({ tier: 'pro' });

    expect(useLicenseStore.getState().canAddAttribute(10)).toBe(true); // ✅ Unlimited
  });
});
```

### Common Pitfalls

❌ **Using stale store references**
```typescript
// BAD: Store reference becomes stale
const store = useDataStore.getState();
store.addAttribute('Color', 15);
expect(store.config.attributes).toHaveLength(1); // ❌ Stale reference!
```

✅ **Always get fresh state**
```typescript
// GOOD: Get fresh state after mutation
const store = useDataStore.getState();
store.addAttribute('Color', 15);

const freshState = useDataStore.getState(); // ✅ Fresh!
expect(freshState.config.attributes).toHaveLength(1);
```

❌ **State bleeding between tests**
```typescript
// BAD: State persists across tests
describe('Store', () => {
  it('test 1', () => {
    useDataStore.setState({ result: mockResult });
    // ...
  });

  it('test 2', () => {
    // Still has result from test 1! ⚠️
  });
});
```

✅ **Reset in beforeEach**
```typescript
// GOOD: Clean state for each test
beforeEach(() => {
  useDataStore.getState().reset();
});
```

---

## 4. Testing Backend IPC Handlers

### When to Use

Testing `src-electron/ipc-handlers.ts` functions, file system operations, and dialog interactions.

### Pattern: Testing IPC Handler

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleReadFile, handleOpenDialog } from './ipc-handlers';
import fs from 'fs/promises';
import { dialog, BrowserWindow } from 'electron';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn(),
  },
  BrowserWindow: {
    fromWebContents: vi.fn(() => ({ id: 1 })),
  },
}));

describe('IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleReadFile', () => {
    it('should read file and return array buffer', async () => {
      const mockBuffer = Buffer.from([1, 2, 3, 4]);
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

      const mockEvent = { sender: { id: 1 } } as any;
      const result = await handleReadFile(mockEvent, { path: '/test.xlsx' });

      expect(result).toEqual([1, 2, 3, 4]);
      expect(fs.readFile).toHaveBeenCalledWith('/test.xlsx');
    });

    it('should throw error when file not found', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file'));

      const mockEvent = { sender: { id: 1 } } as any;

      await expect(
        handleReadFile(mockEvent, { path: '/nonexistent.xlsx' })
      ).rejects.toThrow('Failed to read file');
    });

    it('should throw error on permission denied', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('EACCES: permission denied'));

      const mockEvent = { sender: { id: 1 } } as any;

      await expect(
        handleReadFile(mockEvent, { path: '/protected.xlsx' })
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('handleOpenDialog', () => {
    it('should return selected file path', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/selected/file.xlsx'],
      });

      const mockEvent = { sender: { id: 1 } } as any;
      const result = await handleOpenDialog(mockEvent, {
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      });

      expect(result).toBe('/selected/file.xlsx');
      expect(dialog.showOpenDialog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          filters: [{ name: 'Excel', extensions: ['xlsx'] }],
        })
      );
    });

    it('should return null when user cancels', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      const mockEvent = { sender: { id: 1 } } as any;
      const result = await handleOpenDialog(mockEvent, {});

      expect(result).toBeNull();
    });
  });
});
```

### Common Pitfalls

❌ **Not mocking Electron modules**
```typescript
// BAD: Electron modules not mocked
import { dialog } from 'electron'; // ❌ Will fail in test environment
```

✅ **Mock at top of file**
```typescript
// GOOD: Mock before imports
vi.mock('electron', () => ({
  dialog: { showOpenDialog: vi.fn() },
  // ...
}));
```

❌ **Missing error test cases**
```typescript
// BAD: Only testing happy path
it('should read file', async () => {
  // ... only tests success ❌
});
```

✅ **Test all error scenarios**
```typescript
// GOOD: Test errors too
it('should read file successfully', async () => { /* ... */ });
it('should handle file not found', async () => { /* ... */ });
it('should handle permission denied', async () => { /* ... */ });
```

---

## 5. Testing Database Operations

### When to Use

Testing Drizzle queries, migrations, and database CRUD operations (future - when `src-electron/db/` is implemented).

### Pattern: In-Memory Database Testing

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { products, insertProduct } from './schema';
import { eq } from 'drizzle-orm';

describe('Product Repository', () => {
  let testDb: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    // Create in-memory database
    testDb = new Database(':memory:');
    db = drizzle(testDb);

    // Run migrations
    testDb.exec(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);
  });

  afterEach(() => {
    testDb.close();
  });

  it('should insert and retrieve product', () => {
    const product = { name: 'Widget A', sku: 'WDG-001' };

    const [inserted] = db.insert(products).values(product).returning();

    expect(inserted).toMatchObject({
      id: 1,
      name: 'Widget A',
      sku: 'WDG-001',
    });

    const retrieved = db.select().from(products).where(eq(products.id, 1)).get();

    expect(retrieved).toMatchObject(product);
  });

  it('should enforce unique SKU constraint', () => {
    db.insert(products).values({ name: 'Widget A', sku: 'WDG-001' }).run();

    expect(() => {
      db.insert(products).values({ name: 'Widget B', sku: 'WDG-001' }).run();
    }).toThrow(/UNIQUE constraint failed/);
  });
});
```

### Common Pitfalls

❌ **Using production database**
```typescript
// BAD: Tests modify production data!
const db = new Database('./production.db'); // ❌
```

✅ **Use in-memory database**
```typescript
// GOOD: Isolated test database
const testDb = new Database(':memory:'); // ✅
```

❌ **Not cleaning up between tests**
```typescript
// BAD: Data persists across tests
// No afterEach cleanup ❌
```

✅ **Close database after each test**
```typescript
// GOOD: Clean up
afterEach(() => {
  testDb.close(); // ✅
});
```

---

## 6. E2E Testing with Playwright + Electron

### When to Use

Testing full user flows in the actual Electron application.

### Pattern: Basic E2E Test

```typescript
import { test, expect, _electron as electron, type ElectronApplication } from '@playwright/test';
import path from 'path';

test.describe('Electron App E2E', () => {
  let app: ElectronApplication;

  test.beforeEach(async () => {
    // Launch Electron app
    app = await electron.launch({
      args: [path.join(__dirname, '../../')],
    });
  });

  test.afterEach(async () => {
    // Always close app to prevent memory leaks
    await app.close();
  });

  test('should launch and display welcome screen', async () => {
    const page = await app.firstWindow();

    // Wait for app to load
    await page.waitForLoadState('domcontentloaded');

    // Verify welcome screen is displayed
    await expect(page.locator('h1')).toContainText('ChangeoverOptimizer');
    await expect(page.getByRole('button', { name: /import data/i })).toBeVisible();
  });

  test('should navigate to settings', async () => {
    const page = await app.firstWindow();

    // Click settings button
    await page.getByRole('button', { name: /settings/i }).click();

    // Verify settings screen is displayed
    await expect(page.locator('h2')).toContainText('Settings');
  });

  test('should persist theme selection', async () => {
    const page = await app.firstWindow();

    // Navigate to settings
    await page.getByRole('button', { name: /settings/i }).click();

    // Switch to dark theme
    await page.getByRole('button', { name: /dark/i }).click();

    // Verify dark theme applied
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Close and relaunch app
    await app.close();
    app = await electron.launch({ args: [path.join(__dirname, '../../')] });
    const newPage = await app.firstWindow();

    // Verify theme persisted
    await expect(newPage.locator('html')).toHaveClass(/dark/);
  });
});
```

### Pattern: Testing File Operations

```typescript
test('should import and optimize file', async () => {
  const page = await app.firstWindow();

  // Mock file dialog (requires electron API mocking)
  await page.evaluate(async () => {
    window.electron.invoke = async (channel: string, ...args: any[]) => {
      if (channel === 'dialog:open') {
        return '/path/to/test/data.xlsx';
      }
      if (channel === 'file:read') {
        return [/* mock file buffer */];
      }
      return null;
    };
  });

  // Click import button
  await page.getByRole('button', { name: /import data/i }).click();

  // Verify file is loaded
  await expect(page.locator('h2')).toContainText('Data Preview');
  await expect(page.getByRole('table')).toBeVisible();
});
```

### Common Pitfalls

❌ **Not waiting for app to load**
```typescript
// BAD: No wait
test('should show title', async () => {
  const page = await app.firstWindow();
  await expect(page.locator('h1')).toContainText('Title'); // ❌ Might fail!
});
```

✅ **Wait for load state**
```typescript
// GOOD: Wait for DOM
test('should show title', async () => {
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h1')).toContainText('Title'); // ✅ Reliable
});
```

❌ **Forgetting to close app**
```typescript
// BAD: No cleanup
test('should work', async () => {
  const app = await electron.launch({ args: ['.'] });
  // ... test code
  // ❌ No app.close() - memory leak!
});
```

✅ **Always close in afterEach**
```typescript
// GOOD: Clean up
test.afterEach(async () => {
  await app.close(); // ✅ Prevents leaks
});
```

---

## 7. Performance/Benchmark Testing

### When to Use

Testing algorithm performance with large datasets, ensuring optimization runs within acceptable time limits.

### Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { optimize } from './optimizer';
import { generateOrders } from '../test/fixtures/generate-orders';

describe('Optimizer Performance', () => {
  it('should optimize 1000 orders in <500ms', () => {
    const orders = generateOrders(1000);
    const attributes = [
      { column: 'Color', changeoverTime: 15, parallelGroup: 'default' },
      { column: 'Material', changeoverTime: 10, parallelGroup: 'default' },
    ];

    const startTime = performance.now();
    const result = optimize(orders, attributes);
    const duration = performance.now() - startTime;

    expect(result.sequence).toHaveLength(1000);
    expect(duration).toBeLessThan(500);
  });

  it('should optimize 5000 orders in <3s', () => {
    const orders = generateOrders(5000);
    const attributes = [
      { column: 'Color', changeoverTime: 15, parallelGroup: 'default' },
      { column: 'Size', changeoverTime: 10, parallelGroup: 'default' },
      { column: 'Material', changeoverTime: 20, parallelGroup: 'default' },
    ];

    const startTime = performance.now();
    const result = optimize(orders, attributes);
    const duration = performance.now() - startTime;

    expect(result.sequence).toHaveLength(5000);
    expect(duration).toBeLessThan(3000);
    expect(result.savings).toBeGreaterThan(0);
  });
});
```

### Common Pitfalls

❌ **Testing in debug mode**
```typescript
// BAD: Debug mode is slower
// Running tests with debugger attached ❌
```

✅ **Run in production-like mode**
```typescript
// GOOD: Run without debugger
npm run test:perf -- --run
```

❌ **Flaky tests due to system load**
```typescript
// BAD: Single run, no tolerance
expect(duration).toBeLessThan(500); // ❌ Might fail under load
```

✅ **Add tolerance or run multiple times**
```typescript
// GOOD: Reasonable tolerance
expect(duration).toBeLessThan(600); // ✅ 20% tolerance

// Or average multiple runs
const durations = [];
for (let i = 0; i < 5; i++) {
  const start = performance.now();
  optimize(orders, attributes);
  durations.push(performance.now() - start);
}
const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
expect(avgDuration).toBeLessThan(500);
```

---

## 8. Integration Testing

### When to Use

Testing multi-layer interactions: service + store + IPC workflows.

### Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from '@/stores/data-store';
import { optimize } from '@/services/optimizer';
import { parseFile } from '@/services/parser';
import { mockElectronIPC, resetElectronMocks } from '@/test/setup';

describe('Optimization Flow Integration', () => {
  beforeEach(() => {
    useDataStore.getState().reset();
    resetElectronMocks();
  });

  it('should complete full optimization workflow', async () => {
    // Mock file data
    const mockFileBuffer = new Uint8Array([/* Excel file bytes */]);
    mockElectronIPC('file:read', Array.from(mockFileBuffer));

    // Step 1: Import file
    const store = useDataStore.getState();
    const filePath = '/test/data.xlsx';
    const fileBuffer = await window.electron.invoke('file:read', { path: filePath });
    const parsedData = parseFile(new Uint8Array(fileBuffer));
    store.setSourceFile(parsedData);

    // Step 2: Configure
    store.setOrderIdColumn('Order ID');
    store.addAttribute('Color', 15, 'default');
    store.addAttribute('Size', 10, 'default');

    // Step 3: Extract orders and optimize
    const orders = extractOrders(store.sourceFile!, store.config);
    const result = optimize(orders, store.config.attributes);

    // Step 4: Store result
    store.setResult(result);

    // Verify
    const finalState = useDataStore.getState();
    expect(finalState.result).not.toBeNull();
    expect(finalState.result?.sequence.length).toBeGreaterThan(0);
    expect(finalState.result?.savings).toBeGreaterThan(0);
  });

  it('should handle invalid config gracefully', () => {
    const store = useDataStore.getState();

    // Set up invalid config (no order ID column)
    store.setSourceFile(mockParsedData);
    store.addAttribute('Color', 15, 'default');
    // Note: no setOrderIdColumn() call

    // Attempt to optimize
    expect(() => {
      extractOrders(store.sourceFile!, store.config);
    }).toThrow(/order id column not set/i);
  });
});
```

### Common Pitfalls

❌ **Over-mocking (test becomes meaningless)**
```typescript
// BAD: Mocking everything
vi.mock('@/services/parser');
vi.mock('@/services/optimizer');
vi.mock('@/stores/data-store');
// ... ❌ Not testing real integration!
```

✅ **Mock only external dependencies**
```typescript
// GOOD: Only mock IPC/file system
mockElectronIPC('file:read', mockData);
// Test real parser, optimizer, store ✅
```

❌ **Not testing error propagation**
```typescript
// BAD: Only happy path
it('should optimize', () => {
  // ... only tests success ❌
});
```

✅ **Test error flows**
```typescript
// GOOD: Test error handling
it('should handle parse errors', () => {
  mockElectronIPC('file:read', invalidData);
  expect(() => parseFile(invalidData)).toThrow();
});

it('should handle optimizer errors', () => {
  expect(() => optimize([], [])).toThrow(/no orders/i);
});
```

---

## Summary

These 8 patterns cover all testing scenarios in ChangeoverOptimizer:

1. **Electron IPC Mocking** - Frontend ↔ Backend communication
2. **React Components** - UI rendering and interactions
3. **Zustand Stores** - State management
4. **Backend IPC Handlers** - Electron backend operations
5. **Database Operations** - Data persistence (future)
6. **E2E with Playwright** - Full user journeys
7. **Performance Testing** - Algorithm optimization
8. **Integration Testing** - Multi-layer workflows

**Next Steps:**
- See [TESTING_EXAMPLES.md](./TESTING_EXAMPLES.md) for complete copy-paste templates
- See [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) for coverage targets and workflow

**Last Updated:** 2025-12-23
