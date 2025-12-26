# Database Schema

## Overview

ChangeOverOptimizer uses SQLite for local data storage. The schema is managed with Drizzle ORM for type-safe database operations.

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

---

## Drizzle Schema

### Products & Orders

```typescript
// src/main/db/schema/products.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

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

```typescript
// src/main/db/schema/orders.ts
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

### Changeover Configuration

```typescript
// src/main/db/schema/changeovers.ts
export const changeoverAttributes = sqliteTable('changeover_attributes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  name: text('name').notNull(), // e.g., "color", "size", "die"
  displayName: text('display_name').notNull(),
  
  // Hierarchy position (1 = longest changeovers)
  hierarchyLevel: integer('hierarchy_level').notNull(),
  
  // Default time for this attribute change
  defaultMinutes: integer('default_minutes').default(0),
  
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

### Schedules

```typescript
// src/main/db/schema/schedules.ts
export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  name: text('name'),
  scheduleDate: text('schedule_date').notNull(), // ISO date
  
  // Status
  status: text('status', { 
    enum: ['draft', 'published', 'active', 'completed'] 
  }).default('draft'),
  
  // Metrics
  totalOrders: integer('total_orders').default(0),
  totalChangeovers: integer('total_changeovers').default(0),
  totalChangeoverMinutes: integer('total_changeover_minutes').default(0),
  productionMinutes: integer('production_minutes').default(0),
  
  // Comparison
  fifoChangeoverMinutes: integer('fifo_changeover_minutes'),
  savingsMinutes: integer('savings_minutes'),
  savingsPercent: real('savings_percent'),
  
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
});

