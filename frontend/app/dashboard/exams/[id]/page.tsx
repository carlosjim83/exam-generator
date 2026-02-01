import { ExamDetails } from '@/features/exams/components/ExamDetails';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ExamDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="p-6">
      <ExamDetails examId={id} />
    </div>
  );
}
