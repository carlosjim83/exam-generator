# ADR 0006: Azure Blob Storage for Document Files

**Date**: 2026-01-26  
**Status**: Accepted  
**Decision Makers**: Student + Senior Architect

---

## Context

We need to store uploaded documents (PDFs, DOCX) with:
- Secure access control (users can only access their own files)
- Scalable storage (hundreds of documents, MB-GB each)
- Public/temporary access URLs (for downloading)
- Integration with Azure infrastructure (student has Azure account)

**Options considered**:
1. **Local filesystem** (store in backend/uploads/)
2. **Azure Blob Storage** (Azure object storage)
3. **AWS S3** (object storage)
4. **Uploadthing** (managed file upload service)
5. **Cloudflare R2** (S3-compatible, cheaper)

---

## Decision

We will use **Azure Blob Storage** for document file storage.

**SDK**: `@azure/storage-blob` (official TypeScript SDK)

**Storage structure**:
```
azure-container: exam-generator-documents
├── {userId}/
│   ├── {documentId}.pdf
│   ├── {documentId}.docx
│   └── ...
```

---

## Rationale

### Why Azure Blob Storage?

#### Integration with Existing Infrastructure
- ✅ Student already has **Azure account** (free credits)
- ✅ Consistent with deployment strategy (Azure App Service)
- ✅ Single cloud provider (simpler billing, management)
- ✅ Azure AD integration (if needed for auth)

#### Features
- ✅ **SAS Tokens**: Generate temporary signed URLs for secure downloads
- ✅ **Access tiers**: Hot, Cool, Archive (optimize costs)
- ✅ **Lifecycle policies**: Auto-delete old files
- ✅ **CDN integration**: Fast global delivery (if needed)

#### Cost
- ✅ **Free tier**: 5GB + 20k operations/month
- ✅ **Production**: ~$0.02/GB/month (Hot tier)
- ✅ Cheaper than competitors for small-medium scale

#### Developer Experience
- ✅ Official TypeScript SDK (well-documented)
- ✅ Azure Storage Explorer (GUI for debugging)
- ✅ Easy to set up (create storage account in Azure Portal)

---

### Why NOT Local Filesystem?

- ❌ **Not scalable**: Single server, no redundancy
- ❌ **Lost on redeployment**: Containers are ephemeral
- ❌ **No CDN**: Slower access for global users
- ❌ **Backup complexity**: Manual backup setup
- ✅ Only good for prototyping

---

### Why NOT AWS S3?

- ❌ Student has **Azure** account, not AWS
- ❌ Two cloud providers = more complexity
- ❌ S3 pricing slightly higher for small workloads
- ✅ S3 is excellent, but Azure is the right fit here

---

### Why NOT Uploadthing?

