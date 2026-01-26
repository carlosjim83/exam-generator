# Backend - Exam Generator

Fastify API server for the Exam Generator platform.

## 🚀 Tech Stack

- **Fastify** - Fast, low-overhead web framework
- **TypeScript**
- **Prisma** - Type-safe ORM
- **Passport.js** - Authentication
- **Vitest** - Unit testing
- **@google/generative-ai** - Gemini API
- **@azure/storage-blob** - Azure Blob Storage

## 📁 Structure

```
backend/
├── src/
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic
│   ├── repositories/     # Data access layer
│   ├── plugins/          # Fastify plugins
│   ├── schemas/          # JSON validation schemas
│   ├── utils/            # Utilities
│   └── server.ts         # Application entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
└── tests/                # Unit and integration tests
```

## 🛠️ Development

```bash
# Install dependencies (from root)
pnpm install

# Run database migrations
pnpm --filter backend prisma migrate dev

# Generate Prisma client
pnpm --filter backend prisma generate

# Run development server
pnpm --filter backend dev

# Build for production
pnpm --filter backend build

# Run tests
pnpm --filter backend test
```

## 🗄️ Database

Start PostgreSQL with Docker:

```bash
# From root directory
docker-compose up -d

# Check if running
docker-compose ps

# View logs
docker-compose logs -f postgres
```

## 🌐 Environment Variables

Create `.env` in root directory (see `.env.example`).

Required variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `GEMINI_API_KEY`

---

**Coming soon**: Full setup with Fastify, Prisma, and authentication
