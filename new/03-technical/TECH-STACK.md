# ChangeOverOptimizer Tech Stack

## Overview

ChangeOverOptimizer is built with Electron for cross-platform desktop distribution, React for the UI, and SQLite for local data storage.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         ARCHITECTURE OVERVIEW                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          ELECTRON                                    │   │
│  │                                                                      │   │
│  │   ┌─────────────────────┐         ┌─────────────────────┐          │   │
│  │   │    MAIN PROCESS     │         │   RENDERER PROCESS   │          │   │
│  │   │    (Node.js)        │         │   (Chromium)         │          │   │
│  │   │                     │         │                      │          │   │
│  │   │  • File system      │   IPC   │  • React UI          │          │   │
│  │   │  • SQLite database  │◄───────▶│  • State management  │          │   │
│  │   │  • Native dialogs   │         │  • User interactions │          │   │
│  │   │  • Auto-updates     │         │  • Charts/visuals    │          │   │
│  │   │  • System tray      │         │                      │          │   │
│  │   │                     │         │                      │          │   │
│  │   └─────────────────────┘         └─────────────────────┘          │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          DATA LAYER                                  │   │
│  │                                                                      │   │
│  │   ┌─────────────────────┐         ┌─────────────────────┐          │   │
│  │   │      SQLite         │         │    File System       │          │   │
│  │   │   (better-sqlite3)  │         │                      │          │   │
│  │   │                     │         │  • Excel imports     │          │   │
│  │   │  • Products         │         │  • Excel exports     │          │   │
│  │   │  • Orders           │         │  • PDF reports       │          │   │
│  │   │  • Changeovers      │         │  • Backup files      │          │   │
│  │   │  • SMED studies     │         │                      │          │   │
│  │   │  • Standards        │         │                      │          │   │
│  │   │                     │         │                      │          │   │
│  │   └─────────────────────┘         └─────────────────────┘          │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Choices

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Electron** | 33.x | Cross-platform desktop framework |
| **Node.js** | 20.x LTS | Backend runtime |
| **React** | 19.x | UI framework |
| **TypeScript** | 5.x | Type safety |

### Why Electron?

| Benefit | Details |
|---------|---------|
| **Cross-platform** | Single codebase for Windows & Mac |
| **Web technologies** | Use React, TypeScript, CSS |
| **Node.js access** | Full file system, native modules |
| **Mature ecosystem** | Electron Forge, electron-builder |
| **Easy testing** | Playwright has first-class support |
| **Debugging** | Chrome DevTools built-in |
| **Consistent rendering** | Ships Chromium, identical on all platforms |

### UI Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.x | Utility-first styling |
| **shadcn/ui** | Latest | Pre-built accessible components |
| **Lucide React** | Latest | Icons |
| **Recharts** | 2.x | Charts and visualizations |

### Data Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **better-sqlite3** | 11.x | SQLite bindings (sync, fast) |
| **drizzle-orm** | 0.35.x | Type-safe ORM |
| **zod** | 3.x | Runtime validation |

### Why SQLite + better-sqlite3?

| Benefit | Details |
|---------|---------|
| **No server needed** | Runs entirely local |
| **Fast** | Synchronous API, no async overhead |
| **Reliable** | Battle-tested, ACID compliant |
| **Portable** | Single file, easy backup |
| **Type-safe** | Drizzle provides TypeScript types |

### Build & Tooling

| Technology | Version | Purpose |
|------------|---------|---------|
| **Electron Forge** | 7.x | Build, package, publish |
| **Vite** | 5.x | Fast dev server & bundler |
| **Playwright** | 1.x | E2E testing |
| **Vitest** | 2.x | Unit testing |
| **ESLint** | 9.x | Linting |
| **Prettier** | 3.x | Code formatting |

### External Services

| Service | Purpose | Cost |
|---------|---------|------|
| **Paddle** | Payments & licensing | 5% + €0.50/transaction |
| **Sentry** | Error tracking | Free tier / €26/mo |
| **GitHub** | Source control & CI | Free |
| **electron-updater** | Auto-updates | Free (self-hosted) |

---

## Project Structure

