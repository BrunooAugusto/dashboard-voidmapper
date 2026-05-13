import { PrismaClient } from '@prisma/client'

// SQLite (local dev) — no adapter needed; Prisma handles it natively.
// For production (PostgreSQL), replace with:
//   import pg from 'pg'
//   import { PrismaPg } from '@prisma/adapter-pg'
//   const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
//   const adapter = new PrismaPg(pool)
//   export default new PrismaClient({ adapter, log: ['error'] })

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

export default prisma
