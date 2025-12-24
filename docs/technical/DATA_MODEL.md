# TD-03: Data Layer

**Storage, State, and File Processing**

---

## Purpose

This document specifies how ChangeoverOptimizer handles data:
- File parsing (input)
- Application state (runtime)
- Persistent storage (settings, templates, license)
- Export generation (output)

---

## Data Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   DATA FLOW ARCHITECTURE                                                    │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│                                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │
│   │             │     │             │     │             │                  │
│   │  Excel/CSV  │────▶│   Parser    │────▶│   Zustand   │                  │
│   │   (Input)   │     │  (SheetJS)  │     │   Store     │                  │
│   │             │     │             │     │             │                  │
│   └─────────────┘     └─────────────┘     └──────┬──────┘                  │
│                                                  │                          │
│                                                  │                          │
│                                                  ▼                          │
│                                           ┌─────────────┐                  │
│                                           │             │                  │
│                                           │  Optimizer  │                  │
│                                           │             │                  │
│                                           └──────┬──────┘                  │
│                                                  │                          │
│                                                  │                          │
│                                                  ▼                          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │
│   │             │     │             │     │             │                  │
│   │  Excel/CSV  │◀────│  Exporter   │◀────│   Results   │                  │
│   │    /PDF     │     │             │     │   (State)   │                  │
│   │             │     │             │     │             │                  │
│   └─────────────┘     └─────────────┘     └─────────────┘                  │
│                                                                             │
│                                                                             │
│   PERSISTENT STORAGE (Electron Store)                                       │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │
│   │             │     │             │     │             │                  │
│   │  Settings   │     │  Templates  │     │   License   │                  │
│   │             │     │   (Pro)     │     │             │                  │
│   │             │     │             │     │             │                  │
│   └─────────────┘     └─────────────┘     └─────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Storage Architecture

**ChangeoverOptimizer uses a hybrid storage approach:**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Persistent Data** | SQLite (better-sqlite3) + Drizzle ORM | Products, orders, schedules, SMED studies, changeover configuration |
| **Runtime State** | Zustand | UI state, current screen, loading status, optimization results |
| **UI Preferences** | localStorage | Theme, language, window position |
| **License** | Encrypted SQLite | License keys and validation status |

### Why SQLite?

1. **Relational Data**: Products, orders, and changeov relationships fit SQL model naturally
2. **Performance**: Synchronous better-sqlite3 is faster than async filesystem operations
3. **Queries**: Complex filtering, sorting, JOIN operations are simple with SQL
4. **Single File**: Entire database in one file (~5-50 MB typical)
5. **Backup**: Copy one file to backup entire application data
6. **SMED Module**: Studies, steps, improvements require proper relational storage

### Database Location

```
Windows:   C:\Users\{user}\AppData\Roaming\changeoveroptimizer\changeoveroptimizer.db
macOS:     ~/Library/Application Support/changeoveroptimizer/changeoveroptimizer.db
Linux:     ~/.config/changeoveroptimizer/changeoveroptimizer.db
```

### Data Flow with Database

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   UPDATED DATA FLOW ARCHITECTURE (with SQLite)                             │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│                                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                 │
│   │             │     │             │     │             │                 │
│   │  Excel/CSV  │────▶│   Parser    │────▶│   SQLite    │                 │
│   │   (Input)   │     │  (SheetJS)  │     │  (persist)  │                 │
│   │             │     │             │     │             │                 │
│   └─────────────┘     └─────────────┘     └──────┬──────┘                 │
│                                                   │                         │
│                                                   ▼                         │
│                                            ┌─────────────┐                 │
│                                            │   Zustand   │                 │
│                                            │   (state)   │                 │
│                                            └──────┬──────┘                 │
│                                                   │                         │
│                                                   ▼                         │
│                                            ┌─────────────┐                 │
│                                            │  Optimizer  │                 │
│                                            └──────┬──────┘                 │
│                                                   │                         │
│                                                   ▼                         │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                 │
│   │             │     │             │     │             │                 │
│   │  Excel/CSV  │◀────│  Exporter   │◀────│   SQLite    │                 │
│   │    /PDF     │     │             │     │  (results)  │                 │
│   │             │     │             │     │             │                 │
│   └─────────────┘     └─────────────┘     └─────────────┘                 │
│                                                                             │
│                                                                             │
│   PERSISTENT STORAGE (SQLite Database)                                     │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│   │             │  │             │  │             │  │             │      │
│   │  Products   │  │   Orders    │  │  Schedules  │  │    SMED     │      │
│   │ Changeover  │  │  Templates  │  │  Settings   │  │   Studies   │      │
│   │   Config    │  │   License   │  │  App State  │  │  Standards  │      │
│   │             │  │             │  │             │  │             │      │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (SQLite + Drizzle ORM)

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         ENTITY RELATIONSHIP DIAGRAM                        │
│                                                                             │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│  │  products   │◄────────│   orders    │────────▶│  schedules  │          │
│  └─────────────┘         └─────────────┘         └─────────────┘          │
│         │                                               │                  │
│         │                                               │                  │
│         ▼                                               ▼                  │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│  │ product_    │         │ schedule_   │         │ changeover_ │          │
│  │ attributes  │         │   items     │         │   matrix    │          │
│  └─────────────┘         └─────────────┘         └─────────────┘          │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                            SMED TABLES                                      │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│  │   studies   │────────▶│    steps    │────────▶│improvements │          │
│  └─────────────┘         └─────────────┘         └─────────────┘          │
│         │                                                                   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐         ┌─────────────┐                                   │
│  │  standards  │────────▶│    logs     │                                   │
│  └─────────────┘         └─────────────┘                                   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                            SYSTEM TABLES                                    │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  ┌─────────────┐         ┌─────────────┐                                   │
│  │  settings   │         │  app_state  │                                   │
│  └─────────────┘         └─────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Tables

#### Products
Stores product/SKU master data with attributes.

