const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client Singleton
 *
 * Prevents multiple Prisma Client instances in development (caused by hot-reload).
 * In production, a single instance is created and reused.
 *
 * This replaces the pg Pool from config/db.js with identical connection behavior:
 * - Uses DATABASE_URL from environment variables
 * - SSL is handled automatically by Prisma via the connection string
 * - Connection pooling is managed internally by Prisma's query engine
 */

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'minimal',
  });
} else {
  // In development, reuse the client across hot-reloads
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
      errorFormat: 'pretty',
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
