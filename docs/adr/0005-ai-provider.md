# ADR 0005: Google Gemini API for Embeddings and Text Generation

**Date**: 2026-01-26  
**Status**: Accepted  
**Decision Makers**: Student + Senior Architect

---

## Context

We need AI capabilities for:
1. **Embeddings generation**: Convert document chunks into vectors for similarity search
2. **Exam generation**: Generate questions/answers based on document content (RAG)
3. **Text extraction improvement**: Optional OCR/text understanding

**Requirements**:
- Must be accessible (free tier or affordable)
- Good quality embeddings (512-1536 dimensions)
- Support for long context (exam generation needs large prompts)
- TypeScript SDK available

**Options considered**:
1. **OpenAI** (GPT-4, text-embedding-3)
2. **Google Gemini** (Gemini 1.5 Pro, text-embedding-004)
3. **Anthropic Claude** (Claude 3.5 Sonnet)
4. **Cohere** (embeddings + generation)
5. **Open-source models** (Ollama, llama.cpp)

---

## Decision

We will use **Google Gemini API** with:
- **text-embedding-004**: For generating embeddings (768 dimensions)
- **gemini-1.5-pro** or **gemini-2.0-flash**: For exam question generation

**SDK**: `@google/generative-ai` (official TypeScript/JavaScript SDK)

---

## Rationale

### Why Gemini over OpenAI?

#### Cost & Availability
- ✅ **Generous free tier**: 1,500 requests/day (vs OpenAI's strict limits)
- ✅ Student has access to Gemini API
- ✅ No credit card required for free tier
- ✅ Lower cost at scale ($0.03/1k tokens vs OpenAI $0.10/1k)

#### Performance
- ✅ **Long context window**: Gemini 1.5 Pro supports 1M tokens (huge for RAG)
- ✅ Fast response times (comparable to GPT-4)
- ✅ Good embedding quality (768 dims, competitive with OpenAI)

#### Features
- ✅ Multimodal support (text + images) - useful if we add image extraction from PDFs
- ✅ JSON mode (structured output for exams)
- ✅ Function calling (if we need tool use later)

#### Integration
- ✅ Official TypeScript SDK (well-documented)
- ✅ Simple API (easier than OpenAI's chat completions)
- ✅ Good error handling and retries built-in

---

### Why NOT OpenAI?

While GPT-4 is excellent:
- ❌ **Cost**: More expensive (important for student project)
- ❌ **Free tier**: Very limited (3 RPM on free tier)
- ❌ Student doesn't have OpenAI API access readily available
- ✅ If budget allows, OpenAI is a solid choice

---

### Why NOT Claude?

- ❌ **No embeddings API**: Anthropic doesn't offer embeddings (would need separate service)
- ❌ **Cost**: More expensive than Gemini
- ✅ Excellent at reasoning and instruction-following (but not needed for this use case)

---

### Why NOT Open-Source (Ollama/llama.cpp)?

- ❌ **Hosting complexity**: Requires GPU server or local GPU
- ❌ **Quality**: Embeddings not as good as commercial models
- ❌ **Slower**: Inference time much higher without good hardware
- ✅ Great for privacy-sensitive projects (but not our priority)

---

## Consequences

### Positive
- Free tier covers development and initial production
- Long context window perfect for RAG (entire document chapters)
- Single API for embeddings + generation (simpler integration)
- Official SDK with TypeScript types
- Can add multimodal features later (image extraction from PDFs)

### Negative
- Less ecosystem tooling than OpenAI (LangChain, LlamaIndex favor OpenAI)
- Gemini API occasionally changes (less stable than OpenAI)
- Smaller community (fewer tutorials/examples)

### Neutral
- Need to learn Gemini API specifics (different from OpenAI format)
- Prompt engineering may differ from GPT-4 best practices

---

## Implementation Notes

### Embedding Generation
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

// Generate embedding for a chunk
const result = await model.embedContent(chunk.content);
const embedding = result.embedding.values; // float32 array (768 dimensions)
```

### Exam Generation (RAG)
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

const prompt = `
Based on the following content, generate 10 multiple-choice questions.

Content:
${relevantChunks.map(c => c.content).join('\n\n')}

Format: JSON array with {question, options: [A,B,C,D], correctAnswer, explanation}
`;

const result = await model.generateContent(prompt);
const examQuestions = JSON.parse(result.response.text());
```

### Rate Limiting
- Free tier: 15 requests/minute (embeddings), 2 requests/minute (generation)
- Implement exponential backoff for retries
- Queue system (BullMQ) for batch processing

---

## API Costs (Production)

### Gemini Pricing (after free tier)
- **Embeddings**: $0.00025 per 1k tokens (~$0.25 per 1M tokens)
- **Generation**: $0.00125 per 1k tokens input, $0.005 per 1k tokens output
- **Example**: 1000 documents × 10 chunks × 500 tokens = ~$1.25 for embeddings

### Comparison (1M input tokens)
| Provider | Embeddings | Generation (input) |
|----------|------------|-------------------|
| Gemini   | $0.25      | $1.25             |
| OpenAI   | $0.13      | $10.00 (GPT-4)    |
| Cohere   | $0.10      | $1.00             |

---

## Quality Considerations

### Embedding Quality
- **Dimensions**: 768 (good balance between quality and storage)
- **Performance**: Competitive with OpenAI text-embedding-3-small
- **Languages**: Supports 100+ languages (good for internationalization)

### Generation Quality
- **Instruction following**: Excellent (comparable to GPT-4)
- **JSON mode**: Reliable structured output
- **Hallucination rate**: Low (with proper prompting)

---

## Testing Strategy

### Unit Tests
- Mock Gemini API responses
- Test embedding normalization
- Test JSON parsing from generation

### Integration Tests
- Real API calls (with test API key)
- Validate embedding dimensions
- Validate exam question format

### E2E Tests
- Full document → chunks → embeddings → exam flow
- Test with various document types (PDF, DOCX)

---

## Migration Path (if needed)

If we need to switch providers:
1. Abstract AI calls behind interface:
   ```typescript
   interface EmbeddingProvider {
     generateEmbedding(text: string): Promise<number[]>;
   }
   
   interface TextGenerator {
     generateExam(context: string, prompt: string): Promise<Exam>;
   }
   ```
2. Implement adapters for different providers
3. Minimal code changes (swap implementation)

---

## Alternatives Considered

### OpenAI (GPT-4 + text-embedding-3)
- ✅ Best-in-class quality
- ✅ Largest ecosystem
- ❌ Cost (10x more expensive)
- ❌ Stricter rate limits

### Cohere
- ✅ Excellent embeddings (specialized)
- ✅ Good pricing
- ❌ Less powerful text generation than Gemini/GPT-4
- ❌ Smaller context window

### Local Models (Ollama)
- ✅ Zero API cost
- ✅ Full control
- ❌ Requires GPU infrastructure
- ❌ Lower quality

---

## Related Decisions
- See ADR 0003 for database (pgvector stores embeddings)
- See ADR 0007 for RAG implementation details

---

## References
- [Google AI Documentation](https://ai.google.dev/docs)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Gemini 1.5 Pro Technical Report](https://arxiv.org/abs/2403.05530)
- [Embedding Quality Benchmarks](https://github.com/embeddings-benchmark/mteb)
