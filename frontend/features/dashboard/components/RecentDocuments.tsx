'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Share2, MoreVertical } from 'lucide-react';
import { useDashboardDocuments } from '@/lib/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Document } from '@/lib/types/dashboard.types';

function DocumentIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
        <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
      <FileText className="h-5 w-5 text-blue-600" />
    </div>
  );
}

function DocumentItem({ document }: { document: Document }) {
  // Format file size
  const fileSizeFormatted = (document.fileSize / (1024 * 1024)).toFixed(1) + ' MB';

  // Format date
  const dateFormatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(document.uploadedAt);

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <DocumentIcon mimeType={document.mimeType} />

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{document.title}</h4>
        <p className="text-xs text-muted-foreground">
          Modified {dateFormatted} • {fileSizeFormatted}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DocumentItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-8 w-8 rounded" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}

export function RecentDocuments() {
  const { documents, loading, error } = useDashboardDocuments(2);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Documents</h2>
        <Button variant="link" className="text-primary">
          View all
        </Button>
      </div>

      <div className="space-y-2">
        {loading && (
          <>
            <DocumentItemSkeleton />
            <DocumentItemSkeleton />
          </>
        )}

        {error && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-destructive">Failed to load documents</p>
              <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && documents.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No documents yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload your first document to get started
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && documents.map((doc) => <DocumentItem key={doc.id} document={doc} />)}
      </div>
    </div>
  );
}
