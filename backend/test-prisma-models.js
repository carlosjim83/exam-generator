const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkModels() {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    // Check available models
    const modelNames = Object.keys(prisma).filter(
      (key) => !key.startsWith('_') && !key.startsWith('$') && typeof key === 'string'
    );
    console.log('Available models:', modelNames);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkModels();