```typescript
// src-electron/db/schema/products.ts
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // Basic info
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  description: text('description'),

  // Classification
  family: text('family'),
  category: text('category'),

  // Production
  standardTimeMinutes: real('standard_time_minutes'),
  packQuantity: integer('pack_quantity').default(1),

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

export const productAttributes = sqliteTable('product_attributes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').notNull()
    .references(() => products.id, { onDelete: 'cascade' }),

  attributeName: text('attribute_name').notNull(), // e.g., "color", "size"
  attributeValue: text('attribute_value').notNull(), // e.g., "red", "large"
});
```

#### Orders
Production orders to be scheduled.

```typescript
// src-electron/db/schema/orders.ts
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // Reference
  orderNumber: text('order_number'),
  externalId: text('external_id'), // ERP reference

  // What
  productId: text('product_id').notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),

  // When
  dueDate: text('due_date').notNull(), // ISO date string
  dueTime: text('due_time'), // HH:MM

  // Priority
  priority: text('priority', {
    enum: ['low', 'normal', 'high', 'rush']
  }).default('normal'),

  // Status
  status: text('status', {
    enum: ['pending', 'scheduled', 'in_progress', 'complete', 'canceled']
  }).default('pending'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});
```

#### Changeover Configuration
Defines changeover attributes and times matrix.

```typescript
// src-electron/db/schema/changeovers.ts
export const changeoverAttributes = sqliteTable('changeover_attributes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  name: text('name').notNull(), // e.g., "color", "size", "die"
  displayName: text('display_name').notNull(),

  // Hierarchy position (1 = longest changeovers)
  hierarchyLevel: integer('hierarchy_level').notNull(),

  // Default time for this attribute change
  defaultMinutes: integer('default_minutes').default(0),

  // Parallel group (for parallel changeovers)
  parallelGroup: text('parallel_group').default('default'),

  sortOrder: integer('sort_order').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

export const changeoverMatrix = sqliteTable('changeover_matrix', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  attributeId: text('attribute_id').notNull()
    .references(() => changeoverAttributes.id, { onDelete: 'cascade' }),

  fromValue: text('from_value').notNull(),
  toValue: text('to_value').notNull(),
  timeMinutes: integer('time_minutes').notNull(),

  // Source of the time
  source: text('source', {
    enum: ['manual', 'smed_standard', 'smed_average']
  }).default('manual'),

  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});
```

### SMED Module Tables

#### Studies
SMED improvement studies for specific changeovers.

```typescript
// src-electron/db/schema/smed.ts
export const smedStudies = sqliteTable('smed_studies', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // Basic info
  name: text('name').notNull(),
  description: text('description'),

  // Changeover type
  fromProductId: text('from_product_id')
    .references(() => products.id),
  toProductId: text('to_product_id')
    .references(() => products.id),
  changeoverType: text('changeover_type'), // Free text alternative

  // Location
  lineName: text('line_name'),
  machineName: text('machine_name'),

  // Status
  status: text('status', {
    enum: ['draft', 'analyzing', 'improving', 'standardized', 'archived']
  }).default('draft'),

  // Times
  baselineMinutes: integer('baseline_minutes'),
  targetMinutes: integer('target_minutes'),
  currentMinutes: integer('current_minutes'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});
```

See [SMED_MODULE.md](SMED_MODULE.md) for complete SMED schema including steps, improvements, standards, and logs tables.

### System Tables

```typescript
// src-electron/db/schema/system.ts
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

export const appState = sqliteTable('app_state', {
  id: text('id').primaryKey().default('main'),

  // UI state
  lastViewedScheduleId: text('last_viewed_schedule_id'),
  lastViewedStudyId: text('last_viewed_study_id'),

  // License
  licenseKey: text('license_key'),
  licenseValidUntil: integer('license_valid_until', { mode: 'timestamp' }),

  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});
```

### Drizzle ORM Setup

```typescript
// src-electron/db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app } from 'electron';
import path from 'path';

const dbPath = path.join(app.getPath('userData'), 'changeoveroptimizer.db');
const sqlite = new Database(dbPath);

// Performance settings
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('cache_size = -64000');
sqlite.pragma('temp_store = MEMORY');

export const db = drizzle(sqlite);

// Run migrations on startup
export function initDatabase() {
  migrate(db, { migrationsFolder: './migrations' });
}
```

### Migration Workflow

```bash
# drizzle.config.ts at project root
import type { Config } from 'drizzle-kit';

export default {
  schema: './src-electron/db/schema/*',
  out: './src-electron/db/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './changeoveroptimizer.db',
  },
} satisfies Config;

# Generate migration after schema changes
npx drizzle-kit generate:sqlite

# Migrations auto-run on app startup via initDatabase()
```

### Backup & Restore

```typescript
// src-electron/services/backup.ts
import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

export async function createBackup(): Promise<string> {
  const dbPath = path.join(app.getPath('userData'), 'changeoveroptimizer.db');
  const backupDir = path.join(app.getPath('userData'), 'backups');

  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

  await fs.copyFile(dbPath, backupPath);

  return backupPath;
}
```

---

## 1. File Parsing (Input)

### Supported Formats

| Format | Extension | Library | Notes |
|--------|-----------|---------|-------|
| Excel 2007+ | .xlsx | SheetJS | Primary format |
| Excel 97-2003 | .xls | SheetJS | Legacy support |
| CSV | .csv | SheetJS | Comma-separated |
| TSV | .tsv | SheetJS | Tab-separated |

### Parser Service

