# TD-01: ChangeoverOptimizer Technical Architecture

**From UX Specification to Implementation**

*Updated December 2025 — Electron architecture*

---

## Purpose

This document translates the UX specification (UX-00 through UX-11) into a concrete technical architecture. It defines how ChangeoverOptimizer will be built, not what it does.

---

## Strategic Architecture Decision

### Web-First Core for Future Flexibility

ChangeoverOptimizer is architected with a **web-first core** that can be deployed to multiple targets:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   SHARED CORE (React + TypeScript) — 95% of code                           │
│   ─────────────────────────────────────────────────────────────────────────│
│   • UI components (shadcn/ui + Tailwind)                                    │
│   • Optimization algorithm                                                  │
│   • State management (Zustand)                                              │
│   • Excel parsing, export generation                                        │
│   • i18n (12 languages)                                                     │
│                                                                             │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│   │                 │  │                 │  │                 │            │
│   │  DESKTOP APP    │  │    WEB APP      │  │   TEAMS APP     │            │
│   │  (Tauri)        │  │   (Future?)     │  │   (Future?)     │            │
│   │                 │  │                 │  │                 │            │
│   │  • File system  │  │  • Cloud files  │  │  • Teams auth   │            │
│   │  • Local files  │  │  • SaaS model   │  │  • SharePoint   │            │
│   │  • Offline      │  │                 │  │  • OneDrive     │            │
│   │  • License key  │  │                 │  │                 │            │
│   │                 │  │                 │  │                 │            │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│   V1.0: Desktop      V1.x: Web demo       V2.0?: Teams/Web SaaS            │
│         (This doc)        (If needed)           (Future)                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Electron?

| Factor | Benefit |
|--------|---------|
| **Mature Ecosystem** | 10+ years of production use, extensive libraries |
| **Bundled Chromium** | Consistent rendering across all platforms |
| **Node.js Integration** | Direct access to npm packages and filesystem |
| **Tooling** | Excellent DevTools, debugging, profiling |
| **Community** | Large community, extensive documentation |
| **TypeScript Backend** | Unified language across frontend and backend |

