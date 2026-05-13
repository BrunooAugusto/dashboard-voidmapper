import { readFileSync } from 'fs'
import path from 'path'
import { defineConfig } from "prisma/config";

// In local dev, .env may not exist in the Railway deploy environment,
// so we wrap the read in a try/catch and fall back to process.env.
try {
  const envPath = path.join(import.meta.dirname, '.env')
  const envContent = readFileSync(envPath, 'utf8')
  const dbUrl = envContent.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)?.[1]
  if (dbUrl) process.env.DATABASE_URL = dbUrl
} catch {
  // No .env file — rely on environment variables set by the host (Railway, etc.)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
