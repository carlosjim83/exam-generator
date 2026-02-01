import { ExamGenerationWizard } from '@/features/exams/components/ExamGenerationWizard';

export default function GenerateExamPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Generate New Exam</h1>
          <p className="text-gray-600 mt-1">Create AI-powered exam questions from your documents</p>
        </div>
      </div>
      <div className="py-6">
        <ExamGenerationWizard />
      </div>
    </div>
  );
}
