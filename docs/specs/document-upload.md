# Document Upload & Processing Specification

**Version**: 1.0  
**Last Updated**: 2026-01-26

---

## Overview

This document specifies how teachers upload documents (PDF, DOCX) and how the backend processes them for RAG-based exam generation.

---

## Supported File Types

| Type | MIME Type | Max Size | Parser |
|------|-----------|----------|--------|
| PDF | `application/pdf` | 10MB | `pdf-parse` |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | 10MB | `mammoth` |

**Future support**: `.txt`, `.pptx`, scanned PDFs (OCR)

---

## Upload Flow (Direct to Azure)

### Why Direct Upload?

Instead of uploading through the backend (POST multipart), we use **direct client-to-Azure upload** with SAS tokens:

**Benefits**:
- ✅ Faster (no backend bottleneck)
- ✅ Lower backend load (no large file handling)
- ✅ Better UX (progress bar, no timeout)
- ✅ Scalable (Azure handles bandwidth)

---

### Step 1: Request Upload URL

**Endpoint**: `POST /api/documents/upload-url`

**Request**:
```json
{
  "filename": "biology-chapter-3.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 2048000
}
```

**Validation**:
- `filename`: Required, max 255 chars
- `mimeType`: Must be `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `sizeBytes`: Max 10MB (10,485,760 bytes)

**Response** (200 OK):
```json
{
  "documentId": "uuid-1234",
  "uploadUrl": "https://storage.blob.core.windows.net/documents/userId/uuid-1234.pdf?sv=2021-08-06&se=2026-01-26T12%3A10%3A00Z&sr=b&sp=w&sig=xxx",
  "expiresAt": "2026-01-26T12:00:00Z"
}
```

**Backend Logic**:
1. Validate user authentication
2. Validate file type and size
3. Generate unique `documentId` (UUID)
4. Create SAS token for Azure Blob (write-only, 10min expiry)
5. Construct blob path: `{userId}/{documentId}.{ext}`
6. Return upload URL + documentId

**Errors**:
- `400`: Invalid file type or size
- `401`: Unauthorized
- `413`: File too large

---

### Step 2: Upload File to Azure

**Frontend**: Use fetch or XMLHttpRequest to upload directly to Azure

```typescript
async function uploadFile(file: File, uploadUrl: string) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': file.type,
    },
    body: file,
  });
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
}
```

**Azure Response**: `201 Created` (no body)

**Errors**:
- `403`: SAS token expired or invalid
- `413`: File too large
- `500`: Azure storage error

---

### Step 3: Confirm Upload

**Endpoint**: `POST /api/documents/confirm-upload`

**Request**:
```json
{
  "documentId": "uuid-1234",
  "filename": "biology-chapter-3.pdf",
  "title": "Biology Chapter 3: Cells" // Optional, defaults to filename
}
```

**Response** (201 Created):
```json
{
  "document": {
    "id": "uuid-1234",
    "title": "Biology Chapter 3: Cells",
    "filename": "biology-chapter-3.pdf",
    "status": "PROCESSING",
    "createdAt": "2026-01-26T12:00:00Z"
  }
}
```

**Backend Logic**:
1. Validate user authentication
2. Verify file exists in Azure Blob Storage (HEAD request)
3. Get file size from Azure metadata
4. Create document record in database:
   ```typescript
   await prisma.document.create({
     data: {
       id: documentId,
       title: title || filename,
       filename,
       blobUrl: `https://storage.blob.core.windows.net/documents/${userId}/${documentId}.pdf`,
       mimeType,
       sizeBytes,
       status: 'PROCESSING',
       userId,
     }
   });
   ```
5. **Trigger async processing** (queue job or background task)
6. Return document metadata

**Errors**:
- `400`: Missing documentId or filename
- `404`: File not found in Azure (upload failed)
- `409`: Document already confirmed

---

## Async Document Processing

### Processing Pipeline

```
1. Download file from Azure
   ↓
2. Extract text (pdf-parse or mammoth)
   ↓
3. Validate extracted text (min 100 chars)
   ↓
4. Split into chunks (RecursiveCharacterTextSplitter)
   ↓
5. Generate embeddings (Gemini API, batch)
   ↓
6. Store chunks + embeddings in PostgreSQL
   ↓
7. Update document status: PROCESSING → READY
```

**Processing Time**: ~5-30 seconds depending on document size

---

### Background Job (Optional: BullMQ)

For production, use a queue system to avoid blocking:

```typescript
// Add job to queue
await documentQueue.add('process-document', { documentId });

