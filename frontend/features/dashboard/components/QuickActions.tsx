'use client';

import { Button } from '@/components/ui/button';
import { Upload, Wand2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Quick Actions</h2>

      {/* Primary Actions - Large Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upload Document Card */}
        <Link href="/dashboard/upload" className="block group">
          <div className="relative h-40 overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 transition-all hover:border-blue-400 hover:shadow-lg">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-blue-600 p-3 shadow-md">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <Sparkles className="h-5 w-5 text-blue-400 opacity-50" />
              </div>
              <div>
                <h3 className="mb-1 text-xl font-bold text-blue-900">Upload Document</h3>
                <p className="text-sm text-blue-700">Add PDF, DOCX, or TXT files to your library</p>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-blue-200/50 blur-2xl" />
          </div>
        </Link>

        {/* Generate Exam Card */}
        <Link href="/dashboard/exams/generate" className="block group">
          <div className="relative h-40 overflow-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 transition-all hover:border-purple-400 hover:shadow-lg">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-purple-600 p-3 shadow-md">
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
                <Sparkles className="h-5 w-5 text-purple-400 opacity-50" />
              </div>
              <div>
                <h3 className="mb-1 text-xl font-bold text-purple-900">Generate Exam</h3>
                <p className="text-sm text-purple-700">
                  Create AI-powered exams from your documents
                </p>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-purple-200/50 blur-2xl" />
          </div>
        </Link>
      </div>
    </div>
  );
}
