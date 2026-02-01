/**
 * DeleteExamDialog Component
 *
 * Modern confirmation dialog for deleting exams
 * Features:
 * - Accessible AlertDialog from shadcn/ui
 * - Shows exam title in confirmation message
 * - Warning text about irreversibility
 * - Loading state during deletion
 * - Fully translated (EN/ES)
 */

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

interface DeleteExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  examTitle: string;
  isDeleting?: boolean;
}

export function DeleteExamDialog({
  open,
  onOpenChange,
  onConfirm,
  examTitle,
  isDeleting = false,
}: DeleteExamDialogProps) {
  const { t } = useTranslation('exams');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">{t('deleteConfirmDescription', { title: examTitle })}</span>
            <span className="block text-destructive font-medium">{t('deleteConfirmWarning')}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? t('deleting') : t('deleteButton')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
