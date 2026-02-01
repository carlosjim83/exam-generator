import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DocumentLibrary } from '@/features/documents/components/DocumentLibrary';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function DocumentsPage() {
  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">My Library</h1>
            <p className="text-muted-foreground">View and manage all your uploaded documents</p>
          </div>
          <Link href="/dashboard/upload">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </Link>
        </div>
        <DocumentLibrary />
      </div>
    </DashboardLayout>
  );
}
