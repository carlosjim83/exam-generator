import type { DocumentId } from '@domain/value-objects/DocumentId.js';

export interface IRAGContextExtractor {
  extract(documentIds: DocumentId[], numQuestions: number): Promise<string>;
}
