/**
 * Dependency Injection Container
 *
 * Wires up all dependencies for Hexagonal Architecture:
 * - Infrastructure implementations (repositories, services)
 * - Application use cases
 * - Domain services
 *
 * This is the ONLY place where we manually instantiate classes.
 * Everything else receives dependencies via constructor injection.
 */

import { PrismaClient } from '@prisma/client';

// Infrastructure
import type { IMessageBroker } from '@application/ports/IMessageBroker.js'; // Added
import { GetClassDocumentsForStudentUseCase } from '@application/use-cases/documents/GetClassDocumentsForStudentUseCase.js';
import { GetClassDocumentsForTeacherUseCase } from '@application/use-cases/classes/GetClassDocumentsForTeacherUseCase.js';
import { GetDocumentDownloadUrlUseCase } from '@application/use-cases/documents/GetDocumentDownloadUrlUseCase.js';
import { GetDocumentSharesUseCase } from '@application/use-cases/documents/GetDocumentSharesUseCase.js';
import { ShareDocumentWithClassUseCase } from '@application/use-cases/documents/ShareDocumentWithClassUseCase.js';
import { UnshareDocumentUseCase } from '@application/use-cases/documents/UnshareDocumentUseCase.js';
import { UpdateDocumentVisibilityUseCase } from '@application/use-cases/documents/UpdateDocumentVisibilityUseCase.js';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokenUseCase,
  UploadDocumentUseCase,
  GetDocumentUseCase,
  ListDocumentsUseCase,
  ProcessDocumentUseCase,
  ReprocessDocumentUseCase, // Added
  QueryDocumentUseCase, // Added
  DeleteDocumentUseCase, // Added
  DownloadDocumentUseCase, // Added
  GetDashboardStatsUseCase,
  GenerateExamUseCase,
  GetExamUseCase,
  ListExamsUseCase,
  DeleteExamUseCase, // Added
  CreateClassUseCase,
  CreateEmailInvitationsUseCase,
  StudentJoinClassUseCase,
  GetClassesUseCase,
  GetClassByCodeUseCase,
  GetClassDetailsUseCase,
  StudentJoinClassWithInvitationUseCase,
  GetClassStudentsUseCase,
  AcceptInvitationUseCase,
  AssignExamToClassUseCase,
  DeleteClassUseCase,
  ImportStudentsCSVUseCase,
  GetClassInvitationsUseCase,
  ResendInvitationUseCase, // Added
  RemoveStudentFromClassUseCase, // Added
  GetStudentClassesUseCase, // Added
} from '@application/use-cases/index.js';
import { SaveAnswerUseCase } from '@application/use-cases/student/SaveAnswerUseCase.js';
import { GetTeacherClassesWithStatsUseCase } from '@application/use-cases/classes/GetTeacherClassesWithStatsUseCase.js';
import { GetStudentClassesWithStatsUseCase } from '@application/use-cases/classes/GetStudentClassesWithStatsUseCase.js';
import { GetClassExamsUseCase } from '@application/use-cases/classes/GetClassExamsUseCase.js';
import { GetStudentExamsUseCase } from '@application/use-cases/classes/GetStudentExamsUseCase.js';
import { PublishClassExamUseCase } from '@application/use-cases/classes/PublishClassExamUseCase.js';
import { UpdateClassExamSettingsUseCase } from '@application/use-cases/classes/UpdateClassExamSettingsUseCase.js';
import { GetClassExamResultsUseCase } from '@application/use-cases/classes/GetClassExamResultsUseCase.js';
import { DeleteClassExamUseCase } from '@application/use-cases/classes/DeleteClassExamUseCase.js';
import { ListRecentClassExamsUseCase } from '@application/use-cases/class-exams/ListRecentClassExamsUseCase.js';
import { GetSubscriptionUseCase } from '@application/use-cases/subscription/index.js';
// Class Document Use Cases
// Application Use Cases
// Student Use Cases
import { AssignExamToStudentUseCase } from '@application/use-cases/student/AssignExamToStudentUseCase.js';
import { GetAssignedExamsUseCase } from '@application/use-cases/student/GetAssignedExamsUseCase.js';
import { GetExamResultsUseCase } from '@application/use-cases/student/GetExamResultsUseCase.js';
import { StartExamUseCase } from '@application/use-cases/student/StartExamUseCase.js';
import { SubmitExamAnswersUseCase } from '@application/use-cases/student/SubmitExamAnswersUseCase.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { IInvitationRepository } from '@domain/repositories/IInvitationRepository.js';
import type { IStudentAnswerRepository } from '@domain/repositories/IStudentAnswerRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import type { IUserRepository } from '@domain/repositories/IUserRepository.js';
import type { IAnswerGradingService } from '@domain/services/IAnswerGradingService.js';
import type { IDocumentProcessor } from '@domain/services/IDocumentProcessor.js';
import type { IEmbeddingService } from '@domain/services/IEmbeddingService.js';
import type { IExamGenerator } from '@domain/services/IExamGenerator.js';
import type { IPasswordHasher } from '@domain/services/IPasswordHasher.js';
import type { IStorageService } from '@domain/services/IStorageService.js';
import type { ITextExtractor } from '@domain/services/ITextExtractor.js';
import type { ITokenService } from '@domain/services/ITokenService.js';
import { AzureOpenAIEmbeddingService } from '@infrastructure/ai/AzureOpenAIEmbeddingService.js';
import { GenkitDocumentProcessor } from '@infrastructure/ai/GenkitDocumentProcessor.js';
import { GenkitExamGenerator } from '@infrastructure/ai/GenkitExamGenerator.js';
import {
  PrismaUserRepository,
  PrismaDocumentRepository,
  BcryptPasswordHasher,
  JWTTokenService,
  AzureBlobStorageService,
  LocalFileStorageService,
  TextExtractorService,
  BullMQMessageBroker, // Added
  PrismaClassRepository,
  PrismaStudentEnrollmentRepository,
  PrismaInvitationRepository,
  PrismaClassDocumentRepository,
  PrismaClassExamRepository,
  PrismaSubscriptionRepository,
  PrismaUsageMetricsRepository,
} from '@infrastructure/index.js';
import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import { PrismaExamAssignmentRepository } from '@infrastructure/repositories/PrismaExamAssignmentRepository.js';
import { PrismaExamRepository } from '@infrastructure/repositories/PrismaExamRepository.js';
import { PrismaStudentAnswerRepository } from '@infrastructure/repositories/PrismaStudentAnswerRepository.js';
import { GetStudentClassExamsUseCase } from '@application/use-cases/classes/GetStudentClassExamsUseCase.js';
import { GetStudentSubmissionDetailUseCase } from '@application/use-cases/classes/GetStudentSubmissionDetailUseCase.js';
import { ISubscriptionRepository } from '@/domain/repositories/ISubscriptionRepository';
import { IUsageMetricsRepository } from '@/domain/repositories/IUsageMetricsRepository';
import { AzureOpenAIGradingService } from '@infrastructure/ai/AzureOpenAIGradingService.js';

