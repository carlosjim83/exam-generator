# ADR 0009: Clean Architecture with Domain-Driven Design

**Date**: 2026-02-15
**Status**: Accepted
**Decision Makers**: Development Team

---

## Context

Exam Generator is a business application with complex domain logic involving users, documents, exams, and student assessments. As the application grows, we need to ensure:

- Separation of business rules from technical concerns
- Testable and maintainable codebase
- Domain logic evolves independently of frameworks
- Clear boundaries between layers

While we have made framework and tech stack decisions (ADRs 0001-0008), we need a formal architectural pattern that guides daily development.

**Options considered**:

1. **Traditional Layered Architecture** (Controller → Service → Repository)
2. **Onion Architecture**
3. **Clean Architecture** combined with **Domain-Driven Design (DDD)**

---

## Decision

We will adopt **Clean Architecture** combined with **Domain-Driven Design (DDD)**.

### Layer Structure

```
backend/
└── src/
    ├── domain/              # Core business logic, no dependencies
    │   ├── entities/        # Domain entities with business rules
    │   ├── value-objects/   # Value objects (UserId, Email, etc.)
    │   ├── events/          # Domain events
    │   ├── repositories/    # Repository interfaces
    │   └── services/        # Domain services
    │
    ├── application/         # Use cases and orchestration
    │   ├── use-cases/       # Business workflows
    │   └── ports/           # Input/Output ports (interfaces)
    │
    ├── infrastructure/      # External integrations
    │   ├── persistence/     # Prisma ORM implementation
    │   ├── queue/           # BullMQ workers
    │   ├── storage/         # Azure Blob Storage
    │   │   ├── ai/          # OpenAI integration
    │   │   └── auth/        # JWT/OAuth services
    │
    └── routes/              # HTTP endpoints (presentation layer)
```

### Dependency Rule

**Dependencies point inward only:**

```
→ Routes → Application → Domain ← Infrastructure
        (depends on)   (depends on)  (no dependencies)
```

- **Domain**: Zero dependencies on outer layers
- **Application**: Can depend on Domain
- **Infrastructure**: Can depend on Domain and Application
- **Routes**: Can depend on Application (and Infrastructure)

---

## Rationale

### Why Clean Architecture?

#### Separation of Concerns

- ✅ **Business logic isolated** in Domain layer (no framework code)
- ✅ **Framework independent** - Can swap Fastify for Express, Prisma for PostgreSQL
- ✅ **Testable** - Domain entities and use cases tested without infrastructure

#### Maintainability

- ✅ **Clear boundaries** - Easy to locate where code belongs
- ✅ **Single Responsibility** - Each layer has one job
- ✅ **Open/Closed Principle** - Domain closed to modification, open to extension

#### Learning Value

- ✅ **Industry-standard pattern** - Used in large-scale applications
- ✅ **Professional practices** - Demonstrates software engineering maturity
- ✅ **Portfolio value** - Shows understanding beyond CRUD apps

### Why Domain-Driven Design?

#### Rich Domain Models

- ✅ **Entities with behavior** - Not just data containers (DTOs)
- ✅ **Business rules enforced** - Validation in domain, not in controllers
- ✅ **Ubiquitous Language** - Code matches business terminology

#### Value Objects

- ✅ **Immutable identity** - Identified by attributes, not ID
- ✅ **No primitive obsession** - `Email`, `Percentage`, `Money` instead of strings/numbers
- ✅ **Validation at creation** - Can't create invalid value objects

#### Repository Pattern

- ✅ **Domain defines interfaces** - `IExamRepository`, `IUserRepository`
- ✅ **Infrastructure implements** - `PrismaExamRepository`, `PrismaUserRepository`
- ✅ **Swappable implementations** - Can switch databases without changing domain

---

## Implementation Examples

### 1. Domain Entity with Business Logic

