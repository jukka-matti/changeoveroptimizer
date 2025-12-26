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
| Database | SQLite (better-sqlite3) | 11.x |
| ORM | Drizzle | 0.35.x |
| Validation | Zod | 3.x |
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
│   │   ├── ui/               # shadcn/ui + custom (Logo, DurationInput, MetricCard, etc.)
│   │   ├── layout/           # Layout (Sidebar, Header, Footer, ScreenContainer)
│   │   ├── smed/             # SMED-specific (NewStudyDialog, etc.)
│   │   └── features/         # Feature-specific (LicenseSection)
│   ├── screens/              # Page-level components
│   ├── stores/               # Zustand stores
│   │   └── utils/            # Store utilities (async-action.ts)
│   ├── services/             # Business logic
│   │   ├── parser.ts         # Excel/CSV parsing
│   │   ├── optimizer.ts      # Core algorithm
│   │   ├── exporter.ts       # Export generation
│   │   └── pdf/              # PDF generation (config.ts)
│   ├── hooks/                # Custom React hooks (useKeyboardEvent, etc.)
│   ├── lib/                  # Utilities (electron-ipc.ts, parallel-groups.ts, timer-utils.ts)
│   ├── types/                # TypeScript types (base.ts, smed.ts, etc.)
│   └── i18n/                 # Translations
├── src-electron/             # TypeScript backend (main process)
│   ├── main.ts               # Electron entry point
│   ├── preload.ts            # Security bridge (contextBridge)
│   ├── ipc-handlers.ts       # Legacy IPC handlers
│   ├── ipc/                  # Modular IPC system
│   │   ├── registry.ts       # Handler registration utilities
│   │   └── handlers/         # Domain-specific handlers
│   │       ├── files.ts      # File operations
│   │       ├── smed.ts       # SMED operations
│   │       ├── analytics.ts  # Analytics operations
│   │       └── changeovers.ts # Changeover matrix operations
│   ├── db/                   # Database layer (SQLite + Drizzle)
│   │   ├── index.ts          # DB connection & initialization
│   │   ├── schema/           # Drizzle schema definitions
│   │   ├── queries/          # Query functions
│   │   ├── utils.ts          # DB utilities (groupByMonth, etc.)
│   │   └── migrations/       # Schema migrations
│   ├── storage.ts            # Settings (electron-store)
│   └── window-state.ts       # Window persistence
├── forge.config.ts           # Electron Forge config
├── docs/                     # Detailed specs
└── public/                   # Static assets
```

## Core Data Flow

```
Excel/CSV → Parser → SQLite/Zustand → Optimizer → SQLite → Exporter → Excel/CSV/PDF
```

**SQLite** stores persistent data (products, orders, schedules, SMED studies)
**Zustand** manages runtime UI state (current screen, loading status)

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

// SMED Module types (Phase 2)
interface Study {
  id: string;
  name: string;
  fromProductId: string;
  toProductId: string;
  status: 'draft' | 'analyzing' | 'improving' | 'standardized';
  baselineMinutes: number;
  targetMinutes: number;
  currentMinutes: number;
}

interface Step {
  id: string;
  studyId: string;
  sequenceNumber: number;
  description: string;
  durationSeconds: number;
  category: 'preparation' | 'removal' | 'installation' | 'adjustment' | 'cleanup';
  operationType: 'internal' | 'external';  // Internal = machine stopped
}

interface Improvement {
  id: string;
  studyId: string;
  description: string;
  improvementType: 'convert_to_external' | 'streamline_internal' | 'parallelize' | 'eliminate';
  status: 'idea' | 'planned' | 'in_progress' | 'implemented' | 'verified';
  estimatedSavingsSeconds: number;
  actualSavingsSeconds: number;
}
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

## Application Layout

The app uses **sidebar navigation** (enterprise-grade, like SAP/Siemens industrial software):

```
┌──────────┬─────────────────────────────────────────────────────────────────┐
│   [CO]   │ Header: ChangeoverOptimizer                             [Info]  │
│ Optimizer├─────────────────────────────────────────────────────────────────┤
│          │ Progress Stepper (only during workflow)                         │
│  ○ Home  ├─────────────────────────────────────────────────────────────────┤
│  ● Optim │                                                                 │
│  ○ SMED  │  Main Content: Welcome | Workflow (5 steps) | Modules          │
│  ○ Stats │                                                                 │
├──────────┤                                                                 │
│  ⚙ Set   │  Footer                                                         │
└──────────┴─────────────────────────────────────────────────────────────────┘
```

**Sidebar Navigation:**
- Home → Welcome screen
- Optimizer → 5-step workflow (Data Preview → Column Mapping → Config → Results → Export)
- SMED → SMED studies module
- Analytics → Analytics dashboard
- Settings → App settings + Changeover Times

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

## Browser Testing (npm run dev)

For rapid UI development and testing, use browser mode. This runs the React frontend without Electron, using shimmed APIs.

### Quick Test Flow

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173 in your browser

3. On the Welcome screen, click **"Load Example Schedule"** to use sample data

4. Follow the optimization flow:
   - Data Preview → Next
   - Column Mapping → Select attributes (Color, Size, Material) → Next
   - Configure Changeovers → Set times (e.g., Color: 15 min, Size: 10 min) → Run Optimization
   - Results → View savings → Export

5. Export downloads via browser (file appears in Downloads folder)

### What's Shimmed in Browser Mode

The following features require Electron and are mocked in browser mode:
- **Templates**: Save/load returns empty, no persistence
- **SMED Module**: All database operations return empty arrays
- **Analytics**: No data stored or retrieved
- **Changeover Matrix**: Lookups return empty
- **Settings persistence**: Not saved between sessions

Console shows `[Electron Shim]` messages for shimmed API calls - these are expected.

### Full Electron Testing

For complete feature testing including database persistence:
```bash
npm run electron:dev
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

