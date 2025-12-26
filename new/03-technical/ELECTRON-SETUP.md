# Electron Project Setup Guide

## Quick Start

This guide walks through setting up the ChangeOverOptimizer development environment from scratch.

### Prerequisites

- Node.js 20.x LTS
- npm 10.x or pnpm 8.x
- Git
- VS Code (recommended)

### Initial Setup

```bash
# Create project directory
mkdir changeoveroptimizer
cd changeoveroptimizer

# Initialize with Electron Forge + Vite + TypeScript template
npm init electron-app@latest . -- --template=vite-typescript

# Or with pnpm
pnpm create electron-app . --template=vite-typescript
```

---

## Project Configuration

### 1. Install Dependencies

```bash
# Core dependencies
npm install react react-dom
npm install zustand @tanstack/react-query
npm install better-sqlite3 drizzle-orm
npm install zod
npm install @paralleldrive/cuid2

# UI dependencies
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install recharts
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs

# File handling
npm install exceljs
npm install @react-pdf/renderer

# Dev dependencies
npm install -D @types/react @types/react-dom
npm install -D @types/better-sqlite3
npm install -D drizzle-kit
npm install -D vitest @testing-library/react
npm install -D playwright @playwright/test
npm install -D eslint @typescript-eslint/eslint-plugin
npm install -D prettier prettier-plugin-tailwindcss

# Native module rebuild
npm install -D electron-rebuild
```

### 2. Configure TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["src/shared/*"],
      "@main/*": ["src/main/*"],
      "@renderer/*": ["src/renderer/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "out"]
}
```

### 3. Configure Tailwind CSS

```bash
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... add more as needed
      },
    },
  },
  plugins: [],
};
```

```css
/* src/renderer/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    /* ... more CSS variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode variables */
  }
}
```

### 4. Configure Vite

```typescript
// vite.main.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@main': path.resolve(__dirname, 'src/main'),
    },
  },
  build: {
    rollupOptions: {
      external: ['better-sqlite3'],
    },
  },
});
```

```typescript
// vite.renderer.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
    },
  },
});
```

### 5. Configure Electron Forge

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
    asar: true,
    extraResource: ['./resources'],
  },
  rebuildConfig: {
    // Rebuild native modules
    force: true,
  },
  makers: [
    new MakerSquirrel({
      name: 'ChangeOverOptimizer',
      setupIcon: './resources/icon.ico',
    }),
    new MakerDMG({
      format: 'ULFO',
      icon: './resources/icon.icns',
    }),
    new MakerZIP({}, ['darwin', 'win32']),
  ],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'src/main/index.ts', config: 'vite.main.config.ts' },
        { entry: 'src/preload/index.ts', config: 'vite.preload.config.ts' },
      ],
      renderer: [
        { name: 'main_window', config: 'vite.renderer.config.ts' },
      ],
    }),
  ],
};

export default config;
```

### 6. Configure Package.json Scripts

```json
{
  "name": "changeoveroptimizer",
  "version": "1.0.0",
  "description": "Changeover optimization desktop application",
  "main": ".vite/build/main.js",
  "scripts": {
    "dev": "electron-forge start",
    "build": "electron-forge make",
    "package": "electron-forge package",
    "publish": "electron-forge publish",
    "lint": "eslint src/ --ext .ts,.tsx",
    "lint:fix": "eslint src/ --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate:sqlite",
    "db:migrate": "drizzle-kit migrate",
    "rebuild": "electron-rebuild -f -w better-sqlite3"
  }
}
```

---

## Project Structure Setup

```bash
# Create directory structure
mkdir -p src/main/ipc
mkdir -p src/main/db/migrations
mkdir -p src/main/services
mkdir -p src/main/utils
mkdir -p src/renderer/components/ui
mkdir -p src/renderer/features/products
mkdir -p src/renderer/features/orders
mkdir -p src/renderer/features/sequence
mkdir -p src/renderer/features/smed
mkdir -p src/renderer/features/settings
mkdir -p src/renderer/hooks
mkdir -p src/renderer/stores
mkdir -p src/renderer/lib
mkdir -p src/renderer/styles
mkdir -p src/shared/types
mkdir -p src/shared/constants
mkdir -p src/preload
mkdir -p tests/e2e
mkdir -p tests/unit
mkdir -p resources
```

---

## Core Files

### Main Process Entry

