import { v4 as uuidv4 } from 'uuid';
import { ClassDocument } from '@domain/entities/ClassDocument.js';
import { ClassDocumentId } from '@domain/value-objects/ClassDocumentId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';

/**
 * Test Object Mother for ClassDocument entity
 * Helps create test fixtures with sensible defaults
 */
export class ClassDocumentMother {
  static create(props?: {
    id?: ClassDocumentId;
    classId?: string;
    documentId?: string;
    isVisible?: boolean;
    publishedAt?: Date | null;
    orderIndex?: number;
  }): ClassDocument {
    const id = props?.id ?? new ClassDocumentId(uuidv4());
    const classId = ClassId.create(props?.classId ?? uuidv4());
    const documentId = DocumentId.create(props?.documentId ?? uuidv4());
    const isVisible = props?.isVisible ?? false;
    const orderIndex = props?.orderIndex ?? 0;

    return ClassDocument.create({
      id,
      classId,
      documentId,
      isVisible,
      publishedAt: props?.publishedAt,
      orderIndex,
    });
  }

  static visible(props?: {
    id?: ClassDocumentId;
    classId?: string;
    documentId?: string;
    publishedAt?: Date;
    orderIndex?: number;
  }): ClassDocument {
    return this.create({
      ...props,
      isVisible: true,
      publishedAt: props?.publishedAt ?? new Date(),
    });
  }

  static hidden(props?: {
    id?: ClassDocumentId;
    classId?: string;
    documentId?: string;
    orderIndex?: number;
  }): ClassDocument {
    return this.create({
      ...props,
      isVisible: false,
      publishedAt: null,
    });
  }
}