// Worker processes job
documentQueue.process('process-document', async (job) => {
  const { documentId } = job.data;
  await processDocument(documentId);
});
```

**Benefits**:
- Non-blocking (API responds immediately)
- Retries on failure
- Rate limiting (respect Gemini API limits)

**For MVP**: Simple async function (no queue)

---

### Text Extraction

**PDF Parsing**:
```typescript
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath);
  const pdf = await pdfParse(dataBuffer);
  return pdf.text; // Extracted text
}
```

**DOCX Parsing**:
```typescript
import mammoth from 'mammoth';

async function extractTextFromDOCX(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value; // Extracted text
}
```

**Error Handling**:
- **Corrupt file**: Update status to `FAILED`, log error
- **Empty document**: Update status to `FAILED`, error message: "No text found"
- **Parser error**: Retry once, then fail

---

### Text Chunking

**Strategy**: Recursive character splitting with overlap

```typescript
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,       // ~750 tokens
    chunkOverlap: 200,     // Preserve context
    separators: ['\n\n', '\n', '. ', ' ', ''],
  });
  
  return await splitter.splitText(text);
}
```

**Why 1000 chars?**
- Gemini embedding model supports up to 2048 tokens
- 1000 chars ≈ 750 tokens (safe margin)
- Balances context (enough info) vs specificity (not too broad)

**Why 200 char overlap?**
- Prevents losing context at chunk boundaries
- Example: "Mitosis is a process. [CHUNK BREAK] The process involves..." → overlap ensures "process" context is preserved

---

### Embedding Generation

**Batch Processing** (efficient):
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Process in batches of 100 (Gemini API limit)
  for (let i = 0; i < chunks.length; i += 100) {
    const batch = chunks.slice(i, i + 100);
    
    const results = await Promise.all(
      batch.map(chunk => embeddingModel.embedContent(chunk))
    );
    
    embeddings.push(...results.map(r => r.embedding.values));
    
    // Rate limiting: 15 req/min on free tier
    if (i + 100 < chunks.length) {
      await sleep(4000); // 4 seconds between batches
    }
  }
  
  return embeddings;
}
```

**Error Handling**:
- **Rate limit**: Exponential backoff (retry after 10s, 20s, 40s)
- **API error**: Retry 3 times, then fail document processing

---

### Store Chunks + Embeddings

```typescript
async function storeChunks(documentId: string, chunks: string[], embeddings: number[][]) {
  for (let i = 0; i < chunks.length; i++) {
    await prisma.$executeRaw`
      INSERT INTO "Chunk" (id, content, embedding, position, "documentId")
      VALUES (
        gen_random_uuid(),
        ${chunks[i]},
        ${JSON.stringify(embeddings[i])}::vector,
        ${i},
        ${documentId}
      )
    `;
  }
}
```

**Note**: `::vector` casts JSON array to pgvector type

---

### Update Document Status

```typescript
// On success
await prisma.document.update({
  where: { id: documentId },
  data: { status: 'READY' }
});

// On failure
await prisma.document.update({
  where: { id: documentId },
  data: { 
    status: 'FAILED',
    errorMessage: 'Failed to extract text from PDF'
  }
});
```

---

## Document Management

### List User's Documents

**Endpoint**: `GET /api/documents`

