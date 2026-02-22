/**
 * ClassList Component
 * Displays a list of classes with pagination
 */

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClassCard } from './ClassCard';
import type { ClassSummary } from '../types';

interface ClassListProps {
  classes?: ClassSummary[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function ClassList({ classes = [], loading = false, onRefresh }: ClassListProps) {
  const { t } = useTranslation('classes');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClasses = classes.filter(
    (classItem) =>
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-6 w-3/4 bg-muted rounded mb-2" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <h2 className="text-2xl font-bold">
          {t('classes:myClasses')} ({filteredClasses.length})
        </h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('classes:searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-muted p-4 rounded-full mb-4">
            <Code className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {searchTerm ? t('classes:noResults') : t('classes:noClasses')}
          </h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {searchTerm ? t('classes:noSearchResults') : t('classes:createFirstClassDescription')}
          </p>
          {!searchTerm && (
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {t('classes:createClass')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredClasses.map((classItem) => (
            <ClassCard key={classItem.id} classData={classItem} />
          ))}
        </div>
      )}
    </div>
  );
}
