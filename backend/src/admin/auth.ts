import type { PrismaClient } from '@prisma/client';

export const authenticate = async (email: string, password: string, prisma: PrismaClient) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  // Only LOCAL users with verified passwords can access AdminJS
  if (user.provider !== 'LOCAL' || !user.password) {
    return null;
  }

  const bcrypt = (await import('bcrypt')).default;
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  return {
    email: user.email,
    id: user.id,
    role: user.role,
  };
};
