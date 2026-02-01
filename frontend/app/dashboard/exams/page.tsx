import { ExamList } from '@/features/exams/components/ExamList';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function ExamsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="My Exams" description="View and manage all your generated exams">
        <Link href="/dashboard/exams/generate">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate New Exam
          </Button>
        </Link>
      </PageHeader>
      <PageContainer>
        <ExamList />
      </PageContainer>
    </div>
  );
}
