# ADR 0007: RAG Implementation for Exam Generation

**Date**: 2026-01-26  
**Status**: Accepted  
**Decision Makers**: Student + Senior Architect

---

## Context

We need to implement **Retrieval-Augmented Generation (RAG)** to generate exam questions from uploaded documents.

**RAG workflow**:
1. **Retrieval**: Find relevant document chunks based on topic/query
2. **Augmentation**: Inject retrieved chunks into AI prompt context
3. **Generation**: AI generates questions based on the augmented context

**Requirements**:
- Extract text from PDFs and DOCX files
- Split documents into semantically meaningful chunks
- Generate embeddings for similarity search
- Retrieve top-K most relevant chunks
- Generate structured exam output (JSON)

**Options considered**:
1. **LangChain** (popular framework for RAG)
2. **LlamaIndex** (data framework for LLMs)
3. **Custom implementation** (manual chunking + embeddings)
4. **Haystack** (NLP framework with RAG support)

---

## Decision

We will implement a **custom RAG pipeline** without heavy frameworks.

**Justification**: For a learning project, understanding RAG internals is more valuable than using abstraction layers like LangChain. We'll use focused libraries for specific tasks.

**Tech stack**:
- **Text extraction**: `pdf-parse` (PDFs), `mammoth` (DOCX)
- **Chunking**: Custom implementation with `langchain/text_splitter` utility
- **Embeddings**: Gemini API (`text-embedding-004`)
- **Vector storage**: PostgreSQL + pgvector
- **Generation**: Gemini API (`gemini-1.5-pro`)

---

## Rationale

### Why Custom Implementation over LangChain?

#### Learning Value
- ✅ **Understand RAG internals**: Chunking strategies, embedding generation, similarity search
- ✅ **No magic**: See exactly what's happening at each step
- ✅ **Better debugging**: Full control over pipeline
- ✅ **Portfolio value**: Demonstrates deep understanding, not just framework usage

#### Simplicity
- ✅ **Less dependencies**: LangChain is 20+ packages (heavy)
- ✅ **Faster development**: No learning curve for LangChain abstractions
- ✅ **Easier testing**: Test individual functions, not framework magic

