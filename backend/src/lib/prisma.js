import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'

// Read .env before the adapter is constructed — static ES module imports are
// hoisted above the dotenv.config() call in server.js, so process.env is not
// yet populated at module-evaluation time. readFileSync forces the correct URL.
// On Railway (no .env file) this silently falls through to the existing env var.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
try {
  const envContent = readFileSync(path.join(__dirname, '../../.env'), 'utf8')
  const dbUrl = envContent.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)?.[1]
  if (dbUrl) process.env.DATABASE_URL = dbUrl
} catch { /* no .env — use env vars from the host */ }

// SQLite (local dev). For production (PostgreSQL), replace with:
//   import pg from 'pg'
//   import { PrismaPg } from '@prisma/adapter-pg'
//   const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
//   export default new PrismaClient({ adapter: new PrismaPg(pool), log: ['error'] })

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL })

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

export default prisma
