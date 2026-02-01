'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Wand2, FolderOpen, Users, Lightbulb } from 'lucide-react';
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

        <Button variant="outline" className="w-full justify-start gap-3 h-11">
          <Users className="h-4 w-4" />
          Manage Student Groups
        </Button>
      </div>

      {/* Pro Tip Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-white/20">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">PRO TIP</h3>
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-4 text-blue-50">
            You can now import question banks directly from Google Classroom using the new
            integration tool.
          </p>

          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-blue-600 hover:bg-white/90"
          >
            Learn more
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
