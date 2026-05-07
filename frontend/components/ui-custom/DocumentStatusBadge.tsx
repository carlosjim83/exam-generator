'use client';

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, XCircle, Clock } from 'lucide-react';

interface DocumentStatusBadgeLabels {
  completed?: string;
  processing?: string;
  pending?: string;
  failed?: string;
}

interface DocumentStatusBadgeProps {
  status: string;
  labels?: DocumentStatusBadgeLabels;
}

export function DocumentStatusBadge({ status, labels }: DocumentStatusBadgeProps) {
  const { t } = useTranslation();

  switch (status) {
    case 'COMPLETED':
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {labels?.completed ?? t('documents:ready')}
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          {labels?.processing ?? t('documents:processing')}
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="default" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          <Clock className="mr-1 h-3 w-3" />
          {labels?.pending ?? t('documents:pending')}
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          {labels?.failed ?? t('documents:failed')}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