**Decision: Electron** — While the installer is larger (~100MB vs Tauri's ~10MB), Electron provides a mature, battle-tested ecosystem with seamless Node.js integration. The development experience is significantly smoother with TypeScript across the entire stack.

---

## Document Index

| Doc | Title | Purpose | Status |
|-----|-------|---------|--------|
| TD-01 | **Technical Architecture** (this doc) | Overview, stack, structure | ✅ Created |
| TD-02 | **Optimization Algorithm** | Algorithm design, pseudocode | 📝 To Do |
| TD-03 | **Data Layer** | Storage, state, file processing | 📝 To Do |
| TD-04 | **UI Components** | React component library | 📝 To Do |
| TD-05 | **Licensing & Payments** | Paddle integration | 📝 To Do |
| TD-06 | **Build & Distribution** | CI/CD, signing, updates | 📝 To Do |
| TD-07 | **Development Phases** | MVP → V1.0 → V1.x roadmap | 📝 To Do |

---

## 1. System Context

### What ChangeoverOptimizer Is

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   SYSTEM CONTEXT                                                            │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│                                                                             │
│   ┌──────────────┐         ┌──────────────────────────────────────────┐    │
│   │              │         │                                          │    │
│   │  Excel/CSV   │────────▶│           HEIJUNKAFLOW                   │    │
│   │    Files     │         │         (Desktop App)                    │    │
│   │              │         │                                          │    │
│   └──────────────┘         │  ┌────────────────────────────────────┐ │    │
│                            │  │                                    │ │    │
│                            │  │   • Parse production orders        │ │    │
│   ┌──────────────┐         │  │   • Optimize sequence              │ │    │
│   │              │         │  │   • Calculate changeover savings   │ │    │
│   │    User      │────────▶│  │   • Export optimized schedule     │ │    │
│   │              │         │  │                                    │ │    │
│   └──────────────┘         │  └────────────────────────────────────┘ │    │
│                            │                                          │    │
│                            └─────────────────┬────────────────────────┘    │
│                                              │                              │
│                                              ▼                              │
│                            ┌──────────────────────────────────────────┐    │
│                            │                                          │    │
│                            │   Excel / CSV / PDF / Clipboard          │    │
│                            │   (Exported Schedule)                    │    │
│                            │                                          │    │
│                            └──────────────────────────────────────────┘    │
│                                                                             │
│                                                                             │
│   EXTERNAL SERVICES (minimal, optional)                                     │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                 │
│   │   Paddle     │    │   Update     │    │   Telemetry  │                 │
│   │   (License)  │    │   Server     │    │   (Optional) │                 │
│   └──────────────┘    └──────────────┘    └──────────────┘                 │
│                                                                             │
│   Only contacted for:                                                       │
│   • License activation (once)                                               │
│   • Version check (daily, non-blocking)                                     │
│   • Anonymous analytics (if opted in)                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Principles

| Principle | Implication |
|-----------|-------------|
| **Offline-first** | All core functionality works without internet |
| **Local data** | No cloud storage, data never leaves user's PC |
| **Fast** | Optimization feels instant for typical workloads |
| **Cross-platform** | Windows, macOS, Linux from single codebase |
| **Future-ready** | Web-first core enables Teams integration later |

---

## 2. Technology Stack (December 2025)

### Core Technologies

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Framework** | Electron | 39.x | Mature, consistent, Chromium-based |
| **Backend** | Node.js + TypeScript | 5.x | Unified language, npm ecosystem |
| **UI Framework** | React | 19.x | Latest stable, hooks improvements |
| **Language** | TypeScript | 5.x | Type safety, better DX |
| **Styling** | Tailwind CSS | 4.x | OKLCH colors, CSS-first config, faster |
| **Components** | shadcn/ui | Latest | Copy-paste ownership, Radix + Tailwind |
| **State** | Zustand | 5.x | Simple, minimal boilerplate, performant |
| **Database** | SQLite (better-sqlite3) | 11.x | Embedded, fast synchronous API |
| **ORM** | Drizzle | 0.35.x | Type-safe, lightweight ORM |
| **Build** | Vite | 6.x | Fast dev server, Electron integration |
| **Package** | Electron Forge | 7.x | Multi-platform builds, auto-update |

### Libraries

| Purpose | Library | Version | Notes |
|---------|---------|---------|-------|
| **Excel parsing** | SheetJS (xlsx) | 0.20.x | Read/write Excel, CSV |
| **PDF generation** | pdfmake | 0.2.x | Declarative PDF creation |
| **i18n** | i18next | 24.x | Industry standard, React bindings |
| **Icons** | Lucide React | 0.460.x | Consistent with shadcn/ui |
| **Date handling** | date-fns | 4.x | Lightweight, tree-shakable |
| **UUID** | uuid | 10.x | Template IDs |
| **Validation** | Zod | 3.x | Runtime type validation |
| **Charts** | Recharts | 2.x | React-native charts (for results) |

### Development Tools

| Purpose | Tool | Notes |
|---------|------|-------|
| **Linting** | ESLint 9 | Flat config, TypeScript |
| **Formatting** | Prettier | Consistent code style |
| **Testing** | Vitest | Fast, Vite-native |
| **E2E Testing** | Playwright | Cross-platform, reliable |
| **Git Hooks** | Husky + lint-staged | Pre-commit quality |

### Why These Specific Versions?

| Technology | Why This Version |
|------------|------------------|
| **React 19** | No more `forwardRef`, better performance with `useTransition` |
| **Tailwind 4** | OKLCH colors (better perception), CSS-first config, Rust-based Oxide engine |
| **shadcn/ui** | Components you own, not a dependency — modify freely |
| **Zustand 5** | Simpler API, better TypeScript support |
| **Electron 39** | Latest stable, security updates, performance improvements |

---

## 3. Application Architecture

### Electron Process Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ELECTRON APPLICATION ARCHITECTURE                                         │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │   MAIN PROCESS (Node.js + TypeScript)                              │  │
│   │   ─────────────────────────────────────────────────────────────────│  │
│   │                                                                     │  │
│   │   Responsibilities:                                                 │  │
│   │   • Window management (BrowserWindow)                               │  │
│   │   • File system access (Node.js fs)                                │  │
│   │   • Native dialogs (dialog module)                                 │  │
│   │   • Menu bar                                                        │  │
│   │   • Auto-updater (electron-updater)                                │  │
│   │   • IPC message handling                                           │  │
│   │                                                                     │  │
│   │   Key Modules:                                                      │  │
│   │   ├── main.ts              Entry point, window creation            │  │
│   │   ├── preload.ts           Security bridge (contextBridge)         │  │
│   │   ├── ipc-handlers.ts      IPC message handlers                    │  │
│   │   ├── storage.ts           Template management                     │  │
│   │   └── window-state.ts      Window geometry persistence             │  │
│   │                                                                     │  │
│   └──────────────────────────────┬──────────────────────────────────────┘  │
│                                  │                                          │
│                                  │ IPC (Inter-Process Communication)        │
│                                  │ ipcMain ↔ ipcRenderer via contextBridge │
│                                  │                                          │
│   ┌──────────────────────────────▼──────────────────────────────────────┐  │
│   │                                                                     │  │
│   │   RENDERER PROCESS (Chromium + React)                              │  │
│   │   ─────────────────────────────────────────────────────────────────│  │
│   │                                                                     │  │
│   │   Responsibilities:                                                 │  │
│   │   • UI rendering (React + shadcn/ui)                               │  │
│   │   • State management (Zustand)                                     │  │
│   │   • Optimization algorithm                                         │  │
│   │   • i18n                                                            │  │
│   │                                                                     │  │
│   │   Key Modules:                                                      │  │
│   │   ├── App.tsx              Root component                          │  │
│   │   ├── screens/             Screen components                       │  │
│   │   ├── components/          UI components                           │  │
│   │   ├── stores/              Zustand stores                          │  │
│   │   ├── services/            Business logic                          │  │
│   │   │   ├── optimizer.ts     Optimization algorithm                  │  │
│   │   │   ├── parser.ts        Excel/CSV parsing                       │  │
│   │   │   └── exporter.ts      Export generation                       │  │
│   │   └── lib/electron.ts      Electron API wrapper                    │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Electron IPC (Inter-Process Communication)

IPC handlers in the main process, called from the renderer via contextBridge:

```typescript
// src-electron/ipc-handlers.ts

import { ipcMain, IpcMainInvokeEvent, dialog, BrowserWindow } from 'electron';
import fs from 'fs/promises';

// File operations
export async function handleReadFile(
  event: IpcMainInvokeEvent,
  args: { path: string }
): Promise<number[]> {
  const buffer = await fs.readFile(args.path);
  return Array.from(buffer);
}

export async function handleWriteFile(
  event: IpcMainInvokeEvent,
  args: { path: string; data: number[] }
): Promise<void> {
  await fs.writeFile(args.path, Buffer.from(args.data));
}

// Dialogs
export async function handleOpenDialog(
  event: IpcMainInvokeEvent,
  args: { filters?: { name: string; extensions: string[] }[] }
): Promise<string | null> {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;

  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: args.filters,
  });

  return result.canceled ? null : result.filePaths[0];
}

export async function handleSaveDialog(
  event: IpcMainInvokeEvent,
  args: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }
): Promise<string | null> {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;

  const result = await dialog.showSaveDialog(win, {
    defaultPath: args.defaultPath,
    filters: args.filters,
  });

  return result.canceled ? null : result.filePath;
}
```

```typescript
// Frontend - calling Electron IPC
import { invoke } from '@/lib/electron';

interface Settings {
  language: string;
  theme: string;
  telemetryEnabled: boolean;
}

// File operations via dialog
async function openFile(): Promise<{ path: string; data: Uint8Array } | null> {
  const selected = await invoke<string | null>('open_dialog', {
    filters: [{ name: 'Spreadsheets', extensions: ['xlsx', 'csv'] }],
  });

  if (!selected) return null;

  const data = await invoke<number[]>('read_file', { path: selected });
  return { path: selected, data: new Uint8Array(data) };
}

// Save file
async function saveFile(data: Uint8Array, filename: string): Promise<string | null> {
  const path = await invoke<string | null>('save_dialog', {
    defaultPath: filename,
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
  });

  if (!path) return null;

  await invoke('write_file', { path, data: Array.from(data) });
  return path;
}
```

### Electron Security Configuration

```typescript
// src-electron/main.ts - Security settings

import { app, BrowserWindow } from 'electron';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'ChangeoverOptimizer',
    webPreferences: {
      // Security: Enable context isolation
      contextIsolation: true,
      // Security: Disable Node.js in renderer
      nodeIntegration: false,
      // Security: Use preload script
      preload: path.join(__dirname, 'preload.js'),
      // Performance: Enable sandbox
      sandbox: true,
    },
  });

  // Security: Set Content Security Policy
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.paddle.com https://changeoveroptimizer.com"
        ],
      },
    });
  });

  return win;
}
```

```typescript
// src-electron/preload.ts - IPC channel whitelist

import { contextBridge, ipcRenderer } from 'electron';

// Whitelist of allowed IPC channels
const validChannels = [
  'greet',
  'read_file',
  'write_file',
  'list_templates',
  'save_template',
  'delete_template',
  'open_dialog',
  'save_dialog',
];

// Expose IPC to renderer via contextBridge
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: any[]) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid IPC channel: ${channel}`);
  },
});
```

---

## 4. Project Structure

### Directory Layout

```
changeoveroptimizer/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Test on PR
│       └── release.yml            # Build & publish
├── src-electron/                  # TypeScript backend (main process)
│   ├── main.ts                    # Entry point
│   ├── preload.ts                 # Security bridge (contextBridge)
│   ├── ipc-handlers.ts            # IPC command handlers
│   ├── storage.ts                 # Template management
│   ├── window-state.ts            # Window geometry persistence
│   └── types.ts                   # TypeScript interfaces
├── forge.config.ts                # Electron Forge configuration
├── tsconfig.electron.json         # TypeScript config for main
├── vite.main.config.ts            # Vite config for main process
├── vite.preload.config.ts         # Vite config for preload
├── src/                           # React frontend
│   ├── main.tsx                   # React entry
│   ├── App.tsx                    # Root component
│   ├── screens/
│   │   ├── WelcomeScreen.tsx
│   │   ├── DataPreviewScreen.tsx
│   │   ├── ColumnMappingScreen.tsx
│   │   ├── ChangeoverConfigScreen.tsx
│   │   ├── OptimizingScreen.tsx
│   │   ├── ResultsScreen.tsx
│   │   ├── ExportScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── card.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── badge.tsx
│   │   │   └── tooltip.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ScreenContainer.tsx
│   │   └── features/
│   │       ├── FileDropzone.tsx
│   │       ├── ColumnMapper.tsx
│   │       ├── ChangeoverMatrix.tsx
│   │       ├── ResultsChart.tsx
│   │       ├── SequenceTable.tsx
│   │       └── UpgradePrompt.tsx
│   ├── stores/
│   │   ├── app-store.ts           # App-level state
│   │   ├── data-store.ts          # Current data/config
│   │   └── license-store.ts       # License state
│   ├── services/
│   │   ├── optimizer.ts           # Optimization algorithm
│   │   ├── parser.ts              # File parsing
│   │   ├── exporter.ts            # Export generation
│   │   └── validator.ts           # Data validation
│   ├── hooks/
│   │   ├── useFileImport.ts
│   │   ├── useOptimization.ts
│   │   ├── useExport.ts
│   │   └── useKeyboardShortcuts.ts
│   ├── i18n/
│   │   ├── index.ts               # i18next setup
│   │   └── locales/
│   │       ├── en.json
│   │       ├── de.json
│   │       ├── fi.json
│   │       ├── sv.json
│   │       ├── fr.json
│   │       ├── es.json
│   │       ├── pt.json
│   │       ├── it.json
│   │       ├── nl.json
│   │       ├── pl.json
│   │       ├── ja.json
│   │       └── zh-CN.json
│   ├── styles/
│   │   └── globals.css            # Tailwind v4 imports
│   ├── lib/
│   │   ├── utils.ts               # cn() helper for shadcn
│   │   └── electron.ts            # Typed Electron API wrappers
│   └── types/
│       ├── data.ts                # Data types
│       ├── config.ts              # Configuration types
│       └── api.ts                 # Electron IPC types
├── public/
│   └── sample-data.json           # Bundled sample dataset
├── tests/
│   ├── unit/
│   │   ├── optimizer.test.ts
│   │   ├── parser.test.ts
│   │   └── exporter.test.ts
│   ├── integration/
│   │   └── workflow.test.ts
│   └── e2e/
│       └── app.spec.ts
├── index.html                     # HTML entry point
├── vite.config.ts                 # Vite configuration
├── tailwind.config.ts             # Tailwind v4 configuration
├── tsconfig.json                  # TypeScript configuration
├── components.json                # shadcn/ui configuration
├── package.json
└── README.md
```

---

## 5. State Management

### Zustand Store Design

```typescript
// stores/data-store.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Order, AttributeConfig, OptimizationResult } from '@/types';

