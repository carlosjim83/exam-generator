# Exam Generation Specification

**Version**: 1.0  
**Last Updated**: 2026-01-26

---

## Overview

This document specifies how teachers generate exams from uploaded documents using RAG (Retrieval-Augmented Generation).

---

## Exam Generation Flow

```
1. Teacher opens exam generator and selects one or multiple documents
   ↓
2. Teacher specifies parameters: topic, question count, difficulty, question type
   ↓
3. Backend generates query embedding from topic
   ↓
4. Vector similarity search retrieves relevant chunks from selected documents
   ↓
5. Build prompt with retrieved chunks as context
   ↓
6. Gemini API generates structured exam (JSON)
   ↓
7. Parse and validate JSON response
   ↓
8. Store exam + questions in database
   ↓
9. Return exam to frontend for review/editing
```

---

## Generate Exam

**Endpoint**: `POST /api/exams/generate`

**Request**:
```json
{
  "documentIds": ["uuid-1234", "uuid-5678"], // Can select multiple documents
  "topic": "Cell division and mitosis",
  "questionCount": 10,
  "difficulty": "mixed", // "easy", "medium", "hard", "mixed"
  "questionType": "multiple-choice" // Future: "true-false", "short-answer"
}
```

**Validation**:
- `documentIds`: Array of document UUIDs, all must exist and belong to user, min 1, max 10 documents
- `topic`: Required, min 3 chars, max 200 chars
- `questionCount`: Min 1, max 50 (default: 10)
- `difficulty`: One of `["easy", "medium", "hard", "mixed"]` (default: "mixed")
- `questionType`: Only "multiple-choice" for MVP

**Response** (201 Created):
```json
{
  "exam": {
    "id": "exam-uuid-1234",
    "title": "Cell division and mitosis - Exam",
    "topic": "Cell division and mitosis",
    "documentIds": ["uuid-1234", "uuid-5678"],
    "questionCount": 10,
    "createdAt": "2026-01-26T14:00:00Z",
    "questions": [
      {
        "id": "q-uuid-1",
        "question": "What is the primary purpose of mitosis?",
        "options": {
          "A": "To produce gametes",
          "B": "To create two identical daughter cells",
          "C": "To reduce chromosome number",
          "D": "To increase genetic variation"
        },
        "correctAnswer": "B",
        "explanation": "Mitosis is the process of cell division that produces two genetically identical daughter cells, each with the same number of chromosomes as the parent cell.",
        "difficulty": "easy",
        "position": 1
      },
      {
        "id": "q-uuid-2",
        "question": "During which phase of mitosis do chromosomes align at the cell's equator?",
        "options": {
          "A": "Prophase",
          "B": "Metaphase",
          "C": "Anaphase",
          "D": "Telophase"
        },
        "correctAnswer": "B",
        "explanation": "During metaphase, chromosomes line up along the metaphase plate (equator) of the cell before being separated.",
        "difficulty": "medium",
        "position": 2
      }
      // ... 8 more questions
    ]
  }
}
```

**Errors**:
- `400`: Invalid parameters (empty documentIds, invalid question count, etc.)
- `403`: User does not own one or more documents
- `404`: One or more documents not found or not ready (`status !== 'READY'`)
- `429`: Rate limit exceeded (Gemini API)
- `500`: Generation failed (Gemini API error)

---

## Backend Implementation

### Step 1: Validate Request

```typescript
async function generateExam(request: GenerateExamRequest) {
  // Verify all documents exist and belong to user
  const documents = await prisma.document.findMany({
    where: { 
      id: { in: request.documentIds },
      userId: request.user.id 
    }
  });
  
  if (documents.length !== request.documentIds.length) {
    throw new Error('One or more documents not found or forbidden', 404);
  }
  
  // Check all documents are ready
  const notReady = documents.filter(d => d.status !== 'READY');
  if (notReady.length > 0) {
    throw new Error(`Documents still processing: ${notReady.map(d => d.title).join(', ')}`, 400);
  }
}
```

---

### Step 2: Generate Query Embedding

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function generateQueryEmbedding(topic: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(topic);
  return result.embedding.values; // float32[] (768 dims)
}
```

**Why embed the topic?**
- Topic is user's natural language query ("Cell division and mitosis")
- We need a vector to search against chunk embeddings
- Embedding captures semantic meaning (not just keywords)

---

### Step 3: Retrieve Relevant Chunks (RAG)

```typescript
interface RelevantChunk {
  id: string;
  content: string;
  similarity: number;
  documentTitle: string; // For source attribution
}