- ❌ Another service to manage (separate from Azure)
- ❌ Limited free tier (1GB)
- ❌ Costs add up quickly ($10/month for 10GB)
- ✅ Great for quick prototypes (but we're building proper infrastructure)

---

## Consequences

### Positive
- Secure, scalable file storage
- Integration with Azure ecosystem
- SAS tokens for temporary access (no public URLs)
- Automatic redundancy (3 copies by default)
- Easy to add CDN later (Azure CDN)

### Negative
- Azure SDK slightly more complex than Uploadthing
- Need to manage container lifecycle policies manually
- Requires Azure Storage Account setup

### Neutral
- Need to learn Azure Blob Storage concepts (containers, blobs, SAS)
- Must handle file cleanup on document deletion

---

## Implementation Notes

### File Upload Flow

1. **Frontend** → Request upload URL from backend:
   ```
   POST /api/documents/upload-url
   Response: { uploadUrl, documentId }
   ```

2. **Frontend** → Upload file directly to Azure (bypasses backend):
   ```typescript
   await fetch(uploadUrl, {
     method: 'PUT',
     headers: { 'x-ms-blob-type': 'BlockBlob' },
     body: file
   });
   ```

3. **Frontend** → Notify backend that upload is complete:
   ```
   POST /api/documents/confirm-upload
   Body: { documentId, filename, size }
   ```

4. **Backend**:
   - Validates file exists in Azure
   - Extracts text (PDF/DOCX parsing)
   - Generates embeddings
   - Stores metadata in PostgreSQL

---

### SAS Token Generation

```typescript
import { BlobServiceClient, generateBlobSASQueryParameters } from '@azure/storage-blob';

// Generate temporary upload URL (valid for 10min)
async function generateUploadUrl(userId: string, documentId: string) {
  const blobName = `${userId}/${documentId}.pdf`;
  const containerClient = blobServiceClient.getContainerClient('documents');
  const blobClient = containerClient.getBlobClient(blobName);
  
  const sasToken = generateBlobSASQueryParameters({
    containerName: 'documents',
    blobName: blobName,
    permissions: 'w', // Write only
    expiresOn: new Date(Date.now() + 10 * 60 * 1000), // 10min
  }, sharedKeyCredential);
  
  return `${blobClient.url}?${sasToken}`;
}

// Generate temporary download URL (valid for 1 hour)
async function generateDownloadUrl(userId: string, documentId: string) {
  const blobName = `${userId}/${documentId}.pdf`;
  const containerClient = blobServiceClient.getContainerClient('documents');
  const blobClient = containerClient.getBlobClient(blobName);
  
  const sasToken = generateBlobSASQueryParameters({
    containerName: 'documents',
    blobName: blobName,
    permissions: 'r', // Read only
    expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  }, sharedKeyCredential);
  
  return `${blobClient.url}?${sasToken}`;
}
```

---

### Security Considerations

#### Access Control
- ✅ Container is **private** (not publicly accessible)
- ✅ Files stored under `{userId}/` prefix (namespace isolation)
- ✅ SAS tokens are **time-limited** (10min upload, 1hr download)
- ✅ Backend validates user owns document before generating SAS token

#### File Validation
- ✅ Check MIME type (only PDF, DOCX allowed)
- ✅ Check file size (max 10MB per document)
- ✅ Scan for malware (optional: Azure Defender for Storage)

#### Data Retention
- ✅ Lifecycle policy: Delete files after 1 year (or when document deleted)
- ✅ Soft delete enabled (30-day recovery window)

---

### Cost Estimation

**Assumptions**:
- 100 users, 10 documents each = 1000 documents
- Average document size: 2MB
- Total storage: 2GB

**Monthly costs** (Hot tier):
- Storage: 2GB × $0.02 = **$0.04/month**
- Operations: 1000 uploads + 5000 downloads = **$0.03/month**
- **Total**: ~$0.07/month (within free tier)

**At scale** (10,000 documents, 20GB):
- Storage: **$0.40/month**
- Operations: **$0.30/month**
- **Total**: ~$0.70/month

---

## Testing Strategy

### Unit Tests
- Mock Azure SDK (`@azure/storage-blob`)
- Test SAS token generation logic
- Test file path construction (`${userId}/${documentId}`)

### Integration Tests
- Real Azure Storage Account (test container)
- Upload file → verify exists
- Generate download URL → verify accessible
- Delete file → verify removed

### E2E Tests
- Full document upload flow (frontend → backend → Azure)
- Download document via SAS URL
- Try accessing another user's document (should fail)

---

## Deployment Considerations

### Environment Variables
```bash
AZURE_STORAGE_ACCOUNT_NAME=examgenstorage
AZURE_STORAGE_ACCOUNT_KEY=xxx
AZURE_STORAGE_CONTAINER_NAME=documents
```

### Azure Setup Steps
1. Create Storage Account (Azure Portal)
2. Create container: `documents` (private access)
3. Enable soft delete (30 days)
4. Set lifecycle policy (optional: auto-delete after 1 year)
5. Copy access keys to `.env`

---

## Alternatives Considered

### Local Filesystem
- ✅ Simplest implementation
- ❌ Not production-ready
- ❌ No redundancy

### AWS S3
- ✅ Industry standard
- ✅ Excellent SDK
- ❌ Student has Azure, not AWS
- ❌ Two cloud providers

### Uploadthing
- ✅ Easiest setup (1 line of code)
- ✅ Built-in UI components
- ❌ Cost ($10/month for 10GB)
- ❌ Vendor lock-in

### Cloudflare R2
- ✅ S3-compatible API
- ✅ Zero egress fees
- ❌ Student doesn't have Cloudflare account
- ❌ Another service to manage

---

## Migration Path (if needed)

If we need to switch storage providers:
1. Abstract storage behind interface:
   ```typescript
   interface FileStorage {
     uploadFile(userId: string, documentId: string, file: Buffer): Promise<string>;
     getDownloadUrl(userId: string, documentId: string): Promise<string>;
     deleteFile(userId: string, documentId: string): Promise<void>;
   }
   ```
2. Implement adapters (AzureBlobStorage, S3Storage, etc.)
3. Migrate existing files (bulk copy script)

---

## Related Decisions
- See ADR 0002 for backend framework (Fastify handles upload URLs)
- See ADR 0004 for authentication (validates user owns document)

---

## References
- [Azure Blob Storage Documentation](https://learn.microsoft.com/en-us/azure/storage/blobs/)
- [Azure Storage SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
- [SAS Token Best Practices](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview)
- [Azure Storage Pricing](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/)