```typescript
// services/parser.ts

import * as XLSX from 'xlsx';

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedFile {
  /** Original filename */
  name: string;
  
  /** Full file path (for recent files) */
  path: string;
  
  /** Sheet names (for multi-sheet files) */
  sheets: string[];
  
  /** Currently selected sheet */
  activeSheet: string;
  
  /** Parsed rows as key-value objects */
  rows: Record<string, unknown>[];
  
  /** Column headers */
  columns: string[];
  
  /** Total row count */
  rowCount: number;
}

export interface ParseOptions {
  /** Which sheet to parse (default: first) */
  sheet?: string;
  
  /** Max rows to parse (default: unlimited) */
  maxRows?: number;
  
  /** Skip empty rows (default: true) */
  skipEmpty?: boolean;
}

export type ParseError = 
  | { code: 'UNSUPPORTED_FORMAT'; message: string }
  | { code: 'EMPTY_FILE'; message: string }
  | { code: 'CORRUPTED'; message: string }
  | { code: 'TOO_LARGE'; message: string }
  | { code: 'NO_HEADERS'; message: string }
  | { code: 'ENCODING'; message: string };

export type ParseResult = 
  | { ok: true; data: ParsedFile }
  | { ok: false; error: ParseError };

// ============================================================================
// CONSTANTS
// ============================================================================

const SUPPORTED_EXTENSIONS = ['xlsx', 'xls', 'csv', 'tsv'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_ROWS_WARNING = 10000;

// ============================================================================
// MAIN PARSER
// ============================================================================

export async function parseFile(
  buffer: ArrayBuffer,
  filename: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  // Validate file extension
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_FORMAT',
        message: `Unsupported file type: .${ext}. Please use Excel (.xlsx, .xls) or CSV files.`,
      },
    };
  }
  
  // Check file size
  if (buffer.byteLength > MAX_FILE_SIZE) {
    return {
      ok: false,
      error: {
        code: 'TOO_LARGE',
        message: `File is too large (${Math.round(buffer.byteLength / 1024 / 1024)} MB). Maximum size is 50 MB.`,
      },
    };
  }
  
  try {
    // Parse workbook
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
    });
    
    // Get sheet names
    const sheets = workbook.SheetNames;
    
    if (sheets.length === 0) {
      return {
        ok: false,
        error: { code: 'EMPTY_FILE', message: 'File contains no sheets.' },
      };
    }
    
    // Select sheet
    const activeSheet = options.sheet ?? sheets[0];
    const sheet = workbook.Sheets[activeSheet];
    
    if (!sheet) {
      return {
        ok: false,
        error: { code: 'EMPTY_FILE', message: `Sheet "${activeSheet}" not found.` },
      };
    }
    
    // Convert to JSON
    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      raw: false, // Convert to strings
    }) as Record<string, unknown>[];
    
    // Filter empty rows if requested
    const rows = options.skipEmpty !== false
      ? rawRows.filter(row => Object.values(row).some(v => v !== ''))
      : rawRows;
    
    if (rows.length === 0) {
      return {
        ok: false,
        error: { code: 'EMPTY_FILE', message: 'File contains no data rows.' },
      };
    }
    
    // Extract columns from first row
    const columns = Object.keys(rows[0]);
    
    if (columns.length === 0) {
      return {
        ok: false,
        error: { code: 'NO_HEADERS', message: 'Could not detect column headers.' },
      };
    }
    
    // Apply max rows limit
    const limitedRows = options.maxRows 
      ? rows.slice(0, options.maxRows)
      : rows;
    
    return {
      ok: true,
      data: {
        name: filename,
        path: '', // Set by caller
        sheets,
        activeSheet,
        rows: limitedRows,
        columns,
        rowCount: rows.length,
      },
    };
  } catch (e) {
    console.error('Parse error:', e);
    return {
      ok: false,
      error: {
        code: 'CORRUPTED',
        message: 'Could not read file. It may be corrupted or password-protected.',
      },
    };
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get preview rows for display (first 10 rows).
 */
export function getPreviewRows(
  rows: Record<string, unknown>[],
  limit: number = 10
): Record<string, unknown>[] {
  return rows.slice(0, limit);
}

/**
 * Detect likely Order ID column using heuristics.
 */
export function detectOrderIdColumn(columns: string[]): string | null {
  const patterns = [
    /^order[_\s-]?id$/i,
    /^order[_\s-]?no$/i,
    /^order[_\s-]?number$/i,
    /^order$/i,
    /^id$/i,
    /^po[_\s-]?number$/i,
    /^job[_\s-]?id$/i,
    /^job[_\s-]?no$/i,
    /^work[_\s-]?order$/i,
    /^wo[_\s-]?number$/i,
  ];
  
  for (const pattern of patterns) {
    const match = columns.find(col => pattern.test(col));
    if (match) return match;
  }
  
  // Fallback: first column
  return columns[0] ?? null;
}

/**
 * Detect likely attribute columns (exclude Order ID).
 */
export function detectAttributeColumns(
  columns: string[],
  orderIdColumn: string | null
): string[] {
  const exclude = [
    orderIdColumn?.toLowerCase(),
    'id',
    'date',
    'created',
    'modified',
    'quantity',
    'qty',
    'amount',
    'price',
    'notes',
    'comments',
    'description',
  ].filter(Boolean) as string[];
  
  return columns.filter(col => 
    !exclude.includes(col.toLowerCase())
  );
}

/**
 * Get unique values for a column (for changeover matrix).
 */
export function getUniqueValues(
  rows: Record<string, unknown>[],
  column: string
): string[] {
  const values = new Set<string>();
  
  for (const row of rows) {
    const value = String(row[column] ?? '').trim();
    if (value) {
      values.add(value);
    }
  }
  
  return Array.from(values).sort();
}
```

---

## 2. Application State (Zustand)

