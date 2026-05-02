import { EXAM_LIMITS } from '@config/subscription-limits.js';
import type { IRAGContextExtractor } from '@domain/services/IRAGContextExtractor.js';
import type { IEmbeddingService } from '@domain/services/IEmbeddingService.js';
import type { ILogger } from '@domain/services/ILogger.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { DocumentId } from '@domain/value-objects/DocumentId.js';

/**
 * RAGContextExtractor
 * Extracts relevant context from multiple documents using semantic search (RAG).
 */
export class RAGContextExtractor implements IRAGContextExtractor {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly embeddingService: IEmbeddingService,
    private readonly logger: ILogger
  ) {}

  async extract(documentIds: DocumentId[], numQuestions: number): Promise<string> {
    const totalChunksToExtract = Math.min(numQuestions * 3, 100);
    const chunksPerDocument = Math.max(
      EXAM_LIMITS.MAX_CHUNKS_PER_DOCUMENT,
      Math.ceil(totalChunksToExtract / documentIds.length)
    );

    const queries = [
      'main concepts and key ideas',
      'important definitions and explanations',
      'examples and applications',
      'critical information and facts',
    ];

    const allChunks: Array<{
      content: string;
      similarity: number;
      documentId: string;
    }> = [];

    for (const documentId of documentIds) {
      this.logger.info(
        `Extracting up to ${chunksPerDocument} chunks from document ${documentId.value}`
      );

      for (const query of queries) {
        const embeddings = await this.embeddingService.generateEmbeddings([query]);
        const queryEmbedding = embeddings[0];

        const chunks = await this.documentRepository.searchSimilarChunks(
          documentId,
          queryEmbedding,
          Math.ceil(chunksPerDocument / queries.length)
        );

        allChunks.push(
          ...chunks.map((c) => ({
            content: c.content,
            similarity: c.similarity,
            documentId: documentId.value,
          }))
        );
      }
    }

    const uniqueChunks = Array.from(new Map(allChunks.map((c) => [c.content, c])).values());
    const balancedChunks = this.balanceChunkDistribution(
      uniqueChunks,
      documentIds.map((d) => d.value),
      totalChunksToExtract
    );

    const context = balancedChunks.map((c) => c.content).join('\n\n');

    const distribution = this.getChunkDistribution(balancedChunks);
    this.logger.info(`Extracted ${balancedChunks.length} chunks total:`);
    documentIds.forEach((docId) => {
      const count = distribution.get(docId.value) || 0;
      this.logger.info(`  - Document ${docId.value.substring(0, 8)}...: ${count} chunks`);
    });
    this.logger.info(`Total context size: ${context.length} characters`);

    return context;
  }

  private balanceChunkDistribution(
    chunks: Array<{ content: string; similarity: number; documentId: string }>,
    documentIds: string[],
    totalChunks: number
  ): Array<{ content: string; similarity: number; documentId: string }> {
    const minChunksPerDoc = Math.floor(totalChunks / documentIds.length);
    const selected: Array<{ content: string; similarity: number; documentId: string }> = [];

    const chunksByDoc = new Map<string, typeof chunks>();
    documentIds.forEach((docId) => {
      chunksByDoc.set(
        docId,
        chunks.filter((c) => c.documentId === docId).sort((a, b) => b.similarity - a.similarity)
      );
    });

    documentIds.forEach((docId) => {
      const docChunks = chunksByDoc.get(docId) || [];
      const toTake = Math.min(minChunksPerDoc, docChunks.length);
      selected.push(...docChunks.slice(0, toTake));
    });

    const remaining = chunks
      .filter((c) => !selected.some((s) => s.content === c.content))
      .sort((a, b) => b.similarity - a.similarity);

    const slotsRemaining = totalChunks - selected.length;
    selected.push(...remaining.slice(0, slotsRemaining));

    return selected.sort((a, b) => b.similarity - a.similarity);
  }

  private getChunkDistribution(chunks: Array<{ documentId: string }>): Map<string, number> {
    const distribution = new Map<string, number>();
    chunks.forEach((chunk) => {
      distribution.set(chunk.documentId, (distribution.get(chunk.documentId) || 0) + 1);
    });
    return distribution;
  }
}
