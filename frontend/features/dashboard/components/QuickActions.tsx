'use client';

import { Upload, Wand2 } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Quick Actions</h2>

      {/* Primary Actions - Compact Stacked Cards */}
      <div className="space-y-3">
        {/* Upload Document Card */}
        <Link href="/dashboard/upload" className="group block">
          <div className="relative overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:scale-[1.02]">
            {/* Background decoration */}
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-300/20 blur-2xl" />

            <div className="relative flex items-center gap-3">
              <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 shadow-md transition-transform duration-300 group-hover:scale-110">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="mb-0.5 text-base font-bold text-blue-900 transition-colors group-hover:text-blue-700">
                  Upload Document
                </h3>
                <p className="text-xs text-blue-700">Add PDF, DOCX, or TXT</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Generate Exam Card */}
        <Link href="/dashboard/exams/generate" className="group block">
          <div className="relative overflow-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 transition-all duration-300 hover:border-purple-400 hover:shadow-lg hover:scale-[1.02]">
            {/* Background decoration */}
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-purple-300/20 blur-2xl" />

            <div className="relative flex items-center gap-3">
              <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 p-2.5 shadow-md transition-transform duration-300 group-hover:scale-110">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="mb-0.5 text-base font-bold text-purple-900 transition-colors group-hover:text-purple-700">
                  Generate Exam
                </h3>
                <p className="text-xs text-purple-700">Create AI-powered exams</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
