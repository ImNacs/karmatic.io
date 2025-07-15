/**
 * @fileoverview Prisma client singleton instance
 * @module lib/prisma
 */

import { PrismaClient } from '@prisma/client';

/**
 * Global type augmentation for Prisma client storage
 * Prevents multiple instances in development with hot reloading
 */
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma client instance
 * @description
 * Creates a single PrismaClient instance that persists across hot reloads
 * in development. In production, always creates a fresh instance.
 * 
 * Logging configuration:
 * - Development: Logs queries, errors, and warnings
 * - Production: Only logs errors
 * 
 * @example
 * ```ts
 * import { prisma } from '@/lib/prisma';
 * 
 * const users = await prisma.user.findMany();
 * ```
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

/**
 * Store prisma instance in global for development hot reloading
 */
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;