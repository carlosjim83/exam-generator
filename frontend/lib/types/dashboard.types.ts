/**
 * Dashboard Domain Types
 * Shared types for dashboard data
 */

export interface Document {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  uploadedAt: Date;
  processedAt: Date | null;
  pageCount: number | null;
  wordCount: number | null;
}

export interface Exam {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  questionsCount: number;
  gradeLevel: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalDocuments: number;
  totalExams: number;
  documentsChange: string; // e.g. "+12% this month"
  examsChange: string; // e.g. "+5% from last term"
  lastActivity: {
    timestamp: Date;
    description: string;
  };
}
