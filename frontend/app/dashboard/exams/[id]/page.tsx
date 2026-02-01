import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExamDetails } from '@/features/exams/components/ExamDetails';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ExamDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard/exams">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Exams
            </Button>
          </Link>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Exam Details</h1>
          <p className="text-muted-foreground">Review your generated exam</p>
        </div>
        <ExamDetails examId={id} />
      </div>
    </DashboardLayout>
  );
}
