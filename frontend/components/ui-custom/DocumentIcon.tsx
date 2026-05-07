'use client';

import { FileText, FileIcon } from 'lucide-react';

interface DocumentIconProps {
  mimeType: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: 'fileText' | 'fileIcon';
}

const containerSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function DocumentIcon({ mimeType, size = 'md', icon = 'fileText' }: DocumentIconProps) {
  const isPdf = mimeType === 'application/pdf';
  const containerClass = containerSizes[size];
  const iconClass = iconSizes[size];
  const Icon = icon === 'fileIcon' ? FileIcon : FileText;

  if (isPdf) {
    return (
      <div className={`flex ${containerClass} items-center justify-center rounded-lg bg-red-100`}>
        <svg className={`${iconClass} text-red-600`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex ${containerClass} items-center justify-center rounded-lg bg-blue-100`}>
      <Icon className={`${iconClass} text-blue-600`} />
    </div>
  );
}