### Store Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ZUSTAND STORE ARCHITECTURE                                                │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │   useAppStore                                                       │  │
│   │   ─────────────────────────────────────────────────────────────────│  │
│   │   • currentScreen                                                   │  │
│   │   • isLoading                                                       │  │
│   │   • error                                                           │  │
│   │   • navigateTo()                                                    │  │
│   │   • setError()                                                      │  │
│   │   • clearError()                                                    │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │   useDataStore                                                      │  │
│   │   ─────────────────────────────────────────────────────────────────│  │
│   │   • sourceFile (ParsedFile | null)                                 │  │
│   │   • config (orderIdColumn, attributes)                             │  │
│   │   • result (OptimizationResult | null)                             │  │
│   │   • setSourceFile()                                                 │  │
│   │   • updateConfig()                                                  │  │
│   │   • setResult()                                                     │  │
│   │   • reset()                                                         │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │   useLicenseStore                                                   │  │
│   │   ─────────────────────────────────────────────────────────────────│  │
│   │   • tier ('free' | 'pro')                                          │  │
│   │   • license (LicenseInfo | null)                                   │  │
│   │   • isValidating                                                    │  │
│   │   • setLicense()                                                    │  │
│   │   • clearLicense()                                                  │  │
│   │   • checkFeature()                                                  │  │
│   │   • checkLimit()                                                    │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │   useSettingsStore                                                  │  │
│   │   ─────────────────────────────────────────────────────────────────│  │
│   │   • language                                                        │  │
│   │   • theme                                                           │  │
│   │   • exportDefaults                                                  │  │
│   │   • recentFiles                                                     │  │
│   │   • setLanguage()                                                   │  │
│   │   • setTheme()                                                      │  │
│   │   • addRecentFile()                                                 │  │
│   │   • hydrate() / persist()                                           │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### App Store

```typescript
// stores/app-store.ts

import { create } from 'zustand';

export type Screen =
  | 'welcome'
  | 'data-preview'
  | 'column-mapping'
  | 'changeover-config'
  | 'optimizing'
  | 'results'
  | 'export';

export interface AppError {
  code: string;
  message: string;
  details?: string;
}

interface AppState {
  // State
  currentScreen: Screen;
  isLoading: boolean;
  loadingMessage: string | null;
  error: AppError | null;
  
  // Actions
  navigateTo: (screen: Screen) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  setError: (error: AppError) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentScreen: 'welcome',
  isLoading: false,
  loadingMessage: null,
  error: null,
  
  // Actions
  navigateTo: (screen) => set({ currentScreen: screen, error: null }),
  
  setLoading: (isLoading, message) => set({ 
    isLoading, 
    loadingMessage: message ?? null 
  }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  clearError: () => set({ error: null }),
  
  reset: () => set({
    currentScreen: 'welcome',
    isLoading: false,
    loadingMessage: null,
    error: null,
  }),
}));
```

### Data Store

```typescript
// stores/data-store.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ParsedFile } from '@/services/parser';
import type { AttributeConfig, OptimizationResult } from '@/services/optimizer';

interface DataConfig {
  orderIdColumn: string | null;
  attributes: AttributeConfig[];
}

interface DataState {
  // State
  sourceFile: ParsedFile | null;
  config: DataConfig;
  result: OptimizationResult | null;
  
  // Actions
  setSourceFile: (file: ParsedFile) => void;
  clearSourceFile: () => void;
  
  setOrderIdColumn: (column: string) => void;
  
  addAttribute: (column: string, changeoverTime: number) => void;
  removeAttribute: (column: string) => void;
  updateAttributeTime: (column: string, time: number) => void;
  reorderAttributes: (fromIndex: number, toIndex: number) => void;
  
  setResult: (result: OptimizationResult) => void;
  clearResult: () => void;
  
  reset: () => void;
}

const initialConfig: DataConfig = {
  orderIdColumn: null,
  attributes: [],
};

export const useDataStore = create<DataState>()(
  immer((set) => ({
    // Initial state
    sourceFile: null,
    config: initialConfig,
    result: null,
    
    // File actions
    setSourceFile: (file) => set((state) => {
      state.sourceFile = file;
      state.config = initialConfig;
      state.result = null;
    }),
    
    clearSourceFile: () => set((state) => {
      state.sourceFile = null;
      state.config = initialConfig;
      state.result = null;
    }),
    
    // Config actions
    setOrderIdColumn: (column) => set((state) => {
      state.config.orderIdColumn = column;
    }),
    
    addAttribute: (column, changeoverTime) => set((state) => {
      // Don't add duplicates
      if (state.config.attributes.some(a => a.column === column)) return;
      
      state.config.attributes.push({ column, changeoverTime });
    }),
    
    removeAttribute: (column) => set((state) => {
      state.config.attributes = state.config.attributes.filter(
        a => a.column !== column
      );
    }),
    
    updateAttributeTime: (column, time) => set((state) => {
      const attr = state.config.attributes.find(a => a.column === column);
      if (attr) attr.changeoverTime = time;
    }),
    
    reorderAttributes: (fromIndex, toIndex) => set((state) => {
      const attrs = state.config.attributes;
      const [removed] = attrs.splice(fromIndex, 1);
      attrs.splice(toIndex, 0, removed);
    }),
    
    // Result actions
    setResult: (result) => set({ result }),
    clearResult: () => set({ result: null }),
    
    // Reset
    reset: () => set({
      sourceFile: null,
      config: initialConfig,
      result: null,
    }),
  }))
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Get orders ready for optimization.
 */
export function useOrders() {
  return useDataStore((state) => {
    if (!state.sourceFile || !state.config.orderIdColumn) return [];
    
    return state.sourceFile.rows.map((row, index) => ({
      id: String(row[state.config.orderIdColumn!] ?? `row-${index}`),
      originalIndex: index,
      values: Object.fromEntries(
        state.config.attributes.map(attr => [
          attr.column,
          String(row[attr.column] ?? ''),
        ])
      ),
    }));
  });
}

/**
 * Check if config is valid for optimization.
 */
export function useIsConfigValid() {
  return useDataStore((state) => {
    return (
      state.sourceFile !== null &&
      state.config.orderIdColumn !== null &&
      state.config.attributes.length > 0 &&
      state.config.attributes.every(a => a.changeoverTime > 0)
    );
  });
}
```

### License Store

