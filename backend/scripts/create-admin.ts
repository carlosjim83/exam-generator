import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const firstName = process.argv[4] || 'Admin';
  const lastName = process.argv[5] || 'User';

  if (!email || !password) {
    console.error(
      'Usage: node dist/scripts/create-admin.js <email> <password> [firstName] [lastName]'
    );
    process.exit(1);
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
  }

  // Password validation
  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters');
    process.exit(1);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.error('❌ Error: User with email already exists');
    process.exit(1);
  }

  // Check if ADMIN role exists (by trying to query for it)
  const testAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!testAdmin) {
    console.log('⚠️  Creating first ever ADMIN user. Make sure you ran the migration:');
    console.log('⚠️  pnpm prisma migrate dev');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'ADMIN',
      provider: 'LOCAL',
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log('');
  console.log(`Email: ${user.email}`);
  console.log(`Name: ${user.firstName} ${user.lastName}`);
  console.log(`Role: ADMIN`);
  console.log(`Provider: LOCAL`);
  console.log(`ID: ${user.id}`);
  console.log('');
  console.log('You can now login to /admin with email:', user.email);
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
