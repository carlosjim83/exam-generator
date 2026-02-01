import { ExamDetails } from '@/features/exams/components/ExamDetails';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ExamDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Exam Details"
        description="Review your generated exam"
        backHref="/dashboard/exams"
        backLabel="Back to My Exams"
      />
      <PageContainer>
        <ExamDetails examId={id} />
      </PageContainer>
    </div>
  );
}
