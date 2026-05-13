import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envContent = readFileSync(path.join(__dirname, '../../.env'), 'utf8')
const dbUrl = envContent.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)?.[1]

// Force override the machine-level env (file:./prisma/dev.db leftover from frontend setup)
if (dbUrl) process.env.DATABASE_URL = dbUrl

const pool    = new pg.Pool({ connectionString: dbUrl })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

export default prisma