```typescript
// domain/entities/Exam.ts
import { ExamId } from '@domain/value-objects/ExamId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class Exam {
  readonly id: ExamId;
  readonly userId: UserId;
  private _title: string;
  private _description: string | null;
  private _questions: Question[];
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: ExamId,
    userId: UserId,
    title: string,
    description: string | null,
    questions: Question[],
    createdAt: Date
  ) {
    this.id = id;
    this.userId = userId;
    this._title = title;
    this._description = description;
    this._questions = questions;
    this.createdAt = createdAt;
    this._updatedAt = createdAt;

    this.validate();
  }

  private validate(): void {
    if (!this._title || this._title.trim().length === 0) {
      throw new Error('Exam title cannot be empty');
    }

    if (this._questions.length === 0) {
      throw new Error('Exam must have at least one question');
    }

    if (this._questions.length > 100) {
      throw new Error('Exam cannot have more than 100 questions');
    }
  }

  // Business logic methods
  addQuestion(question: Question): void {
    if (this._questions.length >= 100) {
      throw new Error('Cannot add more than 100 questions');
    }
    this._questions.push(question);
    this._updatedAt = new Date();
  }

  removeQuestion(questionId: QuestionId): void {
    const index = this._questions.findIndex((q) => q.id.equals(questionId));
    if (index === -1) {
      throw new Error('Question not found');
    }
    this._questions.splice(index, 1);
    this._updatedAt = new Date();
  }

  calculateTotalPoints(): number {
    return this._questions.reduce((sum, q) => sum + q.points, 0);
  }

  // Getters (no setters - domain controls state)
  get title(): string {
    return this._title;
  }

  get description(): string | null {
    return this._description;
  }

  get questions(): readonly Question[] {
    return this._questions;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
```

### 2. Value Object

