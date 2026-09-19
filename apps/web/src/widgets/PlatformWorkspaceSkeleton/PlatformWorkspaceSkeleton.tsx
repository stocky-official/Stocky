'use client';

import React from 'react';
import {
  Skeleton,
  SkeletonToolbar,
  SkeletonCard,
  SkeletonTable,
  SkeletonCalendar,
  SkeletonSidebar,
} from '@/components/ui/Skeleton';

export type PlatformSkeletonVariant =
  | 'home'
  | 'dashboard'
  | 'inventory'
  | 'stock'
  | 'suppliers'
  | 'transfers'
  | 'expiring'
  | 'expiry'
  | 'tasks'
  | 'attendance'
  | 'calendar'
  | 'locations'
  | 'team'
  | 'activity'
  | 'logs'
  | 'notifications'
  | 'settings'
  | 'table'
  | 'cards';

export interface PlatformWorkspaceSkeletonProps {
  variant?: PlatformSkeletonVariant;
  activeTab?: string;
  eyebrow?: boolean;
  hasTabs?: boolean;
  rowsCount?: number;
  includeSidebar?: boolean;
  className?: string;
}

interface PageMeta {
  titleWidth: string;
  subtitleWidth: string;
  actionWidth: string;
  subtabs: string[];
  activeSubtabIndex: number;
}

const PAGE_METAS: Record<string, PageMeta> = {
  home: {
    titleWidth: 'w-48 sm:w-64',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: [],
    activeSubtabIndex: 0,
  },
  dashboard: {
    titleWidth: 'w-48 sm:w-64',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['Dashboard', 'Activity Logs'],
    activeSubtabIndex: 0,
  },
  inventory: {
    titleWidth: 'w-52 sm:w-72',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-36',
    subtabs: ['All Inventory', 'Expiring Soon', 'Low Stock', 'Out of Stock'],
    activeSubtabIndex: 0,
  },
  stock: {
    titleWidth: 'w-52 sm:w-72',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-36',
    subtabs: ['All Inventory', 'Expiring Soon', 'Low Stock', 'Out of Stock'],
    activeSubtabIndex: 0,
  },
  suppliers: {
    titleWidth: 'w-52 sm:w-68',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['Suppliers Directory', 'Supplier Requests'],
    activeSubtabIndex: 0,
  },
  transfers: {
    titleWidth: 'w-48 sm:w-64',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-36',
    subtabs: ['All Transfers', 'Inbound', 'Outbound', 'Drafts'],
    activeSubtabIndex: 0,
  },
  expiring: {
    titleWidth: 'w-44 sm:w-60',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-32',
    subtabs: ['All Inventory', 'Expiring Soon', 'Expired Lots'],
    activeSubtabIndex: 1,
  },
  expiry: {
    titleWidth: 'w-44 sm:w-60',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-32',
    subtabs: ['All Inventory', 'Expiring Soon', 'Expired Lots'],
    activeSubtabIndex: 1,
  },
  tasks: {
    titleWidth: 'w-48 sm:w-64',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['All Tasks', 'Stock Audits', 'Discrepancies', 'Completed'],
    activeSubtabIndex: 0,
  },
  attendance: {
    titleWidth: 'w-56 sm:w-72',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-36',
    subtabs: ['Timesheets', 'Calendar'],
    activeSubtabIndex: 0,
  },
  calendar: {
    titleWidth: 'w-56 sm:w-72',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-36',
    subtabs: ['Timesheets', 'Calendar'],
    activeSubtabIndex: 1,
  },
  locations: {
    titleWidth: 'w-48 sm:w-64',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['All Facilities', 'Branches', 'Warehouses'],
    activeSubtabIndex: 0,
  },
  team: {
    titleWidth: 'w-40 sm:w-56',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['Directory', 'Org Structure'],
    activeSubtabIndex: 0,
  },
  activity: {
    titleWidth: 'w-40 sm:w-56',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-32',
    subtabs: ['All Activity', 'Stock Movements', 'System Events'],
    activeSubtabIndex: 0,
  },
  logs: {
    titleWidth: 'w-40 sm:w-56',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-32',
    subtabs: ['All Activity', 'Stock Movements', 'System Events'],
    activeSubtabIndex: 0,
  },
  notifications: {
    titleWidth: 'w-44 sm:w-60',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['All Notifications', 'Unread', 'Archived'],
    activeSubtabIndex: 0,
  },
  settings: {
    titleWidth: 'w-48 sm:w-64',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-32',
    subtabs: ['General', 'Security', 'Integrations'],
    activeSubtabIndex: 0,
  },
};

