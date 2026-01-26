import bcrypt from 'bcrypt';
import { prisma } from '@/config/prisma';
import type { RegisterRequest, User } from '@exam-generator/shared';
import { AuthProvider, UserRole } from '@prisma/client';

export class AuthService {
  private readonly SALT_ROUNDS = 10;

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns True if passwords match
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Register a new user with local authentication
   * @param data - Registration data (email, password, firstName, lastName, role)
   * @returns Created user (without password)
   * @throws Error if email already exists
   */
  async register(data: RegisterRequest): Promise<Omit<User, 'password'>> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as UserRole,
        provider: AuthProvider.LOCAL,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }

  /**
   * Find a user by email
   * @param email - User email
   * @returns User or null if not found
   */
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Validate user credentials (email + password)
   * @param email - User email
   * @param password - Plain text password
   * @returns User if valid, null otherwise
   */
  async validateCredentials(email: string, password: string) {
    // Find user
    const user = await this.findUserByEmail(email);
    
    if (!user) {
      return null;
    }

    // Check if user has a password (OAuth users don't have passwords)
    if (!user.password) {
      return null;
    }

    // Compare passwords
    const isValid = await this.comparePassword(password, user.password);
    
    if (!isValid) {
      return null;
    }

    return user;
  }
}
