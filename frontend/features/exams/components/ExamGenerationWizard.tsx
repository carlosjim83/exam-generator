/**
 * ExamGenerationWizard
 *
 * Multi-step wizard for generating exams from documents
 *
 * Steps:
 * 1. Select Documents (multi-select from user's completed documents)
 * 2. Configure Exam (title, description, questions, difficulty, types)
 * 3. Review & Generate
 * 4. View Results
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { documentService } from '@/lib/services/api-document.service';
import {
  examService,
  type QuestionType,
  type Difficulty,
  type ExamResponse,
} from '@/lib/services/api-exam.service';
import type { Document } from '@/lib/types/dashboard.types';
import {
  WizardProgress,
  ErrorDisplay,
  StepSelectDocuments,
  StepConfigureExam,
  StepReview,
  StepResults,
  WizardNavigation,
} from './ExamGenerationWizardSteps';

type WizardStep = 1 | 2 | 3 | 4;

interface ExamConfig {
  documentIds: string[];
  title: string;
  description: string;
  numQuestions: number;
  difficulty: Difficulty;
  questionTypes: QuestionType[];
}

export function ExamGenerationWizard() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<ExamResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<ExamConfig>({
    documentIds: [],
    title: '',
    description: '',
    numQuestions: 10,
    difficulty: 'MIXED',
    questionTypes: ['MULTIPLE_CHOICE'],
  });

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const docs = await documentService.listDocuments();
      const docsArray = Array.isArray(docs) ? docs : [];
      setAllDocuments(docsArray);
      const completedDocs = docsArray.filter((d) => d.status === 'COMPLETED');
      setDocuments(completedDocs);
    } catch {
      setError(t('examGeneration.failedToLoadDocuments'));
    } finally {
      setLoadingDocuments(false);
    }
  };

  const toggleDocument = (docId: string) => {
    setConfig((prev) => ({
      ...prev,
      documentIds: prev.documentIds.includes(docId)
        ? prev.documentIds.filter((id) => id !== docId)
        : [...prev.documentIds, docId],
    }));
  };

  const canProceedFromStep1 = config.documentIds.length >= 1 && config.documentIds.length <= 10;
  const canProceedFromStep2 = config.title.trim().length > 0 && config.questionTypes.length > 0;

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);

      const result = await examService.generateExam(config);
      setGeneratedExam(result);
      setCurrentStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('generate:generateError'));
    } finally {
      setGenerating(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setConfig({
      documentIds: [],
      title: '',
      description: '',
      numQuestions: 10,
      difficulty: 'MIXED',
      questionTypes: ['MULTIPLE_CHOICE'],
    });
    setGeneratedExam(null);
    setError(null);
  };

  const handleViewExam = (examId: string) => {
    router.push(`/dashboard/exams/${examId}`);
  };

  return (
    <div className="space-y-6">
      <WizardProgress currentStep={currentStep} />
      <ErrorDisplay error={error} />

      {currentStep === 1 && (
        <StepSelectDocuments
          documents={documents}
          allDocuments={allDocuments}
          loadingDocuments={loadingDocuments}
          config={config}
          onToggleDocument={toggleDocument}
        />
      )}

      {currentStep === 2 && <StepConfigureExam config={config} onConfigChange={setConfig} />}

      {currentStep === 3 && <StepReview documents={documents} config={config} />}

      {currentStep === 4 && (
        <StepResults
          generating={generating}
          generatedExam={generatedExam}
          onStartOver={handleStartOver}
          onViewExam={handleViewExam}
        />
      )}

      <WizardNavigation
        currentStep={currentStep}
        generating={generating}
        canProceedFromStep1={canProceedFromStep1}
        canProceedFromStep2={canProceedFromStep2}
        onBack={handleBack}
        onNext={handleNext}
        onGenerate={handleGenerate}
      />
    </div>
  );
}