type Screen = 
  | 'welcome'
  | 'data-preview'
  | 'column-mapping'
  | 'changeover-config'
  | 'optimizing'
  | 'results'
  | 'export'
  | 'settings';

interface SourceFile {
  name: string;
  path: string;
  rows: Record<string, unknown>[];
  columns: string[];
}

interface Config {
  orderIdColumn: string | null;
  attributes: AttributeConfig[];
}

interface DataState {
  // Source data
  sourceFile: SourceFile | null;
  
  // Configuration
  config: Config;
  
  // Results
  result: OptimizationResult | null;
  
  // UI state
  currentScreen: Screen;
  isOptimizing: boolean;
  
  // Actions
  setSourceFile: (file: SourceFile) => void;
  setOrderIdColumn: (column: string) => void;
  addAttribute: (attr: AttributeConfig) => void;
  removeAttribute: (column: string) => void;
  updateAttributeTime: (column: string, time: number) => void;
  setResult: (result: OptimizationResult) => void;
  setOptimizing: (isOptimizing: boolean) => void;
  navigateTo: (screen: Screen) => void;
  reset: () => void;
}

const initialState = {
  sourceFile: null,
  config: { orderIdColumn: null, attributes: [] },
  result: null,
  currentScreen: 'welcome' as Screen,
  isOptimizing: false,
};

