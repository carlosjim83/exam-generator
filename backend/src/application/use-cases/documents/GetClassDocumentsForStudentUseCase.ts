import { NotFoundError, ForbiddenError } from '@domain/errors/DomainError.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface GetClassDocumentsInput {
  classId: string;
  studentId: string;
}

export interface ClassDocumentOutput {
  id: string;
  documentId: string;
  title: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  isVisible: boolean;
  publishedAt: Date | null;
  orderIndex: number;
}

export interface GetClassDocumentsOutput {
  class: {
    id: string;
    name: string;
    description: string | null;
  };
  documents: ClassDocumentOutput[];
}

/**
 * GetClassDocumentsForStudentUseCase
 *
 * Gets all visible documents for a class that a student is enrolled in.
 * Students can only see documents where isVisible = true.
 */
export class GetClassDocumentsForStudentUseCase {
  constructor(
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly classRepository: IClassRepository,
    private readonly enrollmentRepository: IStudentEnrollmentRepository,
    private readonly documentRepository: IDocumentRepository
  ) {}

  async execute(input: GetClassDocumentsInput): Promise<GetClassDocumentsOutput> {
    const classId = ClassId.create(input.classId);
    const studentId = UserId.create(input.studentId);

    // 1. Verify class exists
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    // 2. Verify student is enrolled
    const enrollment = await this.enrollmentRepository.findByClassAndStudent(classId, studentId);
    if (!enrollment || !enrollment.isActive) {
      throw new ForbiddenError('You are not enrolled in this class');
    }

    // 3. Get all visible class documents
    const classDocuments = await this.classDocumentRepository.findByClassId(classId, {
      visibleOnly: true,
    });

    // 4. Get document details for each
    const documents: ClassDocumentOutput[] = [];

    for (const cd of classDocuments) {
      const document = await this.documentRepository.findById(cd.documentId);
      if (document) {
        documents.push({
          id: cd.id.value,
          documentId: document.id.value,
          title: document.title,
          filename: document.filename,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          isVisible: cd.isVisible,
          publishedAt: cd.publishedAt,
          orderIndex: cd.orderIndex,
        });
      }
    }

    // 5. Sort by orderIndex
    documents.sort((a, b) => a.orderIndex - b.orderIndex);

    return {
      class: {
        id: classEntity.id.value,
        name: classEntity.name,
        description: classEntity.description,
      },
      documents,
    };
  }
}
