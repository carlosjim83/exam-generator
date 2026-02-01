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
  [key: string]: any;
}

export function SafeTranslation({
  children,
  as = 'span',
  className,
  ...props
}: SafeTranslationProps) {
  const Component = as;

  return (
    <Component className={className} suppressHydrationWarning {...props}>
      {children}
    </Component>
  );
}
