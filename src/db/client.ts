/**
 * Purpose: Shared Prisma client instance.
 * Example: import {prisma} from './db/client.js'
 */
import {PrismaClient} from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// Create Prisma client instance with lazy initialization for serverless
export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

