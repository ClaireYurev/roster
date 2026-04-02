import type { Config } from 'drizzle-kit'
import path from 'path'

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'roster.db'),
  },
} satisfies Config
