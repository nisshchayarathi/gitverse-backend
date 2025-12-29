import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Get DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL

console.log('Loading Prisma with DATABASE_URL:', connectionString ? '✓ Set' : '✗ Missing')

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create PostgreSQL connection pool with timeout settings
const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
  min: 2,
})

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected pool error:', err)
})

const adapter = new PrismaPg(pool)

// Create Prisma Client with PostgreSQL adapter
const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

export default prisma
export { prisma }
