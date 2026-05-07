import React from 'react';

/**
 * SafeTranslation Component
 *
 * Wrapper for translated text to prevent hydration mismatches.
 * Use this when rendering translated content that might differ between server and client.
 */

interface SafeTranslationProps {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}

export function SafeTranslation({ children, as, className }: SafeTranslationProps) {
  if (!as && !className) {
    return <>{children}</>;
  }

  const Component = as || 'span';

  return (
    <Component className={className} suppressHydrationWarning>
      {children}
    </Component>
  );
}
