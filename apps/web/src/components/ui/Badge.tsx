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
  let colorStyles = 'bg-stocky-bg-subtle text-stocky-text-sub border-stocky-border-subtle';
  let dotColor = 'bg-stocky-text-main';

  if (variant === 'in_stock' || variant === 'emerald') {
    colorStyles = 'bg-stocky-status-success-bg text-stocky-status-success-fg border-stocky-status-success-border';
    dotColor = 'bg-stocky-status-success-fg';
  } else if (variant === 'out_of_stock' || variant === 'rose') {
    colorStyles = 'bg-stocky-status-critical-bg text-stocky-status-critical-fg border-stocky-status-critical-border';
    dotColor = 'bg-stocky-status-critical-fg';
  } else if (variant === 'low_stock' || variant === 'amber') {
    colorStyles = 'bg-stocky-status-warning-bg text-stocky-status-warning-fg border-stocky-status-warning-border';
    dotColor = 'bg-stocky-status-warning-fg';
  } else if (variant === 'accent' || variant === 'blue') {
    colorStyles = 'bg-stocky-status-info-bg text-stocky-status-info-fg border-stocky-status-info-border';
    dotColor = 'bg-stocky-status-info-fg';
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

