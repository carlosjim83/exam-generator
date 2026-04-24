import type { FastifyInstance } from 'fastify';
import '@fastify/multipart'; // Import for type augmentation

import { container } from '@config/container.js';
import { queueDocumentProcessing, retryFailedJob } from '@infrastructure/queue/DocumentQueue.js';
import { authenticateUser } from '@middleware/auth.middleware.js';

export async function documentRoutes(fastify: FastifyInstance) {
  // POST /api/documents/upload - Upload a document (PDF or DOCX)
  fastify.post(
    '/api/documents/upload',
    {
      preHandler: authenticateUser, // Require authentication
      schema: {
        tags: ['documents'],
        summary: 'Upload a document (PDF or DOCX)',
        description:
          'Upload a PDF or DOCX file for exam generation. The file will be processed asynchronously.',
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        response: {
          201: {
            description: 'Document uploaded successfully',
            type: 'object',
            properties: {
              document: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  filename: { type: 'string' },
                  fileSize: { type: 'number' },
                  mimeType: { type: 'string' },
                  status: { type: 'string' },
                  uploadedAt: { type: 'string' },
                },
              },
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request (invalid file)',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // With attachFieldsToBody: true (registered by AdminJS), file is in request.body
        const body = request.body as any;
        const fileField = body?.file;

        if (!fileField || !fileField.file) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'No file uploaded',
          });
        }

        // Get file info from the body
        const { file, filename, mimetype } = fileField;
        const title = body?.title?.value || filename;

        // Debug logging for production troubleshooting
        fastify.log.info(
          {
            hasFileField: !!fileField,
            hasFile: !!file,
            hasToBuffer: typeof fileField?.toBuffer === 'function',
            fileType: typeof file,
            isBuffer: Buffer.isBuffer(file),
            filename,
            mimetype,
          },
          'Processing upload file'
        );

        // Convert file to buffer - with attachFieldsToBody: true, use fileField.toBuffer()
        let buffer: Buffer;
        if (typeof fileField.toBuffer === 'function') {
          buffer = await fileField.toBuffer();
          fastify.log.info({ bufferSize: buffer.length }, 'File loaded via toBuffer()');
        } else if (Buffer.isBuffer(file)) {
          buffer = file;
          fastify.log.info({ bufferSize: buffer.length }, 'File is already buffer');
        } else {
          // Fallback: read stream manually
          const chunks: Buffer[] = [];
          for await (const chunk of file) {
            chunks.push(chunk);
          }
          buffer = Buffer.concat(chunks);
          fastify.log.info({ bufferSize: buffer.length }, 'File loaded via stream');
        }

        // Execute UploadDocumentUseCase
        const result = await container.uploadDocumentUseCase.execute({
          userId: request.user!.userId,
          title,
          filename,
          mimetype,
          buffer,
        });

        // 🔥 Add document to processing queue
        // The worker will fetch the document from DB and get all necessary data
        try {
          const userId = request.user!.userId;
          await queueDocumentProcessing({
            documentId: result.document.id,
            userId,
          });
          fastify.log.info(`Document queued for processing: ${result.document.id}`);
        } catch (queueError) {
          // Don't fail the request if queuing fails, just log it
          fastify.log.error({ error: queueError }, 'Failed to queue document for processing');
        }

        return reply.status(201).send({
          document: {
            id: result.document.id,
            title: result.document.title,
            filename: result.document.filename,
            fileSize: result.document.fileSize,
            mimeType: result.document.mimeType,
            status: result.document.status,
            uploadedAt: result.document.uploadedAt.toISOString(),
          },
          message: result.message,
        });
      } catch (error: any) {
        fastify.log.error('Document upload error:', error);

        // Handle validation errors
        if (
          error.message.includes('Invalid file') ||
          error.message.includes('File too large') ||
          error.message.includes('File is empty')
        ) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }

        // Handle storage errors
        if (error.message.includes('storage') || error.message.includes('Azure')) {
          return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Failed to upload file to storage',
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Document upload failed',
        });
      }
    }
  );

  // GET /api/documents - List user's documents
  fastify.get(
    '/api/documents',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['documents'],
        summary: 'List user documents',
        description: 'Get all documents uploaded by the authenticated user',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'List of documents',
            type: 'object',
            properties: {
              documents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    filename: { type: 'string' },
                    fileSize: { type: 'number' },
                    mimeType: { type: 'string' },
                    status: { type: 'string' },
                    pageCount: { type: 'number', nullable: true },
                    wordCount: { type: 'number', nullable: true },
                    uploadedAt: { type: 'string' },
                    processedAt: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Execute ListDocumentsUseCase
        const result = await container.listDocumentsUseCase.execute({
          userId: request.user!.userId,
        });

        return reply.status(200).send({
          documents: result.documents.map((doc) => ({
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            status: doc.status,
            pageCount: doc.pageCount,
            wordCount: doc.wordCount,
            uploadedAt: doc.uploadedAt.toISOString(),
            processedAt: doc.processedAt?.toISOString() || null,
          })),
        });
      } catch (error: any) {
        fastify.log.error('List documents error:', error);

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to list documents',
        });
      }
    }
  );

  // GET /api/documents/:id - Get document details
  fastify.get(
    '/api/documents/:id',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['documents'],
        summary: 'Get document details',
        description: 'Get detailed information about a specific document',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Document UUID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Document details',
            type: 'object',
            properties: {
              document: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  filename: { type: 'string' },
                  fileSize: { type: 'number' },
                  mimeType: { type: 'string' },
                  status: { type: 'string' },
                  pageCount: { type: 'number', nullable: true },
                  wordCount: { type: 'number', nullable: true },
                  uploadedAt: { type: 'string' },
                  processedAt: { type: 'string', nullable: true },
                },
              },
            },
          },
          404: {
            description: 'Document not found',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Access denied',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        // Execute GetDocumentUseCase
        const result = await container.getDocumentUseCase.execute({
          documentId: id,
          userId: request.user!.userId,
        });

        return reply.status(200).send({
          document: {
            id: result.document.id,
            title: result.document.title,
            filename: result.document.filename,
            fileSize: result.document.fileSize,
            mimeType: result.document.mimeType,
            status: result.document.status,
            pageCount: result.document.pageCount,
            wordCount: result.document.wordCount,
            uploadedAt: result.document.uploadedAt.toISOString(),
            processedAt: result.document.processedAt?.toISOString() || null,
          },
        });
      } catch (error: any) {
        fastify.log.error('Get document error:', error);

        // Handle not found
        if (error.message === 'Document not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Document not found',
          });
        }

        // Handle access denied
        if (error.message === 'Access denied') {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Access denied',
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to get document',
        });
      }
    }
  );

  // POST /api/documents/:id/process - Process a document with Genkit (extract text, embeddings, RAG)
  fastify.post(
    '/api/documents/:id/process',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['documents'],
        summary: 'Process a document with AI embeddings',
        description:
          'Extract text from document, generate embeddings with Genkit, and store chunks in vector database. Updates status to COMPLETED or FAILED.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Document UUID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Document processed successfully',
            type: 'object',
            properties: {
              document: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  status: { type: 'string' },
                  pageCount: { type: 'number', nullable: true },
                  wordCount: { type: 'number', nullable: true },
                  processedAt: { type: 'string', nullable: true },
                },
              },
              processingTimeMs: { type: 'number' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Document not found',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request (invalid ID format)',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Access denied',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Processing failed',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        // Execute ProcessDocumentUseCase (RAG + embeddings)
        const result = await container.processDocumentUseCase.execute({
          documentId: id,
          userId: request.user!.userId,
        });

        return reply.status(200).send({
          document: {
            id: result.document.id,
            title: result.document.title,
            status: result.document.status,
            pageCount: result.document.pageCount,
            wordCount: result.document.wordCount,
            processedAt: result.document.processedAt?.toISOString() || null,
          },
          processingTimeMs: result.processingTimeMs,
          message: 'Document processed successfully with AI embeddings',
        });
      } catch (error: any) {
        fastify.log.error('Process document error:', error);

        // Handle invalid UUID format
        if (error.message.includes('must be a valid UUID')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid document ID format',
          });
        }

        // Handle not found
        if (error.message === 'Document not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Document not found',
          });
        }

        // Handle access denied
        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Access denied: Document does not belong to user',
          });
        }

        // Handle processing errors
        if (error.message.includes('processing failed')) {
          return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: error.message,
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to process document',
        });
      }
    }
  );

  // POST /api/documents/:id/reprocess - Reprocess a failed or completed document
  fastify.post(
    '/api/documents/:id/reprocess',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['documents'],
        summary: 'Reprocess a document',
        description:
          'Triggers re-processing for a document that previously failed or was completed. Its status will be set to PENDING and chunks will be removed for re-embedding.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Document UUID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Document re-processing initiated successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string' },
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad Request (e.g., invalid document ID or status)',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Access denied',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Document not found',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal Server Error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const result = await container.reprocessDocumentUseCase.execute({
          documentId: id,
          userId: request.user!.userId,
        });

        // Also try to retry the queue job if it exists and failed
        try {
          const jobId = await retryFailedJob(id);
          if (jobId) {
            fastify.log.info(`Retried failed queue job: ${jobId}`);
          } else {
            // If no failed job exists, queue a new one
            await queueDocumentProcessing({
              documentId: id,
              userId: request.user!.userId,
            });
            fastify.log.info(`Queued new job for document: ${id}`);
          }
        } catch (queueError) {
          // Don't fail the request if queue retry fails
          fastify.log.error({ error: queueError }, 'Failed to retry/queue document');
        }

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Reprocess document error:', error);

        if (error.message.includes('Document not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: error.message,
          });
        }
        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: error.message,
          });
        }
        if (error.message.includes('cannot be reprocessed')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }
        if (error.message.includes('valid UUID')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid document ID format',
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to reprocess document',
        });
      }
    }
  );

  // POST /api/documents/:documentId/query - Query a document using semantic search
  fastify.post(
    '/api/documents/:documentId/query',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['documents'],
        summary: 'Query a document using semantic search',
        description: 'Search for relevant chunks within a document using natural language query',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            documentId: { type: 'string', format: 'uuid', description: 'Document UUID' },
          },
          required: ['documentId'],
        },
        body: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              minLength: 1,
              maxLength: 500,
              description: 'Natural language query to search for',
            },
            topK: {
              type: 'integer',
              minimum: 1,
              maximum: 50,
              default: 5,
              description: 'Number of results to return (default: 5)',
            },
          },
          required: ['query'],
        },
        response: {
          200: {
            description: 'Query results',
            type: 'object',
            properties: {
              documentId: { type: 'string' },
              documentTitle: { type: 'string' },
              query: { type: 'string' },
              totalResults: { type: 'integer' },
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    chunkIndex: { type: 'integer' },
                    content: { type: 'string' },
                    similarity: { type: 'number' },
                    wordCount: { type: 'integer' },
                    pageNumber: { type: 'integer', nullable: true },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Document not found',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { documentId } = request.params as { documentId: string };
        const { query, topK } = request.body as { query: string; topK?: number };

        const result = await container.queryDocumentUseCase.execute({
          documentId,
          userId: request.user!.userId,
          query,
          topK: topK || 5,
        });

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Document query error:', error);

        if (error.message === 'Document not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Document not found',
          });
        }

        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have access to this document',
          });
        }

        if (error.message.includes('not ready for querying')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }

        if (error.message.includes('valid UUID')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid document ID format',
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Query failed',
        });
      }
    }
  );

  // DELETE /api/documents/:id - Delete a document
  fastify.delete(
    '/api/documents/:id',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['documents'],
        summary: 'Delete a document',
        description: 'Delete a document and all its associated data (chunks, embeddings)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Document UUID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Document deleted successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Document not found',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const result = await container.deleteDocumentUseCase.execute({
          documentId: id,
          userId: request.user!.userId,
        });

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Delete document error:', error);

        if (error.message === 'Document not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Document not found',
          });
        }

        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have permission to delete this document',
          });
        }

        if (error.message.includes('valid UUID')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid document ID format',
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to delete document',
        });
      }
    }
  );

  // GET /api/documents/:id/download - Download a document
  fastify.get(
    '/api/documents/:id/download',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['documents'],
        summary: 'Download a document',
        description: 'Download the original document file',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Document UUID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Document file',
            type: 'string',
            format: 'binary',
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Document not found',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const result = await container.downloadDocumentUseCase.execute({
          documentId: id,
          userId: request.user!.userId,
        });

        // Set headers for file download
        // Encode filename for proper Content-Disposition header (RFC 5987)
        const encodedFilename = encodeURIComponent(result.filename);
        reply.header('Content-Type', result.mimeType);
        reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
        reply.header('Content-Length', result.buffer.length);

        return reply.status(200).send(result.buffer);
      } catch (error: any) {
        fastify.log.error('Download document error:', error);

        if (error.message === 'Document not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Document not found',
          });
        }

        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have permission to download this document',
          });
        }

        if (error.message.includes('valid UUID')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid document ID format',
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to download document',
        });
      }
    }
  );

  // POST /api/documents/:documentId/share - Share a document with classes
  fastify.post(
    '/api/documents/:documentId/share',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['documents'],
        summary: 'Share a document with one or more classes',
        description: 'Teacher shares a document with their classes. Document must be completed.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            documentId: { type: 'string', format: 'uuid' },
          },
          required: ['documentId'],
        },
        body: {
          type: 'object',
          properties: {
            classIds: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              minItems: 1,
            },
            isVisible: { type: 'boolean', default: false },
          },
          required: ['classIds'],
        },
        response: {
          200: {
            description: 'Document shared successfully',
            type: 'object',
            properties: {
              documentId: { type: 'string' },
              sharedWith: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    classId: { type: 'string' },
                    isVisible: { type: 'boolean' },
                    publishedAt: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Not found',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          409: {
            description: 'Conflict - Document already shared',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { documentId } = request.params as { documentId: string };
        const body = request.body as { classIds: string[]; isVisible?: boolean };
        const userId = request.user!.userId;

        const results = [];
        for (const classId of body.classIds) {
          const result = await container.shareDocumentWithClassUseCase.execute({
            documentId,
            classId,
            userId,
            isVisible: body.isVisible ?? false,
          });
          results.push({
            classId: result.classId,
            isVisible: result.isVisible,
            publishedAt: result.publishedAt?.toISOString() ?? null,
          });
        }

        return reply.status(200).send({
          documentId,
          sharedWith: results,
        });
      } catch (error: any) {
        if (error.message === 'Document not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Document not found',
          });
        }
        if (error.message === 'Class not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Class not found',
          });
        }
        if (error.message.includes('permission')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: error.message,
          });
        }
        if (error.message.includes('already shared')) {
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: error.message,
          });
        }
        if (error.message.includes('processed before sharing')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to share document',
        });
      }
    }
  );

  // DELETE /api/documents/:documentId/share/:classId - Unshare document from class
  fastify.delete(
    '/api/documents/:documentId/share/:classId',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['documents'],
        summary: 'Unshare a document from a class',
        description: 'Teacher removes document sharing from a class.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            documentId: { type: 'string', format: 'uuid' },
            classId: { type: 'string', format: 'uuid' },
          },
          required: ['documentId', 'classId'],
        },
        response: {
          204: {
            description: 'Document unshared successfully',
            type: 'null',
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Not found',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { documentId, classId } = request.params as {
          documentId: string;
          classId: string;
        };
        const userId = request.user!.userId;

        await container.unshareDocumentUseCase.execute({
          documentId,
          classId,
          userId,
        });

        return reply.status(204).send();
      } catch (error: any) {
        if (error.message === 'Document not found' || error.message === 'Class not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: error.message,
          });
        }
        if (error.message.includes('permission')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: error.message,
          });
        }
        if (error.message.includes('not shared')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: error.message,
          });
        }
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to unshare document',
        });
      }
    }
  );

  // GET /api/documents/:documentId/shares - Get classes a document is shared with
  fastify.get(
    '/api/documents/:documentId/shares',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['documents'],
        summary: 'Get classes a document is shared with',
        description: 'Teacher gets all classes their document is shared with.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            documentId: { type: 'string', format: 'uuid' },
          },
          required: ['documentId'],
        },
        response: {
          200: {
            description: 'Document shares retrieved successfully',
            type: 'object',
            properties: {
              documentId: { type: 'string' },
              sharedWith: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    classId: { type: 'string' },
                    className: { type: 'string' },
                    isVisible: { type: 'boolean' },
                    publishedAt: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Not found',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { documentId } = request.params as { documentId: string };
        const userId = request.user!.userId;

        const result = await container.getDocumentSharesUseCase.execute({
          documentId,
          userId,
        });

        return reply.status(200).send({
          documentId: result.documentId,
          sharedWith: result.sharedWith.map((share) => ({
            classId: share.classId,
            className: share.className,
            isVisible: share.isVisible,
            publishedAt: share.publishedAt?.toISOString() ?? null,
          })),
        });
      } catch (error: any) {
        if (error.message === 'Document not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Document not found',
          });
        }
        if (error.message.includes('permission')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: error.message,
          });
        }
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to get document shares',
        });
      }
    }
  );

  // PATCH /api/documents/:documentId/share/:classId - Update document visibility
  fastify.patch(
    '/api/documents/:documentId/share/:classId',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['documents'],
        summary: 'Update document visibility for a class',
        description: 'Teacher updates whether a shared document is visible to students.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            documentId: { type: 'string', format: 'uuid' },
            classId: { type: 'string', format: 'uuid' },
          },
          required: ['documentId', 'classId'],
        },
        body: {
          type: 'object',
          properties: {
            isVisible: { type: 'boolean' },
          },
          required: ['isVisible'],
        },
        response: {
          200: {
            description: 'Visibility updated successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              classId: { type: 'string' },
              documentId: { type: 'string' },
              isVisible: { type: 'boolean' },
              publishedAt: { type: 'string', nullable: true },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Not found',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { documentId, classId } = request.params as {
          documentId: string;
          classId: string;
        };
        const { isVisible } = request.body as { isVisible: boolean };
        const userId = request.user!.userId;

        const result = await container.updateDocumentVisibilityUseCase.execute({
          documentId,
          classId,
          userId,
          isVisible,
        });

        return reply.status(200).send({
          id: result.id,
          classId: result.classId,
          documentId: result.documentId,
          isVisible: result.isVisible,
          publishedAt: result.publishedAt?.toISOString() ?? null,
        });
      } catch (error: any) {
        if (error.message === 'Document not found' || error.message === 'Class not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: error.message,
          });
        }
        if (error.message.includes('permission')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: error.message,
          });
        }
        if (error.message.includes('not shared')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Document is not shared with this class',
          });
        }
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to update visibility',
        });
      }
    }
  );
}
