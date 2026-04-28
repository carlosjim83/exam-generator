'use client';

import { ReactNode } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingGridProps {
  columns?: number;
  rows?: number;
}

/**
 * Reusable loading grid with skeleton cards
 */
export function LoadingGrid({ columns = 3, rows = 1 }: LoadingGridProps) {
  const gridCols =
    columns === 1
      ? 'grid-cols-1'
      : columns === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <Card key={`loading-grid-${i}`}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
