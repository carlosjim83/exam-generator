/**
 * QueryDocumentUseCase
 *
 * Performs semantic search on document chunks using RAG (Retrieval-Augmented Generation).
 *
 * Flow:
 * 1. Validate document exists and user has access
 * 2. Generate embedding for user's query using Azure OpenAI
 * 3. Search similar chunks in pgvector database
 * 4. Return top K most relevant chunks with similarity scores
 */

import type {
  IDocumentRepository,
  QueryDocumentResult,
} from '../../../domain/repositories/IDocumentRepository.js';
import { DocumentId } from '../../../domain/value-objects/DocumentId.js';
import { UserId } from '../../../domain/value-objects/UserId.js';
import { AzureOpenAIEmbeddingService } from '../../../infrastructure/ai/AzureOpenAIEmbeddingService.js';

export interface QueryDocumentInput {
  documentId: string;
  userId: string;
  query: string;
  topK?: number; // Number of chunks to return (default: 5)
}

export interface QueryDocumentOutput {
  documentId: string;
  documentTitle: string;
  query: string;
  results: QueryDocumentResult[];
  totalResults: number;
}

export class QueryDocumentUseCase {
  private readonly embeddingService: AzureOpenAIEmbeddingService;

  constructor(private readonly documentRepository: IDocumentRepository) {
    this.embeddingService = new AzureOpenAIEmbeddingService();
  }

  async execute(input: QueryDocumentInput): Promise<QueryDocumentOutput> {
    // 1. Validate input
    const documentId = DocumentId.create(input.documentId);
    const userId = UserId.create(input.userId);
    const topK = input.topK ?? 5;

    if (!input.query || input.query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    if (topK < 1 || topK > 50) {
      throw new Error('topK must be between 1 and 50');
    }

    // 2. Verify document exists and user owns it
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.userId.value !== userId.value) {
      throw new Error('Unauthorized: Document does not belong to user');
    }

    // 3. Check document is processed
    if (!document.isCompleted()) {
      throw new Error(`Document is not ready for querying. Current status: ${document.status}`);
    }

    // 4. Generate embedding for the query
    console.log(`[QueryDocument] Generating embedding for query: "${input.query}"`);

    const queryEmbeddings = await this.embeddingService.generateEmbeddings([input.query]);

    const queryEmbedding = queryEmbeddings[0];

    // 5. Search similar chunks in database
    console.log(`[QueryDocument] Searching top ${topK} similar chunks...`);

    const results = await this.documentRepository.searchSimilarChunks(
      documentId,
      queryEmbedding,
      topK
    );

    console.log(`[QueryDocument] Found ${results.length} results`);

    // 6. Return results
    return {
      documentId: document.id.value,
      documentTitle: document.title,
      query: input.query,
      results,
      totalResults: results.length,
    };
  }
}
