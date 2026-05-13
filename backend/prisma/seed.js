import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envContent = readFileSync(path.join(__dirname, '../.env'), 'utf8')
const dbUrl = envContent.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)?.[1]
if (dbUrl) process.env.DATABASE_URL = dbUrl

const pool    = new pg.Pool({ connectionString: dbUrl })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

async function main() {
  console.log('🌱  Seeding database…')

  // Clear all demo data
  await prisma.survey.deleteMany()
  await prisma.monitoring.deleteMany()
  await prisma.projectImage.deleteMany()
  await prisma.project.deleteMany()
  await prisma.report.deleteMany()
  console.log('  ✓ Cleared all demo data')

  // Upsert admin user only (profileComplete: true so they skip setup)
  const hash  = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@voidmapper.com' },
    update: { profileComplete: true },
    create: {
      email:           'admin@voidmapper.com',
      name:            'Admin VoidMapper',
      role:            'Administrador',
      initials:        'AV',
      password:        hash,
      profileComplete: true,
    },
  })
  console.log(`  ✓ User: ${admin.email}`)

  console.log('\n✅  Seed complete!')
  console.log('\n🔑  Credentials:')
  console.log('   admin@voidmapper.com  /  admin123')
}

main()
  .catch(err => { console.error('❌  Seed failed:', err); process.exit(1) })
  .finally(() => prisma.$disconnect().finally(() => pool.end()))