#### Performance
- ✅ **No overhead**: Direct API calls (no middleware)
- ✅ **Optimized queries**: Custom SQL for pgvector (faster than LangChain's ORM)

---

### Why NOT LangChain?

While LangChain is powerful:
- ❌ **Overkill**: We only need basic RAG (retrieval + generation)
- ❌ **Abstraction leak**: When things break, debugging is hard
- ❌ **Version churn**: LangChain API changes frequently
- ❌ **Learning hindrance**: Students copy-paste without understanding
- ✅ Good for production with complex chains (but not our case)

---

### Why NOT LlamaIndex?

- ❌ Similar issues to LangChain (heavy framework)
- ❌ Optimized for document indexing (we don't need that complexity)
- ✅ Excellent for large-scale RAG systems (overkill here)

---

## Implementation Details

### 1. Document Text Extraction

```typescript
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

async function extractText(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const dataBuffer = await fs.readFile(filePath);
    const pdf = await pdfParse(dataBuffer);
    return pdf.text;
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}
```

---

### 2. Text Chunking Strategy

**Strategy**: Recursive character splitting with overlap

```typescript
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

async function chunkDocument(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,        // ~750 tokens (Gemini tokenizer)
    chunkOverlap: 200,      // Preserve context between chunks
    separators: ['\n\n', '\n', '. ', ' ', ''], // Try semantic boundaries first
  });
  
  return await splitter.splitText(text);
}
```

**Why these parameters?**
- **chunkSize: 1000 chars**: Balances context (enough info) vs specificity (not too broad)
- **chunkOverlap: 200 chars**: Prevents losing context at chunk boundaries
- **Separators**: Tries to split at paragraph → sentence → word boundaries

---

### 3. Embedding Generation

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values; // float32[] (768 dimensions)
}
```

---

### 4. Store Chunks + Embeddings

```typescript
// Prisma schema
model Chunk {
  id         String                 @id @default(uuid())
  content    String                 @db.Text
  embedding  Unsupported("vector(768)")? // pgvector
  position   Int                    // Chunk order in document
  documentId String
  document   Document               @relation(fields: [documentId], references: [id], onDelete: Cascade)
  createdAt  DateTime               @default(now())
  
  @@index([documentId, position])
}

// Insert chunks with embeddings
async function storeChunks(documentId: string, chunks: string[]) {
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);
    
    await prisma.$executeRaw`
      INSERT INTO "Chunk" (id, content, embedding, position, "documentId")
      VALUES (
        gen_random_uuid(),
        ${chunks[i]},
        ${JSON.stringify(embedding)}::vector,
        ${i},
        ${documentId}
      )
    `;
  }
}
```

---

### 5. Similarity Search (Retrieval)

```typescript
async function retrieveRelevantChunks(
  documentId: string,
  query: string,
  topK: number = 5
): Promise<Array<{ content: string; similarity: number }>> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Cosine similarity search with pgvector
  const results = await prisma.$queryRaw<Array<{ content: string; similarity: number }>>`
    SELECT 
      content,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    FROM "Chunk"
    WHERE "documentId" = ${documentId}
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${topK}
  `;
  
  return results;
}
```

**Explanation**:
- `<=>`: pgvector cosine distance operator
- `1 - distance`: Convert distance to similarity (higher = more similar)
- `ORDER BY ... LIMIT`: Get top-K most similar chunks

---

### 6. Exam Generation (Augmented Generation)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const generationModel = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 0.7,      // Balanced creativity
    responseMimeType: 'application/json', // Structured output
  }
});

async function generateExam(
  documentId: string,
  topic: string,
  questionCount: number = 10
): Promise<Exam> {
  // Retrieve relevant chunks
  const chunks = await retrieveRelevantChunks(documentId, topic, 5);
  
  // Build context from chunks
  const context = chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join('\n\n');
  
  // Prompt with retrieved context
  const prompt = `
You are an expert educator creating an exam based on the following content.

CONTEXT:
${context}

TASK:
Generate ${questionCount} multiple-choice questions about: "${topic}"

REQUIREMENTS:
- Questions must be based ONLY on the provided context
- Each question must have 4 options (A, B, C, D)
- Include the correct answer
- Add a brief explanation for the correct answer
- Vary difficulty (easy, medium, hard)

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "question": "What is...?",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correctAnswer": "B",
      "explanation": "Because...",
      "difficulty": "medium"
    }
  ]
}
`;

  const result = await generationModel.generateContent(prompt);
  const examData = JSON.parse(result.response.text());
  
  return examData;
}
```

---

## Data Models

### Document Processing Pipeline

```
1. Upload PDF/DOCX
   ↓
2. Extract text (pdf-parse / mammoth)
   ↓
3. Split into chunks (RecursiveCharacterTextSplitter)
   ↓
4. Generate embeddings (Gemini text-embedding-004)
   ↓
5. Store in PostgreSQL (Document + Chunks with embeddings)
   ↓
6. Ready for exam generation
```

### Exam Generation Pipeline

```
1. User requests exam (topic, question count)
   ↓
2. Generate query embedding (topic text)
   ↓
3. Similarity search (pgvector cosine distance)
   ↓
4. Retrieve top-5 most relevant chunks
   ↓
5. Build prompt (context + instructions)
   ↓
6. Generate exam (Gemini 1.5 Pro)
   ↓
7. Parse JSON response
   ↓
8. Store exam in database
   ↓
9. Return to user
```

---

## Performance Optimizations

### Chunking
- **Batch processing**: Process documents asynchronously (BullMQ queue)
- **Caching**: Cache extracted text (avoid re-parsing same file)

