import { Type } from '@sinclair/typebox';

// --- Document schemas ---

export const DocumentUploadResponseSchema = Type.Object(
  {
    document: Type.Object({
      id: Type.String(),
      title: Type.String(),
      filename: Type.String(),
      fileSize: Type.Number(),
      mimeType: Type.String(),
      status: Type.String(),
      uploadedAt: Type.String(),
    }),
    message: Type.String(),
  },
  { description: 'Document uploaded successfully' }
);

export const DocumentListItemSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  filename: Type.String(),
  fileSize: Type.Number(),
  mimeType: Type.String(),
  status: Type.String(),
  pageCount: Type.Union([Type.Number(), Type.Null()]),
  wordCount: Type.Union([Type.Number(), Type.Null()]),
  uploadedAt: Type.String(),
  processedAt: Type.Union([Type.String(), Type.Null()]),
});

export const DocumentListResponseSchema = Type.Object(
  {
    documents: Type.Array(DocumentListItemSchema),
  },
  { description: 'List of documents' }
);

export const DocumentDetailSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  filename: Type.String(),
  fileSize: Type.Number(),
  mimeType: Type.String(),
  status: Type.String(),
  pageCount: Type.Union([Type.Number(), Type.Null()]),
  wordCount: Type.Union([Type.Number(), Type.Null()]),
  uploadedAt: Type.String(),
  processedAt: Type.Union([Type.String(), Type.Null()]),
});

export const DocumentDetailResponseSchema = Type.Object(
  {
    document: DocumentDetailSchema,
  },
  { description: 'Document details' }
);

export const DocumentProcessResponseSchema = Type.Object(
  {
    document: Type.Object({
      id: Type.String(),
      title: Type.String(),
      status: Type.String(),
      pageCount: Type.Union([Type.Number(), Type.Null()]),
      wordCount: Type.Union([Type.Number(), Type.Null()]),
      processedAt: Type.Union([Type.String(), Type.Null()]),
    }),
    processingTimeMs: Type.Number(),
    message: Type.String(),
  },
  { description: 'Document processed successfully' }
);

export const DocumentReprocessResponseSchema = Type.Object(
  {
    id: Type.String(),
    status: Type.String(),
    message: Type.String(),
  },
  { description: 'Document re-processing initiated' }
);

export const QueryResultSchema = Type.Object({
  chunkIndex: Type.Integer(),
  content: Type.String(),
  similarity: Type.Number(),
  wordCount: Type.Integer(),
  pageNumber: Type.Union([Type.Integer(), Type.Null()]),
});

export const DocumentQueryResponseSchema = Type.Object(
  {
    documentId: Type.String(),
    documentTitle: Type.String(),
    query: Type.String(),
    totalResults: Type.Integer(),
    results: Type.Array(QueryResultSchema),
  },
  { description: 'Query results' }
);

export const DocumentShareItemSchema = Type.Object({
  classId: Type.String(),
  isVisible: Type.Boolean(),
  publishedAt: Type.Union([Type.String(), Type.Null()]),
});

export const DocumentShareResponseSchema = Type.Object(
  {
    documentId: Type.String(),
    sharedWith: Type.Array(DocumentShareItemSchema),
  },
  { description: 'Document shared successfully' }
);

export const DocumentShareDetailSchema = Type.Object({
  classId: Type.String(),
  className: Type.String(),
  isVisible: Type.Boolean(),
  publishedAt: Type.Union([Type.String(), Type.Null()]),
});

export const DocumentSharesResponseSchema = Type.Object(
  {
    documentId: Type.String(),
    sharedWith: Type.Array(DocumentShareDetailSchema),
  },
  { description: 'Document shares retrieved' }
);

export const DocumentVisibilityResponseSchema = Type.Object(
  {
    id: Type.String(),
    classId: Type.String(),
    documentId: Type.String(),
    isVisible: Type.Boolean(),
    publishedAt: Type.Union([Type.String(), Type.Null()]),
  },
  { description: 'Visibility updated successfully' }
);