```typescript
// domain/value-objects/UserId.ts
import { v4 as uuidv4 } from 'uuid';

export class UserId {
  private readonly value: string;

  constructor(value?: string) {
    if (value && !this.isValidUUID(value)) {
      throw new Error('Invalid UserId: must be a valid UUID');
    }
    this.value = value || uuidv4();
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

### 3. Repository Interface (Domain)

```typescript
// domain/repositories/IExamRepository.ts
import { Exam } from '@domain/entities/Exam.js';
import { ExamId } from '@domain/value-objects/ExamId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface IExamRepository {
  findById(id: ExamId): Promise<Exam | null>;
  findByUserId(userId: UserId): Promise<Exam[]>;
  save(exam: Exam): Promise<void>;
  delete(id: ExamId): Promise<void>;
}
```

### 4. Repository Implementation (Infrastructure)

```typescript
// infrastructure/persistence/PrismaExamRepository.ts
import { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { Exam } from '@domain/entities/Exam.js';
import { ExamId } from '@domain/value-objects/ExamId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { prisma } from '@infrastructure/database/prisma.js';
import { ExamMapper } from '@infrastructure/persistence/mappers/ExamMapper.js';

export class PrismaExamRepository implements IExamRepository {
  async findById(id: ExamId): Promise<Exam | null> {
    const examData = await prisma.exam.findUnique({
      where: { id: id.getValue() },
      include: { questions: true },
    });

    if (!examData) {
      return null;
    }

    return ExamMapper.toDomain(examData);
  }

  async findByUserId(userId: UserId): Promise<Exam[]> {
    const examsData = await prisma.exam.findMany({
      where: { userId: userId.getValue() },
      include: { questions: true },
      orderBy: { createdAt: 'desc' },
    });

    return examsData.map(ExamMapper.toDomain);
  }

  async save(exam: Exam): Promise<void> {
    const examData = ExamMapper.toPersistence(exam);

    await prisma.exam.upsert({
      where: { id: examData.id },
      update: examData,
      create: examData,
    });
  }

  async delete(id: ExamId): Promise<void> {
    await prisma.exam.delete({
      where: { id: id.getValue() },
    });
  }
}
```

### 5. Use Case (Application)

```typescript
// application/use-cases/GenerateExamFromDocumentsUseCase.ts
import { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { IAIService } from '@application/ports/IAIService.js';
import { GenerateExamFromDocumentsCommand } from '@application/commands/GenerateExamFromDocumentsCommand.js';
import { Exam } from '@domain/entities/Exam.js';

export class GenerateExamFromDocumentsUseCase {
  constructor(
    private examRepository: IExamRepository,
    private documentRepository: IDocumentRepository,
    private aiService: IAIService
  ) {}

  async execute(command: GenerateExamFromDocumentsCommand): Promise<Exam> {
    // Validate documents exist and are processed
    const documents = await this.documentRepository.findByIds(command.documentIds);

    const unprocessed = documents.filter((d) => d.status !== 'COMPLETED');
    if (unprocessed.length > 0) {
      throw new Error('Some documents are still being processed');
    }

    // Retrieve relevant chunks from documents (RAG)
    const relevantChunks = await this.aiService.retrieveRelevantChunks(
      command.prompt,
      command.documentIds,
      command.numQuestions * 5 // Retrieve 5x chunks for context
    );

    // Generate questions using AI
    const questions = await this.aiService.generateQuestions({
      numQuestions: command.numQuestions,
      difficulty: command.difficulty,
      questionTypes: command.questionTypes,
      context: relevantChunks,
      topic: command.prompt,
    });

    // Create exam entity (business rule validation happens in constructor)
    const exam = new Exam(
      new ExamId(),
      command.userId,
      command.title,
      command.description || null,
      questions,
      new Date()
    );

    // Persist using repository
    await this.examRepository.save(exam);

    return exam;
  }
}
```

### 6. Route (Presentation Layer)

```typescript
// routes/exams.routes.ts
import { GenerateExamFromDocumentsUseCase } from '@application/use-cases/GenerateExamFromDocumentsUseCase.js';

server.post(
  '/exams/generate',
  {
    preHandler: [authenticateUser, requireRoles(UserRole.TEACHER)],
  },
  async (request, reply) => {
    const command = new GenerateExamFromDocumentsCommand(request.body);

    // Use case orchestration (domain + infrastructure)
    const useCase = container.get<GenerateExamFromDocumentsUseCase>(
      GenerateExamFromDocumentsUseCase
    );
    const exam = await useCase.execute(command);

    return reply.status(201).send(exam);
  }
);
```

---

## Consequences

### Positive

- **Testability**: Domain logic tested without infrastructure (fast tests)
- **Maintainability**: Clear separation makes code easier to understand
- **Flexibility**: Easy to swap implementations (Prisma → TypeORM, PostgreSQL → MySQL)
- **Business focus**: Domain models represent real concepts, not database tables
- **Scalability**: Each layer can scale independently

### Negative

- **Initial complexity**: More files and layers than typical CRUD apps
- **Learning curve**: Team must understand DDD concepts
- **Boilerplate**: Some repetitive mapping code (Prisma ↔ Domain)
- **Overkill**: For very simple features, might feel "heavy"

### Neutral

- **Path aliases required**: Using `@domain/*`, `@application/*`, etc. (see ADR 0002)
- **Dependency injection**: Use cases need all dependencies injected via DI container
- **Mappers**: Need mapper classes to convert between domain and persistence models

---

## Alternatives Considered

### Traditional Layered Architecture (Controller → Service → Repository)

- ✅ Simpler, less boilerplate
- ❌ Business logic leaks into controllers/database code
- ❌ Harder to test domain logic (requires database)
- ❌ Repository returns DTOs, not domain entities

### Onion Architecture

- Similar to Clean Architecture
- ✅ Clean separation
- ❌ Steeper learning curve
- ❌ More strict about inner/outer boundaries
- **Decision**: Clean Architecture is more flexible and widely adopted

### Hexagonal Architecture (Ports & Adapters)

- Very similar to Clean Architecture
- ✅ Great for microservices
- ❌ More emphasis on "ports" and "adapters" terminology
- **Decision**: Clean Architecture terminology is more developer-friendly

---

## Related Decisions

- [ADR 0001: Monorepo Structure](./0001-monorepo-structure.md) - Workspace structure
- [ADR 0002: Fastify Backend](./0002-backend-framework.md) - HTTP layer
- [ADR 0003: PostgreSQL + pgvector](./0003-database-choice.md) - Persistence layer
- [ADR 0007: RAG Implementation](./0007-rag-implementation.md) - AI infrastructure

---

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design by Eric Evans](https://domainlanguage.com/ddd/)
- [Value Objects - Martin Fowler](https://martinfowler.com/bliki/ValueObject.html)
- [Repository Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- [Building Clean Architecture with TypeScript](https://github.com/stemmlerjs/ddd-forum)

---

**Migration Notes**:

The existing codebase **already follows Clean Architecture principles**. This ADR formalizes what we've been practicing:

- Entities are in `backend/src/domain/entities/`
- Repositories are split into interfaces (`domain/repositories/`) and implementations (`infrastructure/persistence/`)
- Use cases are in `backend/src/application/use-cases/`
- Routes contain only HTTP-related logic

**This ADR ensures future development continues following these patterns.**

---

**Decision Date**: February 15, 2026
**Status**: Accepted
