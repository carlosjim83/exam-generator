import { UserId } from '../value-objects/UserId.js';
import { Email } from '../value-objects/Email.js';

export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
  MICROSOFT = 'MICROSOFT',
}

export interface UserProps {
  id: UserId;
  email: Email;
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  provider: AuthProvider;
  providerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Entity
 * Represents a user in the system (teacher or student)
 */
export class User {
  private constructor(private props: UserProps) {}

  static create(props: UserProps): User {
    // Validation rules
    if (!props.firstName || props.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }
    if (!props.lastName || props.lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }

    // OAuth users must not have password
    if (props.provider !== AuthProvider.LOCAL && props.passwordHash !== null) {
      throw new Error('OAuth users cannot have a password');
    }

    // Local users must have password
    if (props.provider === AuthProvider.LOCAL && props.passwordHash === null) {
      throw new Error('Local users must have a password');
    }

    return new User(props);
  }

  // Getters
  get id(): UserId {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string | null {
    return this.props.passwordHash;
  }

  get password(): string | null {
    return this.props.passwordHash;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get provider(): AuthProvider {
    return this.props.provider;
  }

  get providerId(): string | null {
    return this.props.providerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  isTeacher(): boolean {
    return this.props.role === UserRole.TEACHER;
  }

  isStudent(): boolean {
    return this.props.role === UserRole.STUDENT;
  }

  isOAuthUser(): boolean {
    return this.props.provider !== AuthProvider.LOCAL;
  }

  hasPassword(): boolean {
    return this.props.passwordHash !== null;
  }

  // Convert to plain object (for serialization)
  toObject() {
    return {
      id: this.props.id.value,
      email: this.props.email.value,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      role: this.props.role,
      provider: this.props.provider,
      providerId: this.props.providerId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
