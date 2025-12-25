# TD-05: Changeover Matrix

**Value-specific changeover time definitions for precision optimization**

---

## Purpose

This document specifies the Changeover Matrix feature, which allows defining specific changeover times for individual value-to-value transitions. Instead of using a single default changeover time per attribute (e.g., "Color change = 15 min"), the matrix enables granular definitions like "Red → Blue = 20 min" but "Red → White = 8 min".

---

## 1. Overview

### Why a Changeover Matrix?

In real manufacturing environments, changeover times vary significantly depending on the specific transition:

| Transition | Reason | Time |
|------------|--------|------|
| Light → Dark color | Simple flush | 5 min |
| Dark → Light color | Full line purge | 25 min |
| Small → Large size | Die change only | 10 min |
| Large → Small size | Die + guides | 18 min |

The optimizer uses these specific times instead of averages, producing more accurate schedules.

### Integration Points

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   CHANGEOVER MATRIX DATA FLOW                                               │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│                                                                             │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│   │             │         │             │         │             │          │
│   │    SMED     │────────▶│   Matrix    │────────▶│  Optimizer  │          │
│   │   Studies   │ import  │   Editor    │ lookup  │             │          │
│   │             │         │             │         │             │          │
│   └─────────────┘         └──────┬──────┘         └─────────────┘          │
│                                  │                                          │
│                                  │ persist                                  │
│                                  ▼                                          │
│                           ┌─────────────┐                                   │
│                           │             │                                   │
│                           │   SQLite    │                                   │
│                           │  Database   │                                   │
│                           │             │                                   │
│                           └─────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Model

### Entity Relationship

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   CHANGEOVER MATRIX SCHEMA                                                  │
│                                                                             │
│   ┌─────────────────────┐         ┌─────────────────────┐                  │
│   │                     │         │                     │                  │
│   │ changeover_         │────────▶│   changeover_       │                  │
│   │ attributes          │  1:N    │      matrix         │                  │
│   │                     │         │                     │                  │
│   └─────────────────────┘         └──────────┬──────────┘                  │
│                                              │                              │
│                                              │ optional FK                  │
│                                              ▼                              │
│                                   ┌─────────────────────┐                  │
│                                   │                     │                  │
│                                   │    smed_studies     │                  │
│                                   │   (source tracking) │                  │
│                                   │                     │                  │
│                                   └─────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Changeover Attributes Table

Master table defining attributes that trigger changeovers.

