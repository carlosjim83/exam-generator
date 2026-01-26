import { FastifyInstance } from 'fastify';
import { DocumentService } from '../services/document.service.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const documentService = new DocumentService();

export async function documentRoutes(fastify: FastifyInstance) {
  // POST /documents/upload - Upload a document (PDF or DOCX)
  fastify.post(
    '/documents/upload',
    {
      preHandler: authenticateUser, // Require authentication
      schema: {
        tags: ['documents'],
        summary: 'Upload a document (PDF or DOCX)',
        description: 'Upload a PDF or DOCX file for exam generation. The file will be processed asynchronously.',
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

        // Validate file
        const validation = documentService.validateFile({
          filename: data.filename,
          mimetype: data.mimetype,
          size: buffer.length,
        });

        if (!validation.valid) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: validation.error || 'Invalid file',
          });
        }

        // Get title from fields (or use filename)
        const fields = data.fields;
        const title = (fields.title as any)?.value || data.filename.replace(/\.[^/.]+$/, '');

        // Upload to Azure Blob Storage
        let blobUrl: string;
        try {
          blobUrl = await documentService.uploadToBlob(data.filename, buffer);
        } catch (error: any) {
          fastify.log.error('Azure upload error:', error);
          return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Failed to upload file to storage',
          });
        }

        // Create document record in database
        const document = await documentService.createDocument({
          userId: request.user!.userId,
          title,
          filename: data.filename,
          fileSize: buffer.length,
          mimeType: data.mimetype,
          blobUrl,
        });

        // TODO: Trigger async processing (text extraction, chunking, embeddings)
        // For now, just return the document record

        return reply.status(201).send({
          document: {
            id: document.id,
            title: document.title,
            filename: document.filename,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            status: document.status,
            uploadedAt: document.uploadedAt.toISOString(),
          },
          message: 'Document uploaded successfully. Processing will start shortly.',
        });
      } catch (error: any) {
        fastify.log.error('Document upload error:', error);

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Document upload failed',
        });
      }
    }
  );

  // GET /documents - List user's documents
  fastify.get(
    '/documents',
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
                    status: { type: 'string' },
                    uploadedAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const documents = await documentService.getDocumentsByUserId(request.user!.userId);

      return reply.status(200).send({
        documents: documents.map((doc) => ({
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
          fileSize: doc.fileSize,
          status: doc.status,
          uploadedAt: doc.uploadedAt.toISOString(),
        })),
      });
    }
  );

  // GET /documents/:id - Get document details
  fastify.get(
    '/documents/:id',
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
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const document = await documentService.getDocumentById(id);

      if (!document) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Document not found',
        });
      }

      // Check if document belongs to user
      if (document.userId !== request.user!.userId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Access denied',
        });
      }

      return reply.status(200).send({
        document: {
          id: document.id,
          title: document.title,
          filename: document.filename,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          status: document.status,
          pageCount: document.pageCount,
          wordCount: document.wordCount,
          uploadedAt: document.uploadedAt.toISOString(),
          processedAt: document.processedAt?.toISOString() || null,
        },
      });
    }
  );
}
