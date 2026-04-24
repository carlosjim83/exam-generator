import type { DecodedToken } from '@domain/services/ITokenService.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: DecodedToken;
  }
}
