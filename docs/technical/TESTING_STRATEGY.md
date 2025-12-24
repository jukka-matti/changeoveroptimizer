# Testing Strategy

Comprehensive testing approach for ChangeoverOptimizer Electron application.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Coverage Targets](#coverage-targets)
- [Test Organization](#test-organization)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Testing Checklist](#testing-checklist)
- [Troubleshooting](#troubleshooting)

---

## Testing Philosophy

### Why We Test

- **Confidence**: Tests give us confidence that code works as expected
- **Refactoring Safety**: Change code fearlessly knowing tests will catch regressions
- **Documentation**: Tests serve as executable documentation of how code should work
- **Quality**: Prevent bugs from reaching production

### What We Test

- **Business Logic**: Core optimizer algorithm, parser, exporter (services/)
- **State Management**: Zustand stores (stores/)
- **UI Components**: React screens and components (screens/, components/)
- **Backend Operations**: Electron IPC handlers, file operations, storage (src-electron/)
- **Integration Flows**: Multi-layer interactions (file import → parse → optimize → export)
- **End-to-End**: Critical user journeys in actual Electron app

### What We Don't Test

- **Third-party libraries**: Trust shadcn/ui, Recharts, etc. Don't test their internals
- **Trivial code**: Simple getters/setters, type definitions
- **Implementation details**: Test behavior, not how it's implemented
- **Visual appearance**: Avoid snapshot tests for styling (too brittle)

---

## Coverage Targets

### Overall Target: 75% code coverage

**By Layer:**

| Layer | Target | Priority | Rationale |
|-------|--------|----------|-----------|
| **Services** (src/services/) | 90% | Critical | Core business logic, high value |
| **Stores** (src/stores/) | 85% | Critical | State management is critical for app |
| **Backend** (src-electron/) | 80% | High | IPC handlers, file operations |
| **Screens** (src/screens/) | 70% | Medium | User-facing screens |
| **Components** (src/components/features/) | 70% | Medium | Feature-specific components |
| **UI Primitives** (src/components/ui/) | 50% | Low | Mostly shadcn/ui, lower priority |
| **Integration** | 80% | High | Multi-layer workflows |
| **E2E** | Flow coverage | Critical | User journey coverage (not code %) |

### Coverage Metrics

- **Lines**: 75% - Minimum code executed
- **Functions**: 75% - Every function tested at least once
- **Branches**: 70% - if/else paths covered
- **Statements**: 75% - Each statement executed

### Incremental Improvement

- **Current**: ~13% (7 test files for 60+ source files)
- **Week 1**: 60% (foundation + backend + component tests)
- **Week 2**: 65% (integration tests)
- **Week 3**: 70% (E2E tests)
- **Week 4+**: 75%+ (coverage improvement)
- **Long-term**: 85%+ (increase thresholds by 5% each sprint)

---

## Test Organization

### File Naming Conventions

```
src/
├── services/
│   ├── optimizer.ts
│   └── optimizer.test.ts      # Unit test next to source
├── screens/
│   ├── WelcomeScreen.tsx
│   └── WelcomeScreen.test.tsx # Component test next to source
└── test/
    ├── setup.ts               # Global test setup
    ├── integration/           # Integration tests
    │   └── optimization-flow.test.ts
    └── fixtures/              # Mock data (if needed)

tests/
└── e2e/                       # E2E tests (separate from unit tests)
    └── full-optimization-flow.spec.ts

src-electron/
├── ipc-handlers.ts
└── ipc-handlers.test.ts       # Backend test next to source
```

### Test File Extensions

- **Unit/Component tests**: `*.test.ts` or `*.test.tsx`
- **Integration tests**: `*.test.ts` (in src/test/integration/)
- **E2E tests**: `*.spec.ts` (in tests/e2e/)

### Directory Structure

- **Unit tests**: Co-located with source files (same directory)
- **Integration tests**: `src/test/integration/`
- **E2E tests**: `tests/e2e/`
- **Test utilities**: `src/test/setup.ts`, `src/test/fixtures/` (if needed)

---

## Running Tests

### Quick Reference

```bash
# Run all unit & integration tests (watch mode)
npm run test

# Run all tests once (CI mode)
npm run test run

# Run specific test file
npm run test src/services/optimizer.test.ts

# Run tests matching pattern
npm run test optimizer

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode (interactive debugging)
npm run test:e2e:ui

# Run E2E tests for specific file
npm run test:e2e tests/e2e/full-optimization-flow.spec.ts

# Lint
npm run lint

# Type check
npm run typecheck
```

### Watch Mode (Development)

```bash
npm run test
```

- Tests automatically re-run when files change
- Fast feedback loop
- Press `p` to filter by filename
- Press `t` to filter by test name
- Press `q` to quit

### Coverage Reports

```bash
npm run test:coverage
```

**Outputs:**
- Terminal: Text summary of coverage %
- Browser: `coverage/index.html` - detailed HTML report
- CI: `coverage/lcov.info` - for Codecov/Coveralls

**How to read coverage report:**
1. Open `coverage/index.html` in browser
2. Click on directories/files to drill down
3. Red lines: not covered
4. Green lines: covered
5. Yellow lines: partially covered (e.g., only one branch of if/else)

### Debugging Tests

**VSCode/Cursor:**
1. Add breakpoint in test file
2. Click "Debug" above test (Vitest extension)
3. Step through code

**Chrome DevTools (E2E):**
```bash
npm run test:e2e:ui
```
- Opens Playwright UI
- Click test to run
- View screenshots, traces, videos
- Time-travel debugging

**Console Logs:**
```typescript
it('should do something', () => {
  console.log('Debug info:', someValue);
  expect(someValue).toBe(expected);
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/ci.yml`

**Jobs:**
1. **test-unit** (ubuntu-latest)
   - Run unit & integration tests with coverage
   - Upload coverage to Codecov
   - Run lint & typecheck

2. **test-e2e** (ubuntu, windows, macos)
   - Run E2E tests on all platforms
   - Upload artifacts on failure (screenshots, traces)

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

### Pre-commit Hooks (Future)

**Using Husky + lint-staged:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ]
  }
}
```

- Run tests only for changed files (fast)
- Auto-fix linting issues
- Prevent broken commits

**Note**: Don't require ALL tests to pass pre-commit (too slow), only related tests.

### Coverage Enforcement

**vite.config.ts thresholds:**
```typescript
thresholds: {
  lines: 75,
  functions: 75,
  branches: 70,
  statements: 75,
}
```

- CI fails if coverage drops below thresholds
- Encourages maintaining/improving coverage
- Can be adjusted incrementally (e.g., 75% → 80% → 85%)

---

## Testing Checklist

### For New Features

When adding a new feature, ensure:

- [ ] **Unit tests** for business logic (services, utilities)
  - Test happy path
  - Test edge cases (empty data, null values, invalid input)
  - Test error handling

- [ ] **Component tests** for UI (if adding screens/components)
  - Test rendering
  - Test user interactions (clicks, form inputs)
  - Test conditional rendering (loading, error, empty states)
  - Test Zustand store integration
  - Test Electron IPC calls (if applicable)

- [ ] **Integration tests** (if feature spans multiple layers)
  - Test service + store + IPC workflow
  - Test data flow through layers

- [ ] **E2E tests** (if feature affects critical user flows)
  - Test end-to-end user journey
  - Test cross-screen navigation

- [ ] **Coverage** maintained or improved
  - Run `npm run test:coverage`
  - Verify coverage % didn't drop

### For Bug Fixes

- [ ] **Write failing test** that reproduces the bug
- [ ] **Fix the bug**
- [ ] **Verify test passes**
- [ ] **Add edge case tests** to prevent similar bugs

### Before Merging PR

- [ ] All tests pass locally: `npm run test run`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] Lint passes: `npm run lint`
- [ ] Type check passes: `npm run typecheck`
- [ ] Coverage maintained: `npm run test:coverage`
- [ ] CI/CD workflow passes

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@/...'"

**Problem**: Module alias not working in tests.

**Solution**: Ensure `vite.config.ts` has alias:
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
},
```

