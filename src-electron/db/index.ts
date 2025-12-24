import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app } from 'electron';
import path from 'path';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;
let sqlite: Database.Database | null = null;

/**
 * Initialize the database connection and run migrations
 * Should be called once during app startup
 */
export function initDatabase(): ReturnType<typeof drizzle> {
  if (db) return db;

  const dbPath = path.join(app.getPath('userData'), 'changeoveroptimizer.db');
  console.log('[DB] Initializing database at:', dbPath);

  sqlite = new Database(dbPath);

  // Performance settings
  sqlite.pragma('journal_mode = WAL'); // Write-Ahead Logging for crash recovery
  sqlite.pragma('synchronous = NORMAL'); // Balance between safety and performance
  sqlite.pragma('cache_size = -64000'); // 64MB cache
  sqlite.pragma('temp_store = MEMORY'); // Store temp tables in memory
  sqlite.pragma('foreign_keys = ON'); // Enable foreign key constraints

  db = drizzle(sqlite, { schema });

  // Run migrations
  try {
    const migrationsFolder = path.join(__dirname, 'migrations');
    migrate(db, { migrationsFolder });
    console.log('[DB] Migrations completed successfully');
  } catch (error) {
    console.error('[DB] Migration error:', error);
    throw error;
  }

  return db;
}

/**
 * Get the database instance
 * Throws error if database is not initialized
 */
export function getDatabase(): ReturnType<typeof drizzle> {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 * Should be called during app shutdown
 */
export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
    console.log('[DB] Database closed');
  }
}
