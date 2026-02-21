const prisma = require('../config/prismaClient');

/**
 * Initializes the database connection via Prisma.
 *
 * MIGRATION NOTE:
 *   Previously this file ran CREATE TABLE IF NOT EXISTS via raw pg queries.
 *   With Prisma, table management is handled by the schema + migrations.
 *   This function now performs a connection health check instead.
 *
 *   The users table already exists and is managed by Prisma schema.
 *   No table creation is needed at runtime.
 */
const initDB = async () => {
  try {
    // Verify database connectivity by running a simple query
    await prisma.$connect();

    // Optional: verify the users table exists and is accessible
    const userCount = await prisma.user.count();

    console.log('✅ Database connected successfully via Prisma');
    console.log(`📊 Users table accessible (${userCount} existing records)`);
  } catch (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
};

/**
 * Gracefully disconnect Prisma on shutdown
 */
const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected gracefully');
};

module.exports = { initDB, disconnectDB };
