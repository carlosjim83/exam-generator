/**
 * ClassCard Component
 * Displays a single class card with basic information
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clipboard, Users, Calendar, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { ClassSummary } from '../types';

interface ClassCardProps {
  classData: ClassSummary;
}

export function ClassCard({ classData }: ClassCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{classData.name}</CardTitle>
            <CardDescription className="mt-1">
              {classData.description || 'No description'}
            </CardDescription>
          </div>
          {classData.color && (
            <div
              className="h-8 w-8 rounded-full border-2 border-border"
              style={{ backgroundColor: classData.color }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Code className="h-4 w-4" />
          <span className="font-mono bg-muted px-2 py-1 rounded">{classData.code}</span>
          <span className="text-xs">(Code)</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{classData.studentCount} students</span>
        </div>

        <div className="pt-4 flex items-center gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/dashboard/classes/${classData.id}`}>
              <Clipboard className="h-4 w-4 mr-2" />
              Manage
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
