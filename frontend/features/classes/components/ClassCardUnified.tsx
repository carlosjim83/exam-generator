'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, ClipboardList, ArrowRight } from 'lucide-react';

export interface ClassCardData {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  color?: string | null;
  studentCount: number;
  documentCount?: number;
  examCount?: number;
}

interface ClassCardProps {
  classData: ClassCardData;
  href: string;
  actionLabel: string;
  role: 'teacher' | 'student';
}

export function ClassCard({ classData, href, actionLabel, role }: ClassCardProps) {
  const { t } = useTranslation('classes');

  const initials = classData.name
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const bgColor = classData.color || '#6366f1';

  return (
    <Card className="group transition-all duration-200 hover:shadow-lg hover:border-primary/20 h-full flex flex-col">
      <CardContent className="p-0 flex flex-col flex-1">
        {/* Header with avatar and name */}
        <div className="flex items-start gap-4 p-5 pb-4">
          <div
            className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
            style={{ backgroundColor: bgColor }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight truncate">{classData.name}</h3>
            <Badge variant="secondary" className="font-mono text-xs mt-1.5">
              {classData.code}
            </Badge>
          </div>
        </div>

        {/* Description */}
        {classData.description && (
          <div className="px-5 pb-4">
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {classData.description}
            </p>
          </div>
        )}

        {/* Stats - wrapped layout for better responsiveness */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 bg-muted/30 border-t border-b mt-auto">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold">{classData.studentCount}</span>
            <span className="text-muted-foreground">
              {t('classCard.students', { count: classData.studentCount })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold">{classData.documentCount ?? 0}</span>
            <span className="text-muted-foreground">
              {t('classCard.documents', { count: classData.documentCount ?? 0 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <ClipboardList className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold">{classData.examCount ?? 0}</span>
            <span className="text-muted-foreground">
              {t('classCard.exams', { count: classData.examCount ?? 0 })}
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="p-4">
          <Button asChild className="w-full">
            <Link href={href}>
              {actionLabel}
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
