/**
 * Purpose: Shared Prisma client instance.
 * Example: import {prisma} from './db/client.js'
 */
import {PrismaClient} from '@prisma/client'
import {env} from '../env.js'

// Only create Prisma client if DATABASE_URL is available
export const prisma = env.DATABASE_URL ? new PrismaClient() : null

