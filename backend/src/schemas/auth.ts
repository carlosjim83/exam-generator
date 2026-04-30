import { Type } from '@sinclair/typebox';

// Request schemas
export const RegisterRequestSchema = Type.Object(
  {
    email: Type.String({
      format: 'email',
      description: 'User email address (must be unique)',
      examples: ['teacher@example.com'],
    }),
    password: Type.String({
      minLength: 8,
      description: 'Password (minimum 8 characters)',
      examples: ['SecurePass123!'],
    }),
    firstName: Type.String({
      minLength: 1,
      description: 'User first name',
      examples: ['John'],
    }),
    lastName: Type.String({
      minLength: 1,
      description: 'User last name',
      examples: ['Doe'],
    }),
    role: Type.Union([Type.Literal('TEACHER'), Type.Literal('STUDENT')], {
      description: 'User role (TEACHER or STUDENT)',
      examples: ['TEACHER'],
    }),
  },
  {
    description: 'User registration request',
  }
);

export const LoginRequestSchema = Type.Object(
  {
    email: Type.String({
      format: 'email',
      description: 'User email address',
      examples: ['teacher@example.com'],
    }),
    password: Type.String({
      minLength: 1,
      description: 'User password',
      examples: ['password123'],
    }),
  },
  {
    description: 'User login request',
  }
);

export const RefreshRequestSchema = Type.Object(
  {
    refreshToken: Type.String({
      minLength: 1,
      description: 'JWT refresh token (7 days TTL)',
      examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'],
    }),
  },
  {
    description: 'Token refresh request',
  }
);

// Response schemas
export const UserResponseSchema = Type.Object(
  {
    id: Type.String({ description: 'User UUID' }),
    email: Type.String({ description: 'User email' }),
    firstName: Type.String({ description: 'User first name' }),
    lastName: Type.String({ description: 'User last name' }),
    role: Type.String({ description: 'User role (TEACHER or STUDENT)' }),
    provider: Type.String({ description: 'Authentication provider (LOCAL, GOOGLE, etc.)' }),
    createdAt: Type.String({ description: 'User creation timestamp (ISO 8601)' }),
    updatedAt: Type.String({ description: 'User last update timestamp (ISO 8601)' }),
  },
  { description: 'User data response' }
);

export const AuthResponseSchema = Type.Object(
  {
    user: UserResponseSchema,
    accessToken: Type.String({ description: 'JWT access token (15 minutes TTL)' }),
    refreshToken: Type.String({ description: 'JWT refresh token (7 days TTL)' }),
  },
  {
    description: 'Successful authentication response',
  }
);
