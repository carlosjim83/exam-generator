'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, RefreshCw, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useDashboardContext } from '../context/DashboardContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiDocumentService } from '@/lib/services/api-document.service';
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

function DocumentStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  switch (status) {
    case 'COMPLETED':
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {t('dashboard:recentDocuments.ready')}
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          {t('dashboard:recentDocuments.processing')}
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="default" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          <Clock className="h-3 w-3 mr-1" />
          {t('dashboard.status.pending')}
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          {t('dashboard:recentDocuments.error')}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function DocumentItem({
  document,
  onRetry,
}: {
  document: Document;
  onRetry: (id: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [isRetrying, setIsRetrying] = useState(false);

  // Format file size
  const fileSizeFormatted = (document.fileSize / (1024 * 1024)).toFixed(1) + ' MB';

  // Format date
  const dateFormatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(document.uploadedAt);

  // Calculate time since upload for processing documents
  const timeSinceUpload = Date.now() - new Date(document.uploadedAt).getTime();
  const minutesSinceUpload = Math.floor(timeSinceUpload / 60000);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry(document.id);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
      <DocumentIcon mimeType={document.mimeType} />

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="mb-1 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="truncate text-sm font-medium max-w-[300px] lg:max-w-[500px]">
                {document.title}
              </h4>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-md">
              <p className="break-words">{document.title}</p>
            </TooltipContent>
          </Tooltip>
          <DocumentStatusBadge status={document.status} />
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {t('dashboard.modifiedAt', { date: dateFormatted })} • {fileSizeFormatted}
          {document.status === 'PROCESSING' && minutesSinceUpload > 0 && (
            <span className="ml-1">
              • {t('dashboard.processingFor', { minutes: minutesSinceUpload })}
            </span>
          )}
        </p>
      </div>

      {(document.status === 'FAILED' ||
        (document.status === 'PROCESSING' && minutesSinceUpload > 5)) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs flex-shrink-0"
          onClick={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              {t('dashboard.retrying')}
            </>
          ) : (
            <>
              <RefreshCw className="mr-1 h-3 w-3" />
              {t('dashboard:recentDocuments.retry')}
            </>
          )}
        </Button>
      )}
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
    </div>
  );
}

export function RecentDocuments() {
  const { t } = useTranslation();
  const {
    documents,
    documentsLoading: loading,
    documentsError: error,
    refreshDocuments,
  } = useDashboardContext();
  const [documentService] = useState(() => new ApiDocumentService());

  // Auto-refresh every 5 seconds if there are processing documents
  useEffect(() => {
    const hasProcessingDocs = documents.some(
      (doc) => doc.status === 'PROCESSING' || doc.status === 'PENDING'
    );

    if (!hasProcessingDocs) return;

    const interval = setInterval(() => {
      refreshDocuments();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [documents, refreshDocuments]);

  const handleRetry = useCallback(
    async (documentId: string) => {
      try {
        await documentService.reprocessDocument(documentId);
        // Refresh documents list after retry
        await refreshDocuments();
      } catch (error) {
        console.error('Failed to retry document:', error);
        throw error;
      }
    },
    [documentService, refreshDocuments]
  );

  return (
    <TooltipProvider>
      <div className="overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('dashboard:recentDocuments.title')}</h2>
          <Link href="/dashboard/documents">
            <Button variant="link" className="text-primary">
              {t('dashboard:recentDocuments.viewAll')}
            </Button>
          </Link>
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
                <p className="text-sm text-destructive">{t('common:error')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && documents.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('noContent.noDocuments')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.uploadFirstDocument')}
                </p>
              </CardContent>
            </Card>
          )}

          {!loading &&
            !error &&
            documents.map((doc) => (
              <DocumentItem key={doc.id} document={doc} onRetry={handleRetry} />
            ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
