'use client';

import { Upload, Wand2, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Quick Actions</h2>

      {/* Primary Actions - Large Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upload Document Card */}
        <Link href="/dashboard/upload" className="group block">
          <div className="relative h-48 overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 p-6 transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:scale-[1.02]">
            {/* Background decoration */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-300/20 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-3.5 shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Upload className="h-7 w-7 text-white" />
                </div>
                <Sparkles className="h-6 w-6 text-blue-500 opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:rotate-12" />
              </div>

              <div>
                <h3 className="mb-2 text-2xl font-bold text-blue-900 transition-colors group-hover:text-blue-700">
                  Upload Document
                </h3>
                <p className="mb-3 text-sm leading-relaxed text-blue-700">
                  Add PDF, DOCX, or TXT files to your library
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <span>Get started</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Generate Exam Card */}
        <Link href="/dashboard/exams/generate" className="group block">
          <div className="relative h-48 overflow-hidden rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 p-6 transition-all duration-300 hover:border-purple-400 hover:shadow-xl hover:scale-[1.02]">
            {/* Background decoration */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-300/20 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-purple-400/20 blur-3xl" />

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 p-3.5 shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Wand2 className="h-7 w-7 text-white" />
                </div>
                <Sparkles className="h-6 w-6 text-purple-500 opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:rotate-12" />
              </div>

              <div>
                <h3 className="mb-2 text-2xl font-bold text-purple-900 transition-colors group-hover:text-purple-700">
                  Generate Exam
                </h3>
                <p className="mb-3 text-sm leading-relaxed text-purple-700">
                  Create AI-powered exams from your documents
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <span>Start creating</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
