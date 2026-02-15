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
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Settings,
  Eye,
  Sparkles,
  AlertCircle,
  Upload,
  Home,
} from 'lucide-react';
import { ApiDocumentService } from '@/lib/services/api-document.service';
import {
  ApiExamService,
  type QuestionType,
  type Difficulty,
} from '@/lib/services/api-exam.service';
import type { Document } from '@/lib/types/dashboard.types';
import Link from 'next/link';

type WizardStep = 1 | 2 | 3 | 4;

interface ExamConfig {
  documentIds: string[];
  title: string;
  description: string;
  numQuestions: number;
  difficulty: Difficulty;
  questionTypes: QuestionType[];
}

const documentService = new ApiDocumentService();
const examService = new ApiExamService();

export function ExamGenerationWizard() {
  const { t } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]); // Track all docs for better messaging
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<any>(null);
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
      // Ensure docs is an array and only show COMPLETED documents
      const docsArray = Array.isArray(docs) ? docs : [];
      setAllDocuments(docsArray); // Store all documents
      const completedDocs = docsArray.filter((d) => d.status === 'COMPLETED');
      setDocuments(completedDocs);
    } catch (err) {
      console.error('Failed to load documents:', err);
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

  const toggleQuestionType = (type: QuestionType) => {
    setConfig((prev) => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type)
        ? prev.questionTypes.filter((t) => t !== type)
        : [...prev.questionTypes, type],
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
    } catch (err: any) {
      setError(err.message || 'Failed to generate exam');
      console.error('Exam generation failed:', err);
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

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{t('generate:stepOf', { current: currentStep, total: 4 })}</span>
          <span>
            {t('generate:percentComplete', { percent: Math.round((currentStep / 4) * 100) })}
          </span>
        </div>
        <Progress value={(currentStep / 4) * 100} className="h-2" />

        <div className="flex justify-between mt-4">
          {[
            { num: 1, label: t('generate:selectDocuments'), icon: FileText },
            { num: 2, label: t('generate:configure'), icon: Settings },
            { num: 3, label: t('generate:review'), icon: Eye },
            { num: 4, label: t('generate:generate'), icon: Sparkles },
          ].map((step) => (
            <div
              key={step.num}
              className={`flex items-center gap-2 ${
                currentStep >= step.num ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  currentStep >= step.num ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                }`}
              >
                {currentStep > step.num ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Select Documents */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('generate:step1Title')}
            </CardTitle>
            <CardDescription>{t('generate:step1Description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDocuments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                {allDocuments.length === 0 ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('generate:noDocumentsUploaded')}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {t('generate:noDocumentsUploadedDescription')}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('generate:documentsProcessing')}
                    </h3>
                    <p className="text-gray-600 mb-2 max-w-md mx-auto">
                      {t('generate:documentsProcessingDescription', { count: allDocuments.length })}
                    </p>
                    <p className="text-sm text-gray-500 mb-6">{t('generate:processingNote')}</p>
                  </>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/dashboard">
                    <Button variant="outline" className="gap-2">
                      <Home className="h-4 w-4" />
                      {t('generate:backToDashboard')}
                    </Button>
                  </Link>
                  {allDocuments.length === 0 && (
                    <Link href="/dashboard/upload">
                      <Button className="gap-2">
                        <Upload className="h-4 w-4" />
                        {t('generate:uploadDocuments')}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <label
                      key={doc.id}
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        config.documentIds.includes(doc.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={config.documentIds.includes(doc.id)}
                        onChange={() => toggleDocument(doc.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <FileCheck className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-gray-500">{doc.filename}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>
                          {doc.pageCount || 0} {t('generate:pages')}
                        </p>
                        <p>
                          {doc.wordCount?.toLocaleString() || 0} {t('generate:words')}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={config.documentIds.length > 10 ? 'destructive' : 'default'}>
                    {config.documentIds.length} {t('generate:selected')}
                  </Badge>
                  <span className="text-gray-500">
                    {config.documentIds.length === 0 && t('generate:selectAtLeast')}
                    {config.documentIds.length > 0 &&
                      config.documentIds.length <= 10 &&
                      t('generate:validSelection')}
                    {config.documentIds.length > 10 && t('generate:maxDocuments')}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configure Exam */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('generate:step2Title')}
            </CardTitle>
            <CardDescription>{t('generate:step2Description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">{t('generate:examTitle')}</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder={t('generate:examTitlePlaceholder')}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('generate:description')}</Label>
              <Textarea
                id="description"
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder={t('generate:descriptionPlaceholder')}
                maxLength={1000}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numQuestions">{t('generate:numberOfQuestions')}</Label>
                <Input
                  id="numQuestions"
                  type="number"
                  min={5}
                  max={50}
                  value={config.numQuestions}
                  onChange={(e) =>
                    setConfig({ ...config, numQuestions: parseInt(e.target.value) || 10 })
                  }
                />
                <p className="text-xs text-gray-500">{t('generate:questionsRange')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">{t('generate:difficultyLevel')}</Label>
                <select
                  id="difficulty"
                  value={config.difficulty}
                  onChange={(e) =>
                    setConfig({ ...config, difficulty: e.target.value as Difficulty })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="EASY">{t('generate:easy')}</option>
                  <option value="MEDIUM">{t('generate:medium')}</option>
                  <option value="HARD">{t('generate:hard')}</option>
                  <option value="MIXED">{t('generate:mixed')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t('generate:questionTypes')}</Label>
              <div className="space-y-2">
                {[
                  { value: 'MULTIPLE_CHOICE', label: t('generate:multipleChoice') },
                  { value: 'TRUE_FALSE', label: t('generate:trueFalse') },
                  { value: 'SHORT_ANSWER', label: t('generate:shortAnswer') },
                ].map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={config.questionTypes.includes(type.value as QuestionType)}
                      onChange={() => toggleQuestionType(type.value as QuestionType)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
              {config.questionTypes.length === 0 && (
                <p className="text-sm text-red-500">{t('generate:selectOneQuestionType')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('generate:step3Title')}
            </CardTitle>
            <CardDescription>{t('generate:step3Description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('generate:selectedDocuments')}</h3>
                <div className="space-y-1">
                  {documents
                    .filter((d) => config.documentIds.includes(d.id))
                    .map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm">
                        <FileCheck className="h-4 w-4 text-green-600" />
                        <span>{doc.title}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">{t('generate:examDetails')}</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">{t('generate:titleLabel')}</dt>
                    <dd className="font-medium">{config.title}</dd>
                  </div>
                  {config.description && (
                    <div className="col-span-2">
                      <dt className="text-gray-500">{t('generate:descriptionLabel')}</dt>
                      <dd className="font-medium">{config.description}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500">{t('generate:questionsLabel')}</dt>
                    <dd className="font-medium">{config.numQuestions}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">{t('generate:difficultyLabel')}</dt>
                    <dd className="font-medium">{config.difficulty}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-gray-500">{t('generate:questionTypesLabel')}</dt>
                    <dd className="font-medium flex gap-2 mt-1">
                      {config.questionTypes.map((type) => (
                        <Badge key={type} variant="outline">
                          {type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>{t('generate:noteLabel')}</strong> {t('generate:generationNote')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              {generating ? t('generate:generatingExam') : t('generate:examGeneratedSuccess')}
            </CardTitle>
            <CardDescription>
              {generating
                ? t('generate:generatingMessage')
                : t('generate:generatedIn', {
                    count: generatedExam?.questions?.length || 0,
                    time: ((generatedExam?.generationTimeMs || 0) / 1000).toFixed(1),
                  })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">{t('generate:analyzingDocuments')}</p>
                <p className="text-sm text-gray-500 mt-2">{t('generate:mayTakeMinute')}</p>
              </div>
            ) : generatedExam ? (
              <div className="space-y-6">
                {/* Exam Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{t('generate:questionsLabel')}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {generatedExam.exam.questionCount}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{t('generate:selectDocuments')}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {generatedExam.exam.documentCount}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{t('generate:generate')}</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {((generatedExam.generationTimeMs || 0) / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>

                {/* Questions Preview */}
                <div>
                  <h3 className="font-semibold mb-3">{t('generate:questionsPreview')}</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {generatedExam.questions.slice(0, 5).map((q: any, i: number) => (
                      <div key={q.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline">{i + 1}</Badge>
                          <div className="flex-1">
                            <p className="font-medium mb-2">{q.questionText}</p>
                            {q.type === 'MULTIPLE_CHOICE' && q.options && (
                              <ul className="space-y-1 text-sm text-gray-600">
                                {q.options.map((opt: string, j: number) => (
                                  <li
                                    key={j}
                                    className={
                                      opt === q.correctAnswer ? 'text-green-600 font-medium' : ''
                                    }
                                  >
                                    {String.fromCharCode(65 + j)}. {opt}
                                    {opt === q.correctAnswer && ' ✓'}
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary">{q.type.replace('_', ' ')}</Badge>
                              <Badge variant="secondary">{q.difficulty}</Badge>
                              <Badge variant="secondary">
                                {q.points} {t('generate:pts')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {generatedExam.questions.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        {t('generate:andMore', { count: generatedExam.questions.length - 5 })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={handleStartOver} variant="outline" className="flex-1">
                    {t('generate:generateAnotherExam')}
                  </Button>
                  <Button
                    onClick={() => {
                      // TODO: Navigate to exam details page
                      window.location.href = `/dashboard/exams/${generatedExam.exam.id}`;
                    }}
                    className="flex-1"
                  >
                    {t('generate:viewFullExam')}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('generate:back')}
          </Button>

          {currentStep === 3 ? (
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('generate:generating')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('generate:generateExam')}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !canProceedFromStep1) ||
                (currentStep === 2 && !canProceedFromStep2)
              }
            >
              {t('generate:next')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
