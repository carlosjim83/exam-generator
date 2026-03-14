import type { PrismaClient } from '@prisma/client';

export const authenticate = async (email: string, password: string, prisma: PrismaClient) => {
  console.log('🔐 AdminJS authenticate called:', { email, hasPassword: !!password });

  const user = await prisma.user.findUnique({
    where: { email },
  });

  console.log('👤 User lookup result:', {
    found: !!user,
    role: user?.role,
    provider: user?.provider,
    hasPassword: !!user?.password,
  });

  if (!user || user.role !== 'ADMIN') {
    console.log('❌ Authentication failed: User not found or not ADMIN');
    return null;
  }

  // For LOCAL auth: verify password
  if (user.provider === 'LOCAL' && user.password) {
    const bcrypt = (await import('bcrypt')).default;
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log('❌ Authentication failed: Invalid password');
      return null;
    }
    console.log('✅ Password verified successfully');
  }

  // For OAuth users: any password works (they already authenticated via OAuth)
  // This is a simplified approach. For production, you might want separate admin credentials.

  const result = {
    email: user.email,
    id: user.id,
    role: user.role,
  };

  console.log('✅ Authentication successful, returning:', result);
  return result;
};
