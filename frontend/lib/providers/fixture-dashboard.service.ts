/**
 * Fixture Dashboard Service
 *
 * Mock implementation for development/testing.
 * Returns hardcoded data instead of making HTTP requests.
 */

import type { IDashboardService } from '../services/dashboard.service';
import type { Document, Exam, DashboardStats } from '../types/dashboard.types';

export class FixtureDashboardService implements IDashboardService {
  private mockDocuments: Document[] = [
    {
      id: '1',
      title: 'Introduction to Calculus',
      filename: 'calculus-intro.pdf',
      fileSize: 2457600, // 2.4 MB
      mimeType: 'application/pdf',
      status: 'COMPLETED',
      uploadedAt: new Date('2023-10-12'),
      processedAt: new Date('2023-10-12'),
      pageCount: 45,
      wordCount: 12000,
    },
    {
      id: '2',
      title: 'Organic Chemistry Lab Notes',
      filename: 'chemistry-notes.docx',
      fileSize: 1153434, // 1.1 MB
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      status: 'COMPLETED',
      uploadedAt: new Date('2023-10-10'),
      processedAt: new Date('2023-10-10'),
      pageCount: 28,
      wordCount: 8500,
    },
    {
      id: '3',
      title: 'Physics Lecture Slides',
      filename: 'physics-lecture.pdf',
      fileSize: 3145728, // 3 MB
      mimeType: 'application/pdf',
      status: 'PROCESSING',
      uploadedAt: new Date('2023-10-15'),
      processedAt: null,
      pageCount: null,
      wordCount: null,
    },
  ];

  private mockExams: Exam[] = [
    {
      id: '1',
      title: 'Midterm Exam: Modern History',
      status: 'published',
      questionsCount: 25,
      gradeLevel: '10th Grade',
      createdAt: new Date('2023-09-15'),
      updatedAt: new Date('2023-09-20'),
    },
    {
      id: '2',
      title: 'Physics Final: Thermodynamics',
      status: 'draft',
      questionsCount: 40,
      gradeLevel: '12th Grade',
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2023-10-08'),
    },
    {
      id: '3',
      title: 'Chemistry Quiz: Organic Compounds',
      status: 'published',
      questionsCount: 15,
      gradeLevel: '11th Grade',
      createdAt: new Date('2023-10-05'),
      updatedAt: new Date('2023-10-10'),
    },
  ];

  /**
   * Simulate network delay (300ms)
   */
  private async simulateDelay() {
    return new Promise((resolve) => setTimeout(resolve, 300));
  }

  async getStats(): Promise<DashboardStats> {
    await this.simulateDelay();

    return {
      totalDocuments: 128,
      totalExams: 42,
      documentsChange: '+12% this month',
      examsChange: '+5% from last term',
      lastActivity: {
        timestamp: new Date(Date.now() - 4 * 60 * 1000), // 4 mins ago
        description: 'Last edit on "Introduction to Calculus"',
      },
    };
  }

  async getRecentDocuments(limit: number = 5): Promise<Document[]> {
    await this.simulateDelay();

    return this.mockDocuments.slice(0, limit);
  }

  async getRecentExams(limit: number = 5): Promise<Exam[]> {
    await this.simulateDelay();

    return this.mockExams.slice(0, limit);
  }
}
