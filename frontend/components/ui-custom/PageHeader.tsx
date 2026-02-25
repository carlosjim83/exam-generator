'use client';

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  name?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, name, action }: PageHeaderProps) {
  const formattedSubtitle = name && subtitle ? subtitle.replace('{{name}}', name) : subtitle;

  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">{title}</h1>
        {formattedSubtitle && <p className="text-muted-foreground">{formattedSubtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