export const useDataStore = create<DataState>()(
  immer((set) => ({
    ...initialState,
    
    setSourceFile: (file) => set({ sourceFile: file }),
    
    setOrderIdColumn: (column) => set((state) => {
      state.config.orderIdColumn = column;
    }),
    
    addAttribute: (attr) => set((state) => {
      state.config.attributes.push(attr);
    }),
    
    removeAttribute: (column) => set((state) => {
      state.config.attributes = state.config.attributes.filter(
        (a) => a.column !== column
      );
    }),
    
    updateAttributeTime: (column, time) => set((state) => {
      const attr = state.config.attributes.find((a) => a.column === column);
      if (attr) attr.changeoverTime = time;
    }),
    
    setResult: (result) => set({ result }),
    
    setOptimizing: (isOptimizing) => set({ isOptimizing }),
    
    navigateTo: (screen) => set({ currentScreen: screen }),
    
    reset: () => set(initialState),
  }))
);
```

```typescript
// stores/license-store.ts

import { create } from 'zustand';

type Tier = 'free' | 'pro';
type Feature = 'unlimited-orders' | 'unlimited-attributes' | 'pdf-export' | 'templates' | 'summary';

interface LicenseState {
  tier: Tier;
  key: string | null;
  email: string | null;
  expiresAt: Date | null;
  isValidating: boolean;
  
