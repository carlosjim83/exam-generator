import { ForbiddenError } from '@domain/errors/DomainError.js';

export type Identity = string | { value: string };

function toString(id: Identity): string {
  return typeof id === 'string' ? id : id.value;
}

/**
 * Asserts that the requester is the owner of a resource.
 * Throws {@link ForbiddenError} if the IDs do not match.
 *
 * Role-based bypass can be implemented at the call site by passing
 * `bypass: true` (e.g., when the requester has an ADMIN role).
 *
 * @param ownerId - The ID of the resource owner
 * @param requesterId - The ID of the user making the request
 * @param message - Optional custom error message
 * @param bypass - Optional flag to bypass ownership check (e.g., for ADMIN roles)
 */
export function assertOwnership(
  ownerId: Identity,
  requesterId: Identity,
  message: string = 'You do not have permission to access this resource',
  bypass: boolean = false
): void {
  if (bypass) {
    return;
  }

  if (toString(ownerId) !== toString(requesterId)) {
    throw new ForbiddenError(message);
  }
}
