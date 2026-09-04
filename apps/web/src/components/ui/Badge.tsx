import React from 'react';

export interface BadgeProps {
  variant?:
    | 'default'
    | 'in_stock'
    | 'low_stock'
    | 'out_of_stock'
    | 'accent'
    | 'emerald'
    | 'rose'
    | 'amber'
    | 'blue'
    | 'slate'
    | string;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

/**
 * Badge Component (Bevel-Elevated Design System)
 * Pill shaped with soft pastel backgrounds and vibrant dot indicators.
 */
export function Badge({
  children,
  variant = 'default',
  className = '',
  dot = false,
}: BadgeProps) {
  let colorStyles = 'bg-slate-50 text-slate-700 border-slate-200/80';
  let dotColor = 'bg-slate-400';

  if (variant === 'in_stock' || variant === 'emerald') {
    colorStyles = 'bg-emerald-50/90 text-emerald-700 border-emerald-200/70';
    dotColor = 'bg-emerald-500';
  } else if (variant === 'out_of_stock' || variant === 'rose') {
    colorStyles = 'bg-rose-50/90 text-rose-700 border-rose-200/70';
    dotColor = 'bg-rose-500';
  } else if (variant === 'low_stock' || variant === 'amber') {
    colorStyles = 'bg-amber-50/90 text-amber-700 border-amber-200/70';
    dotColor = 'bg-amber-500';
  } else if (variant === 'accent' || variant === 'blue') {
    colorStyles = 'bg-blue-50/90 text-blue-700 border-blue-200/70';
    dotColor = 'bg-blue-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorStyles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
}

