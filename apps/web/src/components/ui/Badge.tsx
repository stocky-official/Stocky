import React from 'react';

export interface BadgeProps {
  variant?: 'default' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'accent' | string;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

/**
 * Badge Component (v0.1.0 Design System)
 * 12px roundness, smooth soft border, NO shadow.
 */
export function Badge({
  children,
  className = '',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-widget text-xs font-normal bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-stocky-accent" />}
      {children}
    </span>
  );
}
