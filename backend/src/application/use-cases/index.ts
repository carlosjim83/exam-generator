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
export { DeleteDocumentUseCase } from './documents/DeleteDocumentUseCase.js';
export { DownloadDocumentUseCase } from './documents/DownloadDocumentUseCase.js';

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

// Application Layer - Exam Use Cases
export { GenerateExamUseCase } from './exams/GenerateExamUseCase.js';
export { GetExamUseCase } from './exams/GetExamUseCase.js';
export { ListExamsUseCase } from './exams/ListExamsUseCase.js';
export { DeleteExamUseCase } from './exam/DeleteExamUseCase.js';

// Export input/output types for exam use cases
export type { GenerateExamInput, GenerateExamOutput } from './exams/GenerateExamUseCase.js';
export type { GetExamInput, GetExamOutput } from './exams/GetExamUseCase.js';
export type { ListExamsInput, ListExamsOutput } from './exams/ListExamsUseCase.js';
export type { DeleteExamInput, DeleteExamOutput } from './exam/DeleteExamUseCase.js';

// Application Layer - Classes & Invitations Use Cases
export { CreateClassUseCase } from './classes/CreateClassUseCase.js';
export { CreateEmailInvitationsUseCase } from './classes/CreateEmailInvitationsUseCase.js';
export { StudentJoinClassUseCase } from './classes/StudentJoinClassUseCase.js';
export { GetClassesUseCase } from './classes/GetClassesUseCase.js';
export { GetClassByCodeUseCase } from './classes/GetClassByCodeUseCase.js';
export { GetClassDetailsUseCase } from './classes/GetClassDetailsUseCase.js';
export { StudentJoinClassWithInvitationUseCase } from './classes/StudentJoinClassWithInvitationUseCase.js';
export { GetClassStudentsUseCase } from './classes/GetClassStudentsUseCase.js';
export { AcceptInvitationUseCase } from './classes/AcceptInvitationUseCase.js';
export { AssignExamToClassUseCase } from './classes/AssignExamToClassUseCase.js';
export { DeleteClassUseCase } from './classes/DeleteClassUseCase.js';
export { ImportStudentsCSVUseCase } from './classes/ImportStudentsCSVUseCase.js';
export { GetClassInvitationsUseCase } from './classes/GetClassInvitationsUseCase.js';
export { ResendInvitationUseCase } from './classes/ResendInvitationUseCase.js';
export { RemoveStudentFromClassUseCase } from './classes/RemoveStudentFromClassUseCase.js';
export { GetStudentClassesUseCase } from './classes/GetStudentClassesUseCase.js';

// Export input/output types for classes use cases
export type { GetClassInvitationsCommand } from './classes/GetClassInvitationsUseCase.js';
export type { ResendInvitationCommand } from './classes/ResendInvitationUseCase.js';
export type { ImportStudentsCSVCommand } from './classes/ImportStudentsCSVUseCase.js';
export type { CreateClassCommand } from './classes/CreateClassUseCase.js';
export type { CreateEmailInvitationsCommand } from './classes/CreateEmailInvitationsUseCase.js';
export type { StudentJoinClassCommand } from './classes/StudentJoinClassUseCase.js';
export type { GetClassesCommand, GetClassesOutput } from './classes/GetClassesUseCase.js';
export type { GetClassByCodeCommand } from './classes/GetClassByCodeUseCase.js';
export type { GetClassDetailsCommand } from './classes/GetClassDetailsUseCase.js';
export type { StudentJoinClassWithInvitationCommand } from './classes/StudentJoinClassWithInvitationUseCase.js';
export type { GetClassStudentsCommand } from './classes/GetClassStudentsUseCase.js';
export type { AcceptInvitationCommand } from './classes/AcceptInvitationUseCase.js';
export type { RemoveStudentFromClassCommand } from './classes/RemoveStudentFromClassUseCase.js';