### Embeddings
- **Batch API calls**: Gemini supports batch embedding (100 texts/request)
- **Rate limiting**: Respect API limits (15 req/min free tier)

### Vector Search
- **HNSW index**: Add pgvector HNSW index for faster similarity search
  ```sql
  CREATE INDEX ON "Chunk" USING hnsw (embedding vector_cosine_ops);
  ```
- **Pre-filtering**: Filter by documentId before vector search (faster)

---

## Quality Considerations

### Chunking Quality
- **Test with real documents**: Validate chunks are semantically coherent
- **Adjust parameters**: Tune chunkSize/overlap based on document type

### Retrieval Quality
- **Relevance threshold**: Filter chunks with similarity < 0.7 (not relevant)
- **Diversity**: Use MMR (Maximal Marginal Relevance) if needed (avoid redundant chunks)

### Generation Quality
- **Prompt engineering**: Iterate on prompt to improve question quality
- **Validation**: Check generated JSON schema (must match expected format)
- **Human review**: Teacher can edit questions before finalizing

---

## Testing Strategy

### Unit Tests
- Text extraction (mock PDFs/DOCX)
- Chunking logic (test edge cases: empty docs, single paragraph)
- Embedding generation (mock Gemini API)
- Similarity search (mock pgvector queries)

### Integration Tests
- Full pipeline: PDF → chunks → embeddings → DB
- Retrieval: Query → top-K chunks
- Generation: Context → exam JSON

### E2E Tests
- Upload document → process → generate exam → display

---

## Error Handling

### Document Processing Failures
- **Corrupt file**: Return clear error ("File could not be parsed")
- **Empty document**: Skip embedding (no chunks generated)
- **API rate limit**: Retry with exponential backoff

### Generation Failures
- **Invalid JSON**: Retry with clearer prompt
- **No relevant chunks**: Return error ("Not enough content about this topic")
- **API timeout**: Queue for async processing

---

## Consequences

### Positive
- Deep understanding of RAG internals
- Full control over pipeline (no framework lock-in)
- Easier debugging and optimization
- Simpler codebase (fewer dependencies)
- Better performance (no middleware overhead)

### Negative
- More code to write (vs LangChain abstractions)
- Need to handle edge cases manually
- No built-in LangChain features (agents, memory, etc. - but we don't need them)

### Neutral
- Must keep up with Gemini API changes (no framework buffer)
- If requirements expand, might reconsider LangChain

---

## Future Enhancements

### Advanced Retrieval
- **Hybrid search**: Combine vector search + keyword search (BM25)
- **Re-ranking**: Use cross-encoder to re-rank top chunks
- **Query expansion**: Generate multiple query variations

### Better Chunking
- **Semantic chunking**: Use NLP to split at topic boundaries
- **Metadata filtering**: Filter by document section, page number

### Multi-Document RAG
- **Cross-document search**: Generate exams from multiple documents
- **Source attribution**: Show which chunk each question came from

---

## Alternatives Considered

### LangChain
- ✅ Fast prototyping
- ✅ Many integrations
- ❌ Less learning value
- ❌ Heavy dependency

### LlamaIndex
- ✅ Document-centric
- ✅ Good for large corpora
- ❌ Overkill for our use case

### Haystack
- ✅ Production-ready
- ❌ Steeper learning curve
- ❌ Less popular than LangChain

---

## Related Decisions
- See ADR 0003 for database (pgvector stores embeddings)
- See ADR 0005 for AI provider (Gemini generates embeddings + exams)
- See ADR 0006 for file storage (Azure Blob Storage for PDFs)

---

## References
- [RAG Paper (Lewis et al., 2020)](https://arxiv.org/abs/2005.11401)
- [LangChain Text Splitters](https://js.langchain.com/docs/modules/data_connection/document_transformers/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Gemini Embeddings Guide](https://ai.google.dev/docs/embeddings_guide)
- [Chunking Strategies for RAG](https://www.pinecone.io/learn/chunking-strategies/)
