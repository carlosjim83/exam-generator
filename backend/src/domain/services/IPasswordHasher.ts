import type { Password } from '../value-objects/Password.js';

/**
 * IPasswordHasher Interface (Port)
 * Defines password hashing operations
 * Implementation is in infrastructure layer
 */
export interface IPasswordHasher {
  /**
   * Hash a plain-text password
   * @param password - Plain-text password
   * @returns Hashed password
   */
  hash(password: Password): Promise<string>;

  /**
   * Compare a plain-text password with a hash
   * @param password - Plain-text password
   * @param hash - Hashed password
   * @returns True if passwords match
   */
  compare(password: Password, hash: string): Promise<boolean>;
}