```typescript
// stores/license-store.ts

import { create } from 'zustand';

export type Tier = 'free' | 'pro';

export interface LicenseInfo {
  key: string;
  email: string;
  activatedAt: string;
  expiresAt: string | null; // null = perpetual
}

export type Feature =
  | 'unlimited-orders'
  | 'unlimited-attributes'
  | 'pdf-export'
  | 'templates'
  | 'summary-stats';

interface LicenseState {
  // State
  tier: Tier;
  license: LicenseInfo | null;
  isValidating: boolean;
  
  // Actions
  setLicense: (license: LicenseInfo) => void;
  clearLicense: () => void;
  setValidating: (isValidating: boolean) => void;
  
  // Checks
  checkFeature: (feature: Feature) => boolean;
  checkOrderLimit: (count: number) => boolean;
  checkAttributeLimit: (count: number) => boolean;
}

// Free tier limits
const FREE_ORDER_LIMIT = 50;
const FREE_ATTRIBUTE_LIMIT = 2;

export const useLicenseStore = create<LicenseState>((set, get) => ({
  // Initial state
  tier: 'free',
  license: null,
  isValidating: false,
  
  // Actions
  setLicense: (license) => set({
    tier: 'pro',
    license,
  }),
  
  clearLicense: () => set({
    tier: 'free',
    license: null,
  }),
  
  setValidating: (isValidating) => set({ isValidating }),
  
  // Checks
  checkFeature: (feature) => {
    return get().tier === 'pro';
  },
  
  checkOrderLimit: (count) => {
    if (get().tier === 'pro') return true;
    return count <= FREE_ORDER_LIMIT;
  },
  
  checkAttributeLimit: (count) => {
    if (get().tier === 'pro') return true;
    return count <= FREE_ATTRIBUTE_LIMIT;
  },
}));

// ============================================================================
// SELECTORS
// ============================================================================

export function useIsPro() {
  return useLicenseStore((state) => state.tier === 'pro');
}

export function useOrderLimit() {
  return useLicenseStore((state) => 
    state.tier === 'pro' ? Infinity : FREE_ORDER_LIMIT
  );
}

export function useAttributeLimit() {
  return useLicenseStore((state) =>
    state.tier === 'pro' ? Infinity : FREE_ATTRIBUTE_LIMIT
  );
}
```

### Settings Store

```typescript
// stores/settings-store.ts

import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';
export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: string;
}

export interface ExportDefaults {
  format: ExportFormat;
  includeOriginal: boolean;
  includeSummary: boolean;
}

interface SettingsState {
  // State
  language: string;
  theme: Theme;
  exportDefaults: ExportDefaults;
  recentFiles: RecentFile[];
  telemetryEnabled: boolean;
  
  // Actions
  setLanguage: (language: string) => void;
  setTheme: (theme: Theme) => void;
  setExportDefaults: (defaults: Partial<ExportDefaults>) => void;
  addRecentFile: (file: RecentFile) => void;
  removeRecentFile: (path: string) => void;
  clearRecentFiles: () => void;
  setTelemetry: (enabled: boolean) => void;
  
  // Persistence
  hydrate: (settings: Partial<SettingsState>) => void;
  toJSON: () => Partial<SettingsState>;
}

const MAX_RECENT_FILES = 10;

const defaultExportDefaults: ExportDefaults = {
  format: 'xlsx',
  includeOriginal: true,
  includeSummary: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  language: 'en',
  theme: 'system',
  exportDefaults: defaultExportDefaults,
  recentFiles: [],
  telemetryEnabled: false,
  
  // Actions
  setLanguage: (language) => set({ language }),
  
  setTheme: (theme) => set({ theme }),
  
  setExportDefaults: (defaults) => set((state) => ({
    exportDefaults: { ...state.exportDefaults, ...defaults },
  })),
  
  addRecentFile: (file) => set((state) => {
    // Remove if already exists
    const filtered = state.recentFiles.filter(f => f.path !== file.path);
    // Add to front
    const updated = [file, ...filtered].slice(0, MAX_RECENT_FILES);
    return { recentFiles: updated };
  }),
  
  removeRecentFile: (path) => set((state) => ({
    recentFiles: state.recentFiles.filter(f => f.path !== path),
  })),
  
  clearRecentFiles: () => set({ recentFiles: [] }),
  
  setTelemetry: (enabled) => set({ telemetryEnabled: enabled }),
  
  // Persistence
  hydrate: (settings) => set(settings),
  
  toJSON: () => {
    const { hydrate, toJSON, ...state } = get() as any;
    return state;
  },
}));
```

---

## 3. Persistent Storage (Main Process)

### Storage Service

