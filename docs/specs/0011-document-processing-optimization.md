# Spec: Document Processing Optimization

**Status**: Draft  
**Created**: 2026-02-28  
**Author**: Senior Architect  
**Priority**: Post-MVP (Production Readiness)  
**Related**: [ADR 0007](../adr/0007-rag-implementation.md), [Spec 0010](0010-class-resources.md)

---

## Problem Statement

### Current Situation

The document processing worker has hardcoded rate limiting designed for Azure OpenAI free tier:

```typescript
// DocumentWorker.ts
concurrency: 1,              // Process ONE document at a time
limiter: {
  max: 1,                    // Max 1 job
  duration: 60 * 1000,       // Per 60 seconds
}
```

**Impact:**

- 10 documents uploaded = **10 minutes wait time**
- 50 documents uploaded = **50 minutes wait time**
- Teacher uploads materials before class → Students can't use them immediately

### Why It Exists

- Azure OpenAI free tier has strict TPM (Tokens Per Minute) limits
- Embedding generation uses `text-embedding-ada-002` which consumes tokens
- We implemented conservative limits to avoid `429 Rate Limit` errors

### The Problem

Production environments with paid Azure OpenAI quotas can handle much higher throughput. The current configuration:

1. **Degrades UX unnecessarily** in production
2. **Cannot be changed without code changes**
3. **Scales poorly** as user base grows

---

## Goals

1. **Make rate limiting configurable** via environment variables
2. **Support different configurations per environment** (dev, staging, production)
3. **Enable lazy processing** as an alternative approach
4. **Prepare for scale** without code changes

---

## Proposed Solutions

### Solution A: Dynamic Worker Configuration (Recommended)

Make the worker configuration dynamic based on environment variables.

#### Implementation

```typescript
// src/infrastructure/queue/DocumentWorker.ts

// Rate limiting configuration (from environment)
const WORKER_CONFIG = {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '1', 10),
  rateLimit: {
    max: parseInt(process.env.WORKER_RATE_LIMIT_MAX || '1', 10),
    duration: parseInt(process.env.WORKER_RATE_LIMIT_DURATION || '60000', 10),
  },
  timeout: parseInt(process.env.WORKER_TIMEOUT_MS || '600000', 10), // 10 min default
};

export const documentWorker = new Worker<DocumentJobData>(
  'document-processing',
  async (job: Job<DocumentJobData>) => {
    // ... processing logic
  },
  {
    connection: redisConnection,
    concurrency: WORKER_CONFIG.concurrency,
    limiter: WORKER_CONFIG.rateLimit,
    settings: {
      backoffStrategy: (attemptsMade: number) => {
        return Math.min(Math.pow(2, attemptsMade) * 1000, 10000);
      },
    },
  }
);
```

#### Environment Configuration

```bash
# .env.development (Free tier - conservative)
WORKER_CONCURRENCY=1
WORKER_RATE_LIMIT_MAX=1
WORKER_RATE_LIMIT_DURATION=60000  # 1 per minute

# .env.staging (Testing - moderate)
WORKER_CONCURRENCY=2
WORKER_RATE_LIMIT_MAX=5
WORKER_RATE_LIMIT_DURATION=60000  # 5 per minute

# .env.production (Paid tier - higher throughput)
WORKER_CONCURRENCY=5
WORKER_RATE_LIMIT_MAX=30
WORKER_RATE_LIMIT_DURATION=60000  # 30 per minute
```

#### Azure OpenAI Quota Reference

| Tier          | TPM Limit | Recommended Config                |
| ------------- | --------- | --------------------------------- |
| Free (S0)     | 10K TPM   | `max=1, duration=60000` (current) |
| Basic         | 30K TPM   | `max=3, duration=60000`           |
| Standard (S1) | 120K TPM  | `max=10, duration=60000`          |
| High Volume   | Custom    | Based on actual quota             |

#### Pros & Cons

| Aspect      | Pros                  | Cons                                  |
| ----------- | --------------------- | ------------------------------------- |
| Complexity  | Low - just env vars   | Need to document clearly              |
| Flexibility | Highly configurable   | Ops team must set correctly           |
| Performance | Scales with quota     | Can still hit limits if misconfigured |
| Safety      | Conservative defaults | Requires monitoring                   |