  setLicense: (license: { key: string; email: string; expiresAt: Date }) => void;
  clearLicense: () => void;
  setValidating: (isValidating: boolean) => void;
  checkFeature: (feature: Feature) => boolean;
  checkOrderLimit: (count: number) => boolean;
  checkAttributeLimit: (count: number) => boolean;
}

export const useLicenseStore = create<LicenseState>((set, get) => ({
  tier: 'free',
  key: null,
  email: null,
  expiresAt: null,
  isValidating: false,
  
  setLicense: (license) => set({
    tier: 'pro',
    key: license.key,
    email: license.email,
    expiresAt: license.expiresAt,
  }),
  
  clearLicense: () => set({
    tier: 'free',
    key: null,
    email: null,
    expiresAt: null,
  }),
  
  setValidating: (isValidating) => set({ isValidating }),
  
  checkFeature: (feature) => {
    const { tier } = get();
    return tier === 'pro';
  },
  
  checkOrderLimit: (count) => {
    const { tier } = get();
    if (tier === 'pro') return true;
    return count <= 50; // Free tier limit
  },
  
  checkAttributeLimit: (count) => {
    const { tier } = get();
    if (tier === 'pro') return true;
    return count <= 2; // Free tier limit
  },
}));
```

---

## 6. shadcn/ui Setup

### Installation

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Add required components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add progress
npx shadcn@latest add toast
npx shadcn@latest add badge
npx shadcn@latest add tooltip
npx shadcn@latest add dropdown-menu
```