```typescript
// main/services/storage-service.ts

import { app } from 'electron';
import Store from 'electron-store';
import path from 'path';
import fs from 'fs/promises';

// ============================================================================
// TYPES
// ============================================================================

interface StoredSettings {
  version: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  exportDefaults: {
    format: 'xlsx' | 'csv' | 'pdf';
    includeOriginal: boolean;
    includeSummary: boolean;
  };
  recentFiles: Array<{
    path: string;
    name: string;
    lastOpened: string;
  }>;
  windowState: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    maximized: boolean;
  };
  telemetryEnabled: boolean;
}

interface StoredLicense {
  key: string;
  email: string;
  activatedAt: string;
  expiresAt: string | null;
  machineId: string;
}

interface StoredTemplate {
  id: string;
  name: string;
  created: string;
  modified: string;
  config: {
    orderIdColumn: string;
    attributes: Array<{
      column: string;
      changeoverTime: number;
    }>;
  };
}

// ============================================================================
// SETTINGS STORE
// ============================================================================

const settingsStore = new Store<StoredSettings>({
  name: 'settings',
  defaults: {
    version: '1.0.0',
    language: 'en',
    theme: 'system',
    exportDefaults: {
      format: 'xlsx',
      includeOriginal: true,
      includeSummary: true,
    },
    recentFiles: [],
    windowState: {
      width: 1200,
      height: 800,
      maximized: false,
    },
    telemetryEnabled: false,
  },
});

export function getSettings(): StoredSettings {
  return settingsStore.store;
}

export function setSettings(settings: Partial<StoredSettings>): void {
  Object.entries(settings).forEach(([key, value]) => {
    settingsStore.set(key, value);
  });
}

export function getWindowState() {
  return settingsStore.get('windowState');
}

export function setWindowState(state: StoredSettings['windowState']) {
  settingsStore.set('windowState', state);
}

// ============================================================================
// LICENSE STORE
// ============================================================================

const licenseStore = new Store<{ license: StoredLicense | null }>({
  name: 'license',
  encryptionKey: 'changeoveroptimizer-license-key', // Basic obfuscation
  defaults: {
    license: null,
  },
});

export function getLicense(): StoredLicense | null {
  return licenseStore.get('license');
}

export function setLicense(license: StoredLicense): void {
  licenseStore.set('license', license);
}

export function clearLicense(): void {
  licenseStore.set('license', null);
}

// ============================================================================
// TEMPLATES STORE (Pro feature)
// ============================================================================

const templatesDir = path.join(app.getPath('userData'), 'templates');

async function ensureTemplatesDir() {
  try {
    await fs.mkdir(templatesDir, { recursive: true });
  } catch (e) {
    // Ignore if exists
  }
}

export async function getTemplates(): Promise<StoredTemplate[]> {
  await ensureTemplatesDir();
  
  try {
    const files = await fs.readdir(templatesDir);
    const templates: StoredTemplate[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const content = await fs.readFile(
          path.join(templatesDir, file),
          'utf-8'
        );
        templates.push(JSON.parse(content));
      } catch (e) {
        console.error(`Failed to read template ${file}:`, e);
      }
    }
    
    return templates.sort((a, b) => 
      new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );
  } catch (e) {
    console.error('Failed to read templates:', e);
    return [];
  }
}

export async function saveTemplate(template: StoredTemplate): Promise<void> {
  await ensureTemplatesDir();
  
  const filename = `${template.id}.json`;
  const filepath = path.join(templatesDir, filename);
  
  await fs.writeFile(filepath, JSON.stringify(template, null, 2), 'utf-8');
}

export async function deleteTemplate(id: string): Promise<void> {
  const filepath = path.join(templatesDir, `${id}.json`);
  
  try {
    await fs.unlink(filepath);
  } catch (e) {
    // Ignore if not exists
  }
}

// ============================================================================
// MIGRATION
// ============================================================================

export function migrateSettings(): void {
  const version = settingsStore.get('version');
  
  // Add migrations here as needed
  // if (version === '0.9.0') { ... }
  
  settingsStore.set('version', app.getVersion());
}
```

### IPC Handlers

```typescript
// main/ipc-handlers.ts

import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import {
  getSettings,
  setSettings,
  getLicense,
  setLicense,
  clearLicense,
  getTemplates,
  saveTemplate,
  deleteTemplate,
} from './services/storage-service';
import { activateLicenseWithPaddle } from './services/license-service';

export function registerIpcHandlers() {
  // =========================================================================
  // FILE OPERATIONS
  // =========================================================================
  
  ipcMain.handle('dialog:openFile', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;
    
    const result = await dialog.showOpenDialog(window, {
      title: 'Open Production Schedule',
      filters: [
        { name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    const filePath = result.filePaths[0];
    const buffer = await fs.readFile(filePath);
    
    return {
      path: filePath,
      name: filePath.split(/[/\\]/).pop() ?? 'unknown',
      buffer: buffer.buffer,
    };
  });
  
  ipcMain.handle('dialog:saveFile', async (_, options: {
    defaultName: string;
    filters: Array<{ name: string; extensions: string[] }>;
  }) => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;
    
    const result = await dialog.showSaveDialog(window, {
      title: 'Save Optimized Schedule',
      defaultPath: options.defaultName,
      filters: options.filters,
    });
    
    if (result.canceled || !result.filePath) {
      return null;
    }
    
    return result.filePath;
  });
  
  ipcMain.handle('file:write', async (_, path: string, data: ArrayBuffer) => {
    await fs.writeFile(path, Buffer.from(data));
    return true;
  });
  
  // =========================================================================
  // SETTINGS
  // =========================================================================
  
  ipcMain.handle('settings:get', () => {
    return getSettings();
  });
  
  ipcMain.handle('settings:set', (_, settings) => {
    setSettings(settings);
    return true;
  });
  
  // =========================================================================
  // LICENSE
  // =========================================================================
  
  ipcMain.handle('license:get', () => {
    return getLicense();
  });
  
  ipcMain.handle('license:activate', async (_, key: string) => {
    return activateLicenseWithPaddle(key);
  });
  
  ipcMain.handle('license:deactivate', () => {
    clearLicense();
    return true;
  });
  
  // =========================================================================
  // TEMPLATES
  // =========================================================================
  
  ipcMain.handle('templates:list', async () => {
    return getTemplates();
  });
  
  ipcMain.handle('templates:save', async (_, template) => {
    await saveTemplate(template);
    return true;
  });
  
  ipcMain.handle('templates:delete', async (_, id: string) => {
    await deleteTemplate(id);
    return true;
  });
}
```

---

## 4. Export Generation (Output)

### Exporter Service

