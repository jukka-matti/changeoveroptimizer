# ChangeoverOptimizer

Production changeover sequence optimization for SME manufacturers.

## Quick Context

**What:** Desktop app that imports production orders, optimizes their sequence to minimize changeover time, and exports the result.

**Who:** Production planners at SME manufacturers (10-500 employees) who currently use Excel.

**Why:** Every changeover (color, size, material change) costs time. Smart sequencing reduces total changeover time by 20-40%.

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Electron | 39.x |
| Backend | Node.js + TypeScript | 5.x |
| UI | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui | Latest |
| State | Zustand | 5.x |
| Build | Vite | 6.x |
| File Parsing | SheetJS (xlsx) | Latest |
| Payments | Paddle | API v2 |
| Icons | Lucide React | Latest |

**Why Electron:** Mature ecosystem, excellent tooling, bundled Chromium ensures consistency across platforms, extensive community support, and seamless Node.js integration for backend operations.

## Project Structure

```
changeoveroptimizer/
├── src/                      # React frontend
│   ├── App.tsx
│   ├── components/           # UI components
│   │   ├── ui/               # shadcn/ui primitives
│   │   └── features/         # Feature-specific
│   ├── screens/              # Page-level components
│   ├── stores/               # Zustand stores
│   ├── services/             # Business logic
│   │   ├── parser.ts         # Excel/CSV parsing
│   │   ├── optimizer.ts      # Core algorithm
│   │   └── exporter.ts       # Export generation
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities
│   └── i18n/                 # Translations
├── src-electron/             # TypeScript backend (main process)
│   ├── main.ts               # Electron entry point
│   ├── preload.ts            # Security bridge (contextBridge)
│   ├── ipc-handlers.ts       # IPC command handlers
│   ├── storage.ts            # Template storage
│   ├── window-state.ts       # Window persistence
│   └── types.ts              # TypeScript interfaces
├── forge.config.ts           # Electron Forge config
├── tsconfig.electron.json    # TypeScript config
├── vite.main.config.ts       # Vite config for main
├── vite.preload.config.ts    # Vite config for preload
├── docs/                     # Detailed specs
└── public/                   # Static assets
```

## Core Data Flow

```
Excel/CSV → Parser → Zustand Store → Optimizer → Results → Exporter → Excel/CSV/PDF
```

## Key Types

```typescript
// Core domain types
interface Order {
  id: string;
  originalIndex: number;
  values: Record<string, string>;  // e.g., { Color: "Red", Size: "Large" }
}

interface AttributeConfig {
  column: string;          // Column name
  changeoverTime: number;  // Minutes
  parallelGroup: string;   // "default", "A", "B", "C", "D" - for parallel changeovers
}

interface OptimizedOrder extends Order {
  sequenceNumber: number;
  changeoverTime: number;     // Legacy: same as workTime
  changeoverReasons: string[];
  workTime: number;           // Sum of all changeover times (labor cost)
  downtime: number;           // Max per parallel group, sum across groups (production impact)
}

interface OptimizationResult {
  sequence: OptimizedOrder[];
  // Work time metrics (labor cost)
  totalBefore: number;
  totalAfter: number;
  savings: number;
  savingsPercent: number;
  // Downtime metrics (production impact)
  totalDowntimeBefore: number;
  totalDowntimeAfter: number;
  downtimeSavings: number;
  downtimeSavingsPercent: number;
  attributeStats: AttributeStat[];
}

interface AttributeStat {
  column: string;
  changeoverCount: number;
  totalTime: number;
  parallelGroup: string;
}

// License tiers
type LicenseTier = 'free' | 'pro';

// Free: 50 orders, 3 attributes
// Pro: Unlimited
```

## Algorithm Summary

**Hierarchical Greedy with Refinement:**

1. Sort attributes by user-defined priority order
2. Group orders by primary attribute value
3. Within groups, sub-group by secondary attribute
4. Recurse for all attributes
5. Flatten groups into sequence
6. Apply 2-opt refinement (swap adjacent pairs if downtime decreases)
7. Calculate dual metrics: work time and downtime

