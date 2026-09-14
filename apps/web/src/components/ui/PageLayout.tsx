import React from 'react';

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface PageRegionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function PageLayout({ children, className = '', ...props }: PageLayoutProps) {
  return <div className={`stocky-page-shell max-w-full overflow-x-clip ${className}`} {...props}>{children}</div>;
}

export function PageHeader({ children, className = '', ...props }: PageRegionProps) {
  return <header className={`stocky-page-header ${className}`} {...props}>{children}</header>;
}

export function PageContent({ children, className = '', ...props }: PageRegionProps) {
  return <main className={`stocky-page-content ${className}`} {...props}>{children}</main>;
}

export function PageFooter({ children, className = '', ...props }: PageRegionProps) {
  return <footer className={`stocky-page-footer ${className}`} {...props}>{children}</footer>;
}