```
changeoveroptimizer/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── forge.config.ts               # Electron Forge config
├── drizzle.config.ts             # Database config
│
├── src/
│   │
│   ├── main/                     # MAIN PROCESS (Node.js)
│   │   ├── index.ts              # Entry point
│   │   ├── window.ts             # Window management
│   │   ├── menu.ts               # Application menu
│   │   ├── ipc/                  # IPC handlers
│   │   │   ├── index.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── changeovers.ts
│   │   │   ├── smed.ts
│   │   │   └── files.ts
│   │   ├── db/                   # Database
│   │   │   ├── index.ts          # Connection
│   │   │   ├── schema.ts         # Drizzle schema
│   │   │   └── migrations/
│   │   ├── services/             # Business logic
│   │   │   ├── optimizer.ts      # Sequence algorithm
│   │   │   ├── excel.ts          # Import/export
│   │   │   └── pdf.ts            # Report generation
│   │   └── utils/
│   │       ├── paths.ts          # App paths
│   │       └── license.ts        # Paddle integration
│   │
│   ├── renderer/                 # RENDERER PROCESS (React)
│   │   ├── index.html
│   │   ├── main.tsx              # React entry
│   │   ├── App.tsx               # Root component
│   │   ├── components/           # Reusable components
│   │   │   ├── ui/               # shadcn components
│   │   │   ├── Layout/
│   │   │   ├── DataTable/
│   │   │   ├── Charts/
│   │   │   └── Timer/
│   │   ├── features/             # Feature modules
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── sequence/
│   │   │   ├── smed/
│   │   │   │   ├── Studies/
│   │   │   │   ├── Steps/
│   │   │   │   ├── Improvements/
│   │   │   │   ├── Standards/
│   │   │   │   └── Timer/
│   │   │   └── settings/
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useProducts.ts
│   │   │   ├── useOrders.ts
│   │   │   ├── useSMED.ts
│   │   │   └── useIPC.ts
│   │   ├── stores/               # State management
│   │   │   └── appStore.ts       # Zustand store
│   │   ├── lib/                  # Utilities
│   │   │   ├── ipc.ts            # IPC client
│   │   │   └── utils.ts
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── shared/                   # SHARED (both processes)
│   │   ├── types/                # TypeScript types
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   ├── changeover.ts
│   │   │   ├── smed.ts
│   │   │   └── ipc.ts
│   │   └── constants/
│   │       └── channels.ts       # IPC channel names
│   │
│   └── preload/                  # PRELOAD SCRIPT
│       └── index.ts              # Expose IPC to renderer
│
├── tests/
│   ├── e2e/                      # Playwright tests
│   └── unit/                     # Vitest tests
│
├── resources/                    # Static assets
│   ├── icon.png
│   ├── icon.ico
│   └── icon.icns
│
└── out/                          # Build output
    ├── make/                     # Installers
    └── publish/                  # Release files
```

---

## IPC Communication

### Pattern

```typescript
// shared/constants/channels.ts
export const IPC_CHANNELS = {
  // Products
  PRODUCTS_GET_ALL: 'products:getAll',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  
  // SMED
  SMED_STUDIES_GET_ALL: 'smed:studies:getAll',
  SMED_STUDIES_CREATE: 'smed:studies:create',
  SMED_STEPS_GET: 'smed:steps:get',
  SMED_TIMER_START: 'smed:timer:start',
  SMED_TIMER_STOP: 'smed:timer:stop',
  
  // Files
  FILES_IMPORT_EXCEL: 'files:importExcel',
  FILES_EXPORT_EXCEL: 'files:exportExcel',
  FILES_EXPORT_PDF: 'files:exportPdf',
} as const;
```

