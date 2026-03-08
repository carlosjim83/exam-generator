import type { PrismaClient } from '@prisma/client';

export const authenticate = async (email: string, password: string, prisma: PrismaClient) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  // For LOCAL auth: verify password
  if (user.provider === 'LOCAL' && user.password) {
    const bcrypt = (await import('bcrypt')).default;
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }
  }

  // For OAuth users: any password works (they already authenticated via OAuth)
  // This is a simplified approach. For production, you might want separate admin credentials.

  return {
    email: user.email,
    id: user.id,
    role: user.role,
  };
};
