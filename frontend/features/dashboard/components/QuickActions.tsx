'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Wand2, FolderOpen } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Quick Actions</h2>

      {/* Primary Actions */}
      <div className="space-y-3">
        <Link href="/dashboard/upload" className="block">
          <Button className="w-full justify-start gap-3 h-12" size="lg">
            <Upload className="h-5 w-5" />
            Upload Document
          </Button>
        </Link>

        <Link href="/dashboard/exams/generate" className="block">
          <Button variant="secondary" className="w-full justify-start gap-3 h-12" size="lg">
            <Wand2 className="h-5 w-5" />
            Generate Exam
          </Button>
        </Link>

        <Link href="/dashboard/exams" className="block">
          <Button variant="outline" className="w-full justify-start gap-3 h-11">
            <FolderOpen className="h-4 w-4" />
            My Exams
          </Button>
        </Link>

        <Link href="/dashboard/documents" className="block">
          <Button variant="outline" className="w-full justify-start gap-3 h-11">
            <FolderOpen className="h-4 w-4" />
            My Library
          </Button>
        </Link>
      </div>
    </div>
  );
}
