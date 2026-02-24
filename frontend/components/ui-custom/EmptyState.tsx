'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
}

/**
 * Reusable empty state component
 */
export function EmptyState({
  icon = <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      {icon}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </Card>
  );
}
