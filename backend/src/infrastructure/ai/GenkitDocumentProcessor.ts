import type {
  IDocumentProcessor,
  ProcessDocumentInput,
  ProcessDocumentOutput,
} from '@domain/services/IDocumentProcessor.js';
import { processDocumentFlow } from './flows/processDocument.flow.js';
import { getChunkCount } from './indexers/pgvector.indexer.js';

/**
 * GenkitDocumentProcessor
 *
 * Infrastructure adapter for IDocumentProcessor.
 * Wraps Genkit flows for document processing and chunk counting.
 */
export class GenkitDocumentProcessor implements IDocumentProcessor {
  async process(input: ProcessDocumentInput): Promise<ProcessDocumentOutput> {
    return processDocumentFlow(input);
  }

  async getChunkCount(documentId: string): Promise<number> {
    return getChunkCount(documentId);
  }
}