```typescript
// src/main/index.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { initDatabase } from './db';
import { registerAllHandlers } from './ipc';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
  // Initialize database
  initDatabase();
  
  // Register IPC handlers
  registerAllHandlers();
  
  // Create window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### Preload Script

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/channels';

const api = {
  // Products
  products: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_GET_ALL),
    getById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_GET_BY_ID, id),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_CREATE, data),
    update: (id: string, data: unknown) => 
      ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_DELETE, id),
  },

  // Orders
  orders: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.ORDERS_GET_ALL),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.ORDERS_CREATE, data),
    importExcel: () => ipcRenderer.invoke(IPC_CHANNELS.ORDERS_IMPORT_EXCEL),
  },

  // Sequence
  sequence: {
    optimize: (orderIds: string[], options: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.SEQUENCE_OPTIMIZE, orderIds, options),
  },

  // SMED
  smed: {
    studies: {
      getAll: () => ipcRenderer.invoke(IPC_CHANNELS.SMED_STUDIES_GET_ALL),
      getById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.SMED_STUDIES_GET_BY_ID, id),
      create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SMED_STUDIES_CREATE, data),
      update: (id: string, data: unknown) =>
        ipcRenderer.invoke(IPC_CHANNELS.SMED_STUDIES_UPDATE, id, data),
    },
    steps: {
      getByStudy: (studyId: string) =>
        ipcRenderer.invoke(IPC_CHANNELS.SMED_STEPS_GET_BY_STUDY, studyId),
      create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SMED_STEPS_CREATE, data),
      update: (id: string, data: unknown) =>
        ipcRenderer.invoke(IPC_CHANNELS.SMED_STEPS_UPDATE, id, data),
      reorder: (studyId: string, stepIds: string[]) =>
        ipcRenderer.invoke(IPC_CHANNELS.SMED_STEPS_REORDER, studyId, stepIds),
    },
    timer: {
      start: (studyId: string) => ipcRenderer.invoke(IPC_CHANNELS.SMED_TIMER_START, studyId),
      stop: () => ipcRenderer.invoke(IPC_CHANNELS.SMED_TIMER_STOP),
      log: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SMED_TIMER_LOG, data),
    },
  },

  // Files
  files: {
    exportExcel: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.FILES_EXPORT_EXCEL, data),
    exportPdf: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.FILES_EXPORT_PDF, data),
  },

  // App
  app: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
    checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.APP_CHECK_UPDATES),
  },
};

contextBridge.exposeInMainWorld('api', api);

// Type declarations for renderer
export type API = typeof api;
```

### IPC Channels

```typescript
// src/shared/constants/channels.ts
export const IPC_CHANNELS = {
  // Products
  PRODUCTS_GET_ALL: 'products:getAll',
  PRODUCTS_GET_BY_ID: 'products:getById',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',

  // Orders
  ORDERS_GET_ALL: 'orders:getAll',
  ORDERS_CREATE: 'orders:create',
  ORDERS_IMPORT_EXCEL: 'orders:importExcel',

  // Sequence
  SEQUENCE_OPTIMIZE: 'sequence:optimize',

  // SMED Studies
  SMED_STUDIES_GET_ALL: 'smed:studies:getAll',
  SMED_STUDIES_GET_BY_ID: 'smed:studies:getById',
  SMED_STUDIES_CREATE: 'smed:studies:create',
  SMED_STUDIES_UPDATE: 'smed:studies:update',

  // SMED Steps
  SMED_STEPS_GET_BY_STUDY: 'smed:steps:getByStudy',
  SMED_STEPS_CREATE: 'smed:steps:create',
  SMED_STEPS_UPDATE: 'smed:steps:update',
  SMED_STEPS_REORDER: 'smed:steps:reorder',

  // SMED Timer
  SMED_TIMER_START: 'smed:timer:start',
  SMED_TIMER_STOP: 'smed:timer:stop',
  SMED_TIMER_LOG: 'smed:timer:log',

  // Files
  FILES_EXPORT_EXCEL: 'files:exportExcel',
  FILES_EXPORT_PDF: 'files:exportPdf',

  // App
  APP_GET_VERSION: 'app:getVersion',
  APP_CHECK_UPDATES: 'app:checkForUpdates',
} as const;
```

### React Entry Point

```typescript
// src/renderer/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Global Type Declarations

```typescript
// src/renderer/types/global.d.ts
import type { API } from '../preload';

declare global {
  interface Window {
    api: API;
  }
}

export {};
```

---

## Running the App

### Development

```bash
# Start development server
npm run dev
```

This will:
1. Start Vite dev server for renderer
2. Compile main process
3. Launch Electron with hot reload

### Building for Production

```bash
# Package without installer (for testing)
npm run package

# Build with installers
npm run build
```

Output will be in `out/` directory.

---

## Native Module Notes

### better-sqlite3 Rebuild

`better-sqlite3` requires native compilation. After installing:

```bash
npm run rebuild
```

If you encounter issues:
- Windows: Install Visual Studio Build Tools
- macOS: Install Xcode Command Line Tools (`xcode-select --install`)
- Linux: Install build-essential (`apt install build-essential`)

### Packaging Native Modules

Electron Forge handles native module rebuilding during packaging, but ensure:

1. `asar: true` in packagerConfig (compresses, but extracts native modules)
2. Add to `asarUnpack` if needed:

```typescript
// forge.config.ts
packagerConfig: {
  asar: true,
  asarUnpack: ['**/node_modules/better-sqlite3/**'],
}
```

---

## Debugging

### DevTools

Press `Cmd+Opt+I` (Mac) or `Ctrl+Shift+I` (Windows) to open DevTools.

### VS Code Launch Config

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron: Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": ["."],
      "outputCapture": "std",
      "sourceMaps": true
    }
  ]
}
```

---

## Common Issues

### Issue: Window is blank/white

**Solution**: Check console for errors. Usually a path issue with preload script or renderer.

### Issue: Native module error

**Solution**: Run `npm run rebuild` to rebuild native modules for Electron.

### Issue: IPC not working

**Solution**: 
1. Check channel names match between main/preload
2. Verify `contextIsolation: true` in webPreferences
3. Check preload path is correct

### Issue: App crashes on startup

**Solution**: 
1. Check main process console output
2. Try running `npm run package` and test the packaged app
3. Check for missing dependencies

---

## Next Steps

1. ✅ Project setup complete
2. → Implement database schema (see `DATABASE-SCHEMA.md`)
3. → Build SMED module (see `SMED-MODULE-SPEC.md`)
4. → Add sequence optimization (port from existing)
5. → Implement UI screens
6. → Add tests
7. → Package and distribute

---

*Electron Setup Guide v1.0 | December 2024*