```typescript
// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/channels';

contextBridge.exposeInMainWorld('api', {
  // Products
  products: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_GET_ALL),
    create: (data: CreateProductDTO) => 
      ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_CREATE, data),
    update: (id: string, data: UpdateProductDTO) => 
      ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_UPDATE, id, data),
    delete: (id: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_DELETE, id),
  },
  
  // SMED
  smed: {
    studies: {
      getAll: () => ipcRenderer.invoke(IPC_CHANNELS.SMED_STUDIES_GET_ALL),
      create: (data: CreateStudyDTO) => 
        ipcRenderer.invoke(IPC_CHANNELS.SMED_STUDIES_CREATE, data),
    },
    timer: {
      start: (studyId: string) => 
        ipcRenderer.invoke(IPC_CHANNELS.SMED_TIMER_START, studyId),
      stop: () => 
        ipcRenderer.invoke(IPC_CHANNELS.SMED_TIMER_STOP),
    },
  },
  
  // Files
  files: {
    importExcel: () => ipcRenderer.invoke(IPC_CHANNELS.FILES_IMPORT_EXCEL),
    exportExcel: (data: ExportData) => 
      ipcRenderer.invoke(IPC_CHANNELS.FILES_EXPORT_EXCEL, data),
  },
});
```

```typescript
// main/ipc/products.ts
import { ipcMain } from 'electron';
import { db } from '../db';
import { products } from '../db/schema';
import { IPC_CHANNELS } from '../../shared/constants/channels';

export function registerProductHandlers() {
  ipcMain.handle(IPC_CHANNELS.PRODUCTS_GET_ALL, async () => {
    return db.select().from(products).all();
  });

  ipcMain.handle(IPC_CHANNELS.PRODUCTS_CREATE, async (_, data) => {
    return db.insert(products).values(data).returning().get();
  });

  // ... more handlers
}
```

```typescript
// renderer/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProducts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['products'],
    queryFn: () => window.api.products.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductDTO) => window.api.products.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
```

---

## State Management

### Zustand for Global State

```typescript
// renderer/stores/appStore.ts
import { create } from 'zustand';

interface AppState {
  // UI state
  sidebarOpen: boolean;
  currentView: 'sequence' | 'smed' | 'settings';
  
  // Timer state
  timerRunning: boolean;
  timerStudyId: string | null;
  timerStartTime: Date | null;
  timerCurrentStep: number;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: AppState['currentView']) => void;
  startTimer: (studyId: string) => void;
  stopTimer: () => void;
  nextStep: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  currentView: 'sequence',
  timerRunning: false,
  timerStudyId: null,
  timerStartTime: null,
  timerCurrentStep: 0,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),
  
  startTimer: (studyId) => set({
    timerRunning: true,
    timerStudyId: studyId,
    timerStartTime: new Date(),
    timerCurrentStep: 0,
  }),
  
  stopTimer: () => set({
    timerRunning: false,
    timerStudyId: null,
    timerStartTime: null,
    timerCurrentStep: 0,
  }),
  
  nextStep: () => set((state) => ({
    timerCurrentStep: state.timerCurrentStep + 1,
  })),
}));
```

### React Query for Server State

```typescript
// renderer/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

---

## Build & Distribution

### Electron Forge Configuration

```typescript
// forge.config.ts
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'ChangeOverOptimizer',
    executableName: 'changeoveroptimizer',
    icon: './resources/icon',
    appBundleId: 'com.changeoveroptimizer.app',
    appCopyright: 'Copyright © 2024 RDMAIC Oy',
    asar: true,
  },
  
  makers: [
    // Windows
    new MakerSquirrel({
      name: 'ChangeOverOptimizer',
      setupIcon: './resources/icon.ico',
    }),
    
    // macOS
    new MakerDMG({
      format: 'ULFO',
      icon: './resources/icon.icns',
    }),
    
    // Cross-platform ZIP
    new MakerZIP({}, ['darwin', 'win32']),
  ],
  
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/preload/index.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
};

