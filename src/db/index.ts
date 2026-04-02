import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import path from 'path'

const DB_PATH = process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'roster.db')

// Singleton pattern: reuse connection across Next.js hot reloads in dev
const globalForDb = global as unknown as { _db: Database.Database }

const sqlite = globalForDb._db ?? new Database(DB_PATH)
if (process.env.NODE_ENV !== 'production') globalForDb._db = sqlite

// WAL mode: better concurrent read performance (up to 3 users)
sqlite.pragma('journal_mode = WAL')
// Foreign keys are NOT enforced by default in SQLite — must be set per connection
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
export type DB = typeof db
