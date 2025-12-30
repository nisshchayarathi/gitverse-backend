import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

/**
 * Global cache to prevent multiple pools in serverless
 */
const globalForPrisma = global as unknown as {
  prisma?: PrismaClient
  pool?: Pool
}

if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({
    connectionString,
    max: 5,                    // 🔑 NEVER more than 5 on Neon
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
}

const pool = globalForPrisma.pool

const adapter = new PrismaPg(pool)

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: ['error'],
  })
}

const prisma = globalForPrisma.prisma

export default prisma
export { prisma }