/**
 * Container class - Singleton pattern
 * Manages all application dependencies
 */
export class Container {
  private static instance: Container;

  // Infrastructure Layer
  private readonly _prisma: PrismaClient;
  private readonly _userRepository: IUserRepository;
  private readonly _documentRepository: IDocumentRepository;
  private readonly _examRepository: IExamRepository;
  private readonly _examAssignmentRepository: IExamAssignmentRepository;
  private readonly _studentAnswerRepository: IStudentAnswerRepository;
  private readonly _passwordHasher: IPasswordHasher;
  private readonly _tokenService: ITokenService;
  private readonly _storageService: IStorageService;
  private readonly _textExtractor: ITextExtractor;
  private readonly _messageBroker: IMessageBroker; // Added
  private readonly _embeddingService: IEmbeddingService;
  private readonly _documentProcessor: IDocumentProcessor;
  private readonly _examGenerator: IExamGenerator;

  // Classes & Invitations Repositories
  private readonly _classRepository: IClassRepository;
  private readonly _studentEnrollmentRepository: IStudentEnrollmentRepository;
  private readonly _invitationRepository: IInvitationRepository;
  private readonly _classDocumentRepository: IClassDocumentRepository;
  private readonly _classExamRepository: IClassExamRepository;

  // Subscription Repositories
  private readonly _subscriptionRepository: ISubscriptionRepository;
  private readonly _usageMetricsRepository: IUsageMetricsRepository;

  // AI Services
  private readonly _gradingService: IAnswerGradingService;

