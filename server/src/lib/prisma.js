/**
 * Prisma Client instance
 * Usage: const prisma = require('../lib/prisma');
 */

const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

// Log all queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    console.log(`[Prisma Query] ${e.query}`);
    if (e.duration > 1000) {
      console.warn(`  ⚠️  Slow query detected (${e.duration}ms)`);
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