#### 2. "window.electron is not defined"

**Problem**: Electron IPC mock not set up.

**Solution**: Import mock helpers in test:
```typescript
import { mockElectronIPC, resetElectronMocks } from '@/test/setup';

beforeEach(() => {
  resetElectronMocks();
});
```

#### 3. "ReferenceError: global is not defined"

**Problem**: Node.js global not available in jsdom environment.

**Solution**: Already fixed in `src/test/setup.ts`:
```typescript
global.window = Object.create(window);
```

#### 4. "Store state bleeding between tests"

**Problem**: Zustand store not reset between tests.

**Solution**: Reset store in `beforeEach`:
```typescript
import { useDataStore } from '@/stores/data-store';

beforeEach(() => {
  useDataStore.getState().reset();
});
```

#### 5. "Coverage thresholds not met"

**Problem**: CI fails due to coverage drop.

**Solution**:
- Run `npm run test:coverage` locally
- Open `coverage/index.html` to see what's missing
- Add tests for uncovered files
- Or adjust thresholds in `vite.config.ts` (if justified)

#### 6. "Playwright test timeout"

**Problem**: E2E test times out waiting for element.

**Solution**:
- Increase timeout: `test.setTimeout(60000);`
- Use proper waits: `await expect(page.locator('h2')).toBeVisible();`
- Avoid hard-coded delays: `await page.waitForTimeout(1000);` ❌

#### 7. "Module mock not working"

**Problem**: `vi.mock()` not mocking module.

**Solution**:
- Ensure mock is at top of file (before imports)
- Use factory function: `vi.mock('module', () => ({ ... }))`
- For ES modules, use `vi.mocked()` to type mocks

---

## Quick Start Guide

### Write Your First Test (5 minutes)

**1. Create test file next to source:**
```bash
# If you have: src/services/myService.ts
# Create: src/services/myService.test.ts
```

**2. Write a simple test:**
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myService';

describe('myService', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

**3. Run the test:**
```bash
npm run test myService
```

**4. See it pass!** ✅

**Next steps:**
- See [TESTING_PATTERNS.md](./TESTING_PATTERNS.md) for detailed patterns
- See [TESTING_EXAMPLES.md](./TESTING_EXAMPLES.md) for copy-paste templates
- Add more test cases (edge cases, error handling)

---

## Related Documentation

- **[TESTING_PATTERNS.md](./TESTING_PATTERNS.md)** - Detailed testing patterns with code examples
- **[TESTING_EXAMPLES.md](./TESTING_EXAMPLES.md)** - Copy-paste templates for common scenarios
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture (useful for integration tests)
- **[DATA_MODEL.md](./DATA_MODEL.md)** - Data structures (useful for mock data)

---

## Coverage Dashboard

**Current Coverage:** (Run `npm run test:coverage` to generate)

| Metric | Current | Target |
|--------|---------|--------|
| Lines | TBD | 75% |
| Functions | TBD | 75% |
| Branches | TBD | 70% |
| Statements | TBD | 75% |

**Coverage Badge:** (Add to README.md)

```markdown
[![codecov](https://codecov.io/gh/username/changeoveroptimizer/branch/main/graph/badge.svg)](https://codecov.io/gh/username/changeoveroptimizer)
```

**Last Updated:** 2025-12-23