  // Application Layer - Auth Use Cases
  private readonly _registerUserUseCase: RegisterUserUseCase;
  private readonly _loginUserUseCase: LoginUserUseCase;
  private readonly _refreshTokenUseCase: RefreshTokenUseCase;

  // Application Layer - Document Use Cases
  private readonly _uploadDocumentUseCase: UploadDocumentUseCase;
  private readonly _getDocumentUseCase: GetDocumentUseCase;
  private readonly _listDocumentsUseCase: ListDocumentsUseCase;
  private readonly _processDocumentUseCase: ProcessDocumentUseCase;
  private readonly _reprocessDocumentUseCase: ReprocessDocumentUseCase; // Added
  private readonly _queryDocumentUseCase: QueryDocumentUseCase; // Added
  private readonly _deleteDocumentUseCase: DeleteDocumentUseCase; // Added
  private readonly _downloadDocumentUseCase: DownloadDocumentUseCase; // Added

  // Application Layer - Dashboard Use Cases
  private readonly _getDashboardStatsUseCase: GetDashboardStatsUseCase;

  // Application Layer - Exam Use Cases
  private readonly _generateExamUseCase: GenerateExamUseCase;
  private readonly _getExamUseCase: GetExamUseCase;
  private readonly _listExamsUseCase: ListExamsUseCase;
  private readonly _deleteExamUseCase: DeleteExamUseCase; // Added

  // Application Layer - Classes & Invitations Use Cases
  private readonly _createClassUseCase: CreateClassUseCase;
  private readonly _createEmailInvitationsUseCase: CreateEmailInvitationsUseCase;
  private readonly _studentJoinClassUseCase: StudentJoinClassUseCase;
  private readonly _getClassesUseCase: GetClassesUseCase;
  private readonly _getClassByCodeUseCase: GetClassByCodeUseCase;
  private readonly _getClassDetailsUseCase: GetClassDetailsUseCase;
  private readonly _studentJoinClassWithInvitationUseCase: StudentJoinClassWithInvitationUseCase;
  private readonly _getClassStudentsUseCase: GetClassStudentsUseCase;
  private readonly _acceptInvitationUseCase: AcceptInvitationUseCase;
  private readonly _assignExamToClassUseCase: AssignExamToClassUseCase;
  private readonly _deleteClassUseCase: DeleteClassUseCase;
  private readonly _importStudentsCSVUseCase: ImportStudentsCSVUseCase;
  private readonly _getClassInvitationsUseCase: GetClassInvitationsUseCase;
  private readonly _resendInvitationUseCase: ResendInvitationUseCase;
  private readonly _removeStudentFromClassUseCase: RemoveStudentFromClassUseCase;
  private readonly _getStudentClassesUseCase: GetStudentClassesUseCase;
  private readonly _getTeacherClassesWithStatsUseCase: GetTeacherClassesWithStatsUseCase;
  private readonly _getStudentClassesWithStatsUseCase: GetStudentClassesWithStatsUseCase;

  // Application Layer - Class Exam Use Cases
  private readonly _getClassExamsUseCase: GetClassExamsUseCase;
  private readonly _getStudentExamsUseCase: GetStudentExamsUseCase;
  private readonly _getStudentClassExamsUseCase: GetStudentClassExamsUseCase;
  private readonly _publishClassExamUseCase: PublishClassExamUseCase;
  private readonly _updateClassExamSettingsUseCase: UpdateClassExamSettingsUseCase;
  private readonly _getClassExamResultsUseCase: GetClassExamResultsUseCase;
  private readonly _deleteClassExamUseCase: DeleteClassExamUseCase;
  private readonly _listRecentClassExamsUseCase: ListRecentClassExamsUseCase;
  private readonly _getStudentSubmissionDetailUseCase: GetStudentSubmissionDetailUseCase;

  // Application Layer - Class Document Use Cases
  private readonly _shareDocumentWithClassUseCase: ShareDocumentWithClassUseCase;
  private readonly _unshareDocumentUseCase: UnshareDocumentUseCase;
  private readonly _getClassDocumentsForStudentUseCase: GetClassDocumentsForStudentUseCase;
  private readonly _getClassDocumentsForTeacherUseCase: GetClassDocumentsForTeacherUseCase;
  private readonly _getDocumentDownloadUrlUseCase: GetDocumentDownloadUrlUseCase;
  private readonly _getDocumentSharesUseCase: GetDocumentSharesUseCase;
  private readonly _updateDocumentVisibilityUseCase: UpdateDocumentVisibilityUseCase;

