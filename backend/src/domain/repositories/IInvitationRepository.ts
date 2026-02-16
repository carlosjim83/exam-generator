import { Invitation } from '@domain/entities/Invitation.js';
import { InvitationId } from '@domain/value-objects/InvitationId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';

export interface IInvitationRepository {
  findById(id: InvitationId): Promise<Invitation | null>;
  findByToken(token: string): Promise<Invitation | null>;
  findByClassId(
    classId: ClassId,
    options?: { status?: Invitation['status']; page?: number; limit?: number }
  ): Promise<{ invitations: Invitation[]; total: number }>;
  findByEmail(email: string): Promise<Invitation[]>;
  save(invitation: Invitation): Promise<void>;
  saveMany(invitations: Invitation[]): Promise<void>;
  delete(id: InvitationId): Promise<void>;
}
