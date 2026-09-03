import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Button Component (v0.1.0 Design System)
 * Primary: #0057FF background, 12px radius, weight 500, NO shadows.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-widget transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-stocky-primary/20 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  }[size];

  const variants = {
    primary:
      'bg-stocky-primary text-white hover:bg-stocky-primary-hover',
    secondary:
      'bg-stocky-bg-global text-stocky-text-main hover:bg-[#F0F0F0] border border-stocky-border-subtle',
    outline:
      'bg-stocky-bg-widget text-stocky-text-main border border-stocky-border-subtle hover:bg-stocky-bg-global',
    ghost:
      'bg-transparent text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global',
  }[variant];

  return (
    <button
      className={`${base} ${sizes} ${variants} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
