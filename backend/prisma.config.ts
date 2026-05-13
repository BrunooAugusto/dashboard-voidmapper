import { readFileSync } from 'fs'
import path from 'path'
import { defineConfig } from "prisma/config";

// The machine-level env has DATABASE_URL=file:./prisma/dev.db (a leftover from the
// frontend SQLite setup). We read .env directly and force-override so Prisma CLI
// commands (prisma dev, prisma db push, prisma migrate) get the correct URL.
const envPath = path.join(import.meta.dirname, '.env')
const envContent = readFileSync(envPath, 'utf8')
const dbUrl = envContent.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)?.[1]
if (dbUrl) process.env.DATABASE_URL = dbUrl

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
