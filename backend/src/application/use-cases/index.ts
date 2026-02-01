// Application Layer - Auth Use Cases
export { RegisterUserUseCase } from './auth/RegisterUserUseCase.js';
export { LoginUserUseCase } from './auth/LoginUserUseCase.js';
export { RefreshTokenUseCase } from './auth/RefreshTokenUseCase.js';

// Export input/output types for auth use cases
export type { RegisterUserInput, RegisterUserOutput } from './auth/RegisterUserUseCase.js';
export type { LoginUserInput, LoginUserOutput } from './auth/LoginUserUseCase.js';
export type { RefreshTokenInput, RefreshTokenOutput } from './auth/RefreshTokenUseCase.js';

// Application Layer - Document Use Cases
export { UploadDocumentUseCase } from './documents/UploadDocumentUseCase.js';
export { GetDocumentUseCase } from './documents/GetDocumentUseCase.js';
export { ListDocumentsUseCase } from './documents/ListDocumentsUseCase.js';
export { ProcessDocumentUseCase } from './documents/ProcessDocumentUseCase.js';
export { ReprocessDocumentUseCase } from './documents/ReprocessDocumentUseCase.js';
export { QueryDocumentUseCase } from './documents/QueryDocumentUseCase.js';

// Export input/output types for document use cases
export type {
  UploadDocumentInput,
  UploadDocumentOutput,
} from './documents/UploadDocumentUseCase.js';
export type { GetDocumentInput, GetDocumentOutput } from './documents/GetDocumentUseCase.js';
export type { ListDocumentsInput, ListDocumentsOutput } from './documents/ListDocumentsUseCase.js';
export type {
  ProcessDocumentInput,
  ProcessDocumentOutput,
} from './documents/ProcessDocumentUseCase.js';
export type { QueryDocumentInput, QueryDocumentOutput } from './documents/QueryDocumentUseCase.js';

// Application Layer - Dashboard Use Cases
export { GetDashboardStatsUseCase } from './dashboard/GetDashboardStatsUseCase.js';

// Export input/output types for dashboard use cases
export type {
  GetDashboardStatsInput,
  GetDashboardStatsOutput,
} from './dashboard/GetDashboardStatsUseCase.js';
