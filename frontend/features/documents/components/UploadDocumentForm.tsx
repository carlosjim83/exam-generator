'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiDocumentService, type UploadProgress } from '@/lib/services/api-document.service';
import { cn } from '@/lib/utils';

interface UploadDocumentFormProps {
  onUploadSuccess?: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function UploadDocumentForm({ onUploadSuccess }: UploadDocumentFormProps) {
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
      }, 1500);
    } catch (err) {
      setUploadStatus('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle('');
    setUploadStatus('idle');
    setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
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
    <div className="space-y-6">
      {/* Upload Area Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select Document</CardTitle>
          <CardDescription>
            Choose a PDF or DOCX file from your computer. Supported formats: PDF, DOCX • Max size:
            10 MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* File Drop Zone */}
          {!file && uploadStatus === 'idle' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-base font-medium mb-2">Drag & drop your document here</p>
              <p className="text-sm text-muted-foreground mb-4">or</p>
              <Button type="button" variant="secondary" size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
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
            <div className="border rounded-lg p-4 bg-accent/50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-base truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
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
            <div className="space-y-4">
              <div className="border rounded-lg p-6 bg-accent/30">
                <div className="flex items-center gap-4 mb-4">
                  <FileText className="h-12 w-12 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-base truncate">{file?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadProgress.loaded)} of{' '}
                      {formatFileSize(uploadProgress.total)}
                    </p>
                  </div>
                </div>
                <Progress value={uploadProgress.percentage} className="h-2" />
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  Uploading... {uploadProgress.percentage}%
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {uploadStatus === 'success' && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-8 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
              <p className="font-semibold text-lg text-green-900 mb-1">Upload successful!</p>
              <p className="text-sm text-green-700">Your document is being processed.</p>
            </div>
          )}

          {/* Error State */}
          {error && uploadStatus === 'error' && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-base text-red-900 mb-1">Upload failed</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {error && uploadStatus === 'idle' && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Details Card */}
      {file && uploadStatus === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>Provide additional information about your document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Biology Chapter 3"
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                If left empty, the filename will be used
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {uploadStatus === 'idle' && file && (
          <>
            <Button type="button" variant="outline" onClick={handleRemoveFile} size="lg">
              Cancel
            </Button>
            <Button type="button" onClick={handleUpload} disabled={!file || !!error} size="lg">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </>
        )}

        {uploadStatus === 'error' && (
          <>
            <Button type="button" variant="outline" onClick={handleReset} size="lg">
              Start Over
            </Button>
            <Button type="button" onClick={handleUpload} size="lg">
              <Upload className="h-4 w-4 mr-2" />
              Retry Upload
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