---

### Solution B: Lazy Processing (Alternative)

Only generate embeddings when the document is **actually needed** for exam generation.

#### Flow

```
Current Flow:
  Upload → Create Document (PENDING) → Queue Job → Process (EMBEDDINGS) → COMPLETED

Lazy Flow:
  Upload → Create Document (UPLOADED) → No queueing
  On Exam Generation:
    1. Check document status
    2. If UPLOADED → Process embeddings first
    3. Generate exam

New States:
  UPLOADED    → Document uploaded, no embeddings
  PROCESSING  → Generating embeddings (on demand)
  COMPLETED   → Ready for exam generation
  FAILED      → Processing failed
```

#### Database Changes

```prisma
model Document {
  // ...
  status: DocumentStatus

  // New field: embeddings status (separate from document status)
  embeddingsStatus: EmbeddingsStatus @default(PENDING)
  embeddingsGeneratedAt: DateTime? @map("embeddings_generated_at")
}

enum EmbeddingsStatus {
  PENDING      // Not yet generated
  GENERATING   // Currently generating
  GENERATED    // Ready for use
  FAILED       // Generation failed
}
```

#### Use Case Changes

```typescript
// GenerateExamUseCase.ts

async execute(input: GenerateExamInput): Promise<Exam> {
  // 1. Check all documents have embeddings
  const documents = await this.documentRepo.findByIds(input.documentIds);

  const needsProcessing = documents.filter(d => d.embeddingsStatus !== 'GENERATED');

  if (needsProcessing.length > 0) {
    // Option A: Block and process
    await this.processDocuments(needsProcessing);

    // Option B: Return error, tell user to wait
    throw new DocumentsNotReadyError(needsProcessing.map(d => d.id));
  }

  // 2. Generate exam
  // ...
}
```

#### UX Considerations

```
Scenario 1: Teacher uploads docs, immediately creates exam
  → Click "Generate Exam" → System processes → Shows progress → Exam ready
  → Wait time: 1-5 minutes depending on doc size

Scenario 2: Teacher uploads docs, creates exam later
  → Upload is instant → Later, exam creation is instant (embeddings already ready)

Scenario 3: System with lazy processing + eager processing for shared docs
  → Upload + Share → Process automatically
  → Upload (no share) → No processing (save cost)
```

#### Pros & Cons

| Aspect      | Pros                     | Cons                         |
| ----------- | ------------------------ | ---------------------------- |
| Cost        | Save on unused documents | Same cost for used documents |
| UX          | Instant upload           | Wait during exam creation    |
| Complexity  | Need state management    | Two processing paths         |
| Flexibility | Process on demand        | Orphan documents possible    |

---

### Solution C: Hybrid Approach (Best of Both Worlds)

Combine eager processing for shared documents + lazy for personal documents.

```
Rules:
1. Document uploaded (not shared) → UPLOADED status, no embeddings
2. Document shared with class → Queue for processing automatically
3. Document used for exam → Process if not ready, then generate exam

Implementation:
- ShareDocumentUseCase triggers embedding generation
- GenerateExamUseCase checks and triggers if needed
- Background worker processes in order
```

#### Implementation

```typescript
// ShareDocumentWithClassUseCase.ts

async execute(input: ShareDocumentInput): Promise<ClassDocument> {
  const document = await this.documentRepo.findById(input.documentId);

  // If document not processed, queue it now
  if (document.status !== DocumentStatus.COMPLETED) {
    await this.documentQueue.add('process-document', {
      documentId: document.id,
      userId: input.teacherId,
    });
  }

  // Create share relationship
  const classDocument = await this.classDocumentRepo.create({
    classId: input.classId,
    documentId: input.documentId,
    isVisible: true,
  });

  return classDocument;
}
```

#### Pros & Cons

| Aspect | Pros                                         | Cons                  |
| ------ | -------------------------------------------- | --------------------- |
| Cost   | Only process what's shared/used              | More complex logic    |
| UX     | Teachers share → Students access immediately | Edge cases to handle  |
| Scale  | Efficient for large user bases               | Multiple entry points |

---

## Recommendation

### For MVP / Evaluation (Current)

**Keep current implementation** with minor improvement:

