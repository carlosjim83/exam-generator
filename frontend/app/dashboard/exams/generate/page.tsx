import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExamGenerationWizard } from '@/features/exams/components/ExamGenerationWizard';

export default function GenerateExamPage() {
  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Generate New Exam</h1>
          <p className="text-muted-foreground">
            Create AI-powered exam questions from your documents
          </p>
        </div>
        <div className="mx-auto max-w-5xl">
          <ExamGenerationWizard />
        </div>
      </div>
    </DashboardLayout>
  );
}
