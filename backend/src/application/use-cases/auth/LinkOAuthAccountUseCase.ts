import { AuthProvider } from '@domain/entities/User.js';
import { prisma } from '@config/prisma.js';

interface GoogleUser {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
}

export interface LinkOAuthAccountInput {
  googleUser: GoogleUser;
  role: 'TEACHER' | 'STUDENT';
}

export interface LinkOAuthAccountOutput {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    provider: string;
    refreshTokenVersion: number;
  };
  isNew: boolean;
}

/**
 * LinkOAuthAccountUseCase
 * Application use case for linking OAuth providers to existing users
 *
 * Responsibilities:
 * - Find existing user by email
 * - Auto-link OAuth account if user exists with different provider
 * - Create new user if not found
 * - Update providerId for existing Google users if changed
 */
export class LinkOAuthAccountUseCase {
  async execute(input: LinkOAuthAccountInput): Promise<LinkOAuthAccountOutput> {
    const { googleUser, role } = input;

    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.given_name || 'Google',
          lastName: googleUser.family_name || 'User',
          provider: AuthProvider.GOOGLE,
          providerId: googleUser.id,
          password: null,
          role,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          provider: user.provider,
          refreshTokenVersion: user.refreshTokenVersion,
        },
        isNew: true,
      };
    }

    if (user.provider === AuthProvider.GOOGLE) {
      if (user.providerId !== googleUser.id) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { providerId: googleUser.id },
        });
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          provider: user.provider,
          refreshTokenVersion: user.refreshTokenVersion,
        },
        isNew: false,
      };
    }

    const existingLink = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleUser.id,
        },
      },
    });

    if (!existingLink) {
      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: googleUser.id,
        },
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        provider: user.provider,
        refreshTokenVersion: user.refreshTokenVersion,
      },
      isNew: false,
    };
  }
}
