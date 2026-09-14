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
  hideHeaderOnMobile?: boolean;
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
  hideHeaderOnMobile = true,
}: PlatformPageLayoutProps) {
  const platform = useOptionalPlatform();

  let resolvedNavigation = navigation;
  if (resolvedNavigation === undefined && platform) {
    resolvedNavigation = (
      <PlatformContextTabsWidget
        activeTab={platform.activeTab}
        onTabChange={platform.navigateToTab}
        userRole={platform.userRole}
        permissions={platform.userPermissions}
        supplierTab={platform.supplierTab}
        onSupplierTabChange={platform.setSupplierTab}
        taskTab={platform.taskTab}
        onTaskTabChange={platform.setTaskTab}
        attendanceTab={platform.attendanceTab}
        onAttendanceTabChange={platform.setAttendanceTab}
      />
    );
  }

  return (
    <div className={`stocky-subview-layout flex flex-col gap-2.5 sm:gap-5 w-full max-w-[var(--stocky-page-max-width)] mx-auto ${className}`}>
      {(title || eyebrow || subtitle || actions) && (
        <header
          className={`stocky-subview-header flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 ${
            hideHeaderOnMobile ? 'hidden md:flex' : ''
          }`}
        >
          <div className="stocky-subview-title-group min-w-0 flex-1">
            {eyebrow && (
              <p className="hidden sm:block text-[11px] font-medium uppercase tracking-[0.12em] text-stocky-primary mb-1">
                {eyebrow}
              </p>
            )}
            <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
              <h1 className="text-lg font-bold sm:text-2xl sm:font-normal tracking-tight text-stocky-text-main truncate">
                {title}
              </h1>
              {actions && (
                <div className="sm:hidden flex items-center gap-1.5 shrink-0">
                  {actions}
                </div>
              )}
            </div>
            {subtitle && (
              <p className="hidden sm:block text-sm font-normal text-stocky-text-sub mt-1 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="stocky-subview-actions hidden sm:flex items-center flex-wrap gap-2 shrink-0">
              {actions}
            </div>
          )}
        </header>
      )}
      <main className="stocky-subview-content flex flex-col gap-3.5 sm:gap-4">
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
