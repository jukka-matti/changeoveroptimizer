import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Settings table - Key-value store for app settings
 */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .$defaultFn(() => new Date()),
});

/**
 * App state table - Stores application state (last viewed items, license info, etc.)
 */
export const appState = sqliteTable('app_state', {
  id: text('id').primaryKey().$defaultFn(() => 'main'),

  // UI state
  lastViewedScheduleId: text('last_viewed_schedule_id'),
  lastViewedStudyId: text('last_viewed_study_id'),

  // License information
  licenseKey: text('license_key'),
  licenseEmail: text('license_email'),
  licenseActivatedAt: integer('license_activated_at', { mode: 'timestamp' }),
  licenseValidUntil: integer('license_valid_until', { mode: 'timestamp' }),

  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .$defaultFn(() => new Date()),
});