export function PlatformWorkspaceSkeleton({
  variant,
  activeTab,
  eyebrow = false,
  hasTabs = true,
  rowsCount = 6,
  includeSidebar = false,
  className = '',
}: PlatformWorkspaceSkeletonProps) {
  // Resolve the page type
  const rawKey = (variant || activeTab || 'dashboard').toLowerCase();
  const pageType =
    rawKey === 'table' ? 'inventory' :
    rawKey === 'cards' ? 'locations' :
    rawKey;

  const meta = PAGE_METAS[pageType] || PAGE_METAS.dashboard;

  const content = (
    <div
      className={`stocky-subview-layout flex flex-col gap-4 sm:gap-5 w-full max-w-[var(--stocky-page-max-width)] mx-auto select-none ${className}`}
      aria-busy="true"
      aria-label="Loading workspace..."
    >
      {/* 1. Standard 2-Tier Header Skeleton */}
      <header className="stocky-subview-header hidden md:flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="stocky-subview-title-group min-w-0 flex flex-col gap-2">
          {eyebrow && (
            <div className="flex items-center gap-1.5">
              <Skeleton variant="circular" width={8} height={8} />
              <Skeleton variant="text" width={110} height={12} animation="shimmer-subtle" />
            </div>
          )}
          <Skeleton variant="rounded" height={32} className={`${meta.titleWidth} rounded-xl`} />
          <Skeleton variant="rounded" height={16} className={`${meta.subtitleWidth} rounded-lg`} animation="shimmer-subtle" />
        </div>
        <div className="stocky-subview-actions flex items-center gap-2.5 shrink-0">
          <Skeleton variant="rounded" height={36} width={96} className="rounded-full hidden sm:block" animation="shimmer-subtle" />
          <Skeleton variant="rounded" height={36} className={`${meta.actionWidth} rounded-full shadow-2xs`} />
        </div>
      </header>

      {/* 2. Navigation Subtabs Pill Rail Skeleton with Accurate Tabs */}
      {hasTabs && meta.subtabs.length > 0 && (
        <div className="stocky-mobile-pill-rail flex items-center gap-2 pb-1 border-b border-stocky-border-subtle/80 overflow-x-auto scrollbar-none">
          {meta.subtabs.map((tabName, index) => {
            const isActive = index === meta.activeSubtabIndex;
            return (
              <Skeleton
                key={tabName}
                variant="rounded"
                height={32}
                animation={isActive ? 'shimmer' : 'shimmer-subtle'}
                className={`px-4 rounded-full flex items-center shrink-0 ${
                  isActive ? 'shadow-xs w-28' : 'opacity-70 w-24'
                }`}
              />
            );
          })}
        </div>
      )}

      {/* 3. Main Workspace Body Configured Per Page Type */}

      {/* A. HOME / DASHBOARD VIEW */}
      {(pageType === 'home' || pageType === 'dashboard') && (
        <div className="flex flex-col gap-5 sm:gap-6">
          {/* 4 Metric Cards: 2x2 grid on mobile, 4 columns on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} variant="metric" />
            ))}
          </div>

          {/* Quick Actions Pills Row */}
          <div className="flex items-center gap-2 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={36}
                width={130}
                className="rounded-full shrink-0"
                animation="shimmer-subtle"
              />
            ))}
          </div>

          {/* 2 Detail Preview Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-stocky-border-subtle rounded-2xl p-5 shadow-card flex flex-col gap-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-stocky-border-subtle">
                  <Skeleton variant="text" width={140} height={18} />
                  <Skeleton variant="text" width={64} animation="shimmer-subtle" />
                </div>
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-3">
                        <Skeleton variant="rounded" width={32} height={32} className="rounded-lg shrink-0" />
                        <div className="flex flex-col gap-1.5">
                          <Skeleton variant="text" width={128} />
                          <Skeleton variant="text" width={80} animation="shimmer-subtle" />
                        </div>
                      </div>
                      <Skeleton variant="rounded" width={72} height={20} className="rounded-full shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* B. INVENTORY / STOCK VIEW */}
      {(pageType === 'inventory' || pageType === 'stock') && (
        <div className="flex flex-col gap-4">
          <SkeletonToolbar
            queueTabs={['All', 'In Stock', 'Low Stock', 'Out of Stock', 'Expiring']}
            actionButtonsCount={2}
          />
          <SkeletonTable
            columns={['4%', '22%', '14%', '12%', '14%', '10%', '12%', '12%']}
            rowsCount={rowsCount}
          />
        </div>
      )}

      {/* C. ATTENDANCE & TIMESHEETS VIEW */}
      {(pageType === 'attendance' || pageType === 'calendar') && (
        <div className="flex flex-col gap-5 sm:gap-6">
          {/* 4 Attendance Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} variant="metric" />
            ))}
          </div>

          {/* Punch Clock Status Bar */}
          <div className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex flex-col gap-1.5">
                <Skeleton variant="text" width={130} height={16} />
                <Skeleton variant="text" width={90} animation="shimmer-subtle" />
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Skeleton variant="rounded" width={110} height={38} className="rounded-full" animation="shimmer-subtle" />
              <Skeleton variant="rounded" width={130} height={38} className="rounded-full shadow-2xs" />
            </div>
          </div>

          {/* Timesheets vs Calendar Body */}
          {pageType === 'calendar' ? (
            <SkeletonCalendar selectedDayShiftsCount={3} />
          ) : (
            <div className="flex flex-col gap-4">
              <SkeletonToolbar
                hasQueueTabs={false}
                actionButtonsCount={2}
              />
              <SkeletonTable
                columns={['5%', '25%', '18%', '16%', '16%', '20%']}
                rowsCount={rowsCount}
              />
            </div>
          )}
        </div>
      )}

      {/* D. SUPPLIERS VIEW */}
      {pageType === 'suppliers' && (
        <div className="flex flex-col gap-4">
          <SkeletonToolbar
            queueTabs={['Suppliers Directory', 'Purchase Requests']}
            actionButtonsCount={2}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-stocky-border-subtle rounded-2xl p-5 shadow-card flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton variant="rounded" width={44} height={44} className="rounded-xl shrink-0" />
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <Skeleton variant="text" width={140} />
                    <Skeleton variant="text" width={96} animation="shimmer-subtle" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-stocky-border-subtle/60">
                  <Skeleton variant="text" width={160} animation="shimmer-subtle" />
                  <Skeleton variant="text" width={140} animation="shimmer-subtle" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-stocky-border-subtle/60">
                  <Skeleton variant="rounded" width={80} height={22} className="rounded-full" animation="shimmer-subtle" />
                  <Skeleton variant="rounded" width={80} height={28} className="rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E. TRANSFERS VIEW */}
      {pageType === 'transfers' && (
        <div className="flex flex-col gap-4">
          <SkeletonToolbar
            queueTabs={['All Transfers', 'Inbound', 'Outbound', 'Drafts']}
            actionButtonsCount={2}
          />
          <SkeletonTable
            columns={['5%', '25%', '18%', '16%', '16%', '20%']}
            rowsCount={rowsCount}
          />
        </div>
      )}

      {/* F. EXPIRING STOCK VIEW */}
      {(pageType === 'expiring' || pageType === 'expiry') && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-card flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Skeleton variant="text" width={80} animation="shimmer-subtle" />
                <Skeleton variant="rounded" width={48} height={24} />
              </div>
              <Skeleton variant="rounded" width={72} height={22} className="rounded-full" />
            </div>
            <div className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-card flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Skeleton variant="text" width={80} animation="shimmer-subtle" />
                <Skeleton variant="rounded" width={48} height={24} />
              </div>
              <Skeleton variant="rounded" width={72} height={22} className="rounded-full" />
            </div>
            <div className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-card flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Skeleton variant="text" width={80} animation="shimmer-subtle" />
                <Skeleton variant="rounded" width={48} height={24} />
              </div>
              <Skeleton variant="rounded" width={72} height={22} className="rounded-full" />
            </div>
          </div>
          <SkeletonTable
            columns={['5%', '25%', '18%', '16%', '16%', '20%']}
            rowsCount={rowsCount}
          />
        </div>
      )}

      {/* G. TASKS VIEW */}
      {pageType === 'tasks' && (
        <div className="flex flex-col gap-4">
          <SkeletonToolbar
            queueTabs={['All Tasks', 'Stock Audits', 'Discrepancies', 'Completed']}
            actionButtonsCount={2}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-stocky-border-subtle rounded-2xl p-5 shadow-card flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="rounded" width={36} height={36} className="rounded-xl shrink-0" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton variant="text" width={140} />
                      <Skeleton variant="text" width={80} animation="shimmer-subtle" />
                    </div>
                  </div>
                  <Skeleton variant="rounded" width={72} height={20} className="rounded-full" />
                </div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <Skeleton variant="text" width={64} animation="shimmer-subtle" />
                    <Skeleton variant="text" width={32} animation="shimmer-subtle" />
                  </div>
                  <Skeleton variant="rounded" height={8} className="w-full rounded-full" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stocky-border-subtle/60">
                  <div className="flex items-center gap-2">
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width={80} animation="shimmer-subtle" />
                  </div>
                  <Skeleton variant="rounded" width={80} height={28} className="rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* H. LOCATIONS VIEW */}
      {pageType === 'locations' && (
        <div className="flex flex-col gap-4">
          <SkeletonToolbar
            queueTabs={['All Facilities', 'Branches', 'Warehouses']}
            actionButtonsCount={2}
          />
          <div className="flex flex-col gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} variant="location" />
            ))}
          </div>
        </div>
      )}

      {/* I. TEAM VIEW */}
      {pageType === 'team' && (
        <div className="flex flex-col gap-4">
          <SkeletonToolbar
            queueTabs={['All', 'Admins', 'Managers', 'Staff']}
            actionButtonsCount={2}
          />
          <SkeletonTable
            columns={['5%', '25%', '20%', '20%', '15%', '15%']}
            rowsCount={rowsCount}
          />
        </div>
      )}

      {/* J. ACTIVITY LOGS VIEW */}
      {(pageType === 'activity' || pageType === 'logs') && (
        <div className="flex flex-col gap-4">
          <SkeletonToolbar
            queueTabs={['All Activity', 'Stock Movements', 'System Events']}
            actionButtonsCount={1}
          />
          <div className="bg-white border border-stocky-border-subtle rounded-2xl p-5 shadow-card flex flex-col gap-4">
            <Skeleton variant="text" width={112} className="font-mono" />
            <div className="flex flex-col gap-3 divide-y divide-stocky-border-subtle/70">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Skeleton variant="circular" width={32} height={32} />
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <Skeleton variant="text" className="w-52 sm:w-80" />
                      <Skeleton variant="text" width={128} animation="shimmer-subtle" />
                    </div>
                  </div>
                  <Skeleton variant="rounded" width={64} height={20} className="rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* K. NOTIFICATIONS VIEW (Facebook-Style Social Media Feed Skeleton) */}
      {pageType === 'notifications' && (
        <div className="flex flex-col gap-4 w-full">
          <div className="rounded-2xl bg-white border border-stocky-border-subtle overflow-hidden shadow-xs">
            {/* Feed Sub-Header: Filter Tabs ("All", "Unread") */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-stocky-border-subtle bg-white">
              <div className="flex items-center gap-2">
                <Skeleton variant="rounded" width={52} height={28} className="rounded-full" />
                <Skeleton variant="rounded" width={68} height={28} className="rounded-full" animation="shimmer-subtle" />
              </div>
              <Skeleton variant="text" width={90} height={14} animation="shimmer-subtle" />
            </div>

            {/* Notification Rows */}
            <div className="divide-y divide-stocky-border-subtle/70 p-1 sm:p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3.5 p-3 sm:p-3.5 rounded-2xl">
                  {/* Left Avatar + floating corner badge */}
                  <div className="relative shrink-0 mt-0.5">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ring-2 ring-white overflow-hidden">
                      <Skeleton variant="circular" width={20} height={20} />
                    </div>
                  </div>

                  {/* Middle Content (Bold Subject + Context + Time) */}
                  <div className="flex-1 min-w-0 pr-1 flex flex-col gap-1.5">
                    <Skeleton variant="text" className="w-48 sm:w-64" height={15} />
                    <Skeleton variant="text" className="w-full max-w-sm" animation="shimmer-subtle" />
                    <div className="flex items-center gap-2 mt-0.5">
                      <Skeleton variant="text" width={45} height={12} animation="shimmer-subtle" />
                      <Skeleton variant="text" width={60} height={12} animation="shimmer-subtle" />
                    </div>
                  </div>

                  {/* Right Status (blue unread dot + 3-dot menu placeholder) */}
                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {i < 2 && <Skeleton variant="circular" width={10} height={10} className="bg-blue-300" />}
                    <Skeleton variant="circular" width={28} height={28} animation="shimmer-subtle" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* L. SETTINGS VIEW */}
      {pageType === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-stocky-border-subtle rounded-2xl p-6 shadow-card flex flex-col gap-5">
            <Skeleton variant="text" width={160} height={20} />
            <div className="flex items-center gap-4">
              <Skeleton variant="circular" width={64} height={64} />
              <div className="flex flex-col gap-2">
                <Skeleton variant="rounded" width={112} height={32} className="rounded-full" animation="shimmer-subtle" />
                <Skeleton variant="text" width={160} animation="shimmer-subtle" />
              </div>
            </div>
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Skeleton variant="text" width={96} animation="shimmer-subtle" />
                <Skeleton variant="rounded" height={36} className="w-full rounded-xl" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton variant="text" width={112} animation="shimmer-subtle" />
                <Skeleton variant="rounded" height={36} className="w-full rounded-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-stocky-border-subtle rounded-2xl p-6 shadow-card flex flex-col gap-5">
            <Skeleton variant="text" width={192} height={20} />
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-stocky-border-subtle/60 last:border-b-0">
                  <div className="flex flex-col gap-1">
                    <Skeleton variant="text" width={144} />
                    <Skeleton variant="text" width={192} animation="shimmer-subtle" />
                  </div>
                  <Skeleton variant="rounded" width={40} height={24} className="rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (includeSidebar) {
    return (
      <div className="flex w-full h-full min-h-screen bg-stocky-bg-global">
        <SkeletonSidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          {content}
        </main>
      </div>
    );
  }

  return content;
}

export default PlatformWorkspaceSkeleton;