export const scheduleItems = sqliteTable('schedule_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  scheduleId: text('schedule_id').notNull()
    .references(() => schedules.id, { onDelete: 'cascade' }),
  orderId: text('order_id').notNull()
    .references(() => orders.id),
  
  sequenceNumber: integer('sequence_number').notNull(),
  
  // Timing
  changeoverMinutes: integer('changeover_minutes').default(0),
  productionMinutes: integer('production_minutes').default(0),
  
  // Flags
  dueDateConflict: integer('due_date_conflict', { mode: 'boolean' }).default(false),
  
  // Actuals (filled during execution)
  actualChangeoverMinutes: integer('actual_changeover_minutes'),
  actualStartTime: integer('actual_start_time', { mode: 'timestamp' }),
  actualEndTime: integer('actual_end_time', { mode: 'timestamp' }),
});
```

### SMED Tables

```typescript
// src/main/db/schema/smed.ts
export const studies = sqliteTable('studies', {
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
  
  // Video reference (optional)
  videoUrl: text('video_url'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

export const steps = sqliteTable('steps', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  studyId: text('study_id').notNull()
    .references(() => studies.id, { onDelete: 'cascade' }),
  
  // Sequence
  sequenceNumber: integer('sequence_number').notNull(),
  
  // Content
  description: text('description').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  
  // Classification
  category: text('category', { 
    enum: ['preparation', 'removal', 'installation', 'adjustment', 'cleanup', 'other'] 
  }).default('other'),
  
  operationType: text('operation_type', { 
    enum: ['internal', 'external'] 
  }).default('internal'),
  
  // Notes
  notes: text('notes'),
  
  // Video timestamp
  videoTimestamp: integer('video_timestamp'), // Seconds into video
  
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

export const improvements = sqliteTable('improvements', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  studyId: text('study_id').notNull()
    .references(() => studies.id, { onDelete: 'cascade' }),
  
  // Can link to specific step(s)
  stepIds: text('step_ids'), // JSON array of step IDs
  
  // Content
  description: text('description').notNull(),
  
  // Type
  improvementType: text('improvement_type', { 
    enum: [
      'convert_to_external',
      'streamline_internal', 
      'parallelize',
      'eliminate',
      'standardize',
      'quick_release',
      'other'
    ] 
  }).default('other'),
  
  // Estimates
  estimatedSavingsSeconds: integer('estimated_savings_seconds'),
  estimatedCost: real('estimated_cost'),
  
  // Actuals
  actualSavingsSeconds: integer('actual_savings_seconds'),
  actualCost: real('actual_cost'),
  
  // Assignment
  assignedTo: text('assigned_to'),
  dueDate: text('due_date'),
  
  // Status
  status: text('status', { 
    enum: ['idea', 'planned', 'in_progress', 'implemented', 'verified', 'rejected'] 
  }).default('idea'),
  
  priority: text('priority', { 
    enum: ['low', 'medium', 'high'] 
  }).default('medium'),
  
  // Notes
  notes: text('notes'),
  
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

export const standards = sqliteTable('standards', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  studyId: text('study_id').notNull()
    .references(() => studies.id),
  
  // Versioning
  version: integer('version').default(1),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  
  // Content
  name: text('name').notNull(),
  description: text('description'),
  
  // Standard time
  standardTimeSeconds: integer('standard_time_seconds').notNull(),
  
  // Steps snapshot (JSON)
  stepsJson: text('steps_json').notNull(), // Snapshot of steps at time of creation
  
  // Checklist items (JSON)
  checklistJson: text('checklist_json'),
  
  // Tools required (JSON array)
  toolsJson: text('tools_json'),
  
  // Safety notes
  safetyNotes: text('safety_notes'),
  
  // Approval
  approvedBy: text('approved_by'),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

export const changeoverLogs = sqliteTable('changeover_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Reference
  studyId: text('study_id')
    .references(() => studies.id),
  standardId: text('standard_id')
    .references(() => standards.id),
  
  // Changeover type (denormalized for querying)
  changeoverType: text('changeover_type'),
  lineName: text('line_name'),
  
  // Timing
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  durationSeconds: integer('duration_seconds'),
  
  // Comparison
  standardTimeSeconds: integer('standard_time_seconds'),
  varianceSeconds: integer('variance_seconds'),
  
  // Step times (JSON)
  stepTimesJson: text('step_times_json'), // {stepId: seconds, ...}
  
  // Operator
  operatorName: text('operator_name'),
  
  // Notes
  notes: text('notes'),
  issues: text('issues'),
  
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});
```

### System Tables

```typescript
// src/main/db/schema/system.ts
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
  sidebarCollapsed: integer('sidebar_collapsed', { mode: 'boolean' }).default(false),
  
  // License
  licenseKey: text('license_key'),
  licenseValidUntil: integer('license_valid_until', { mode: 'timestamp' }),
  
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});
```

---

## Indexes

```typescript
// src/main/db/schema/indexes.ts
import { index } from 'drizzle-orm/sqlite-core';

// Products
export const productsSkuIdx = index('products_sku_idx').on(products.sku);
export const productsFamilyIdx = index('products_family_idx').on(products.family);

// Orders
export const ordersDueDateIdx = index('orders_due_date_idx').on(orders.dueDate);
export const ordersStatusIdx = index('orders_status_idx').on(orders.status);
export const ordersProductIdx = index('orders_product_idx').on(orders.productId);

// Schedules
export const schedulesDateIdx = index('schedules_date_idx').on(schedules.scheduleDate);
export const schedulesStatusIdx = index('schedules_status_idx').on(schedules.status);

// Schedule Items
export const scheduleItemsScheduleIdx = index('schedule_items_schedule_idx')
  .on(scheduleItems.scheduleId);
export const scheduleItemsSequenceIdx = index('schedule_items_sequence_idx')
  .on(scheduleItems.scheduleId, scheduleItems.sequenceNumber);

// Studies
export const studiesStatusIdx = index('studies_status_idx').on(studies.status);

// Steps
export const stepsStudyIdx = index('steps_study_idx').on(steps.studyId);
export const stepsSequenceIdx = index('steps_sequence_idx')
  .on(steps.studyId, steps.sequenceNumber);

// Improvements
export const improvementsStudyIdx = index('improvements_study_idx').on(improvements.studyId);
export const improvementsStatusIdx = index('improvements_status_idx').on(improvements.status);

// Changeover Logs
export const logsStudyIdx = index('logs_study_idx').on(changeoverLogs.studyId);
export const logsDateIdx = index('logs_date_idx').on(changeoverLogs.startTime);
```

---

## Migrations

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/main/db/schema/*',
  out: './src/main/db/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './changeoveroptimizer.db',
  },
} satisfies Config;
```

```bash
# Generate migration
npx drizzle-kit generate:sqlite

# Apply migrations (in main process)
```

```typescript
// src/main/db/index.ts
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

---

## Sample Queries

### Get study with steps and improvements

```typescript
import { eq } from 'drizzle-orm';

async function getStudyWithDetails(studyId: string) {
  const study = await db.select().from(studies).where(eq(studies.id, studyId)).get();
  
  const studySteps = await db.select()
    .from(steps)
    .where(eq(steps.studyId, studyId))
    .orderBy(steps.sequenceNumber)
    .all();
  
  const studyImprovements = await db.select()
    .from(improvements)
    .where(eq(improvements.studyId, studyId))
    .orderBy(improvements.status, improvements.priority)
    .all();
  
  return {
    ...study,
    steps: studySteps,
    improvements: studyImprovements,
  };
}
```

### Calculate average changeover time

```typescript
import { eq, avg, gte, and } from 'drizzle-orm';

async function getAverageChangeoverTime(studyId: string, daysBack: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  
  const result = await db.select({
    average: avg(changeoverLogs.durationSeconds),
  })
  .from(changeoverLogs)
  .where(and(
    eq(changeoverLogs.studyId, studyId),
    gte(changeoverLogs.startTime, since)
  ))
  .get();
  
  return result?.average ?? null;
}
```

### Optimize sequence (get changeover times)

```typescript
async function getChangeoverTime(fromProductId: string, toProductId: string) {
  // Get product attributes
  const fromAttrs = await db.select()
    .from(productAttributes)
    .where(eq(productAttributes.productId, fromProductId))
    .all();
  
  const toAttrs = await db.select()
    .from(productAttributes)
    .where(eq(productAttributes.productId, toProductId))
    .all();
  
  // Calculate total changeover time from matrix
  let totalMinutes = 0;
  
  for (const fromAttr of fromAttrs) {
    const toAttr = toAttrs.find(a => a.attributeName === fromAttr.attributeName);
    if (toAttr && fromAttr.attributeValue !== toAttr.attributeValue) {
      const matrixEntry = await db.select()
        .from(changeoverMatrix)
        .where(and(
          eq(changeoverMatrix.fromValue, fromAttr.attributeValue),
          eq(changeoverMatrix.toValue, toAttr.attributeValue)
        ))
        .get();
      
      if (matrixEntry) {
        totalMinutes += matrixEntry.timeMinutes;
      }
    }
  }
  
  return totalMinutes;
}
```

---

## Backup & Restore

```typescript
// src/main/services/backup.ts
import { app, dialog } from 'electron';
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

export async function restoreBackup(backupPath: string): Promise<void> {
  const dbPath = path.join(app.getPath('userData'), 'changeoveroptimizer.db');
  
  // Close current connection
  sqlite.close();
  
  // Replace database file
  await fs.copyFile(backupPath, dbPath);
  
  // Reopen connection
  // (Would need to reinitialize db connection)
}

export async function exportData(): Promise<void> {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: `changeoveroptimizer-export-${Date.now()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  
  if (!filePath) return;
  
  // Export all data as JSON
  const data = {
    products: await db.select().from(products).all(),
    orders: await db.select().from(orders).all(),
    studies: await db.select().from(studies).all(),
    steps: await db.select().from(steps).all(),
    improvements: await db.select().from(improvements).all(),
    standards: await db.select().from(standards).all(),
    logs: await db.select().from(changeoverLogs).all(),
    exportedAt: new Date().toISOString(),
  };
  
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
```

---

*Database Schema v1.0 | December 2024*