async function retrieveRelevantChunks(
  documentIds: string[],
  queryEmbedding: number[],
  topK: number = 10 // Higher for multi-document search
): Promise<RelevantChunk[]> {
  const results = await prisma.$queryRaw<RelevantChunk[]>`
    SELECT 
      c.id,
      c.content,
      d.title as "documentTitle",
      1 - (c.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    FROM "Chunk" c
    INNER JOIN "Document" d ON c."documentId" = d.id
    WHERE c."documentId" = ANY(${documentIds})
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${topK}
  `;
  
  // Filter chunks with low similarity (optional quality control)
  return results.filter(chunk => chunk.similarity > 0.7);
}
```

**Explanation**:
- `<=>`: pgvector cosine distance operator
- `= ANY(array)`: Search across multiple documents
- `JOIN Document`: Include source document title for context
- `1 - distance`: Convert distance to similarity (1.0 = identical, 0.0 = unrelated)
- `ORDER BY ... LIMIT`: Get top-K most similar chunks
- `similarity > 0.7`: Only use relevant chunks (optional threshold)

**Why top-K = 5?**
- Balance between context (more chunks = more info) and focus (fewer chunks = less noise)
- 5 chunks × 1000 chars = ~5000 chars = ~3750 tokens (fits in prompt)

---

### Step 4: Build Prompt

```typescript
function buildExamPrompt(
  topic: string,
  chunks: RelevantChunk[],
  questionCount: number,
  difficulty: string
): string {
  const context = chunks
    .map((chunk, i) => `[Context ${i + 1}]\n${chunk.content}`)
    .join('\n\n---\n\n');
  
  const difficultyInstruction = 
    difficulty === 'mixed' 
      ? 'Mix of easy (30%), medium (50%), and hard (20%) questions'
      : `All questions should be ${difficulty} difficulty`;
  
  return `
You are an expert educator creating a multiple-choice exam.

CONTEXT FROM DOCUMENT:
${context}

TASK:
Generate ${questionCount} multiple-choice questions about: "${topic}"

REQUIREMENTS:
1. Questions MUST be based ONLY on the provided context above
2. Do NOT use external knowledge - only information from the context
3. Each question must have exactly 4 options (A, B, C, D)
4. Only ONE option should be correct
5. Include a clear explanation for why the correct answer is right
6. ${difficultyInstruction}
7. Questions should test understanding, not just memorization
8. Avoid ambiguous or trick questions

DIFFICULTY LEVELS:
- Easy: Direct recall of facts from the context
- Medium: Requires understanding relationships or applying concepts
- Hard: Requires analysis, synthesis, or connecting multiple ideas

OUTPUT FORMAT (valid JSON only, no markdown):
{
  "questions": [
    {
      "question": "Clear, specific question text?",
      "options": {
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      },
      "correctAnswer": "B",
      "explanation": "Detailed explanation of why B is correct and others are wrong",
      "difficulty": "medium"
    }
  ]
}

Generate the exam now:
`.trim();
}
```

**Prompt Engineering Tips**:
- ✅ Clear structure (CONTEXT → TASK → REQUIREMENTS → OUTPUT FORMAT)
- ✅ Explicit constraints ("ONLY from context", "valid JSON only")
- ✅ Examples of quality (difficulty definitions)
- ✅ Negative examples ("Avoid ambiguous questions")

---

### Step 5: Call Gemini API

```typescript
const generationModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro', // Or 'gemini-2.0-flash' (faster, cheaper)
  generationConfig: {
    temperature: 0.7,    // Balanced creativity (0=deterministic, 1=creative)
    topP: 0.9,           // Nucleus sampling
    topK: 40,            // Limit vocab diversity
    maxOutputTokens: 8192, // Max response length
    responseMimeType: 'application/json', // Force JSON output
  },
});

