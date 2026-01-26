# ADR 0003: PostgreSQL + pgvector for Data and Embeddings

**Date**: 2026-01-26  
**Status**: Accepted  
**Decision Makers**: Student + Senior Architect

---

## Context

We need to store:
1. **Structured data**: Users, documents metadata, exams, questions
2. **Vector embeddings**: For RAG (Retrieval-Augmented Generation) similarity search

**Options considered**:

### For structured data:
1. **PostgreSQL** (relational)
2. **MongoDB** (document database)
3. **MySQL** (relational)

### For vector embeddings:
1. **Pinecone** (dedicated vector DB, cloud service)
2. **Weaviate** (open-source vector DB)
3. **Qdrant** (modern vector DB)
4. **pgvector** (PostgreSQL extension)
5. **Supabase** (Postgres + pgvector as a service)

---

## Decision

We will use **PostgreSQL + pgvector extension** for both structured data and vector embeddings.

**Tools**:
- **Prisma**: ORM for type-safe database access
- **pgvector**: Extension for storing and querying embeddings
- **Docker Compose**: Local PostgreSQL instance for development

---

## Rationale

### Why PostgreSQL over NoSQL (MongoDB)?

#### Data Structure
- ✅ Our data is **inherently relational**:
  - Users → Documents (one-to-many)
  - Documents → Chunks (one-to-many)
  - Documents → Exams (one-to-many)
  - Exams → Questions (one-to-many)
- ✅ Strong referential integrity (foreign keys, cascades)
- ✅ ACID transactions (important for auth + document processing)

#### Ecosystem
- ✅ Prisma has excellent PostgreSQL support
- ✅ Azure Database for PostgreSQL (easy deployment)
- ✅ Better TypeScript support with Prisma (auto-generated types)

#### Future-Proofing
- ✅ If we need complex queries (analytics, reporting), SQL is easier
- ✅ JSON columns available if we need document-like storage

---

### Why pgvector over Dedicated Vector DBs?

#### Simplicity
- ✅ **Single database system** (not two separate services)
- ✅ Embeddings stored next to metadata (no sync issues)
- ✅ Simpler deployment (one DB instead of Postgres + Pinecone)
- ✅ Easier local development (Docker Compose)

#### Cost
- ✅ No additional service costs (Pinecone charges per vector)
- ✅ Azure Postgres supports pgvector natively

#### Performance
- ✅ For our scale (~thousands of documents), pgvector is sufficient
- ✅ Cosine similarity search is fast enough (<100ms)
- ✅ Can add HNSW indexes if needed (approximate nearest neighbor)

#### Flexibility
- ✅ Can join embeddings with metadata in single query
- ✅ No vendor lock-in (Pinecone/Weaviate proprietary APIs)

---

## Consequences

### Positive
- Single database to manage
- Prisma generates types for everything (users, documents, embeddings)
- Transactions across structured data + embeddings
- Easy to migrate (standard SQL dump)
- Lower infrastructure complexity

### Negative
- pgvector not as optimized as dedicated vector DBs (but good enough for our scale)
- Need to manually install pgvector extension
- If we scale to millions of vectors, might need to migrate

### Neutral
- Need to learn pgvector syntax (L2 distance, cosine similarity operators)
- Embedding queries slightly different from Pinecone/Weaviate APIs

---

## Implementation Notes

### Prisma Schema Example
```prisma
model Document {
  id        String   @id @default(uuid())
  title     String
  blobUrl   String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  chunks    Chunk[]
  exams     Exam[]
  createdAt DateTime @default(now())
}

model Chunk {
  id         String                 @id @default(uuid())
  content    String
  embedding  Unsupported("vector")? // pgvector type
  documentId String
  document   Document               @relation(fields: [documentId], references: [id])
}
```

### pgvector Query Example
```typescript
// Cosine similarity search
const results = await prisma.$queryRaw`
  SELECT id, content, 1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM "Chunk"
  WHERE "documentId" = ${documentId}
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 5
`;
```

---

## Alternatives Considered

### MongoDB + Atlas Vector Search
- ✅ Document-based (flexible schema)
- ❌ Our data is relational (users → docs → chunks)
- ❌ Worse TypeScript experience with Mongoose
- ❌ Atlas Vector Search is new (less mature than pgvector)

### Pinecone (dedicated vector DB)
- ✅ Highly optimized for vectors (best performance)
- ✅ Managed service (no ops)
- ❌ Additional cost (~$70/month for production)
- ❌ Two databases to manage (sync issues)
- ❌ Vendor lock-in

### Supabase (Postgres + pgvector as a service)
- ✅ Managed Postgres with pgvector
- ✅ Built-in auth (but we're using Passport.js)
- ❌ Another service to learn
- ❌ We already have Azure infrastructure

---

## Migration Path (if needed)

If we outgrow pgvector (millions of documents):
1. Keep PostgreSQL for structured data
2. Migrate embeddings to Pinecone/Weaviate
3. Sync embedding IDs between systems
4. Minimal code changes (abstract vector search behind interface)

---

## Related Decisions
- See ADR 0005 for AI provider (Gemini generates embeddings)
- See ADR 0007 for RAG implementation details

---

## References
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Prisma with pgvector](https://www.prisma.io/docs/orm/prisma-schema/data-model/unsupported-types)
- [PostgreSQL vs MongoDB Decision Guide](https://www.postgresql.org/about/)