export default config;
```

### Build Commands

```json
// package.json scripts
{
  "scripts": {
    "dev": "electron-forge start",
    "build": "electron-forge make",
    "publish": "electron-forge publish",
    "package": "electron-forge package",
    "lint": "eslint src/",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// tests/unit/optimizer.test.ts
import { describe, it, expect } from 'vitest';
import { optimizeSequence } from '../../src/main/services/optimizer';

describe('Sequence Optimizer', () => {
  it('should minimize total changeover time', () => {
    const orders = [
      { id: '1', productId: 'A', quantity: 100 },
      { id: '2', productId: 'B', quantity: 100 },
      { id: '3', productId: 'A', quantity: 100 },
    ];
    
    const changeovers = {
      'A->B': 30,
      'B->A': 30,
      'A->A': 0,
      'B->B': 0,
    };
    
    const result = optimizeSequence(orders, changeovers);
    
    // Should group A orders together
    expect(result.sequence[0].productId).toBe('A');
    expect(result.sequence[1].productId).toBe('A');
    expect(result.sequence[2].productId).toBe('B');
    expect(result.totalChangeoverTime).toBe(30);
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/app.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';

let app: Awaited<ReturnType<typeof electron.launch>>;
let window: Awaited<ReturnType<typeof app.firstWindow>>;

test.beforeAll(async () => {
  app = await electron.launch({ args: ['.'] });
  window = await app.firstWindow();
});

test.afterAll(async () => {
  await app.close();
});

test('should display main window', async () => {
  const title = await window.title();
  expect(title).toBe('ChangeOverOptimizer');
});

test('should navigate to SMED module', async () => {
  await window.click('[data-testid="nav-smed"]');
  await expect(window.locator('h1')).toContainText('SMED');
});

test('should create a new study', async () => {
  await window.click('[data-testid="nav-smed"]');
  await window.click('[data-testid="create-study"]');
  await window.fill('[data-testid="study-name"]', 'Test Study');
  await window.click('[data-testid="save-study"]');
  
  await expect(window.locator('[data-testid="study-list"]'))
    .toContainText('Test Study');
});
```

---

## Auto-Updates

```typescript
// main/updater.ts
import { autoUpdater } from 'electron-updater';
import { dialog } from 'electron';

export function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available. Download now?`,
      buttons: ['Download', 'Later'],
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. Restart to apply?',
      buttons: ['Restart', 'Later'],
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  // Check for updates on startup
  autoUpdater.checkForUpdates();
}
```

---

## Licensing (Paddle)

```typescript
// main/utils/license.ts
import { Paddle } from '@paddle/paddle-node-sdk';

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

export async function validateLicense(licenseKey: string): Promise<boolean> {
  try {
    const result = await paddle.licenses.verify({
      licenseKey,
    });
    return result.valid;
  } catch {
    return false;
  }
}

export async function activateLicense(licenseKey: string): Promise<boolean> {
  try {
    await paddle.licenses.activate({
      licenseKey,
      machineId: getMachineId(),
    });
    return true;
  } catch {
    return false;
  }
}

function getMachineId(): string {
  // Generate unique machine identifier
  const { machineIdSync } = require('node-machine-id');
  return machineIdSync();
}
```

---

## Performance Considerations

### SQLite Optimization

```typescript
// main/db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('changeoveroptimizer.db');

// Performance optimizations
sqlite.pragma('journal_mode = WAL');      // Write-ahead logging
sqlite.pragma('synchronous = NORMAL');     // Balance safety/speed
sqlite.pragma('cache_size = -64000');      // 64MB cache
sqlite.pragma('temp_store = MEMORY');      // Temp tables in memory

export const db = drizzle(sqlite);
```

### React Optimization

```typescript
// Use React.memo for expensive components
const OrderRow = React.memo(({ order }: { order: Order }) => {
  return (
    <tr>
      <td>{order.orderNumber}</td>
      <td>{order.product.name}</td>
      <td>{order.quantity}</td>
    </tr>
  );
});

// Use virtualization for long lists
import { useVirtualizer } from '@tanstack/react-virtual';

function OrderList({ orders }: { orders: Order[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <OrderRow key={orders[virtualRow.index].id} order={orders[virtualRow.index]} />
        ))}
      </div>
    </div>
  );
}
```

---

## Development Workflow

### Daily Development

```bash
# Start development
npm run dev

# Run tests while developing
npm run test -- --watch

# Lint before commit
npm run lint

# Build for testing
npm run package
```

### Release Process

```bash
# 1. Update version
npm version patch  # or minor, major

# 2. Build installers
npm run build

# 3. Test installers manually

# 4. Publish
npm run publish

# 5. Tag release
git tag v1.0.1
git push --tags
```

---

*Tech Stack v1.0 | December 2024*
