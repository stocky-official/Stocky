import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card Component (v0.1.0 Design System)
 * Surface Rule: #FFFFFF background, 12px border radius, smooth subtle border, NO shadows.
 */
export function Card({
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-stocky-bg-widget rounded-widget border border-stocky-border-subtle p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
