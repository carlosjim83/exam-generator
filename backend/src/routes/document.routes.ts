import type { FastifyInstance } from 'fastify';

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
        // Get uploaded file from multipart request
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'No file uploaded',
          });
        }

        // Convert file stream to buffer
        const buffer = await data.toBuffer();

        // Get title from fields (or use filename)
        const fields = data.fields;
        const title = (fields.title as any)?.value || undefined;

        // Execute UploadDocumentUseCase
        const result = await container.uploadDocumentUseCase.execute({
          userId: (request as any).user.userId,
          title,
          filename: data.filename,
          mimetype: data.mimetype,
          buffer,
        });

        // 🔥 Add document to processing queue
        // The worker will fetch the document from DB and get all necessary data
        try {
          const userId = (request as any).user.userId;
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
          userId: (request as any).user.userId,
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
          userId: (request as any).user.userId,
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
          userId: (request as any).user.userId,
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
          userId: (request as any).user.userId,
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
              userId: (request as any).user.userId,
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
          userId: (request as any).user.userId,
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
          userId: (request as any).user.userId,
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
          userId: (request as any).user.userId,
        });

        // Set headers for file download
        reply.header('Content-Type', result.mimeType);
        reply.header('Content-Disposition', `attachment; filename="${result.filename}"`);
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
}
