import { Type } from '@sinclair/typebox';

export const ErrorResponseSchema = Type.Object(
  {
    statusCode: Type.Number({ description: 'HTTP status code' }),
    error: Type.String({ description: 'Error name' }),
    message: Type.String({ description: 'Error message' }),
  },
  { description: 'Standard error response' }
);

export const NotFoundResponseSchema = Type.Object(
  {
    statusCode: Type.Number({ description: 'HTTP status code' }),
    error: Type.String({ description: 'Error name' }),
    message: Type.String({ description: 'Error message' }),
  },
  { description: 'Not found error response' }
);

export const ForbiddenResponseSchema = Type.Object(
  {
    statusCode: Type.Number({ description: 'HTTP status code' }),
    error: Type.String({ description: 'Error name' }),
    message: Type.String({ description: 'Error message' }),
  },
  { description: 'Forbidden error response' }
);

export const UnauthorizedResponseSchema = Type.Object(
  {
    statusCode: Type.Number({ description: 'HTTP status code' }),
    error: Type.String({ description: 'Error name' }),
    message: Type.String({ description: 'Error message' }),
  },
  { description: 'Unauthorized error response' }
);

export const BadRequestResponseSchema = Type.Object(
  {
    statusCode: Type.Number({ description: 'HTTP status code' }),
    error: Type.String({ description: 'Error name' }),
    message: Type.String({ description: 'Error message' }),
  },
  { description: 'Bad request error response' }
);

export const ConflictResponseSchema = Type.Object(
  {
    statusCode: Type.Number({ description: 'HTTP status code' }),
    error: Type.String({ description: 'Error name' }),
    message: Type.String({ description: 'Error message' }),
  },
  { description: 'Conflict error response' }
);

export const MessageResponseSchema = Type.Object(
  {
    message: Type.String({ description: 'Response message' }),
  },
  { description: 'Simple message response' }
);

export const SuccessResponseSchema = Type.Object(
  {
    success: Type.Boolean({ description: 'Operation success' }),
    message: Type.String({ description: 'Response message' }),
  },
  { description: 'Success response with message' }
);