  // Application Layer - Student Use Cases
  private readonly _assignExamToStudentUseCase: AssignExamToStudentUseCase;
  private readonly _getAssignedExamsUseCase: GetAssignedExamsUseCase;
  private readonly _startExamUseCase: StartExamUseCase;
  private readonly _saveAnswerUseCase: SaveAnswerUseCase;
  private readonly _submitExamAnswersUseCase: SubmitExamAnswersUseCase;
  private readonly _getExamResultsUseCase: GetExamResultsUseCase;

  // Application Layer - Subscription Use Cases
  private readonly _getSubscriptionUseCase: GetSubscriptionUseCase;

  private constructor() {
    // ========================================
    // INFRASTRUCTURE LAYER
    // ========================================

    // Database client
    this._prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    // Repositories
    this._userRepository = PrismaUserRepository.create(this._prisma);
    this._documentRepository = PrismaDocumentRepository.create(this._prisma);
    this._examRepository = PrismaExamRepository.create(this._prisma);
    this._examAssignmentRepository = PrismaExamAssignmentRepository.create(this._prisma);
    this._studentAnswerRepository = PrismaStudentAnswerRepository.create(this._prisma);

    // Security Services
    this._passwordHasher = new BcryptPasswordHasher();
    this._tokenService = new JWTTokenService();

    // Storage Service - Auto-select based on configuration
    // Use Azure if configured, otherwise fallback to local filesystem
    const azureStorageService = new AzureBlobStorageService();
    if (azureStorageService.isConfigured()) {
      console.log('📦 Using Azure Blob Storage for file storage');
      this._storageService = azureStorageService;
    } else {
      console.log('📁 Using Local File Storage for file storage (./uploads)');
      this._storageService = new LocalFileStorageService('./uploads');
    }

    // Text Extraction Service
    this._textExtractor = new TextExtractorService();
    this._messageBroker = new BullMQMessageBroker(); // Instantiate Message Broker

    // AI Services
    this._embeddingService = new AzureOpenAIEmbeddingService();
    this._documentProcessor = new GenkitDocumentProcessor();
    this._examGenerator = new GenkitExamGenerator();
    this._gradingService = new AzureOpenAIGradingService();

    // Classes & Invitations Repositories
    this._classRepository = PrismaClassRepository.create(this._prisma);
    this._studentEnrollmentRepository = PrismaStudentEnrollmentRepository.create(this._prisma);
    this._invitationRepository = PrismaInvitationRepository.create(this._prisma);
    this._classDocumentRepository = PrismaClassDocumentRepository.create(this._prisma);
    this._classExamRepository = PrismaClassExamRepository.create(this._prisma);

    // Subscription Repositories
    this._subscriptionRepository = PrismaSubscriptionRepository.create(this._prisma);
    this._usageMetricsRepository = PrismaUsageMetricsRepository.create(this._prisma);

    // ========================================
    // APPLICATION LAYER - USE CASES
    // ========================================

    // Auth Use Cases
    this._registerUserUseCase = new RegisterUserUseCase(
      this._userRepository,
      this._passwordHasher,
      this._tokenService,
      this._subscriptionRepository,
      this._usageMetricsRepository
    );

    this._loginUserUseCase = new LoginUserUseCase(
      this._userRepository,
      this._passwordHasher,
      this._tokenService
    );

    this._refreshTokenUseCase = new RefreshTokenUseCase(this._userRepository, this._tokenService);

    // Document Use Cases
    this._uploadDocumentUseCase = new UploadDocumentUseCase(
      this._documentRepository,
      this._storageService
    );

    this._getDocumentUseCase = new GetDocumentUseCase(this._documentRepository);

    this._listDocumentsUseCase = new ListDocumentsUseCase(this._documentRepository);

    this._processDocumentUseCase = new ProcessDocumentUseCase(
      this._documentRepository,
      this._storageService,
      this._documentProcessor
    );

    this._reprocessDocumentUseCase = new ReprocessDocumentUseCase(
      this._documentRepository,
      this._messageBroker
    );

    this._queryDocumentUseCase = new QueryDocumentUseCase(
      this._documentRepository,
      this._embeddingService
    );

    this._deleteDocumentUseCase = new DeleteDocumentUseCase(this._documentRepository);

    this._downloadDocumentUseCase = new DownloadDocumentUseCase(
      this._documentRepository,
      this._classDocumentRepository,
      this._studentEnrollmentRepository,
      this._storageService
    );

    // Dashboard Use Cases
    this._getDashboardStatsUseCase = new GetDashboardStatsUseCase(
      this._documentRepository,
      this._examRepository
    );

    // Exam Use Cases
    this._generateExamUseCase = new GenerateExamUseCase(
      this._documentRepository,
      this._examRepository,
      this._embeddingService,
      this._examGenerator,
      this._subscriptionRepository,
      this._usageMetricsRepository
    );

    this._getExamUseCase = new GetExamUseCase(this._examRepository);

    this._listExamsUseCase = new ListExamsUseCase(this._examRepository);

    this._deleteExamUseCase = new DeleteExamUseCase(this._examRepository);

    // Classes & Invitations Use Cases
    this._createClassUseCase = new CreateClassUseCase(
      this._classRepository,
      this._subscriptionRepository,
      this._usageMetricsRepository
    );
    this._createEmailInvitationsUseCase = new CreateEmailInvitationsUseCase(
      this._invitationRepository
    );
    this._studentJoinClassUseCase = new StudentJoinClassUseCase(
      this._studentEnrollmentRepository,
      this._classRepository,
      this._subscriptionRepository,
      this._usageMetricsRepository
    );
    this._getClassesUseCase = new GetClassesUseCase(this._classRepository);
    this._getClassByCodeUseCase = new GetClassByCodeUseCase(
      this._classRepository,
      this._userRepository
    );
    this._getClassDetailsUseCase = new GetClassDetailsUseCase(
      this._classRepository,
      this._userRepository
    );
    this._studentJoinClassWithInvitationUseCase = new StudentJoinClassWithInvitationUseCase(
      this._invitationRepository,
      this._studentEnrollmentRepository
    );
    this._getClassStudentsUseCase = new GetClassStudentsUseCase(
      this._studentEnrollmentRepository,
      this._userRepository
    );
    this._acceptInvitationUseCase = new AcceptInvitationUseCase(
      this._invitationRepository,
      this._studentEnrollmentRepository
    );
    this._assignExamToClassUseCase = new AssignExamToClassUseCase(
      this._classRepository,
      this._examRepository,
      this._classExamRepository,
      this._studentEnrollmentRepository,
      this._examAssignmentRepository
    );
    this._deleteClassUseCase = new DeleteClassUseCase(this._classRepository);
    this._importStudentsCSVUseCase = new ImportStudentsCSVUseCase(
      this._invitationRepository,
      this._classRepository
    );
    this._getClassInvitationsUseCase = new GetClassInvitationsUseCase(
      this._invitationRepository,
      this._classRepository
    );
    this._resendInvitationUseCase = new ResendInvitationUseCase(
      this._invitationRepository,
      this._classRepository
    );
    this._removeStudentFromClassUseCase = new RemoveStudentFromClassUseCase(
      this._studentEnrollmentRepository,
      this._classRepository
    );
    this._getStudentClassesUseCase = new GetStudentClassesUseCase(
      this._classRepository,
      this._studentEnrollmentRepository
    );
    this._getTeacherClassesWithStatsUseCase = new GetTeacherClassesWithStatsUseCase(
      this._classRepository,
      this._studentEnrollmentRepository,
      this._classDocumentRepository,
      this._classExamRepository
    );
    this._getStudentClassesWithStatsUseCase = new GetStudentClassesWithStatsUseCase(
      this._classRepository,
      this._studentEnrollmentRepository,
      this._classDocumentRepository,
      this._classExamRepository
    );

    // Class Exam Use Cases
    this._getClassExamsUseCase = new GetClassExamsUseCase(
      this._classExamRepository,
      this._examRepository
    );
    this._getStudentExamsUseCase = new GetStudentExamsUseCase(
      this._classExamRepository,
      this._examRepository,
      this._examAssignmentRepository
    );
    this._getStudentClassExamsUseCase = new GetStudentClassExamsUseCase(
      this._classExamRepository,
      this._examRepository,
      this._examAssignmentRepository,
      this._classRepository
    );
    this._publishClassExamUseCase = new PublishClassExamUseCase(
      this._classExamRepository,
      this._classRepository
    );
    this._updateClassExamSettingsUseCase = new UpdateClassExamSettingsUseCase(
      this._classExamRepository,
      this._classRepository
    );
    this._getClassExamResultsUseCase = new GetClassExamResultsUseCase(
      this._classExamRepository,
      this._classRepository,
      this._examRepository,
      this._examAssignmentRepository,
      this._userRepository
    );
    this._deleteClassExamUseCase = new DeleteClassExamUseCase(
      this._classExamRepository,
      this._classRepository
    );
    this._listRecentClassExamsUseCase = new ListRecentClassExamsUseCase(this._classExamRepository);

    this._getStudentSubmissionDetailUseCase = new GetStudentSubmissionDetailUseCase(
      this._classExamRepository,
      this._classRepository,
      this._examRepository,
      this._examAssignmentRepository,
      this._studentAnswerRepository,
      this._userRepository
    );

    // Class Document Use Cases
    this._shareDocumentWithClassUseCase = new ShareDocumentWithClassUseCase(
      this._classDocumentRepository,
      this._documentRepository,
      this._classRepository
    );
    this._unshareDocumentUseCase = new UnshareDocumentUseCase(
      this._classDocumentRepository,
      this._documentRepository,
      this._classRepository
    );
    this._getClassDocumentsForStudentUseCase = new GetClassDocumentsForStudentUseCase(
      this._classDocumentRepository,
      this._classRepository,
      this._studentEnrollmentRepository,
      this._documentRepository
    );
    this._getClassDocumentsForTeacherUseCase = new GetClassDocumentsForTeacherUseCase(
      this._classDocumentRepository,
      this._classRepository,
      this._documentRepository
    );
    this._getDocumentDownloadUrlUseCase = new GetDocumentDownloadUrlUseCase(
      this._documentRepository,
      this._classDocumentRepository,
      this._studentEnrollmentRepository
    );
    this._getDocumentSharesUseCase = new GetDocumentSharesUseCase(
      this._classDocumentRepository,
      this._documentRepository,
      this._classRepository
    );
    this._updateDocumentVisibilityUseCase = new UpdateDocumentVisibilityUseCase(
      this._classDocumentRepository,
      this._documentRepository,
      this._classRepository
    );

    // Student Use Cases
    this._assignExamToStudentUseCase = new AssignExamToStudentUseCase(
      this._examAssignmentRepository,
      this._examRepository,
      this._userRepository
    );

    this._getAssignedExamsUseCase = new GetAssignedExamsUseCase(this._examAssignmentRepository);

    this._startExamUseCase = new StartExamUseCase(
      this._examAssignmentRepository,
      this._examRepository
    );

    this._saveAnswerUseCase = new SaveAnswerUseCase(
      this._examAssignmentRepository,
      this._studentAnswerRepository,
      this._examRepository
    );

    this._submitExamAnswersUseCase = new SubmitExamAnswersUseCase(
      this._examAssignmentRepository,
      this._studentAnswerRepository,
      this._examRepository,
      this._gradingService
    );

    this._getExamResultsUseCase = new GetExamResultsUseCase(
      this._examAssignmentRepository,
      this._studentAnswerRepository,
      this._examRepository
    );

    // Subscription Use Cases
    this._getSubscriptionUseCase = new GetSubscriptionUseCase(
      this._subscriptionRepository,
      this._usageMetricsRepository,
      this._classRepository
    );
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Reset singleton (useful for testing)
   */
  public static reset(): void {
    if (Container.instance) {
      Container.instance._prisma.$disconnect();
    }
    // @ts-expect-error - Force reset for testing
    Container.instance = undefined;
  }

  // ========================================
  // GETTERS - Infrastructure Layer
  // ========================================

  public get prisma(): PrismaClient {
    return this._prisma;
  }

  public get userRepository(): IUserRepository {
    return this._userRepository;
  }

  public get documentRepository(): IDocumentRepository {
    return this._documentRepository;
  }

  public get passwordHasher(): IPasswordHasher {
    return this._passwordHasher;
  }

  public get tokenService(): ITokenService {
    return this._tokenService;
  }

  public get storageService(): IStorageService {
    return this._storageService;
  }

  public get textExtractor(): ITextExtractor {
    return this._textExtractor;
  }

  public get messageBroker(): IMessageBroker {
    return this._messageBroker;
  }

  // ========================================
  // GETTERS - Application Layer (Use Cases)
  // ========================================

  public get registerUserUseCase(): RegisterUserUseCase {
    return this._registerUserUseCase;
  }

  public get loginUserUseCase(): LoginUserUseCase {
    return this._loginUserUseCase;
  }

  public get refreshTokenUseCase(): RefreshTokenUseCase {
    return this._refreshTokenUseCase;
  }

  // Document Use Cases

  public get uploadDocumentUseCase(): UploadDocumentUseCase {
    return this._uploadDocumentUseCase;
  }

  public get getDocumentUseCase(): GetDocumentUseCase {
    return this._getDocumentUseCase;
  }

  public get listDocumentsUseCase(): ListDocumentsUseCase {
    return this._listDocumentsUseCase;
  }

  public get processDocumentUseCase(): ProcessDocumentUseCase {
    return this._processDocumentUseCase;
  }

  public get reprocessDocumentUseCase(): ReprocessDocumentUseCase {
    return this._reprocessDocumentUseCase;
  }

  public get queryDocumentUseCase(): QueryDocumentUseCase {
    return this._queryDocumentUseCase;
  }

  public get deleteDocumentUseCase(): DeleteDocumentUseCase {
    return this._deleteDocumentUseCase;
  }

  public get downloadDocumentUseCase(): DownloadDocumentUseCase {
    return this._downloadDocumentUseCase;
  }

  // Dashboard Use Cases

  public get getDashboardStatsUseCase(): GetDashboardStatsUseCase {
    return this._getDashboardStatsUseCase;
  }

  // Exam Use Cases

  public get generateExamUseCase(): GenerateExamUseCase {
    return this._generateExamUseCase;
  }

  public get getExamUseCase(): GetExamUseCase {
    return this._getExamUseCase;
  }

  public get listExamsUseCase(): ListExamsUseCase {
    return this._listExamsUseCase;
  }

  public get deleteExamUseCase(): DeleteExamUseCase {
    return this._deleteExamUseCase;
  }

  // Classes & Invitations Use Cases

  public get createClassUseCase(): CreateClassUseCase {
    return this._createClassUseCase;
  }

  public get createEmailInvitationsUseCase(): CreateEmailInvitationsUseCase {
    return this._createEmailInvitationsUseCase;
  }

  public get studentJoinClassUseCase(): StudentJoinClassUseCase {
    return this._studentJoinClassUseCase;
  }

  public get getClassesUseCase(): GetClassesUseCase {
    return this._getClassesUseCase;
  }

  public get getClassByCodeUseCase(): GetClassByCodeUseCase {
    return this._getClassByCodeUseCase;
  }

  public get getClassDetailsUseCase(): GetClassDetailsUseCase {
    return this._getClassDetailsUseCase;
  }

  public get studentJoinClassWithInvitationUseCase(): StudentJoinClassWithInvitationUseCase {
    return this._studentJoinClassWithInvitationUseCase;
  }

  public get getClassStudentsUseCase(): GetClassStudentsUseCase {
    return this._getClassStudentsUseCase;
  }

  public get acceptInvitationUseCase(): AcceptInvitationUseCase {
    return this._acceptInvitationUseCase;
  }

  public get assignExamToClassUseCase(): AssignExamToClassUseCase {
    return this._assignExamToClassUseCase;
  }

  public get deleteClassUseCase(): DeleteClassUseCase {
    return this._deleteClassUseCase;
  }

  public get importStudentsCSVUseCase(): ImportStudentsCSVUseCase {
    return this._importStudentsCSVUseCase;
  }

  public get getClassInvitationsUseCase(): GetClassInvitationsUseCase {
    return this._getClassInvitationsUseCase;
  }

  public get resendInvitationUseCase(): ResendInvitationUseCase {
    return this._resendInvitationUseCase;
  }

  public get removeStudentFromClassUseCase(): RemoveStudentFromClassUseCase {
    return this._removeStudentFromClassUseCase;
  }

  // Repositories Getters

  public get invitationRepository(): IInvitationRepository {
    return this._invitationRepository;
  }

  public get classDocumentRepository(): IClassDocumentRepository {
    return this._classDocumentRepository;
  }

  public get studentEnrollmentRepository(): IStudentEnrollmentRepository {
    return this._studentEnrollmentRepository;
  }

  public get classExamRepository(): IClassExamRepository {
    return this._classExamRepository;
  }

  // Subscription Use Cases

  public get subscriptionRepository(): ISubscriptionRepository {
    return this._subscriptionRepository;
  }

  public get usageMetricsRepository(): IUsageMetricsRepository {
    return this._usageMetricsRepository;
  }

  // Student Use Cases

  public get assignExamToStudentUseCase(): AssignExamToStudentUseCase {
    return this._assignExamToStudentUseCase;
  }

  public get getAssignedExamsUseCase(): GetAssignedExamsUseCase {
    return this._getAssignedExamsUseCase;
  }

  public get startExamUseCase(): StartExamUseCase {
    return this._startExamUseCase;
  }

  public get saveAnswerUseCase(): SaveAnswerUseCase {
    return this._saveAnswerUseCase;
  }

  public get submitExamAnswersUseCase(): SubmitExamAnswersUseCase {
    return this._submitExamAnswersUseCase;
  }

  public get getExamResultsUseCase(): GetExamResultsUseCase {
    return this._getExamResultsUseCase;
  }

  public get getStudentClassesUseCase(): GetStudentClassesUseCase {
    return this._getStudentClassesUseCase;
  }

  public get getTeacherClassesWithStatsUseCase(): GetTeacherClassesWithStatsUseCase {
    return this._getTeacherClassesWithStatsUseCase;
  }

  public get getStudentClassesWithStatsUseCase(): GetStudentClassesWithStatsUseCase {
    return this._getStudentClassesWithStatsUseCase;
  }

  // Class Exam Use Cases

  public get getClassExamsUseCase(): GetClassExamsUseCase {
    return this._getClassExamsUseCase;
  }

  public get getStudentExamsUseCase(): GetStudentExamsUseCase {
    return this._getStudentExamsUseCase;
  }

  public get getStudentClassExamsUseCase(): GetStudentClassExamsUseCase {
    return this._getStudentClassExamsUseCase;
  }

  public get publishClassExamUseCase(): PublishClassExamUseCase {
    return this._publishClassExamUseCase;
  }

  public get updateClassExamSettingsUseCase(): UpdateClassExamSettingsUseCase {
    return this._updateClassExamSettingsUseCase;
  }

  public get getClassExamResultsUseCase(): GetClassExamResultsUseCase {
    return this._getClassExamResultsUseCase;
  }

  public get deleteClassExamUseCase(): DeleteClassExamUseCase {
    return this._deleteClassExamUseCase;
  }

  public get listRecentClassExamsUseCase(): ListRecentClassExamsUseCase {
    return this._listRecentClassExamsUseCase;
  }

  public get getStudentSubmissionDetailUseCase(): GetStudentSubmissionDetailUseCase {
    return this._getStudentSubmissionDetailUseCase;
  }

  public get gradingService(): IAnswerGradingService {
    return this._gradingService;
  }

  // Class Document Use Cases

  public get shareDocumentWithClassUseCase(): ShareDocumentWithClassUseCase {
    return this._shareDocumentWithClassUseCase;
  }

  public get unshareDocumentUseCase(): UnshareDocumentUseCase {
    return this._unshareDocumentUseCase;
  }

  public get getClassDocumentsForStudentUseCase(): GetClassDocumentsForStudentUseCase {
    return this._getClassDocumentsForStudentUseCase;
  }

  public get getClassDocumentsForTeacherUseCase(): GetClassDocumentsForTeacherUseCase {
    return this._getClassDocumentsForTeacherUseCase;
  }

  public get getDocumentDownloadUrlUseCase(): GetDocumentDownloadUrlUseCase {
    return this._getDocumentDownloadUrlUseCase;
  }

  public get getDocumentSharesUseCase(): GetDocumentSharesUseCase {
    return this._getDocumentSharesUseCase;
  }

  public get updateDocumentVisibilityUseCase(): UpdateDocumentVisibilityUseCase {
    return this._updateDocumentVisibilityUseCase;
  }

  // Subscription Use Cases

  public get getSubscriptionUseCase(): GetSubscriptionUseCase {
    return this._getSubscriptionUseCase;
  }

  /**
   * Cleanup - disconnect database
   */
  public async cleanup(): Promise<void> {
    await this._prisma.$disconnect();
  }
}

// Export singleton instance
export const container = Container.getInstance();