### Tailwind v4 Configuration

```css
/* src/renderer/styles/globals.css */
@import "tailwindcss";

@theme {
  /* ChangeoverOptimizer brand colors - OKLCH for better perception */
  --color-primary-50: oklch(0.97 0.02 250);
  --color-primary-100: oklch(0.93 0.04 250);
  --color-primary-200: oklch(0.86 0.08 250);
  --color-primary-300: oklch(0.76 0.12 250);
  --color-primary-400: oklch(0.66 0.16 250);
  --color-primary-500: oklch(0.55 0.20 250);
  --color-primary-600: oklch(0.48 0.20 250);  /* Main brand */
  --color-primary-700: oklch(0.40 0.18 250);
  --color-primary-800: oklch(0.33 0.14 250);
  --color-primary-900: oklch(0.27 0.10 250);
  
  /* Success (green) */
  --color-success-500: oklch(0.55 0.15 145);
  --color-success-600: oklch(0.48 0.15 145);
  
  /* Error (red) */
  --color-error-500: oklch(0.55 0.20 25);
  --color-error-600: oklch(0.48 0.20 25);
  
  /* Warning (amber) */
  --color-warning-500: oklch(0.75 0.15 85);
  --color-warning-600: oklch(0.68 0.15 85);
  
  /* Spacing */
  --spacing-unit: 8px;
  
  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
}

/* Font import */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
}
```

### Utils Helper

```typescript
// src/renderer/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 7. Core Services Overview

### Parser Service

```typescript
// services/parser.ts

import * as XLSX from 'xlsx';

export interface ParseResult {
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
  warnings: string[];
}

export interface ParseError {
  code: 'UNSUPPORTED_FORMAT' | 'EMPTY_FILE' | 'CORRUPTED' | 'TOO_LARGE' | 'ENCODING';
  message: string;
}

type ParseOutcome = 
  | { ok: true; data: ParseResult }
  | { ok: false; error: ParseError };

export async function parseFile(buffer: ArrayBuffer, filename: string): Promise<ParseOutcome> {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
    return { 
      ok: false, 
      error: { code: 'UNSUPPORTED_FORMAT', message: `Unsupported file type: ${ext}` }
    };
  }
  
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[];
    
    if (rows.length === 0) {
      return { ok: false, error: { code: 'EMPTY_FILE', message: 'File contains no data' } };
    }
    
    const columns = Object.keys(rows[0]);
    
    return {
      ok: true,
      data: {
        rows,
        columns,
        rowCount: rows.length,
        warnings: [],
      },
    };
  } catch (e) {
    return { 
      ok: false, 
      error: { code: 'CORRUPTED', message: 'Could not read file' }
    };
  }
}
```

### Optimizer Service (Interface)

See **TD-02: Optimization Algorithm** for full implementation.

```typescript
// services/optimizer.ts

