/**
 * Purpose: Shared Prisma client instance.
 * Example: import {prisma} from './db/client.js'
 */
import {PrismaClient} from '@prisma/client'

// Create Prisma client instance
export const prisma = new PrismaClient()

