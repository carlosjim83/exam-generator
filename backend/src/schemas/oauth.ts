import { Type } from '@sinclair/typebox';

// --- OAuth schemas ---

export const OAuthErrorResponseSchema = Type.Object(
  {
    statusCode: Type.Number(),
    error: Type.String(),
    message: Type.String(),
  },
  { description: 'OAuth error response' }
);

export const OAuthConflictResponseSchema = Type.Object(
  {
    statusCode: Type.Number(),
    error: Type.String(),
    message: Type.String(),
  },
  { description: 'OAuth conflict response' }
);
