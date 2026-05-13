import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const isProduction = process.env.NODE_ENV === 'production'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: isProduction ? ['error'] : ['error', 'warn'],
})

export default prisma
