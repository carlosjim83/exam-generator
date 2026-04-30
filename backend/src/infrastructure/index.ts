// Infrastructure Layer - Security Services
export { BcryptPasswordHasher } from './security/BcryptPasswordHasher.js';
export { JWTTokenService } from './security/JWTTokenService.js';

// Infrastructure Layer - Repositories
export { PrismaUserRepository } from './repositories/PrismaUserRepository.js';
export { PrismaDocumentRepository } from './repositories/PrismaDocumentRepository.js';
export { PrismaClassRepository } from './persistence/PrismaClassRepository.js';
export { PrismaStudentEnrollmentRepository } from './persistence/PrismaStudentEnrollmentRepository.js';
export { PrismaInvitationRepository } from './persistence/PrismaInvitationRepository.js';
export { PrismaClassDocumentRepository } from './persistence/PrismaClassDocumentRepository.js';
export { PrismaClassExamRepository } from './persistence/PrismaClassExamRepository.js';

// Infrastructure Layer - Subscription Repositories
export { PrismaSubscriptionRepository } from './persistence/PrismaSubscriptionRepository.js';
export { PrismaUsageMetricsRepository } from './persistence/PrismaUsageMetricsRepository.js';

// Infrastructure Layer - Storage Services
export { AzureBlobStorageService } from './storage/AzureBlobStorageService.js';
export { LocalFileStorageService } from './storage/LocalFileStorageService.js';

// Infrastructure Layer - Text Extraction
export { TextExtractorService } from './text-extraction/TextExtractorService.js';

// Infrastructure Layer - Message Broker
export { BullMQMessageBroker } from './message-broker/BullMQMessageBroker.js';

// Infrastructure Layer - AI Adapters
export { GenkitDocumentProcessor } from './ai/GenkitDocumentProcessor.js';
export { GenkitExamGenerator } from './ai/GenkitExamGenerator.js';
