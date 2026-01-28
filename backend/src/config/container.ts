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
import {
  PrismaUserRepository,
  PrismaDocumentRepository,
  BcryptPasswordHasher,
  JWTTokenService,
  AzureBlobStorageService,
  LocalFileStorageService,
  TextExtractorService,
  BullMQMessageBroker, // Added
} from '../infrastructure/index.js';

// Application Use Cases
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokenUseCase,
  UploadDocumentUseCase,
  GetDocumentUseCase,
  ListDocumentsUseCase,
  ProcessDocumentUseCase,
  ReprocessDocumentUseCase, // Added
  GetDashboardStatsUseCase,
} from '../application/use-cases/index.js';

// Domain Interfaces (for type safety)
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { IDocumentRepository } from '../domain/repositories/IDocumentRepository.js';
import type { IPasswordHasher } from '../domain/services/IPasswordHasher.js';
import type { ITokenService } from '../domain/services/ITokenService.js';
import type { IStorageService } from '../domain/services/IStorageService.js';
import type { ITextExtractor } from '../domain/services/ITextExtractor.js';
import type { IMessageBroker } from '../application/ports/IMessageBroker.js'; // Added

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
  private readonly _passwordHasher: IPasswordHasher;
  private readonly _tokenService: ITokenService;
  private readonly _storageService: IStorageService;
  private readonly _textExtractor: ITextExtractor;
  private readonly _messageBroker: IMessageBroker; // Added

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

  // Application Layer - Dashboard Use Cases
  private readonly _getDashboardStatsUseCase: GetDashboardStatsUseCase;

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

    // ========================================
    // APPLICATION LAYER - USE CASES
    // ========================================

    // Auth Use Cases
    this._registerUserUseCase = new RegisterUserUseCase(
      this._userRepository,
      this._passwordHasher,
      this._tokenService
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
      this._storageService
    );

    this._reprocessDocumentUseCase = new ReprocessDocumentUseCase(
      this._documentRepository,
      this._messageBroker
    );

    // Dashboard Use Cases
    this._getDashboardStatsUseCase = new GetDashboardStatsUseCase(this._documentRepository);
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
    // @ts-ignore - Force reset for testing
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

  // Dashboard Use Cases

  public get getDashboardStatsUseCase(): GetDashboardStatsUseCase {
    return this._getDashboardStatsUseCase;
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