Technical docs in `/docs/technical/`:
- `ARCHITECTURE.md` — Electron 39.x + React + SQLite architecture
- `DATA_MODEL.md` — Database schema & state management
- `ALGORITHM.md` — Optimization algorithm details
- `SMED_MODULE.md` — Phase 2 feature spec (changeover improvement)
- `UI_COMPONENTS.md` — Component library
- `DESIGN_SYSTEM.md` — Colors, typography, spacing
- `LICENSING.md` — Paddle integration
- `BUILD.md` — Build & distribution

Product docs in `/docs/product/`:
- `PHASES.md` — MVP → SMED → Course roadmap

Setup guides in `/docs/guides/`:
- (Coming: ELECTRON_SETUP.md)

Root docs:
- `PRD.md` — Product requirements

Business materials:
- `/marketing` — Website copy, launch plan
- `/course` — Practitioner course materials

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

**Using the modular system (recommended):**
1. Add handler in appropriate `src-electron/ipc/handlers/*.ts` file
2. Use `registerHandler()` from registry.ts
3. Add channel to preload whitelist in `preload.ts`
4. Add typed wrapper in `src/lib/electron-ipc.ts`
5. Call from frontend via typed wrapper (e.g., `smedIpc.getStudy(id)`)

**Legacy approach (for quick additions):**
1. Add handler in `src-electron/ipc-handlers.ts`
2. Register in `main.ts` via `ipcMain.handle()`
3. Add channel to preload whitelist in `preload.ts`
4. Call from frontend via `window.electron.invoke()`

### Work with the database

Database auto-initializes on first app run.
- **Location**: `userData/changeoveroptimizer.db`
- **Schema**: See DATA_MODEL.md for complete schema
- **Migrations**: Auto-run on startup via `initDatabase()`
- **ORM**: Use Drizzle for type-safe queries
- **Backup**: Database is a single file, easy to copy

### Modify the optimizer

1. Read TD-02 first
2. Write tests before changing
3. Benchmark with 1000+ orders
4. Document changes

## Reusable Components & Utilities

### UI Components (`src/components/ui/`)
- `DurationInput` - Time input with minutes/seconds fields
- `MetricCard` - Stats display with variants (default, success, warning)
- `UnderlineTabs` - Tab navigation with underline style
- `FormDialog` - Modal dialog with form handling via `useFormDialog()`
- `FirstTimeHint` - Dismissible first-time user hints with localStorage persistence

### Hooks (`src/hooks/`)
- `useKeyboardEvent` - Unified keyboard shortcut handling
- `useFileImport` - File import with drag-and-drop support
- `useFirstTimeHint` - First-time hint state management (localStorage-backed)

### Utilities (`src/lib/`)
- `electron-ipc.ts` - Type-safe IPC wrappers (smedIpc, analyticsIpc, filesIpc)
- `parallel-groups.ts` - Parallel group colors and border utilities
- `timer-utils.ts` - Time formatting (formatTime, secondsToMinSec, etc.)

### Store Utilities (`src/stores/utils/`)
- `async-action.ts` - createAsyncAction() for consistent async state handling

### Types (`src/types/`)
- `base.ts` - BaseEntity, AsyncState<T>, FormData<T>

## Contact

Built by RDMAIC Oy (Finland) — Lean Six Sigma consulting.