export interface Order {
  id: string;
  originalIndex: number;
  values: Record<string, string>;
}

export interface AttributeConfig {
  column: string;
  changeoverTime: number; // minutes
}

export interface OptimizedOrder extends Order {
  sequenceNumber: number;
  changeoverTime: number;
  changeoverReasons: string[];
}

export interface OptimizationResult {
  sequence: OptimizedOrder[];
  totalBefore: number;
  totalAfter: number;
  savings: number;
  savingsPercent: number;
}

export function optimize(
  orders: Order[],
  attributes: AttributeConfig[]
): OptimizationResult {
  // Implementation in TD-02
}
```

---

## 8. Performance Requirements

### Startup Performance

| Metric | Target |
|--------|--------|
| Cold start to Welcome screen | < 3 seconds |
| Warm start (cached) | < 1.5 seconds |
| Memory at idle | < 200 MB |

### File Operations

| Operation | Target |
|-----------|--------|
| Load 50 orders | < 500ms |
| Load 500 orders | < 1 second |
| Load 5,000 orders | < 3 seconds |

### Optimization

| Dataset Size | Target Time |
|--------------|-------------|
| 50 orders | < 500ms |
| 500 orders | < 5 seconds |
| 5,000 orders | < 60 seconds |

### UI Responsiveness

| Interaction | Target |
|-------------|--------|
| Button feedback | < 50ms |
| Screen transition | < 300ms |
| Input response | < 16ms (60fps) |

---

## 9. Teams App Store Future

### Code Reuse Strategy

When building Teams version:

| Component | Reuse Level | Notes |
|-----------|-------------|-------|
| React components | 100% | Same shadcn/ui components |
| Optimization algorithm | 100% | Pure TypeScript |
| Zustand stores | 90% | Minor adaptations |
| i18n | 100% | Same translation files |
| File handling | 20% | Replace with SharePoint/OneDrive |
| Settings storage | 30% | Replace with Teams storage |
| License handling | 0% | Teams subscription model |

### Teams SDK Integration Points

```typescript
// Future: src/teams/TeamsAdapter.ts

import * as microsoftTeams from '@microsoft/teams-js';

export async function initializeTeams() {
  await microsoftTeams.app.initialize();
  
  const context = await microsoftTeams.app.getContext();
  // User info, tenant, locale available
}

export async function openFilePicker() {
  // Use Teams file picker instead of native dialog
  return microsoftTeams.files.openFilePickerAndUpload({
    fileTypes: ['.xlsx', '.xls', '.csv'],
    maxFiles: 1,
  });
}

export async function saveToOneDrive(blob: Blob, filename: string) {
  // Save optimized schedule to user's OneDrive
}
```

---

## 10. Next Steps

### Technical Documents To Create

| Doc | Content | Priority |
|-----|---------|----------|
| **TD-07** | Development Phases (MVP) | High |
| **TD-02** | Optimization Algorithm | High |
| **TD-03** | Data Layer | High |
| **TD-04** | UI Components | Medium |
| **TD-05** | Licensing & Payments | Medium |
| **TD-06** | Build & Distribution | Medium |

### Recommended Order

1. **TD-07: Development Phases** — Define MVP scope
2. **TD-02: Optimization Algorithm** — Core IP
3. **TD-03: Data Layer** — Foundation
4. **TD-04: UI Components** — Interface
5. **TD-05: Licensing** — Revenue
6. **TD-06: Build** — Ship it

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2024-12-20 | Initial architecture document |
| 0.2 | 2024-12-20 | Updated to 2025 stack (React 19, Tailwind 4, shadcn/ui) |
| 0.3 | 2024-12-20 | Changed from Electron to Tauri for smaller size, better performance |
| | | |

---

*This document provides the architectural foundation. Detailed specifications follow in TD-02 through TD-07.*
