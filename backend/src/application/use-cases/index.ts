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
export { ListRecentClassExamsUseCase } from './class-exams/ListRecentClassExamsUseCase.js';

// Export input/output types for exam use cases
export type { GenerateExamInput, GenerateExamOutput } from './exams/GenerateExamUseCase.js';
export type { GetExamInput, GetExamOutput } from './exams/GetExamUseCase.js';
export type { ListExamsInput, ListExamsOutput } from './exams/ListExamsUseCase.js';
export type { DeleteExamInput, DeleteExamOutput } from './exam/DeleteExamUseCase.js';
export type {
  ListRecentClassExamsInput,
  ListRecentClassExamsOutput,
} from './class-exams/ListRecentClassExamsUseCase.js';

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

// Application Layer - Class Exam Use Cases
export { GetClassExamsUseCase } from './classes/GetClassExamsUseCase.js';
export { GetStudentExamsUseCase } from './classes/GetStudentExamsUseCase.js';
export { GetStudentClassExamsUseCase } from './classes/GetStudentClassExamsUseCase.js';
export { PublishClassExamUseCase } from './classes/PublishClassExamUseCase.js';
export { UpdateClassExamSettingsUseCase } from './classes/UpdateClassExamSettingsUseCase.js';
export { GetClassExamResultsUseCase } from './classes/GetClassExamResultsUseCase.js';
export { DeleteClassExamUseCase } from './classes/DeleteClassExamUseCase.js';
export { GetTeacherClassesWithStatsUseCase } from './classes/GetTeacherClassesWithStatsUseCase.js';
export { GetStudentClassesWithStatsUseCase } from './classes/GetStudentClassesWithStatsUseCase.js';
export { GetStudentSubmissionDetailUseCase } from './classes/GetStudentSubmissionDetailUseCase.js';

// Export input/output types for class exam use cases
export type { GetClassExamsInput, GetClassExamsOutput } from './classes/GetClassExamsUseCase.js';
export type {
  GetStudentExamsInput,
  GetStudentExamsOutput,
} from './classes/GetStudentExamsUseCase.js';
export type {
  GetStudentClassExamsInput,
  GetStudentClassExamsOutput,
} from './classes/GetStudentClassExamsUseCase.js';
export type {
  PublishClassExamInput,
  PublishClassExamOutput,
} from './classes/PublishClassExamUseCase.js';
export type {
  UpdateClassExamSettingsInput,
  UpdateClassExamSettingsOutput,
} from './classes/UpdateClassExamSettingsUseCase.js';
export type {
  GetClassExamResultsInput,
  GetClassExamResultsOutput,
} from './classes/GetClassExamResultsUseCase.js';
export type { DeleteClassExamInput } from './classes/DeleteClassExamUseCase.js';
export type {
  GetStudentSubmissionDetailInput,
  GetStudentSubmissionDetailOutput,
} from './classes/GetStudentSubmissionDetailUseCase.js';

// Application Layer - Student Use Cases
export { SaveAnswerUseCase } from './student/SaveAnswerUseCase.js';
export type { SaveAnswerInput, SaveAnswerOutput } from './student/SaveAnswerUseCase.js';
