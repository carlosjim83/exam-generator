import { NotFoundError, ForbiddenError } from '@domain/errors/DomainError.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface GetClassDocumentsForTeacherInput {
  classId: string;
  teacherId: string;
}

export interface TeacherClassDocumentOutput {
  id: string;
  documentId: string;
  title: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  isVisible: boolean;
  publishedAt: Date | null;
  orderIndex: number;
  sharedAt: Date;
}

export interface GetClassDocumentsForTeacherOutput {
  class: {
    id: string;
    name: string;
    description: string | null;
  };
  documents: TeacherClassDocumentOutput[];
}

/**
 * GetClassDocumentsForTeacherUseCase
 *
 * Gets all documents shared with a class (teacher view).
 * Teachers can see both published (isVisible=true) and draft (isVisible=false) documents.
 */
export class GetClassDocumentsForTeacherUseCase {
  constructor(
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly classRepository: IClassRepository,
    private readonly documentRepository: IDocumentRepository
  ) {}

  async execute(
    input: GetClassDocumentsForTeacherInput
  ): Promise<GetClassDocumentsForTeacherOutput> {
    const classId = ClassId.create(input.classId);
    const teacherId = UserId.create(input.teacherId);

    // 1. Verify class exists and user is the teacher
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    if (classEntity.teacherId.value !== teacherId.value) {
      throw new ForbiddenError('You do not have permission to view this class');
    }

    // 2. Get ALL class documents (including drafts)
    const classDocuments = await this.classDocumentRepository.findByClassId(classId);

    // 3. Get document details for each
    const documents: TeacherClassDocumentOutput[] = [];

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
          sharedAt: cd.createdAt,
        });
      }
    }

    // 4. Sort by orderIndex, then by sharedAt (newest first)
    documents.sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) {
        return a.orderIndex - b.orderIndex;
      }
      return new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime();
    });

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
