import { PrismaClient, UserRole, AuthProvider, DocumentStatus, QuestionType, QuestionDifficulty } from '@prisma/client';
import { AuthService } from '../src/services/auth.service.js';

const prisma = new PrismaClient();
const authService = new AuthService();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================================================
  // Clear existing data (in reverse order of dependencies)
  // ============================================================================
  console.log('🧹 Cleaning existing data...');
  
  await prisma.question.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✅ Database cleaned\n');

  // ============================================================================
  // Create Users
  // ============================================================================
  console.log('👤 Creating users...');
  
  // Hash password using AuthService (ensures consistency with app logic)
  const hashedPassword = await authService.hashPassword('password123');
  
  const teacherLocal = await prisma.user.create({
    data: {
      email: 'teacher@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Teacher',
      role: UserRole.TEACHER,
      provider: AuthProvider.LOCAL,
    },
  });

  const teacherGoogle = await prisma.user.create({
    data: {
      email: 'teacher.google@example.com',
      password: null,
      firstName: 'Maria',
      lastName: 'González',
      role: UserRole.TEACHER,
      provider: AuthProvider.GOOGLE,
      providerId: 'google_123456789',
    },
  });

  const studentLocal = await prisma.user.create({
    data: {
      email: 'student@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Student',
      role: UserRole.STUDENT,
      provider: AuthProvider.LOCAL,
    },
  });

  console.log(`✅ Created ${await prisma.user.count()} users\n`);

  // ============================================================================
  // Create Documents
  // ============================================================================
  console.log('📄 Creating documents...');

  const doc1 = await prisma.document.create({
    data: {
      title: 'Introduction to TypeScript',
      filename: 'typescript-intro.pdf',
      fileSize: 2_500_000, // 2.5 MB
      mimeType: 'application/pdf',
      status: DocumentStatus.COMPLETED,
      blobUrl: 'https://example.blob.core.windows.net/documents/typescript-intro.pdf',
      pageCount: 25,
      wordCount: 5_000,
      userId: teacherLocal.id,
      processedAt: new Date(),
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      title: 'Advanced React Patterns',
      filename: 'react-patterns.pdf',
      fileSize: 3_200_000, // 3.2 MB
      mimeType: 'application/pdf',
      status: DocumentStatus.COMPLETED,
      blobUrl: 'https://example.blob.core.windows.net/documents/react-patterns.pdf',
      pageCount: 40,
      wordCount: 8_500,
      userId: teacherLocal.id,
      processedAt: new Date(),
    },
  });

  const doc3 = await prisma.document.create({
    data: {
      title: 'Database Design Principles',
      filename: 'database-design.docx',
      fileSize: 1_800_000, // 1.8 MB
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      status: DocumentStatus.PROCESSING,
      blobUrl: 'https://example.blob.core.windows.net/documents/database-design.docx',
      pageCount: 30,
      wordCount: 6_200,
      userId: teacherGoogle.id,
    },
  });

  const doc4 = await prisma.document.create({
    data: {
      title: 'Failed Document Upload',
      filename: 'corrupted-file.pdf',
      fileSize: 500_000,
      mimeType: 'application/pdf',
      status: DocumentStatus.FAILED,
      blobUrl: 'https://example.blob.core.windows.net/documents/corrupted-file.pdf',
      errorMessage: 'Failed to extract text: Invalid PDF structure',
      userId: teacherLocal.id,
    },
  });

  console.log(`✅ Created ${await prisma.document.count()} documents\n`);

  // ============================================================================
  // Create Document Chunks (with mock embeddings)
  // Note: Using raw SQL due to Prisma limitations with pgvector Unsupported type
  // ============================================================================
  console.log('🧩 Creating document chunks...');

  // Generate a mock embedding (768 dimensions for Gemini)
  const generateMockEmbedding = () => {
    return `[${Array.from({ length: 768 }, () => (Math.random() * 2 - 1).toFixed(6)).join(',')}]`;
  };

  // Chunks for doc1 (TypeScript) - using raw SQL for vector embeddings
  await prisma.$executeRaw`
    INSERT INTO document_chunks (id, content, chunk_index, embedding, page_number, word_count, document_id)
    VALUES (
      gen_random_uuid(),
      'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.',
      0,
      ${generateMockEmbedding()}::vector,
      1,
      18,
      ${doc1.id}
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO document_chunks (id, content, chunk_index, embedding, page_number, word_count, document_id)
    VALUES (
      gen_random_uuid(),
      'TypeScript adds additional syntax to JavaScript to support a tighter integration with your editor. Catch errors early in your editor.',
      1,
      ${generateMockEmbedding()}::vector,
      1,
      21,
      ${doc1.id}
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO document_chunks (id, content, chunk_index, embedding, page_number, word_count, document_id)
    VALUES (
      gen_random_uuid(),
      'TypeScript code converts to JavaScript, which runs anywhere JavaScript runs: In a browser, on Node.js or Deno and in your apps.',
      2,
      ${generateMockEmbedding()}::vector,
      2,
      23,
      ${doc1.id}
    )
  `;

  // Chunks for doc2 (React)
  await prisma.$executeRaw`
    INSERT INTO document_chunks (id, content, chunk_index, embedding, page_number, word_count, document_id)
    VALUES (
      gen_random_uuid(),
      'React hooks allow function components to have access to state and other React features. useState is the most basic hook for managing component state.',
      0,
      ${generateMockEmbedding()}::vector,
      1,
      26,
      ${doc2.id}
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO document_chunks (id, content, chunk_index, embedding, page_number, word_count, document_id)
    VALUES (
      gen_random_uuid(),
      'useEffect is a hook that allows you to perform side effects in function components. It serves the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount combined.',
      1,
      ${generateMockEmbedding()}::vector,
      3,
      29,
      ${doc2.id}
    )
  `;

  const chunkCount = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::int as count FROM document_chunks`;
  console.log(`✅ Created ${Number(chunkCount[0].count)} document chunks\n`);

  // ============================================================================
  // Create Exams
  // ============================================================================
  console.log('📝 Creating exams...');

  const exam1 = await prisma.exam.create({
    data: {
      title: 'TypeScript Fundamentals Quiz',
      description: 'A comprehensive quiz covering TypeScript basics, types, and best practices.',
      generatedFrom: [doc1.id],
      promptUsed: 'Generate a quiz about TypeScript fundamentals with multiple choice and true/false questions.',
      userId: teacherLocal.id,
      questions: {
        create: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            difficulty: QuestionDifficulty.EASY,
            questionText: 'What is TypeScript?',
            options: [
              'A JavaScript library',
              'A strongly typed programming language that builds on JavaScript',
              'A database management system',
              'A CSS framework',
            ],
            correctAnswer: 'A strongly typed programming language that builds on JavaScript',
            explanation: 'TypeScript is a superset of JavaScript that adds static typing.',
            points: 1,
            orderIndex: 0,
            sourceChunkIds: [],
          },
          {
            type: QuestionType.TRUE_FALSE,
            difficulty: QuestionDifficulty.EASY,
            questionText: 'TypeScript code runs directly in the browser without compilation.',
            options: ['True', 'False'],
            correctAnswer: 'False',
            explanation: 'TypeScript needs to be compiled to JavaScript before it can run in browsers.',
            points: 1,
            orderIndex: 1,
            sourceChunkIds: [],
          },
          {
            type: QuestionType.MULTIPLE_CHOICE,
            difficulty: QuestionDifficulty.MEDIUM,
            questionText: 'Where can TypeScript code run after compilation?',
            options: [
              'Only in browsers',
              'Only on Node.js',
              'In browsers, Node.js, Deno, and apps',
              'Only on Deno',
            ],
            correctAnswer: 'In browsers, Node.js, Deno, and apps',
            explanation: 'TypeScript compiles to JavaScript, which runs anywhere JavaScript runs.',
            points: 2,
            orderIndex: 2,
            sourceChunkIds: [],
          },
        ],
      },
    },
  });

  const exam2 = await prisma.exam.create({
    data: {
      title: 'React Hooks Advanced Test',
      description: 'Test your knowledge of React hooks and advanced patterns.',
      generatedFrom: [doc2.id],
      promptUsed: 'Generate an advanced exam about React hooks with medium and hard difficulty questions.',
      userId: teacherLocal.id,
      questions: {
        create: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            difficulty: QuestionDifficulty.MEDIUM,
            questionText: 'What is the purpose of the useState hook?',
            options: [
              'To fetch data from an API',
              'To manage component state in function components',
              'To handle side effects',
              'To optimize performance',
            ],
            correctAnswer: 'To manage component state in function components',
            explanation: 'useState is the most basic hook for managing state in function components.',
            points: 2,
            orderIndex: 0,
            sourceChunkIds: [],
          },
          {
            type: QuestionType.SHORT_ANSWER,
            difficulty: QuestionDifficulty.HARD,
            questionText: 'Name the three lifecycle methods that useEffect replaces.',
            options: [],
            correctAnswer: 'componentDidMount, componentDidUpdate, and componentWillUnmount',
            explanation: 'useEffect combines the functionality of these three class component lifecycle methods.',
            points: 3,
            orderIndex: 1,
            sourceChunkIds: [],
          },
        ],
      },
    },
  });

  const exam3 = await prisma.exam.create({
    data: {
      title: 'Full Stack Development Quiz',
      description: 'Combined exam covering TypeScript and React concepts.',
      generatedFrom: [doc1.id, doc2.id],
      promptUsed: 'Generate a comprehensive exam covering both TypeScript and React with various difficulty levels.',
      userId: teacherGoogle.id,
      questions: {
        create: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            difficulty: QuestionDifficulty.EASY,
            questionText: 'Which statement is true about TypeScript?',
            options: [
              'It is a dynamically typed language',
              'It adds static typing to JavaScript',
              'It is a backend framework',
              'It replaces JavaScript entirely',
            ],
            correctAnswer: 'It adds static typing to JavaScript',
            explanation: 'TypeScript extends JavaScript with static type definitions.',
            points: 1,
            orderIndex: 0,
            sourceChunkIds: [],
          },
        ],
      },
    },
  });

  console.log(`✅ Created ${await prisma.exam.count()} exams`);
  console.log(`✅ Created ${await prisma.question.count()} questions\n`);

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('📊 Seed Summary:');
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Documents: ${await prisma.document.count()}`);
  console.log(`   - Document Chunks: ${await prisma.documentChunk.count()}`);
  console.log(`   - Exams: ${await prisma.exam.count()}`);
  console.log(`   - Questions: ${await prisma.question.count()}`);
  console.log('\n✅ Database seeded successfully!\n');

  console.log('🔐 Test Credentials:');
  console.log('   Teacher (Local): teacher@example.com / password123');
  console.log('   Student (Local): student@example.com / password123');
  console.log('   Teacher (OAuth): teacher.google@example.com (Google OAuth)\n');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
