import { ExamGenerationWizard } from '@/features/exams/components/ExamGenerationWizard';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';

export default function GenerateExamPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Generate New Exam"
        description="Create AI-powered exam questions from your documents"
      />
      <PageContainer maxWidth="5xl">
        <ExamGenerationWizard />
      </PageContainer>
    </div>
  );
}
