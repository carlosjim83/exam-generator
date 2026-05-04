/**
 * FixStuckDocumentsUseCase
 *
 * Recovers documents that are stuck in PROCESSING status because the
 * worker crashed (e.g. uncaught ECONNRESET) before updating the status.
 *
 * Flow:
 * 1. Find documents in PROCESSING for longer than threshold minutes
 * 2. Reset their status to PENDING and clear error metadata
 * 3. Re-queue them for background processing
 * 4. Return summary of recovered vs failed
 */

import { DocumentStatus } from '@domain/entities/Document.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IMessageBroker } from '@application/ports/IMessageBroker.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';

export interface FixStuckDocumentsInput {
  minutesStuck?: number; // Default: 5 minutes
}

export interface FixStuckDocumentsOutput {
  recovered: number;
  failed: number;
  documents: Array<{
    documentId: string;
    userId: string;
    status: string;
    requeued: boolean;
    error?: string;
  }>;
}

export class FixStuckDocumentsUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly messageBroker: IMessageBroker
  ) {}

  async execute(input: FixStuckDocumentsInput = {}): Promise<FixStuckDocumentsOutput> {
    const minutesStuck = input.minutesStuck ?? 5;

    console.log(`🔍 Looking for documents stuck in PROCESSING for >${minutesStuck} minutes...`);

    const stuckDocuments = await this.documentRepository.findStuckProcessingDocuments(minutesStuck);

    console.log(`📋 Found ${stuckDocuments.length} stuck document(s)`);

    const result: FixStuckDocumentsOutput = {
      recovered: 0,
      failed: 0,
      documents: [],
    };

    for (const doc of stuckDocuments) {
      try {
        // Reset status to PENDING so it can be reprocessed
        await this.documentRepository.updateStatus(DocumentId.create(doc.id.value), {
          status: DocumentStatus.PENDING,
          errorMessage: null,
        });

        // Re-queue for processing
        await this.messageBroker.publish('document.uploaded', {
          occurredAt: new Date(),
          aggregateId: doc.id.value,
          payload: {
            documentId: doc.id.value,
            userId: doc.userId.value,
            filename: doc.filename,
            mimeType: doc.mimeType,
            blobUrl: doc.blobUrl,
          },
        } as any);

        result.recovered++;
        result.documents.push({
          documentId: doc.id.value,
          userId: doc.userId.value,
          status: 'PENDING',
          requeued: true,
        });

        console.log(`✅ Recovered document: ${doc.id.value}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        result.failed++;
        result.documents.push({
          documentId: doc.id.value,
          userId: doc.userId.value,
          status: doc.status,
          requeued: false,
          error: msg,
        });

        console.error(`❌ Failed to recover document ${doc.id.value}:`, msg);
      }
    }

    console.log(`🏁 Fix complete: ${result.recovered} recovered, ${result.failed} failed`);
    return result;
  }
}
