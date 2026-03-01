import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

/**
 * Global setup for vitest - runs ONCE before all test files
 * Ensures test database exists and has migrations applied
 */
export default async function setup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set for tests');
  }

  // Extract database name from URL
  const dbNameMatch = databaseUrl.match(/\/([^/?]+)(\?|$)/);
  const dbName = dbNameMatch ? dbNameMatch[1] : 'exam_generator_test';

  // Create connection URL without database name (connect to postgres)
  const adminUrl = databaseUrl.replace(`/${dbName}`, '/postgres');

  console.log(`\n🔧 Setting up test database: ${dbName}\n`);

  try {
    // Check if database exists by trying to connect
    const testPrisma = new PrismaClient({ datasourceUrl: databaseUrl });

    try {
      await testPrisma.$queryRaw`SELECT 1`;
      console.log(`✅ Test database "${dbName}" exists`);
      await testPrisma.$disconnect();
    } catch (error: any) {
      // Database doesn't exist, create it
      if (error.code === 'P2010' || error.code === 'P1001' || error.message?.includes('database')) {
        console.log(`📦 Creating test database "${dbName}"...`);

        const adminPrisma = new PrismaClient({ datasourceUrl: adminUrl });
        await adminPrisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
        await adminPrisma.$disconnect();

        console.log(`✅ Test database "${dbName}" created`);
      } else {
        await testPrisma.$disconnect();
        throw error;
      }
    }

    // Run migrations
    console.log(`🔄 Running migrations on test database...`);
    execSync('npx prisma migrate deploy', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: process.cwd(),
    });
    console.log(`✅ Migrations applied to test database\n`);
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
}
