'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateInvitationsResponse } from '../services/classes-api';

interface InviteStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (emails: string[]) => Promise<CreateInvitationsResponse>;
  onUploadCsv?: (file: File) => Promise<void>;
}

export function InviteStudentsDialog({
  open,
  onOpenChange,
  onInvite,
  onUploadCsv,
}: InviteStudentsDialogProps) {
  const { t } = useTranslation('classes');
  const [emailsText, setEmailsText] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    const emails = emailsText
      .split('\n')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      toast.error(t('inviteStudents.errors.atLeastOne'));
      return;
    }

    if (emails.length > 50) {
      toast.error(t('inviteStudents.errors.max50'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter((e) => !emailRegex.test(e));

    if (invalidEmails.length > 0) {
      toast.error(
        `${t('inviteStudents.errors.invalidEmails')}: ${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onInvite(emails);
      toast.success(
        t('inviteStudents.success.invitationsSent', { count: emails.length })
      );
      setEmailsText('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to send invitations:', error);
      toast.error(t('inviteStudents.errors.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error(t('inviteStudents.errors.csvFormat'));
      return;
    }

    setCsvFile(file);
    setIsUploading(true);
    try {
      await onUploadCsv?.(file);
      toast.success(t('inviteStudents.success.csvImported'));
      setCsvFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to import CSV:', error);
      toast.error(t('inviteStudents.errors.csvFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const removeCsvFile = () => {
    setCsvFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('inviteStudents.title')}</DialogTitle>
          <DialogDescription>
            {t('inviteStudents.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {csvFile ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{csvFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(csvFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={removeCsvFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="emails">{t('inviteStudents.emailLabel')}</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('inviteStudents.emailHint')}
                </p>
                <Textarea
                  id="emails"
                  placeholder={t('inviteStudents.emailPlaceholder')}
                  value={emailsText}
                  onChange={(e) => setEmailsText(e.target.value)}
                  rows={6}
                  disabled={isSubmitting}
                />
              </div>

              {onUploadCsv && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">{t('inviteStudents.or')}</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="csv-upload">{t('inviteStudents.csvLabel')}</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('inviteStudents.csvHint')}
                    </p>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      disabled={isUploading}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isUploading}
          >
            {t('inviteStudents.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading || (emailsText.length === 0 && !csvFile)}
          >
            {isSubmitting ? t('inviteStudents.sending') : t('inviteStudents.sendButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