```typescript
// src-electron/db/schema/changeovers.ts
export const changeoverAttributes = sqliteTable('changeover_attributes', {
  id: text('id').primaryKey(),

  // Identification
  name: text('name').notNull(),           // Internal: "color", "size"
  displayName: text('display_name').notNull(), // UI: "Color", "Size"

  // Configuration
  hierarchyLevel: integer('hierarchy_level').notNull(), // Priority (lower = higher)
  defaultMinutes: real('default_minutes').notNull().default(0),
  parallelGroup: text('parallel_group').notNull().default('default'),

  // State
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (CUID2) |
| `name` | TEXT | Internal identifier (lowercase, underscore) |
| `displayName` | TEXT | User-facing name |
| `hierarchyLevel` | INTEGER | Priority order (0 = highest priority) |
| `defaultMinutes` | REAL | Fallback time when no matrix entry exists |
| `parallelGroup` | TEXT | "default", "A", "B", "C", "D" for parallel changeovers |
| `sortOrder` | INTEGER | UI display order |
| `isActive` | BOOLEAN | Soft delete flag |

### Changeover Matrix Table

Value-to-value transition times with source tracking.

```typescript
export const changeoverMatrix = sqliteTable('changeover_matrix', {
  id: text('id').primaryKey(),

  // Reference
  attributeId: text('attribute_id').notNull()
    .references(() => changeoverAttributes.id, { onDelete: 'cascade' }),

  // Transition
  fromValue: text('from_value').notNull(),
  toValue: text('to_value').notNull(),
  timeMinutes: real('time_minutes').notNull(),

  // Source tracking
  source: text('source', {
    enum: ['manual', 'smed_standard', 'smed_average', 'imported']
  }).notNull().default('manual'),
  smedStudyId: text('smed_study_id')
    .references(() => smedStudies.id, { onDelete: 'set null' }),
  notes: text('notes'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (CUID2) |
| `attributeId` | TEXT | FK to changeover_attributes |
| `fromValue` | TEXT | Starting value (e.g., "Red") |
| `toValue` | TEXT | Target value (e.g., "Blue") |
| `timeMinutes` | REAL | Changeover time in minutes |
| `source` | ENUM | Data source for traceability |
| `smedStudyId` | TEXT | Optional FK to smed_studies |
| `notes` | TEXT | Optional notes |

### Source Types

| Source | Description |
|--------|-------------|
| `manual` | User entered directly in matrix editor |
| `smed_standard` | Imported from standardized SMED study |
| `smed_average` | Calculated average from multiple SMED observations |
| `imported` | Imported from external system (CSV, ERP) |

### Indexes

```sql
-- Efficient lookup by attribute name
CREATE INDEX changeover_attributes_name_idx
  ON changeover_attributes(name);

-- Filter active attributes
CREATE INDEX changeover_attributes_active_idx
  ON changeover_attributes(is_active);

-- Primary lookup pattern for optimizer
CREATE INDEX changeover_matrix_attr_from_to_idx
  ON changeover_matrix(attribute_id, from_value, to_value);
```

---

## 3. UI Workflow

### Matrix Editor Screen

**Location**: `src/screens/ChangeoverMatrixScreen.tsx`

The screen is divided into two panels:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Changeover Matrix                                          [← Back]        │
│  Define value-specific changeover times for precise optimization            │
├───────────────────┬─────────────────────────────────────────────────────────┤
│                   │                                                         │
│   Attributes      │   Color Matrix            [Import from SMED] [Save]     │
│   ─────────────   │   ─────────────────────────────────────────────────     │
│                   │                                                         │
│   [+ Add]         │   [Add value input field]    [+]                        │
│                   │                                                         │
│   ┌─────────────┐ │   [Red] [Blue] [White] [Green] [×]                     │
│   │ Color       │ │                                                         │
│   │ Default: 15 │ │   ┌───────────┬───────┬───────┬───────┬───────┐        │
│   └─────────────┘ │   │ From↓/To→ │  Red  │ Blue  │ White │ Green │        │
│                   │   ├───────────┼───────┼───────┼───────┼───────┤        │
│   ┌─────────────┐ │   │   Red     │   —   │  20   │   8   │  12   │        │
│   │ Size        │ │   │   Blue    │  18   │   —   │  10   │  15   │        │
│   │ Default: 10 │ │   │   White   │  25   │  22   │   —   │   8   │        │
│   └─────────────┘ │   │   Green   │  15   │  12   │  10   │   —   │        │
│                   │   └───────────┴───────┴───────┴───────┴───────┘        │
│                   │                                                         │
│                   │   Empty cells use default time (15 min).                │
│                   │                                                         │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

### User Workflow

1. **Create Attribute**: Click [+ Add], enter internal name, display name, and default time
2. **Add Values**: Type value names (e.g., "Red", "Blue") and press Enter
3. **Enter Times**: Click matrix cells and enter specific changeover times
4. **Save Matrix**: Click [Save Matrix] to persist all entries
5. **Import from SMED**: Click [Import from SMED] to pull times from standardized studies

### Value Management

- Values are sorted alphabetically for consistent display
- Removing a value cascades deletion to related matrix entries
- Diagonal cells (same from/to) are disabled (no changeover needed)
- Empty cells fall back to the attribute's default time during optimization

---

## 4. SMED Integration

### Import Dialog

**Component**: `src/components/features/SmedImportDialog.tsx`

When a user clicks "Import from SMED":

1. Dialog fetches all SMED studies with `status = 'standardized'`
2. User selects a study showing its name and current time
3. User maps the time to specific from/to values
4. Import creates a matrix entry with `source = 'smed_standard'`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Import from SMED Study                                               [×]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Select SMED Study                                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ ● Color Change: Red to Blue                              ⏱ 18 min  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │   Size Changeover: Small to Large                        ⏱ 12 min  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Map this time to a specific transition:                                    │
│                                                                             │
│  From Value: [Red        ]    To Value: [Blue       ]                       │
│                                                                             │
│  Will create: Red → Blue = 18 min                                           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                [Cancel]      [Import]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Traceability

When a matrix entry is imported from SMED:
- `source` is set to `'smed_standard'`
- `smedStudyId` stores the reference to the originating study
- `notes` is auto-populated with "Imported from SMED study: {study name}"

This allows users to trace where changeover times came from and update them if the SMED study is revised.

---

## 5. Optimizer Integration

### Lookup Strategy

During optimization, the system can use matrix lookups for precise timing:

```typescript
// In src/services/optimizer.ts
export function optimize(
  orders: Order[],
  attributes: AttributeConfig[],
  options?: {
    useMatrixLookup?: boolean;
    matrixData?: Map<string, number>;  // Pre-fetched entries
  }
): OptimizationResult
```

### Prefetch for Performance

Before optimization, all relevant matrix entries are loaded in a single query:

```typescript
// src-electron/db/queries/changeovers.ts
export function prefetchMatrixData(
  attributeNames: string[],
  valuesByAttribute: Map<string, Set<string>>
): Map<string, number>
```

The result is a Map with keys in format `"attributeName:fromValue:toValue"`.

### Lookup with Fallback

During changeover calculation:

```
1. Build lookup key: "color:Red:Blue"
2. Check matrixData.get(key)
3. If found → use matrix time
4. If not found → use attribute.changeoverTime (default)
```

### Example

```typescript
// Orders have these Color values: Red, Blue, White
const valuesByAttribute = new Map([
  ['color', new Set(['Red', 'Blue', 'White'])]
]);

// Prefetch returns entries like:
// "color:Red:Blue" → 20
// "color:Blue:Red" → 18
// "color:White:Red" → 25

// During optimization:
// Previous: Red, Current: Blue
// Key: "color:Red:Blue" → Found: 20 min

// Previous: Blue, Current: Green (not in matrix)
// Key: "color:Blue:Green" → Not found: use default 15 min
```

---

## 6. API Reference

### IPC Channels

All channels are registered in `src-electron/main.ts` and whitelisted in `src-electron/preload.ts`.

#### Attribute Operations

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `changeover:get_all_attributes` | — | `ChangeoverAttribute[]` | List all attributes |
| `changeover:get_active_attributes` | — | `ChangeoverAttribute[]` | List active attributes only |
| `changeover:get_attribute_by_id` | `{ id: string }` | `ChangeoverAttribute \| undefined` | Get single attribute |
| `changeover:upsert_attribute` | `{ data: ChangeoverAttributeInput }` | `ChangeoverAttribute` | Create or update attribute |
| `changeover:delete_attribute` | `{ id: string }` | `void` | Delete attribute (cascades to matrix) |

#### Matrix Operations

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `changeover:get_matrix` | `{ attributeId: string }` | `ChangeoverMatrixEntry[]` | Get all entries for attribute |
| `changeover:upsert_entry` | `{ data: ChangeoverMatrixInput }` | `ChangeoverMatrixEntry` | Create or update matrix entry |
| `changeover:delete_entry` | `{ id: string }` | `void` | Delete single matrix entry |

#### Optimizer Lookup

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `changeover:batch_lookup` | `{ lookups: Lookup[] }` | `Record<string, number>` | Batch lookup for specific transitions |
| `changeover:prefetch_matrix` | `{ attributeNames, valuesByAttribute }` | `Record<string, number>` | Prefetch all relevant matrix data |

#### SMED Import

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `changeover:import_smed` | `{ attributeId, fromValue, toValue, timeMinutes, smedStudyId, notes? }` | `ChangeoverMatrixEntry` | Import time from SMED study |

### Type Definitions

```typescript
// src/types/changeover.ts

interface ChangeoverAttribute {
  id: string;
  name: string;
  displayName: string;
  hierarchyLevel: number;
  defaultMinutes: number;
  parallelGroup: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface ChangeoverAttributeInput {
  name: string;
  displayName: string;
  hierarchyLevel: number;
  defaultMinutes: number;
  parallelGroup?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface ChangeoverMatrixEntry {
  id: string;
  attributeId: string;
  fromValue: string;
  toValue: string;
  timeMinutes: number;
  source: 'manual' | 'smed_standard' | 'smed_average' | 'imported';
  smedStudyId: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface ChangeoverMatrixInput {
  attributeId: string;
  fromValue: string;
  toValue: string;
  timeMinutes: number;
  source?: 'manual' | 'smed_standard' | 'smed_average' | 'imported';
  smedStudyId?: string;
  notes?: string;
}
```

### Frontend Usage

```typescript
// From React components
const attributes = await window.electron.invoke('changeover:get_all_attributes');

const entries = await window.electron.invoke('changeover:get_matrix', {
  attributeId: 'clx123abc...'
});

await window.electron.invoke('changeover:upsert_entry', {
  data: {
    attributeId: 'clx123abc...',
    fromValue: 'Red',
    toValue: 'Blue',
    timeMinutes: 20,
    source: 'manual'
  }
});

// Before optimization
const matrixData = await window.electron.invoke('changeover:prefetch_matrix', {
  attributeNames: ['color', 'size'],
  valuesByAttribute: {
    color: ['Red', 'Blue', 'White'],
    size: ['Small', 'Large']
  }
});
```

---

## 7. Migration

### SQL Migration

**File**: `src-electron/db/migrations/0003_changeover_matrix.sql`

```sql
-- Changeover attributes table
CREATE TABLE IF NOT EXISTS changeover_attributes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  hierarchy_level INTEGER NOT NULL,
  default_minutes REAL NOT NULL DEFAULT 0,
  parallel_group TEXT NOT NULL DEFAULT 'default',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS changeover_attributes_name_idx
  ON changeover_attributes(name);
CREATE INDEX IF NOT EXISTS changeover_attributes_active_idx
  ON changeover_attributes(is_active);

-- Changeover matrix table
CREATE TABLE IF NOT EXISTS changeover_matrix (
  id TEXT PRIMARY KEY,
  attribute_id TEXT NOT NULL REFERENCES changeover_attributes(id) ON DELETE CASCADE,
  from_value TEXT NOT NULL,
  to_value TEXT NOT NULL,
  time_minutes REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  smed_study_id TEXT REFERENCES smed_studies(id) ON DELETE SET NULL,
  notes TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS changeover_matrix_attr_from_to_idx
  ON changeover_matrix(attribute_id, from_value, to_value);
CREATE INDEX IF NOT EXISTS changeover_matrix_attribute_idx
  ON changeover_matrix(attribute_id);
```

---

## Summary

### Key Files

| File | Purpose |
|------|---------|
| `src-electron/db/schema/changeovers.ts` | Drizzle schema definitions |
| `src-electron/db/queries/changeovers.ts` | Database query functions |
| `src-electron/ipc-handlers.ts` | IPC handler implementations |
| `src/screens/ChangeoverMatrixScreen.tsx` | Matrix editor UI |
| `src/components/features/SmedImportDialog.tsx` | SMED import modal |
| `src/types/changeover.ts` | TypeScript type definitions |

### Feature Checklist

- [x] Database schema with source tracking
- [x] CRUD operations for attributes and matrix entries
- [x] Batch lookup for optimizer efficiency
- [x] Matrix editor UI with add/remove values
- [x] SMED study import with traceability
- [x] i18n translations for all UI strings
- [ ] Optimizer integration (planned)
- [ ] Bidirectional time auto-fill (optional enhancement)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2024-12-25 | Initial specification |
| | | |

---

*This document describes the Changeover Matrix feature. For related documentation, see [DATA_MODEL.md](DATA_MODEL.md), [ALGORITHM.md](ALGORITHM.md), and [SMED_MODULE.md](SMED_MODULE.md).*
