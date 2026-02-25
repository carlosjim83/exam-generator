import type { Class } from '@domain/entities/Class.js';
import type { ClassId } from '@domain/value-objects/ClassId.js';
import type { UserId } from '@domain/value-objects/UserId.js';

export interface IClassRepository {
  findById(id: ClassId): Promise<Class | null>;
  findByCode(code: string): Promise<Class | null>;
  findByTeacherId(
    teacherId: UserId,
    options?: { page?: number; limit?: number; search?: string }
  ): Promise<{ classes: Class[]; total: number }>;
  save(classEntity: Class): Promise<void>;
  delete(id: ClassId): Promise<void>;
  existsByCode(code: string, excludeId?: ClassId): Promise<boolean>;
  countStudents(classId: ClassId): Promise<number>;
  countByTeacherId(teacherId: UserId): Promise<number>;
}