**Parallel Groups & Dual Metrics:**

- **Work Time** = sum of all changeover times (total labor cost)
- **Downtime** = max within each parallel group, sum across groups (production impact)

Attributes in the same parallel group can be changed simultaneously (e.g., by different crews). The optimizer minimizes **downtime** (production impact).

```
Example: Group A: Color (15 min), Finish (10 min) | Group B: Material (20 min)
If all change: Work = 45 min, Downtime = max(15,10) + 20 = 35 min
```

Complexity: O(n log n) average, handles 10,000+ orders.

## Screen Flow

```
Welcome → Data Preview → Column Mapping → Changeover Config → Optimizing → Results → Export
                                                                              ↓
                                                                          Settings
```

## Coding Standards

### TypeScript

- Strict mode enabled
- Explicit return types on functions
- Use `interface` for object types, `type` for unions/primitives
- Prefer `const` assertions for immutable data

### React

- Functional components only
- Use `useCallback` and `useMemo` for expensive operations
- Keep components small (<200 lines)
- Co-locate styles with components

### Naming

- Components: `PascalCase` (e.g., `DataPreview.tsx`)
- Utilities: `camelCase` (e.g., `formatTime.ts`)
- Types/Interfaces: `PascalCase` (e.g., `Order`, `AttributeConfig`)
- Constants: `SCREAMING_SNAKE_CASE`
- Files match export name

### State Management

- Zustand for global state
- React state for component-local state
- No Redux, no Context for global state

### Error Handling

- All async operations must have try/catch
- User-facing errors must be localized
- Log errors to console in dev, suppress in prod
- Never expose stack traces to users

## DO NOT

- ❌ Add new npm dependencies without explicit approval
- ❌ Use `any` type (use `unknown` if needed)
- ❌ Use class components
- ❌ Store user production data on any server
- ❌ Make network calls except for license verification
- ❌ Use inline styles (use Tailwind)
- ❌ Break existing tests
- ❌ Change the optimization algorithm without discussion
- ❌ Add features not in PRD.md

## Testing

```bash
npm run test        # Unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```

Test files: `*.test.ts` or `*.spec.ts` next to source files.

## Build Commands

```bash
npm run dev            # Start frontend in browser (shimmed Electron APIs)
npm run electron:dev   # Start Electron in development (native APIs)
npm run build          # Build production frontend
npm run electron:build # Create installers (.exe, .dmg, .deb)
npm run lint           # ESLint
npm run typecheck      # TypeScript check
```

## Business Rules

| Rule | Value |
|------|-------|
| Free tier orders | 50 |
| Free tier attributes | 3 |
| Pro Monthly | €19 |
| Pro Annual | €149 (35% discount) |
| License validation | Once per day when online |
| Offline grace | 30 days |

## Documentation

Detailed specs in `/docs`:
- `PRD.md` — Product requirements
- `ARCHITECTURE.md` — Full architecture (from TD-01)
- `ALGORITHM.md` — Optimization details (from TD-02)
- `DATA_MODEL.md` — Storage and state (from TD-03)
- `UI_COMPONENTS.md` — Component library (from TD-04)
- `LICENSING.md` — Paddle integration (from TD-05)
- `PHASES.md` — Development roadmap (from TD-07)

## Common Tasks

### Add a new screen

1. Create component in `src/screens/`
2. Add route in `App.tsx`
3. Add navigation in store if needed
4. Add translations in `i18n/en.json`

### Add a new UI component

1. Use shadcn/ui if available: `npx shadcn-ui add <component>`
2. Otherwise create in `src/components/ui/`
3. Follow existing patterns

### Add an Electron IPC handler (backend)

1. Add handler in `src-electron/ipc-handlers.ts`
2. Register in `main.ts` via `ipcMain.handle()`
3. Add channel to preload whitelist in `preload.ts`
4. Call from frontend via `window.electron.invoke()`

### Modify the optimizer

1. Read TD-02 first
2. Write tests before changing
3. Benchmark with 1000+ orders
4. Document changes

## Contact

Built by RDMAIC Oy (Finland) — Lean Six Sigma consulting.
