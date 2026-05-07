'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { assignExamToClass, type AssignExamRequest } from '@/lib/services/api-class-exams.service';

interface AvailableExam {
  id: string;
  title: string;
  questionCount: number;
  createdAt: string;
}

interface AssignExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  onAssigned: () => void;
}

export function AssignExamModal({ open, onOpenChange, classId, onAssigned }: AssignExamModalProps) {
  const { t, i18n } = useTranslation('classes');
  const [exams, setExams] = useState<AvailableExam[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Settings
  const [availableAt, setAvailableAt] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [timeLimit, setTimeLimit] = useState<string>('');
  const [maxAttempts, setMaxAttempts] = useState<string>('1');
  const [showResults, setShowResults] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      loadExams();
      resetForm();
    }
  }, [open, classId]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ exams: AvailableExam[] }>('/api/exams');
      setExams(response.exams || []);
    } catch (error) {
      console.error('Failed to load exams:', error);
      toast.error(t('assignExamModal.errors.examLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedExamId(null);
    setAvailableAt('');
    setDueDate('');
    setTimeLimit('');
    setMaxAttempts('1');
    setShowResults(false);
  };

  const handleSubmit = async () => {
    if (!selectedExamId) {
      toast.error(t('assignExamModal.errors.noExamSelected'));
      return;
    }

    setSubmitting(true);
    try {
      // Convert datetime-local to ISO 8601 format
      // datetime-local returns: "2026-03-10T09:00"
      // Backend expects: "2026-03-10T09:00:00.000Z" (ISO 8601)
      const toISOString = (localDateTime: string): string | null => {
        if (!localDateTime) return null;
        // Append seconds and timezone if missing
        const date = new Date(localDateTime);
        return date.toISOString();
      };

      const data: AssignExamRequest = {
        examId: selectedExamId,
        availableAt: toISOString(availableAt),
        dueDate: toISOString(dueDate),
        timeLimit: timeLimit ? parseInt(timeLimit, 10) : null,
        maxAttempts: parseInt(maxAttempts, 10) || 1,
        showResultsImmediately: showResults,
      };

      await assignExamToClass(classId, data);
      toast.success(t('assignExamModal.success.assigned'));
      onOpenChange(false);
      onAssigned();
    } catch (error) {
      console.error('Failed to assign exam:', error);
      toast.error(t('assignExamModal.errors.assignFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('assignExamModal.title')}</DialogTitle>
          <DialogDescription>{t('assignExamModal.selectExamHint')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Exam Selection */}
          <div className="space-y-2">
            <Label>{t('assignExamModal.selectExam')}</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('assignExamModal.noExams')}</p>
                <p className="text-xs mt-1">{t('assignExamModal.noExamsHint')}</p>
              </div>
            ) : (
              <div className="h-48 rounded-md border overflow-y-auto">
                <div className="p-2 space-y-1">
                  {exams.map((exam) => (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => setSelectedExamId(exam.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedExamId === exam.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      } border`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{exam.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {exam.questionCount}{' '}
                            {t('classExams.questions', { count: exam.questionCount })}
                          </p>
                        </div>
                        {selectedExamId === exam.id && (
                          <Badge variant="default" className="shrink-0">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <Label className="text-base">{t('assignExamModal.settings')}</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availableAt">{t('assignExamModal.availableFrom')}</Label>
                <Input
                  id="availableAt"
                  type="datetime-local"
                  value={availableAt}
                  onChange={(e) => setAvailableAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('assignExamModal.availableFromHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">{t('assignExamModal.dueDate')}</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t('assignExamModal.dueDateHint')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeLimit">{t('assignExamModal.timeLimit')}</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="0"
                  placeholder="60"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('assignExamModal.timeLimitHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAttempts">{t('assignExamModal.maxAttempts')}</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  max="10"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('assignExamModal.maxAttemptsHint')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showResults"
                checked={showResults}
                onChange={(e) => setShowResults(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="showResults"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('assignExamModal.showResults')}
                </label>
                <p className="text-xs text-muted-foreground">
                  {t('assignExamModal.showResultsHint')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('assignExamModal.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedExamId}>
            {submitting ? t('assignExamModal.assigning') : t('assignExamModal.assignButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
