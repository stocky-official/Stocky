'use client';

import React from 'react';
import { useOptionalPlatform } from '@/views/platform/PlatformContext';
import { PlatformContextTabsWidget } from '@/widgets/PlatformContextTabsWidget/PlatformContextTabsWidget';

export interface PlatformPageLayoutProps {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  navigation?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * PlatformPageLayout enforces standard layout geometry across all platform subviews:
 * - 1600px max width
 * - Consistent 16px/24px gutters
 * - Unified 24px page title hierarchy
 * - Right-aligned action slot for the primary CTA
 * - Context navigation placed consistently below the headlines
 */
export function PlatformPageLayout({
  eyebrow,
  title,
  subtitle,
  actions,
  navigation,
  children,
  className = '',
}: PlatformPageLayoutProps) {
  const platform = useOptionalPlatform();

  let resolvedNavigation = navigation;
  if (resolvedNavigation === undefined && platform) {
    resolvedNavigation = (
      <PlatformContextTabsWidget
        activeTab={platform.activeTab}
        onTabChange={platform.navigateToTab}
        userRole={platform.userRole}
      />
    );
  }

  return (
    <div className={`stocky-subview-layout flex flex-col gap-5 w-full max-w-[1600px] mx-auto ${className}`}>
      {(title || eyebrow || subtitle || actions) && (
        <header className="stocky-subview-header flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="stocky-subview-title-group min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stocky-primary">
                {eyebrow}
              </p>
            )}
            <h1 className="text-2xl font-normal tracking-tight text-stocky-text-main mt-0.5">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm font-normal text-stocky-text-sub mt-1 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="stocky-subview-actions flex items-center flex-wrap gap-2.5 shrink-0">
              {actions}
            </div>
          )}
        </header>
      )}
      <main className="stocky-subview-content flex flex-col gap-4">
        {resolvedNavigation ? (
          <div className="hidden md:block">
            {resolvedNavigation}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
