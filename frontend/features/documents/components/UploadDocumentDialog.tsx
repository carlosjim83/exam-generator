'use client';

import { useState, useCallback, useRef } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiDocumentService, type UploadProgress } from '@/lib/services/api-document.service';
import { cn } from '@/lib/utils';

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onUploadSuccess,
}: UploadDocumentDialogProps) {
  const { t } = useTranslation('common');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentService = useRef(new ApiDocumentService()).current;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only PDF and DOCX files are allowed.';
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'File size exceeds 10MB limit.';
    }

    return null;
  };

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        const validationError = validateFile(droppedFile);
        if (validationError) {
          setError(validationError);
          return;
        }

        setFile(droppedFile);
        setError(null);
        // Auto-generate title from filename if empty
        if (!title) {
          const fileName = droppedFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
          setTitle(fileName);
        }
      }
    },
    [title]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      setFile(selectedFile);
      setError(null);
      // Auto-generate title from filename if empty
      if (!title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setTitle(fileName);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploadStatus('uploading');
      setError(null);

      await documentService.uploadDocument({ file, title: title || undefined }, (progress) => {
        setUploadProgress(progress);
      });

      setUploadStatus('success');

      // Call success callback after a short delay to show success state
      setTimeout(() => {
        onUploadSuccess?.();
        handleClose();
      }, 1500);
    } catch (err) {
      setUploadStatus('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleClose = () => {
    if (uploadStatus === 'uploading') return; // Prevent closing during upload

    setFile(null);
    setTitle('');
    setUploadStatus('idle');
    setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
    setError(null);
    setIsDragging(false);
    onOpenChange(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t('upload.uploadDocument')}</DialogTitle>
          <DialogDescription>{t('upload.uploadDocumentDescription')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* File Drop Zone */}
          {!file && uploadStatus === 'idle' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">{t('upload.dragDrop')}</p>
              <p className="text-xs text-muted-foreground mb-4">{t('common.or')}</p>
              <Button type="button" variant="secondary" size="sm">
                {t('upload.chooseFile')}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">{t('upload.supportedFormats')}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Selected File Display */}
          {file && uploadStatus === 'idle' && (
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadStatus === 'uploading' && (
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-10 w-10 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadProgress.loaded)} of{' '}
                      {formatFileSize(uploadProgress.total)}
                    </p>
                  </div>
                </div>
                <Progress value={uploadProgress.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {t('upload.uploading')} {uploadProgress.percentage}%
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {uploadStatus === 'success' && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p className="font-medium text-sm text-green-900">{t('upload.uploadSuccessful')}</p>
              <p className="text-xs text-green-700 mt-1">{t('upload.uploadProcessing')}</p>
            </div>
          )}

          {/* Error State */}
          {error && uploadStatus === 'error' && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-red-900">{t('upload.uploadFailed')}</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Title Input */}
          {file && uploadStatus === 'idle' && (
            <div className="space-y-2">
              <Label htmlFor="title">{t('upload.documentTitle')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('upload.titlePlaceholder')}
              />
              <p className="text-xs text-muted-foreground">{t('upload.titleHint')}</p>
            </div>
          )}

          {/* Validation Error */}
          {error && uploadStatus === 'idle' && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {uploadStatus === 'idle' && (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('cancel')}
              </Button>
              <Button type="button" onClick={handleUpload} disabled={!file || !!error}>
                <Upload className="h-4 w-4 mr-2" />
                {t('upload.uploadButton')}
              </Button>
            </>
          )}

          {uploadStatus === 'error' && (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('close')}
              </Button>
              <Button type="button" onClick={handleUpload}>
                {t('upload.retryButton')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