async function callGeminiGeneration(prompt: string): Promise<string> {
  try {
    const result = await generationModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    if (error.message.includes('RATE_LIMIT')) {
      throw new Error('Rate limit exceeded, try again later', 429);
    }
    throw new Error('Failed to generate exam', 500);
  }
}
```

**Why `responseMimeType: 'application/json'`?**
- Forces Gemini to output valid JSON (no markdown, no extra text)
- Reduces parsing errors

---

### Step 6: Parse and Validate Response

```typescript
interface GeneratedExam {
  questions: Array<{
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

function parseExamResponse(jsonText: string): GeneratedExam {
  let parsed: GeneratedExam;
  
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error('Invalid JSON response from AI', 500);
  }
  
  // Validate structure
  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error('Missing or invalid questions array', 500);
  }
  
  for (const q of parsed.questions) {
    if (!q.question || !q.options || !q.correctAnswer || !q.explanation) {
      throw new Error('Incomplete question structure', 500);
    }
    
    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
      throw new Error('Invalid correctAnswer value', 500);
    }
    
    if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) {
      throw new Error('Missing option(s)', 500);
    }
  }
  
  return parsed;
}
```

**Error Recovery**:
- If parsing fails → Retry with modified prompt (add "IMPORTANT: Output valid JSON")
- If validation fails → Retry generation (up to 3 attempts)
- If all retries fail → Return 500 error

---

### Step 7: Store Exam in Database

```typescript
async function storeExam(
  userId: string,
  documentId: string,
  topic: string,
  generatedExam: GeneratedExam
): Promise<Exam> {
  const exam = await prisma.exam.create({
    data: {
      title: `${topic} - Exam`,
      topic,
      documentId,
      userId,
      questions: {
        create: generatedExam.questions.map((q, index) => ({
          question: q.question,
          optionA: q.options.A,
          optionB: q.options.B,
          optionC: q.options.C,
          optionD: q.options.D,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          position: index + 1,
        })),
      },
    },
    include: {
      questions: {
        orderBy: { position: 'asc' },
      },
    },
  });
  
  return exam;
}
```

---

## Exam Management

### List User's Exams

**Endpoint**: `GET /api/exams`

**Query Params**:
- `documentId`: Filter by document (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response** (200 OK):
```json
{
  "exams": [
    {
      "id": "exam-uuid-1",
      "title": "Cell division and mitosis - Exam",
      "topic": "Cell division and mitosis",
      "questionCount": 10,
      "documentTitle": "Biology Chapter 3",
      "createdAt": "2026-01-26T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

---

### Get Exam Details

**Endpoint**: `GET /api/exams/:id`

**Response** (200 OK):
```json
{
  "id": "exam-uuid-1",
  "title": "Cell division and mitosis - Exam",
  "topic": "Cell division and mitosis",
  "documentId": "uuid-1234",
  "documentTitle": "Biology Chapter 3",
  "createdAt": "2026-01-26T14:00:00Z",
  "questions": [
    {
      "id": "q-uuid-1",
      "question": "What is the primary purpose of mitosis?",
      "options": {
        "A": "To produce gametes",
        "B": "To create two identical daughter cells",
        "C": "To reduce chromosome number",
        "D": "To increase genetic variation"
      },
      "correctAnswer": "B",
      "explanation": "Mitosis is the process...",
      "difficulty": "easy",
      "position": 1
    }
    // ... more questions
  ]
}
```

**Authorization**: User must own the exam

---

### Edit Exam (Manual Review)

**Endpoint**: `PATCH /api/exams/:id`

**Request** (partial update):
```json
{
  "title": "Updated Exam Title",
  "questions": [
    {
      "id": "q-uuid-1",
      "question": "Improved question text?",
      "options": {
        "A": "Updated option A",
        "B": "Updated option B",
        "C": "Updated option C",
        "D": "Updated option D"
      },
      "correctAnswer": "C",
      "explanation": "Updated explanation"
    }
  ]
}
```

**Response** (200 OK): Updated exam object

**Use case**: Teacher reviews AI-generated exam and fixes errors

---

### Delete Exam

**Endpoint**: `DELETE /api/exams/:id`

**Response** (204 No Content)

**Backend Logic**:
```typescript
await prisma.exam.delete({
  where: { id: examId }
}); // Cascades to questions (Prisma schema: onDelete: Cascade)
```

**Authorization**: User must own the exam

---

## Quality Control

### Chunk Relevance Threshold

If retrieved chunks have low similarity (<0.7), warn user:

```json
{
  "warning": "Not enough relevant content found for this topic. Exam quality may be lower than expected.",
  "relevantChunks": 2,
  "totalChunks": 87
}
```

**Frontend**: Show warning banner, allow user to cancel or proceed

---

### AI Generation Validation

After parsing JSON, validate:
1. **Question count**: Must match requested count (±1 acceptable)
2. **Unique questions**: No duplicate question text
3. **Option diversity**: All 4 options should be distinct
4. **Correct answer validity**: Must be one of A, B, C, D
5. **Explanation quality**: Min 20 chars (not just "Because B is correct")

If validation fails → Retry generation with improved prompt

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Query embedding generation | <500ms |
| Vector similarity search | <100ms |
| Gemini generation (10 questions) | <10s |
| Database storage | <500ms |
| **Total end-to-end** | **<15s** |

**For large exams** (50 questions): <30s

---

## Frontend Integration

### Generate Exam Flow (React)

```typescript
async function generateExam(documentId: string, topic: string, questionCount: number) {
  setLoading(true);
  
  try {
    const response = await fetch('/api/exams/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentId, topic, questionCount }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const { exam } = await response.json();
    
    // Navigate to exam review page
    router.push(`/exams/${exam.id}`);
    
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}
```

**Loading state**: Show spinner + message ("Analyzing document...", "Generating questions...")

---

### Exam Review UI

```typescript
function ExamReview({ exam }: { exam: Exam }) {
  const [editMode, setEditMode] = useState(false);
  
  return (
    <div>
      <h1>{exam.title}</h1>
      <p>Topic: {exam.topic}</p>
      <p>{exam.questions.length} questions</p>
      
      <button onClick={() => setEditMode(!editMode)}>
        {editMode ? 'Save Changes' : 'Edit Exam'}
      </button>
      
      {exam.questions.map((q, index) => (
        <QuestionCard 
          key={q.id} 
          question={q} 
          index={index} 
          editMode={editMode}
        />
      ))}
    </div>
  );
}

function QuestionCard({ question, index, editMode }) {
  return (
    <div className="border rounded p-4 mb-4">
      <h3>Question {index + 1}</h3>
      
      {editMode ? (
        <textarea value={question.question} onChange={...} />
      ) : (
        <p>{question.question}</p>
      )}
      
      <div className="options">
        {Object.entries(question.options).map(([key, text]) => (
          <div key={key} className={key === question.correctAnswer ? 'correct' : ''}>
            <strong>{key}:</strong> {text}
          </div>
        ))}
      </div>
      
      <details>
        <summary>Explanation</summary>
        <p>{question.explanation}</p>
      </details>
      
      <span className="badge">{question.difficulty}</span>
    </div>
  );
}
```

---

## Export Formats (Future Feature)

### Export as PDF

**Endpoint**: `GET /api/exams/:id/export?format=pdf`

**Use case**: Print exam for paper-based test

---

### Export as JSON

**Endpoint**: `GET /api/exams/:id/export?format=json`

**Use case**: Import into other systems (Moodle, Canvas, etc.)

---

## Testing Requirements

### Unit Tests
- Query embedding generation (mock Gemini)
- Vector similarity search (test SQL query)
- Prompt building (test string formatting)
- JSON parsing and validation
- Exam storage (test Prisma create)

### Integration Tests
- Full generation pipeline (document → chunks → retrieval → generation → storage)
- Error handling (invalid document, API failure)
- Edit exam (partial update)
- Delete exam (cascade to questions)

### E2E Tests (Playwright)
- User generates exam → sees loading state → exam appears
- User reviews exam → clicks edit → modifies question → saves
- User deletes exam → exam removed from list
- User tries to generate exam from unprocessed document → sees error

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/exams/generate` | Yes | Generate exam from document |
| GET | `/api/exams` | Yes | List user's exams |
| GET | `/api/exams/:id` | Yes | Get exam details |
| PATCH | `/api/exams/:id` | Yes | Edit exam (manual review) |
| DELETE | `/api/exams/:id` | Yes | Delete exam |
| GET | `/api/exams/:id/export` | Yes | Export exam (PDF/JSON) |

---

## Related Documentation
- See `docs/adr/0005-ai-provider.md` for Gemini API decisions
- See `docs/adr/0007-rag-implementation.md` for RAG pipeline details
- See `docs/specs/document-upload.md` for document processing

**Last Updated**: 2026-01-26
