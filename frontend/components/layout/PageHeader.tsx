import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  showBackButton = true,
  backHref = '/dashboard',
  backLabel = 'Back to Dashboard',
  children,
}: PageHeaderProps) {
  return (
    <div className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {showBackButton && (
          <div className="mb-2">
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            </Link>
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-gray-600 mt-1">{description}</p>}
          </div>
          {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
      </div>
    </div>
  );
}