```typescript
// services/exporter.ts

import * as XLSX from 'xlsx';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { OptimizationResult, OptimizedOrder, AttributeStat } from './optimizer';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'clipboard';

export interface ExportOptions {
  format: ExportFormat;
  includeOriginal: boolean;
  includeSummary: boolean;
  filename?: string;
}

export interface ExportResult {
  blob?: Blob;
  text?: string;
  filename: string;
  mimeType: string;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export async function generateExport(
  result: OptimizationResult,
  sourceRows: Record<string, unknown>[],
  options: ExportOptions
): Promise<ExportResult> {
  switch (options.format) {
    case 'xlsx':
      return generateExcel(result, sourceRows, options);
    case 'csv':
      return generateCSV(result, sourceRows);
    case 'pdf':
      return generatePDF(result, options);
    case 'clipboard':
      return generateClipboard(result);
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
}

// ============================================================================
// EXCEL EXPORT
// ============================================================================

function generateExcel(
  result: OptimizationResult,
  sourceRows: Record<string, unknown>[],
  options: ExportOptions
): ExportResult {
  const workbook = XLSX.utils.book_new();
  
  // Sheet 1: Optimized Sequence
  const sequenceData = result.sequence.map((order, index) => ({
    '#': index + 1,
    'Order ID': order.id,
    ...order.values,
    'Changeover (min)': order.changeoverTime,
    'Changed': order.changeoverReasons.join(', ') || '—',
  }));
  
  const sequenceSheet = XLSX.utils.json_to_sheet(sequenceData);
  XLSX.utils.book_append_sheet(workbook, sequenceSheet, 'Optimized Sequence');
  
  // Sheet 2: Summary (if enabled)
  if (options.includeSummary) {
    const summaryData = [
      { Metric: 'Total Orders', Value: result.sequence.length },
      { Metric: 'Changeover Before (min)', Value: result.totalBefore },
      { Metric: 'Changeover After (min)', Value: result.totalAfter },
      { Metric: 'Time Saved (min)', Value: result.savings },
      { Metric: 'Reduction %', Value: `${result.savingsPercent}%` },
      { Metric: '', Value: '' },
      { Metric: 'Per Attribute:', Value: '' },
      ...result.attributeStats.map(stat => ({
        Metric: `  ${stat.column}`,
        Value: `${stat.changeoverCount} changes, ${stat.totalTime} min`,
      })),
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }
  
  // Sheet 3: Original (if enabled)
  if (options.includeOriginal) {
    const originalSheet = XLSX.utils.json_to_sheet(sourceRows);
    XLSX.utils.book_append_sheet(workbook, originalSheet, 'Original Data');
  }
  
  // Generate blob
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  
  const filename = options.filename ?? 'optimized-schedule.xlsx';
  
  return {
    blob,
    filename,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

// ============================================================================
// CSV EXPORT
// ============================================================================

function generateCSV(
  result: OptimizationResult,
  sourceRows: Record<string, unknown>[]
): ExportResult {
  const data = result.sequence.map((order, index) => ({
    sequence: index + 1,
    order_id: order.id,
    ...order.values,
    changeover_minutes: order.changeoverTime,
    changed_attributes: order.changeoverReasons.join('; '),
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  return {
    text: csv,
    blob: new Blob([csv], { type: 'text/csv' }),
    filename: 'optimized-schedule.csv',
    mimeType: 'text/csv',
  };
}

// ============================================================================
// PDF EXPORT (Pro feature)
// ============================================================================

async function generatePDF(
  result: OptimizationResult,
  options: ExportOptions
): Promise<ExportResult> {
  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape' as const,
    
    content: [
      // Header
      {
        text: 'Optimized Production Schedule',
        style: 'header',
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      
      // Summary box
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            [
              { text: 'Total Orders', style: 'metricLabel' },
              { text: 'Before', style: 'metricLabel' },
              { text: 'After', style: 'metricLabel' },
              { text: 'Savings', style: 'metricLabel' },
            ],
            [
              { text: String(result.sequence.length), style: 'metricValue' },
              { text: `${result.totalBefore} min`, style: 'metricValue' },
              { text: `${result.totalAfter} min`, style: 'metricValue' },
              { text: `${result.savings} min (${result.savingsPercent}%)`, style: 'metricValueHighlight' },
            ],
          ],
        },
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      
      // Sequence table
      {
        text: 'Optimized Sequence',
        style: 'subheader',
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', ...Object.keys(result.sequence[0]?.values ?? {}).map(() => '*'), 'auto', '*'],
          body: [
            // Header row
            ['#', 'Order ID', ...Object.keys(result.sequence[0]?.values ?? {}), 'Changeover', 'Changed'],
            // Data rows
            ...result.sequence.map((order, index) => [
              index + 1,
              order.id,
              ...Object.values(order.values),
              `${order.changeoverTime} min`,
              order.changeoverReasons.join(', ') || '—',
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      },
      
      // Per-attribute breakdown (if enabled)
      ...(options.includeSummary ? [
        {
          text: 'Per-Attribute Summary',
          style: 'subheader',
          margin: [0, 20, 0, 10] as [number, number, number, number],
          pageBreak: 'before' as const,
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: [
              ['Attribute', 'Changes', 'Total Time'],
              ...result.attributeStats.map(stat => [
                stat.column,
                String(stat.changeoverCount),
                `${stat.totalTime} min`,
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ] : []),
      
      // Footer
      {
        text: `Generated by ChangeoverOptimizer on ${new Date().toLocaleDateString()}`,
        style: 'footer',
        margin: [0, 30, 0, 0] as [number, number, number, number],
      },
    ],
    
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        color: '#1a56db', // Brand blue
      },
      subheader: {
        fontSize: 14,
        bold: true,
        color: '#374151',
      },
      metricLabel: {
        fontSize: 10,
        color: '#6b7280',
        alignment: 'center' as const,
      },
      metricValue: {
        fontSize: 16,
        bold: true,
        alignment: 'center' as const,
      },
      metricValueHighlight: {
        fontSize: 16,
        bold: true,
        color: '#059669', // Green
        alignment: 'center' as const,
      },
      footer: {
        fontSize: 9,
        color: '#9ca3af',
        alignment: 'center' as const,
      },
    },
    
    defaultStyle: {
      fontSize: 10,
    },
  };
  
  return new Promise((resolve, reject) => {
    const pdfDoc = pdfMake.createPdf(docDefinition);
    
    pdfDoc.getBlob((blob) => {
      resolve({
        blob,
        filename: options.filename ?? 'optimized-schedule.pdf',
        mimeType: 'application/pdf',
      });
    });
  });
}

// ============================================================================
// CLIPBOARD EXPORT
// ============================================================================

function generateClipboard(result: OptimizationResult): ExportResult {
  // Tab-separated for Excel paste
  const headers = ['#', 'Order ID', ...Object.keys(result.sequence[0]?.values ?? {}), 'Changeover (min)'];
  
  const rows = result.sequence.map((order, index) => [
    index + 1,
    order.id,
    ...Object.values(order.values),
    order.changeoverTime,
  ]);
  
  const text = [
    headers.join('\t'),
    ...rows.map(row => row.join('\t')),
  ].join('\n');
  
  return {
    text,
    filename: 'clipboard',
    mimeType: 'text/plain',
  };
}
```