```typescript
// Add environment variables with safe defaults
const WORKER_CONFIG = {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '1', 10),
  rateLimit: {
    max: parseInt(process.env.WORKER_RATE_LIMIT_MAX || '1', 10),
    duration: parseInt(process.env.WORKER_RATE_LIMIT_DURATION || '60000', 10),
  },
};
```

**Reasons:**

- Works with free tier Azure
- Safe defaults for evaluation
- Minimal code changes
- Can be overridden for production

### For Production

**Implement Solution A (Dynamic Config)** first, then:

- Monitor token usage
- Adjust based on Azure quota
- Consider Solution C (Hybrid) for cost optimization at scale

---

## Implementation Plan

### Phase 1: Dynamic Configuration (Post-MVP)

**Effort**: 2-3 hours

1. Update `DocumentWorker.ts` with environment variable configuration
2. Add configuration documentation
3. Add monitoring for queue depth/processing time
4. Update deployment scripts with environment configs

**Files to modify:**

```
backend/src/infrastructure/queue/DocumentWorker.ts
backend/src/infrastructure/queue/DocumentQueue.ts
backend/.env.example
docs/deployment/environment-variables.md
```

### Phase 2: Monitoring & Alerting

**Effort**: 4-6 hours

1. Add Prometheus metrics for queue
2. Create Grafana dashboard
3. Set up alerts for:
   - Queue depth > 10 (backlog)
   - Processing time > 5 minutes
   - Failure rate > 10%

### Phase 3: Hybrid Processing (Post-MVP, Optional)

**Effort**: 1-2 days

1. Add `embeddingsStatus` to Document model
2. Update ShareDocumentUseCase to queue processing
3. Update GenerateExamUseCase to check/trigger processing
4. Update frontend to show processing status

---

## Testing Strategy

### Unit Tests

```typescript
describe('DocumentWorker Configuration', () => {
  it('should use default values when env vars not set', () => {
    delete process.env.WORKER_CONCURRENCY;
    const config = getWorkerConfig();
    expect(config.concurrency).toBe(1);
  });

  it('should use environment variables when set', () => {
    process.env.WORKER_CONCURRENCY = '5';
    process.env.WORKER_RATE_LIMIT_MAX = '30';
    const config = getWorkerConfig();
    expect(config.concurrency).toBe(5);
    expect(config.rateLimit.max).toBe(30);
  });

  it('should reject invalid concurrency values', () => {
    process.env.WORKER_CONCURRENCY = '0';
    const config = getWorkerConfig();
    expect(config.concurrency).toBe(1); // Falls back to default
  });
});
```

### Integration Tests

- Test with different concurrency values
- Test rate limiting behavior
- Test queue backlog scenarios

### Load Tests

- Simulate 100 document uploads
- Measure queue processing time
- Verify no dropped jobs

---

## Configuration Reference

### Environment Variables

```bash
# Worker Configuration
WORKER_CONCURRENCY=1              # Number of concurrent jobs (default: 1)
WORKER_RATE_LIMIT_MAX=1          # Max jobs per duration (default: 1)
WORKER_RATE_LIMIT_DURATION=60000 # Duration in ms (default: 60000 = 1 min)
WORKER_TIMEOUT_MS=600000         # Job timeout in ms (default: 600000 = 10 min)

# Azure OpenAI (affects actual rate limits)
AZURE_OPENAI_ENDPOINT=https://...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002

# Monitoring
WORKER_HEALTH_CHECK_INTERVAL=30000  # Health check interval in ms
WORKER_METRICS_ENABLED=true         # Enable Prometheus metrics
```

### Recommended Configurations

#### Development / Free Tier

```bash
WORKER_CONCURRENCY=1
WORKER_RATE_LIMIT_MAX=1
WORKER_RATE_LIMIT_DURATION=60000
```

#### Staging / Testing

```bash
WORKER_CONCURRENCY=2
WORKER_RATE_LIMIT_MAX=5
WORKER_RATE_LIMIT_DURATION=60000
```

#### Production / Standard Tier

```bash
WORKER_CONCURRENCY=5
WORKER_RATE_LIMIT_MAX=30
WORKER_RATE_LIMIT_DURATION=60000
```

#### Production / High Volume

```bash
WORKER_CONCURRENCY=10
WORKER_RATE_LIMIT_MAX=100
WORKER_RATE_LIMIT_DURATION=60000
```

