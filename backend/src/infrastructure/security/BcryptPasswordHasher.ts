import bcrypt from 'bcrypt';

import type { IPasswordHasher } from '../../domain/services/IPasswordHasher.js';
import type { Password } from '../../domain/value-objects/Password.js';

/**
 * BcryptPasswordHasher
 * Infrastructure implementation of IPasswordHasher using bcrypt
 *
 * @implements {IPasswordHasher}
 */
export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly SALT_ROUNDS = 10;

  /**
   * Hash a password using bcrypt
   * @param password - Password value object
   * @returns Hashed password string
   */
  async hash(password: Password): Promise<string> {
    const plainPassword = password.value;
    return bcrypt.hash(plainPassword, this.SALT_ROUNDS);
  }

  /**
   * Compare a plain-text password with a bcrypt hash
   * @param password - Password value object
   * @param hash - Hashed password from database
   * @returns True if passwords match
   */
  async compare(password: Password, hash: string): Promise<boolean> {
    const plainPassword = password.value;
    return bcrypt.compare(plainPassword, hash);
  }
}
