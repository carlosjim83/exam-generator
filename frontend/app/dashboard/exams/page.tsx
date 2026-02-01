import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExamList } from '@/features/exams/components/ExamList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function ExamsPage() {
  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">My Exams</h1>
            <p className="text-muted-foreground">View and manage all your generated exams</p>
          </div>
          <Link href="/dashboard/exams/generate">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate New Exam
            </Button>
          </Link>
        </div>
        <ExamList />
      </div>
    </DashboardLayout>
  );
}
