import type { Config } from 'drizzle-kit';

export default {
  schema: './src-electron/db/schema/*',
  out: './src-electron/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './dev.db', // Dev database for local development
  },
} satisfies Config;
