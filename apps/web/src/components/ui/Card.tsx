import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'bevel' | 'default' | 'glass';
}

/**
  * Card Component (Bevel-Elevated Design System)
  * Features 24px soft rounded corners, hairline border, and gentle ambient diffusion.
  */
export function Card({
  className = '',
  variant = 'bevel',
  children,
  ...props
}: CardProps) {
  let baseStyles = 'bg-white rounded-3xl border border-slate-100/90 shadow-bevel transition-all duration-200';
  if (variant === 'glass') {
    baseStyles = 'bevel-glass-dock rounded-3xl';
  } else if (variant === 'default') {
    baseStyles = 'bg-stocky-bg-widget rounded-widget border border-stocky-border-subtle';
  }

  return (
    <div
      className={`${baseStyles} p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