---

## 5. Type Definitions Summary

```typescript
// types/index.ts

// Re-export all types
export * from './data';
export * from './config';
export * from './optimizer';

// ============================================================================
// data.ts
// ============================================================================

export interface ParsedFile {
  name: string;
  path: string;
  sheets: string[];
  activeSheet: string;
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
}

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: string;
}

// ============================================================================
// config.ts
// ============================================================================

export interface AttributeConfig {
  column: string;
  changeoverTime: number;
  parallelGroup: string; // "default", "A", "B", "C", "D" - for parallel changeovers
}

export interface Template {
  id: string;
  name: string;
  created: string;
  modified: string;
  config: {
    orderIdColumn: string;
    attributes: AttributeConfig[];
  };
}

export interface Settings {
  version: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  exportDefaults: ExportDefaults;
  recentFiles: RecentFile[];
  telemetryEnabled: boolean;
}

export interface ExportDefaults {
  format: 'xlsx' | 'csv' | 'pdf';
  includeOriginal: boolean;
  includeSummary: boolean;
}

// ============================================================================
// optimizer.ts
// ============================================================================

export interface Order {
  id: string;
  originalIndex: number;
  values: Record<string, string>;
}

export interface OptimizedOrder extends Order {
  sequenceNumber: number;
  changeoverTime: number; // Legacy: same as workTime for backward compatibility
  changeoverReasons: string[];
  workTime: number;  // Sum of all changeover times (labor cost)
  downtime: number;  // Max per parallel group, sum across groups (production impact)
}

export interface OptimizationResult {
  sequence: OptimizedOrder[];
  // Work time metrics (sum of all changeover times - labor cost)
  totalBefore: number;
  totalAfter: number;
  savings: number;
  savingsPercent: number;
  // Downtime metrics (considering parallel groups - production impact)
  totalDowntimeBefore: number;
  totalDowntimeAfter: number;
  downtimeSavings: number;
  downtimeSavingsPercent: number;
  attributeStats: AttributeStat[];
}

export interface AttributeStat {
  column: string;
  changeoverCount: number;
  totalTime: number;
  parallelGroup: string;
}
```

---

## 6. Data Validation

```typescript
// services/validator.ts

import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

export const AttributeConfigSchema = z.object({
  column: z.string().min(1),
  changeoverTime: z.number().positive(),
  parallelGroup: z.string().default('default'),
});

export const OptimizationConfigSchema = z.object({
  orderIdColumn: z.string().min(1),
  attributes: z.array(AttributeConfigSchema).min(1),
});

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  created: z.string().datetime(),
  modified: z.string().datetime(),
  config: OptimizationConfigSchema,
});

export const SettingsSchema = z.object({
  version: z.string(),
  language: z.string().length(2),
  theme: z.enum(['light', 'dark', 'system']),
  exportDefaults: z.object({
    format: z.enum(['xlsx', 'csv', 'pdf']),
    includeOriginal: z.boolean(),
    includeSummary: z.boolean(),
  }),
  recentFiles: z.array(z.object({
    path: z.string(),
    name: z.string(),
    lastOpened: z.string().datetime(),
  })),
  telemetryEnabled: z.boolean(),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateConfig(config: unknown) {
  return OptimizationConfigSchema.safeParse(config);
}

export function validateTemplate(template: unknown) {
  return TemplateSchema.safeParse(template);
}

export function validateSettings(settings: unknown) {
  return SettingsSchema.safeParse(settings);
}

// ============================================================================
// DATA VALIDATION
// ============================================================================

export interface DataValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateData(
  rows: Record<string, unknown>[],
  orderIdColumn: string,
  attributes: Array<{ column: string }>
): DataValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check row count
  if (rows.length === 0) {
    errors.push('No data rows found');
    return { valid: false, errors, warnings };
  }
  
  // Check Order ID column exists
  if (!(orderIdColumn in rows[0])) {
    errors.push(`Order ID column "${orderIdColumn}" not found`);
  }
  
  // Check attribute columns exist
  for (const attr of attributes) {
    if (!(attr.column in rows[0])) {
      errors.push(`Attribute column "${attr.column}" not found`);
    }
  }
  
  // Check for empty Order IDs
  const emptyIds = rows.filter(row => !row[orderIdColumn]).length;
  if (emptyIds > 0) {
    warnings.push(`${emptyIds} rows have empty Order IDs`);
  }
  
  // Check for duplicate Order IDs
  const ids = rows.map(row => String(row[orderIdColumn] ?? ''));
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length > 0) {
    warnings.push(`${duplicates.length} duplicate Order IDs found`);
  }
  
  // Check for empty attribute values
  for (const attr of attributes) {
    const emptyCount = rows.filter(row => !row[attr.column]).length;
    if (emptyCount > 0) {
      warnings.push(`${emptyCount} rows have empty "${attr.column}"`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

---

## Summary

### Data Layer Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Parser | `services/parser.ts` | File import (SheetJS) |
| App Store | `stores/app-store.ts` | Navigation, loading, errors |
| Data Store | `stores/data-store.ts` | File data, config, results |
| License Store | `stores/license-store.ts` | Tier, license info |
| Settings Store | `stores/settings-store.ts` | Preferences |
| Storage Service | `main/services/storage-service.ts` | Persistent storage |
| Exporter | `services/exporter.ts` | File export |
| Validator | `services/validator.ts` | Data validation |

### Storage Locations

| Data | Storage | Encryption |
|------|---------|------------|
| Settings | `electron-store` (settings) | No |
| License | `electron-store` (license) | Basic obfuscation |
| Templates | JSON files in userData | No |
| Window state | `electron-store` (settings) | No |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2024-12-20 | Initial data layer specification |
| | | |

---

*This document provides the complete data architecture. Implementation follows TD-02 algorithm and TD-07 phases.*
