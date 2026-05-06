import type { User, UserRole, AuthProvider } from '@domain/entities/User.js';
import type { Email } from '@domain/value-objects/Email.js';
import type { UserId } from '@domain/value-objects/UserId.js';

export interface CreateUserDTO {
  email: Email;
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  provider: AuthProvider;
  providerId?: string | null;
}

/**
 * IUserRepository Interface (Port)
 * Defines operations for User persistence
 * Implementation is in infrastructure layer
 */
export interface IUserRepository {
  /**
   * Find a user by ID
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Find many users by their IDs
   */
  findManyByIds(ids: UserId[]): Promise<User[]>;

  /**
   * Find a user by email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Create a new user
   */
  create(data: CreateUserDTO): Promise<User>;

  /**
   * Update an existing user
   */
  update(user: User): Promise<User>;

  /**
   * Delete a user
   */
  delete(id: UserId): Promise<void>;

  /**
   * Check if an email already exists
   */
  existsByEmail(email: Email): Promise<boolean>;
}