**Query Params**:
- `status`: Filter by status (`PROCESSING`, `READY`, `FAILED`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response** (200 OK):
```json
{
  "documents": [
    {
      "id": "uuid-1234",
      "title": "Biology Chapter 3",
      "filename": "biology-chapter-3.pdf",
      "status": "READY",
      "sizeBytes": 2048000,
      "createdAt": "2026-01-26T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

**Backend Logic**:
```typescript
const documents = await prisma.document.findMany({
  where: { 
    userId: request.user.id,
    status: request.query.status // Optional filter
  },
  select: {
    id: true,
    title: true,
    filename: true,
    status: true,
    sizeBytes: true,
    createdAt: true,
  },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
});
```

---

### Get Document Details

**Endpoint**: `GET /api/documents/:id`

**Response** (200 OK):
```json
{
  "id": "uuid-1234",
  "title": "Biology Chapter 3",
  "filename": "biology-chapter-3.pdf",
  "status": "READY",
  "sizeBytes": 2048000,
  "mimeType": "application/pdf",
  "chunkCount": 87,
  "createdAt": "2026-01-26T12:00:00Z",
  "exams": [
    {
      "id": "exam-uuid",
      "title": "Cell Biology Quiz",
      "createdAt": "2026-01-26T13:00:00Z"
    }
  ]
}
```

**Authorization**: User must own the document

---

### Download Document

**Endpoint**: `GET /api/documents/:id/download`

**Response**: Redirect to Azure Blob SAS URL (read-only, 1 hour expiry)

```typescript
async function getDownloadUrl(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  
  if (document.userId !== userId) {
    throw new Error('Forbidden');
  }
  
  const sasToken = generateBlobSASQueryParameters({
    containerName: 'documents',
    blobName: `${userId}/${documentId}.pdf`,
    permissions: 'r', // Read only
    expiresOn: new Date(Date.now() + 3600 * 1000), // 1 hour
  }, sharedKeyCredential);
  
  return `${document.blobUrl}?${sasToken}`;
}
```

**Frontend**: Automatically downloads file

```typescript
window.location.href = `/api/documents/${documentId}/download`;
```

---

### Delete Document

**Endpoint**: `DELETE /api/documents/:id`

**Response** (204 No Content)

**Backend Logic**:
1. Verify user owns document
2. Delete file from Azure Blob Storage
3. Delete document record (cascades to chunks via Prisma)
4. Return 204

```typescript
// Delete from Azure
const blobClient = containerClient.getBlobClient(`${userId}/${documentId}.pdf`);
await blobClient.delete();

// Delete from database (cascades to chunks and exams)
await prisma.document.delete({ where: { id: documentId } });
```

**Authorization**: User must own the document

**Errors**:
- `403`: User does not own document
- `404`: Document not found

---

## Error States

### Document Status Values

| Status | Description | User Action |
|--------|-------------|-------------|
| `PROCESSING` | Document is being processed | Wait (show spinner) |
| `READY` | Document ready for exam generation | Can generate exams |
| `FAILED` | Processing failed | Delete and re-upload |

### Error Messages

Stored in `document.errorMessage` field:

- `"File is corrupt or unreadable"`
- `"No text found in document"`
- `"Failed to generate embeddings (API error)"`
- `"Document is too short (min 100 characters)"`

---

## Frontend Integration

### Upload Flow (React)

```typescript
async function uploadDocument(file: File) {
  // Step 1: Request upload URL
  const { documentId, uploadUrl } = await fetch('/api/documents/upload-url', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  }).then(res => res.json());
  
  // Step 2: Upload to Azure (with progress)
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      const percent = (e.loaded / e.total) * 100;
      setUploadProgress(percent);
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 201) {
        resolve(null);
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    xhr.send(file);
  });
  
  // Step 3: Confirm upload
  await fetch('/api/documents/confirm-upload', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      documentId, 
      filename: file.name,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
    }),
  });
  
  // Step 4: Poll for processing completion
  await pollDocumentStatus(documentId);
}

async function pollDocumentStatus(documentId: string) {
  const interval = setInterval(async () => {
    const document = await fetch(`/api/documents/${documentId}`).then(r => r.json());
    
    if (document.status === 'READY') {
      clearInterval(interval);
      showSuccess('Document ready!');
    } else if (document.status === 'FAILED') {
      clearInterval(interval);
      showError(document.errorMessage);
    }
  }, 2000); // Poll every 2 seconds
}
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Upload URL generation | <100ms |
| File upload to Azure | Depends on file size + bandwidth |
| Document processing (10MB PDF) | <30s |
| Chunking | <2s for 100 pages |
| Embedding generation | ~1s per 100 chunks (rate limited) |

---

## Testing Requirements

### Unit Tests
- Text extraction (PDF, DOCX)
- Chunking logic (edge cases: short text, empty doc)
- Embedding generation (mock Gemini API)
- SAS token generation

### Integration Tests
- Upload URL generation
- File upload to Azure (test storage account)
- Confirm upload (verify file exists)
- Full processing pipeline (PDF → chunks → embeddings → DB)
- Delete document (verify Azure + DB cleanup)

### E2E Tests (Playwright)
- User uploads PDF → sees processing status → status changes to READY
- User uploads corrupt file → sees error message
- User deletes document → document removed from list

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/documents/upload-url` | Yes | Get Azure upload URL |
| POST | `/api/documents/confirm-upload` | Yes | Confirm upload, start processing |
| GET | `/api/documents` | Yes | List user's documents |
| GET | `/api/documents/:id` | Yes | Get document details |
| GET | `/api/documents/:id/download` | Yes | Download document (SAS URL) |
| DELETE | `/api/documents/:id` | Yes | Delete document + file |

---

## Related Documentation
- See `docs/adr/0006-file-storage.md` for Azure Blob Storage decisions
- See `docs/adr/0007-rag-implementation.md` for RAG pipeline details
- See `docs/architecture.md` for system overview

**Last Updated**: 2026-01-26