---

## Monitoring Dashboard

### Key Metrics

```
Queue Metrics:
├── Waiting jobs count
├── Active jobs count
├── Completed jobs count (last hour)
├── Failed jobs count (last hour)
├── Average processing time
└── Queue depth trend

Worker Metrics:
├── Uptime
├── Health status
├── Failure rate
└── Throughput (jobs/min)

Token Usage (Azure OpenAI):
├── Tokens used (last hour)
├── Tokens remaining (quota)
└── Rate limit errors
```

### Alerts

```
CRITICAL: Queue depth > 20 (backlog accumulating)
WARNING:  Processing time > 5 min (slow jobs)
WARNING:  Failure rate > 10% (investigate issues)
INFO:     Queue depth > 5 (moderate load)
```

---

## Cost Analysis

### Current Implementation (Free Tier)

| Metric              | Value                 |
| ------------------- | --------------------- |
| Documents processed | ~100/month            |
| Average chunks/doc  | ~100                  |
| Tokens per chunk    | ~200                  |
| Total tokens        | ~2M/month             |
| Cost                | $0 (within free tier) |

### Projected (Production - 1000 users)

| Metric              | Value                   |
| ------------------- | ----------------------- |
| Documents processed | ~10,000/month           |
| Average chunks/doc  | ~100                    |
| Tokens per chunk    | ~200                    |
| Total tokens        | ~200M/month             |
| Cost                | ~$20/month (embeddings) |

### With Lazy Processing (30% unused)

| Metric              | Value                   |
| ------------------- | ----------------------- |
| Documents processed | ~7,000/month (30% less) |
| Cost savings        | ~$6/month               |

**Conclusion**: Lazy processing saves money at scale, but not critical for MVP.

---

## Risks and Mitigations

| Risk                       | Impact                     | Mitigation                          |
| -------------------------- | -------------------------- | ----------------------------------- |
| Misconfigured env vars     | High (can hit rate limits) | Validate on startup, safe defaults  |
| Queue backlog during peak  | Medium (UX impact)         | Monitor queue depth, scale workers  |
| Azure quota exceeded       | High (service disruption)  | Add quota monitoring, alert at 80%  |
| Processing failures        | Medium (retries exist)     | Track failures, manual retry option |
| Lazy processing edge cases | Medium (exam delays)       | Clear UX, progress indicators       |

---

## Success Criteria

### Phase 1 (Dynamic Config)

- [ ] Can change worker settings without code changes
- [ ] Safe defaults work with free tier Azure
- [ ] Production config supports higher throughput
- [ ] Documentation is clear and complete

### Phase 2 (Monitoring)

- [ ] Queue metrics visible in dashboard
- [ ] Alerts fire for problems
- [ ] Can diagnose issues from metrics

### Phase 3 (Hybrid)

- [ ] Unshared documents skip processing
- [ ] Shared documents process automatically
- [ ] Exam generation handles pending embeddings
- [ ] Cost reduction measurable at scale

---

## Appendix: Azure OpenAI Rate Limits

### Current Model: text-embedding-ada-002

| Tier          | RPM (Requests) | TPM (Tokens) | Latency |
| ------------- | -------------- | ------------ | ------- |
| Free (S0)     | 60/min         | 10K/min      | ~100ms  |
| Basic         | 60/min         | 30K/min      | ~100ms  |
| Standard (S1) | 60/min         | 120K/min     | ~100ms  |
| Premium       | Custom         | Custom       | ~100ms  |

### Embedding Token Calculation

```
Average document:
- 10 pages
- 300 words/page = 3,000 words
- ~4,000 tokens (words × 1.3)
- 100 chunks × 40 tokens/chunk = 4,000 tokens

With 120K TPM limit (Standard):
- Can process 30 documents/minute
- Current config (1/min) is 3% of capacity
```

---

## Related Documents

- [ADR 0007: RAG Implementation](../adr/0007-rag-implementation.md)
- [ADR 0008: Redis Migration](../adr/0008-redis-migration.md)
- [Spec 0010: Class Resources](0010-class-resources.md)
- [Azure OpenAI Quotas](https://learn.microsoft.com/en-us/azure/ai-services/openai/quotas-limits)
