'use client';

import React from 'react';

export type PlatformSkeletonVariant =
  | 'dashboard'
  | 'stock'
  | 'suppliers'
  | 'transfers'
  | 'expiring'
  | 'expiry'
  | 'tasks'
  | 'attendance'
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
  className?: string;
}

interface PageMeta {
  eyebrowText: string;
  titleWidth: string;
  subtitleWidth: string;
  actionWidth: string;
  subtabs: string[];
  activeSubtabIndex: number;
}

const PAGE_METAS: Record<string, PageMeta> = {
  dashboard: {
    eyebrowText: 'LIVE OPERATIONS',
    titleWidth: 'w-48 sm:w-64',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['Dashboard', 'Activity Logs', 'Notifications'],
    activeSubtabIndex: 0,
  },
  stock: {
    eyebrowText: 'INVENTORY CONTROL',
    titleWidth: 'w-52 sm:w-72',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-36',
    subtabs: ['Stock', 'Transfers', 'Expiring'],
    activeSubtabIndex: 0,
  },
  suppliers: {
    eyebrowText: 'PROCUREMENT & VENDORS',
    titleWidth: 'w-52 sm:w-68',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['Suppliers', 'Purchase Requests'],
    activeSubtabIndex: 0,
  },
  transfers: {
    eyebrowText: 'SUPPLY CHAIN MOVEMENTS',
    titleWidth: 'w-48 sm:w-64',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-36',
    subtabs: ['Stock', 'Transfers', 'Expiring'],
    activeSubtabIndex: 1,
  },
  expiring: {
    eyebrowText: 'EXPIRY INTELLIGENCE',
    titleWidth: 'w-44 sm:w-60',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-32',
    subtabs: ['Stock', 'Transfers', 'Expiring'],
    activeSubtabIndex: 2,
  },
  expiry: {
    eyebrowText: 'EXPIRY INTELLIGENCE',
    titleWidth: 'w-44 sm:w-60',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-32',
    subtabs: ['Stock', 'Transfers', 'Expiring'],
    activeSubtabIndex: 2,
  },
  tasks: {
    eyebrowText: 'OPERATIONAL AUDITS',
    titleWidth: 'w-48 sm:w-64',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['Ongoing Tasks', 'Completed'],
    activeSubtabIndex: 0,
  },
  attendance: {
    eyebrowText: 'STAFF & ATTENDANCE',
    titleWidth: 'w-56 sm:w-72',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-36',
    subtabs: ['Timesheets', 'Calendar', 'Time Off', 'Kiosk & QR'],
    activeSubtabIndex: 0,
  },
  locations: {
    eyebrowText: 'COMPANY FACILITIES',
    titleWidth: 'w-48 sm:w-64',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['Locations', 'Team', 'Settings'],
    activeSubtabIndex: 0,
  },
  team: {
    eyebrowText: 'ORGANIZATION & ACCESS',
    titleWidth: 'w-40 sm:w-56',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['Locations', 'Team', 'Settings'],
    activeSubtabIndex: 1,
  },
  activity: {
    eyebrowText: 'AUDIT TRAIL',
    titleWidth: 'w-40 sm:w-56',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-32',
    subtabs: ['Dashboard', 'Activity Logs', 'Notifications'],
    activeSubtabIndex: 1,
  },
  logs: {
    eyebrowText: 'AUDIT TRAIL',
    titleWidth: 'w-40 sm:w-56',
    subtitleWidth: 'w-72 sm:w-96',
    actionWidth: 'w-32',
    subtabs: ['Dashboard', 'Activity Logs', 'Notifications'],
    activeSubtabIndex: 1,
  },
  notifications: {
    eyebrowText: 'SYSTEM ALERTS',
    titleWidth: 'w-44 sm:w-60',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-36',
    subtabs: ['Dashboard', 'Activity Logs', 'Notifications'],
    activeSubtabIndex: 2,
  },
  settings: {
    eyebrowText: 'WORKSPACE CONFIGURATION',
    titleWidth: 'w-48 sm:w-64',
    subtitleWidth: 'w-64 sm:w-88',
    actionWidth: 'w-32',
    subtabs: ['Locations', 'Team', 'Settings'],
    activeSubtabIndex: 2,
  },
};

export function PlatformWorkspaceSkeleton({
  variant,
  activeTab,
  eyebrow = false,
  hasTabs = true,
  rowsCount = 7,
  className = '',
}: PlatformWorkspaceSkeletonProps) {
  // Resolve the page type
  const rawKey = (variant || activeTab || 'dashboard').toLowerCase();
  const pageType =
    rawKey === 'table' ? 'stock' :
    rawKey === 'cards' ? 'locations' :
    rawKey;

  const meta = PAGE_METAS[pageType] || PAGE_METAS.dashboard;

  return (
    <div
      className={`stocky-subview-layout flex flex-col gap-6 w-full max-w-[var(--stocky-page-max-width)] mx-auto select-none ${className}`}
      aria-busy="true"
      aria-label="Loading workspace..."
    >
      {/* 1. Header Skeleton Tailored to the Page */}
      <header className="stocky-subview-header flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="stocky-subview-title-group min-w-0 flex flex-col gap-2">
          {eyebrow && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full stocky-skeleton-shimmer" />
              <div className="h-3 w-28 rounded-full stocky-skeleton-shimmer font-mono text-[10px]" />
            </div>
          )}
          <div className={`h-8 ${meta.titleWidth} rounded-xl stocky-skeleton-shimmer`} />
          <div className={`h-4 ${meta.subtitleWidth} rounded-lg stocky-skeleton-shimmer-subtle`} />
        </div>
        <div className="stocky-subview-actions flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-24 rounded-full stocky-skeleton-shimmer-subtle hidden sm:block" />
          <div className={`h-9 ${meta.actionWidth} rounded-full stocky-skeleton-shimmer stocky-skeleton-glow shadow-sm`} />
        </div>
      </header>

      {/* 2. Navigation Subtabs Pill Rail Skeleton with Accurate Tabs */}
      {hasTabs && meta.subtabs.length > 0 && (
        <div className="flex items-center gap-2 pb-1 border-b border-stocky-border-subtle/80 overflow-x-auto">
          {meta.subtabs.map((tabName, index) => {
            const isActive = index === meta.activeSubtabIndex;
            return (
              <div
                key={tabName}
                className={`h-8 px-4 rounded-full flex items-center shrink-0 ${
                  isActive
                    ? 'stocky-skeleton-shimmer shadow-xs w-28'
                    : 'stocky-skeleton-shimmer-subtle opacity-70 w-24'
                }`}
              />
            );
          })}
        </div>
      )}

      {/* 3. Main Workspace Body Configured Per Page Type */}

      {/* A. DASHBOARD VIEW */}
      {pageType === 'dashboard' && (
        <div className="flex flex-col gap-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-card flex flex-col gap-3 stocky-skeleton-glow"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-24 rounded stocky-skeleton-shimmer-subtle" />
                  <div className="w-7 h-7 rounded-lg stocky-skeleton-shimmer" />
                </div>
                <div className="h-8 w-20 rounded-xl stocky-skeleton-shimmer" />
                <div className="h-3 w-36 rounded stocky-skeleton-shimmer-subtle" />
              </div>
            ))}
          </div>

          {/* Quick Actions Pills Row */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-36 rounded-full bg-white border border-stocky-border-subtle shadow-2xs shrink-0 stocky-skeleton-shimmer-subtle"
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
                  <div className="h-4.5 w-36 rounded stocky-skeleton-shimmer" />
                  <div className="h-3.5 w-16 rounded stocky-skeleton-shimmer-subtle" />
                </div>
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg stocky-skeleton-shimmer shrink-0" />
                        <div className="flex flex-col gap-1.5">
                          <div className="h-3.5 w-32 rounded stocky-skeleton-shimmer" />
                          <div className="h-2.5 w-20 rounded stocky-skeleton-shimmer-subtle" />
                        </div>
                      </div>
                      <div className="h-5 w-20 rounded-full stocky-skeleton-badge-healthy" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* B. STOCK INVENTORY VIEW */}
      {pageType === 'stock' && (
        <div className="flex flex-col gap-4">
          {/* Controls Toolbar: Search with Barcode Scanner Icon + Category Filters */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="h-9.5 w-full max-w-sm rounded-full bg-white border border-stocky-border-subtle shadow-2xs flex items-center px-3.5 gap-2.5 stocky-skeleton-glow">
                <div className="w-4 h-4 rounded-full stocky-skeleton-shimmer shrink-0" />
                <div className="h-3.5 w-36 rounded stocky-skeleton-shimmer-subtle" />
                <div className="w-px h-4 bg-stocky-border-subtle ml-auto shrink-0" />
                <div className="w-5 h-5 rounded-md stocky-skeleton-shimmer shrink-0" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer-subtle" />
              <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer-subtle hidden sm:block" />
              <div className="h-8.5 w-20 rounded-full stocky-skeleton-shimmer" />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-stocky-border-subtle rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/70 text-[10px] uppercase tracking-wide text-stocky-text-sub">
                  <th className="px-3 py-3 w-[4%]"><div className="w-3.5 h-3.5 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-3 py-3 w-[16%]"><div className="h-3 w-16 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-3 py-3 w-[12%]"><div className="h-3 w-14 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-3 py-3 w-[11%]"><div className="h-3 w-14 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-3 py-3 w-[14%]"><div className="h-3 w-16 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-3 py-3 w-[10%]"><div className="h-3 w-14 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-3 py-3 w-[10%]"><div className="h-3 w-12 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-3 py-3 w-[11%]"><div className="h-3 w-16 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-3 py-3 w-[11%]"><div className="h-3 w-14 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-3 py-3 w-[8%] text-left"><div className="h-3 w-12 rounded stocky-skeleton-shimmer" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle/80">
                {Array.from({ length: rowsCount }).map((_, index) => (
                  <tr key={index} className="hover:bg-stocky-bg-global/30">
                    <td className="px-3 py-3.5"><div className="w-3.5 h-3.5 rounded stocky-skeleton-shimmer-subtle" /></td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg stocky-skeleton-shimmer shrink-0" />
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="h-3.5 rounded stocky-skeleton-shimmer" style={{ width: `${Math.max(85, (index % 4) * 20 + 90)}px` }} />
                          <div className="h-2.5 w-16 rounded stocky-skeleton-shimmer-subtle" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5"><div className="h-5 w-20 rounded-full stocky-skeleton-shimmer-subtle" /></td>
                    <td className="px-3 py-3.5"><div className="h-4 w-18 rounded-full stocky-skeleton-shimmer-subtle" /></td>
                    <td className="px-3 py-3.5"><div className="h-5 w-24 rounded-full stocky-skeleton-shimmer-subtle" /></td>
                    <td className="px-3 py-3.5"><div className="h-3.5 w-14 rounded stocky-skeleton-shimmer" /></td>
                    <td className="px-3 py-3.5"><div className="h-3.5 w-14 rounded stocky-skeleton-shimmer" /></td>
                    <td className="px-3 py-3.5"><div className="h-5 w-20 rounded-full stocky-skeleton-badge-healthy" /></td>
                    <td className="px-3 py-3.5"><div className="h-4 w-18 rounded stocky-skeleton-shimmer-subtle" /></td>
                    <td className="px-3 py-3.5 text-left"><div className="w-6 h-6 rounded-full stocky-skeleton-shimmer-subtle" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-2xs flex flex-col gap-3 stocky-skeleton-glow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg stocky-skeleton-shimmer shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="h-4 w-32 rounded stocky-skeleton-shimmer" />
                      <div className="h-3 w-20 rounded stocky-skeleton-shimmer-subtle" />
                    </div>
                  </div>
                  <div className="h-5 w-16 rounded-full stocky-skeleton-badge-healthy shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C. SUPPLIERS VIEW */}
      {pageType === 'suppliers' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="h-9.5 w-full max-w-sm rounded-full bg-white border border-stocky-border-subtle flex items-center px-3.5 gap-2.5">
              <div className="w-4 h-4 rounded-full stocky-skeleton-shimmer shrink-0" />
              <div className="h-3.5 w-40 rounded stocky-skeleton-shimmer-subtle" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer-subtle" />
              <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer-subtle" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-stocky-border-subtle rounded-2xl p-5 shadow-card flex flex-col gap-4 stocky-skeleton-glow">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl stocky-skeleton-shimmer shrink-0" />
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="h-4 w-36 rounded stocky-skeleton-shimmer" />
                    <div className="h-3 w-24 rounded stocky-skeleton-shimmer-subtle" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-stocky-border-subtle/60">
                  <div className="h-3.5 w-44 rounded stocky-skeleton-shimmer-subtle" />
                  <div className="h-3.5 w-40 rounded stocky-skeleton-shimmer-subtle" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-stocky-border-subtle/60">
                  <div className="h-5 w-20 rounded-full stocky-skeleton-shimmer-subtle" />
                  <div className="h-7 w-20 rounded-full stocky-skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D. TRANSFERS VIEW */}
      {pageType === 'transfers' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="h-9.5 w-full max-w-sm rounded-full bg-white border border-stocky-border-subtle flex items-center px-3.5 gap-2.5">
              <div className="w-4 h-4 rounded-full stocky-skeleton-shimmer shrink-0" />
              <div className="h-3.5 w-36 rounded stocky-skeleton-shimmer-subtle" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8.5 w-20 rounded-full stocky-skeleton-shimmer" />
              <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer-subtle" />
              <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer-subtle hidden sm:block" />
            </div>
          </div>
          <div className="bg-white border border-stocky-border-subtle rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/70 text-[10px] uppercase tracking-wide text-stocky-text-sub">
                  <th className="px-4 py-3"><div className="h-3 w-16 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-4 py-3"><div className="h-3 w-36 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-4 py-3"><div className="h-3 w-14 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-4 py-3"><div className="h-3 w-20 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-4 py-3"><div className="h-3 w-16 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-4 py-3 text-right"><div className="h-3 w-12 rounded stocky-skeleton-shimmer ml-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle/80">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="hover:bg-stocky-bg-global/30">
                    <td className="px-4 py-3.5"><div className="h-4 w-16 rounded stocky-skeleton-shimmer" /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-3.5 w-24 rounded stocky-skeleton-shimmer" />
                        <div className="w-3 h-3 rounded stocky-skeleton-shimmer-subtle" />
                        <div className="h-3.5 w-24 rounded stocky-skeleton-shimmer" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><div className="h-3.5 w-12 rounded stocky-skeleton-shimmer" /></td>
                    <td className="px-4 py-3.5"><div className="h-3.5 w-20 rounded stocky-skeleton-shimmer-subtle" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-20 rounded-full stocky-skeleton-badge-healthy" /></td>
                    <td className="px-4 py-3.5 text-right"><div className="h-7 w-16 rounded-full stocky-skeleton-shimmer ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* E. EXPIRING STOCK VIEW */}
      {(pageType === 'expiring' || pageType === 'expiry') && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-card flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="h-3 w-20 rounded stocky-skeleton-shimmer-subtle" />
                <div className="h-6 w-12 rounded stocky-skeleton-shimmer" />
              </div>
              <div className="h-6 w-20 rounded-full stocky-skeleton-badge-critical" />
            </div>
            <div className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-card flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="h-3 w-20 rounded stocky-skeleton-shimmer-subtle" />
                <div className="h-6 w-12 rounded stocky-skeleton-shimmer" />
              </div>
              <div className="h-6 w-20 rounded-full stocky-skeleton-badge-warning" />
            </div>
            <div className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-card flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="h-3 w-20 rounded stocky-skeleton-shimmer-subtle" />
                <div className="h-6 w-12 rounded stocky-skeleton-shimmer" />
              </div>
              <div className="h-6 w-20 rounded-full stocky-skeleton-badge-healthy" />
            </div>
          </div>
          <div className="bg-white border border-stocky-border-subtle rounded-2xl shadow-card overflow-hidden">
            <div className="p-4 border-b border-stocky-border-subtle flex items-center justify-between">
              <div className="h-4 w-40 rounded stocky-skeleton-shimmer" />
              <div className="h-8 w-28 rounded-full stocky-skeleton-shimmer-subtle" />
            </div>
            <div className="divide-y divide-stocky-border-subtle/80">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg stocky-skeleton-shimmer shrink-0" />
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="h-4 w-36 rounded stocky-skeleton-shimmer" />
                      <div className="h-3 w-24 rounded stocky-skeleton-shimmer-subtle" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="h-5 w-24 rounded-full stocky-skeleton-badge-warning" />
                    <div className="h-7 w-20 rounded-full stocky-skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* F. TASKS VIEW */}
      {pageType === 'tasks' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="h-9.5 w-full max-w-sm rounded-full bg-white border border-stocky-border-subtle flex items-center px-3.5 gap-2.5">
              <div className="w-4 h-4 rounded-full stocky-skeleton-shimmer shrink-0" />
              <div className="h-3.5 w-36 rounded stocky-skeleton-shimmer-subtle" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer" />
              <div className="h-8.5 w-20 rounded-full stocky-skeleton-shimmer-subtle" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-stocky-border-subtle rounded-2xl p-5 shadow-card flex flex-col gap-4 stocky-skeleton-glow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl stocky-skeleton-shimmer shrink-0" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-4 w-36 rounded stocky-skeleton-shimmer" />
                      <div className="h-3 w-20 rounded stocky-skeleton-shimmer-subtle" />
                    </div>
                  </div>
                  <div className="h-5 w-20 rounded-full stocky-skeleton-badge-healthy" />
                </div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="h-3 w-16 rounded stocky-skeleton-shimmer-subtle" />
                    <div className="h-3 w-8 rounded stocky-skeleton-shimmer-subtle" />
                  </div>
                  <div className="h-2 w-full rounded-full stocky-skeleton-shimmer" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stocky-border-subtle/60">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full stocky-skeleton-shimmer" />
                    <div className="h-3 w-20 rounded stocky-skeleton-shimmer-subtle" />
                  </div>
                  <div className="h-7 w-20 rounded-full stocky-skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* G. LOCATIONS VIEW */}
      {pageType === 'locations' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="h-9.5 w-full max-w-sm rounded-full bg-white border border-stocky-border-subtle flex items-center px-3.5 gap-2.5">
              <div className="w-4 h-4 rounded-full stocky-skeleton-shimmer shrink-0" />
              <div className="h-3.5 w-36 rounded stocky-skeleton-shimmer-subtle" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8.5 w-20 rounded-full stocky-skeleton-shimmer" />
              <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer-subtle" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-stocky-border-subtle rounded-2xl p-5 shadow-card flex flex-col gap-4 stocky-skeleton-glow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl stocky-skeleton-shimmer shrink-0" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-4 w-32 rounded stocky-skeleton-shimmer" />
                      <div className="h-3 w-20 rounded stocky-skeleton-shimmer-subtle" />
                    </div>
                  </div>
                  <div className="h-5 w-16 rounded-full stocky-skeleton-badge-healthy" />
                </div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="h-3 w-24 rounded stocky-skeleton-shimmer-subtle" />
                  <div className="h-2 w-full rounded-full stocky-skeleton-shimmer" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-stocky-border-subtle/60">
                  <div className="h-3.5 w-24 rounded stocky-skeleton-shimmer-subtle" />
                  <div className="h-7 w-20 rounded-full stocky-skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* H. TEAM VIEW */}
      {pageType === 'team' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="h-9.5 w-full max-w-sm rounded-full bg-white border border-stocky-border-subtle flex items-center px-3.5 gap-2.5">
              <div className="w-4 h-4 rounded-full stocky-skeleton-shimmer shrink-0" />
              <div className="h-3.5 w-36 rounded stocky-skeleton-shimmer-subtle" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8.5 w-20 rounded-full stocky-skeleton-shimmer" />
              <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer-subtle" />
            </div>
          </div>
          <div className="bg-white border border-stocky-border-subtle rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/70 text-[10px] uppercase tracking-wide text-stocky-text-sub">
                  <th className="px-4 py-3"><div className="h-3 w-24 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-4 py-3"><div className="h-3 w-16 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-4 py-3"><div className="h-3 w-28 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-4 py-3"><div className="h-3 w-20 rounded stocky-skeleton-shimmer" /></th>
                  <th className="px-4 py-3 text-right"><div className="h-3 w-12 rounded stocky-skeleton-shimmer ml-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle/80">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="hover:bg-stocky-bg-global/30">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full stocky-skeleton-shimmer shrink-0" />
                        <div className="flex flex-col gap-1">
                          <div className="h-3.5 w-28 rounded stocky-skeleton-shimmer" />
                          <div className="h-2.5 w-36 rounded stocky-skeleton-shimmer-subtle" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><div className="h-5 w-18 rounded-full stocky-skeleton-shimmer" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-28 rounded-full stocky-skeleton-shimmer-subtle" /></td>
                    <td className="px-4 py-3.5"><div className="h-3.5 w-20 rounded stocky-skeleton-shimmer-subtle" /></td>
                    <td className="px-4 py-3.5 text-right"><div className="h-7 w-16 rounded-full stocky-skeleton-shimmer ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* I. ACTIVITY LOGS VIEW */}
      {(pageType === 'activity' || pageType === 'logs') && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="h-9.5 w-full max-w-sm rounded-full bg-white border border-stocky-border-subtle flex items-center px-3.5 gap-2.5">
              <div className="w-4 h-4 rounded-full stocky-skeleton-shimmer shrink-0" />
              <div className="h-3.5 w-36 rounded stocky-skeleton-shimmer-subtle" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer-subtle" />
              <div className="h-8.5 w-28 rounded-full stocky-skeleton-shimmer-subtle" />
            </div>
          </div>
          <div className="bg-white border border-stocky-border-subtle rounded-2xl p-5 shadow-card flex flex-col gap-4">
            <div className="h-4 w-28 rounded stocky-skeleton-shimmer font-mono" />
            <div className="flex flex-col gap-3 divide-y divide-stocky-border-subtle/70">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full stocky-skeleton-shimmer shrink-0" />
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="h-3.5 w-52 sm:w-80 rounded stocky-skeleton-shimmer" />
                      <div className="h-2.5 w-32 rounded stocky-skeleton-shimmer-subtle" />
                    </div>
                  </div>
                  <div className="h-5 w-16 rounded-full stocky-skeleton-badge-healthy shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* J. NOTIFICATIONS VIEW */}
      {pageType === 'notifications' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8.5 w-20 rounded-full stocky-skeleton-shimmer" />
            <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer-subtle" />
            <div className="h-8.5 w-28 rounded-full stocky-skeleton-shimmer-subtle" />
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-card flex items-start justify-between gap-4 stocky-skeleton-glow">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl stocky-skeleton-shimmer shrink-0" />
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="h-4 w-48 rounded stocky-skeleton-shimmer" />
                    <div className="h-3.5 w-full max-w-md rounded stocky-skeleton-shimmer-subtle" />
                    <div className="h-2.5 w-24 rounded stocky-skeleton-shimmer-subtle" />
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full stocky-skeleton-shimmer shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* K. SETTINGS VIEW */}
      {pageType === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-stocky-border-subtle rounded-2xl p-6 shadow-card flex flex-col gap-5 stocky-skeleton-glow">
            <div className="h-5 w-40 rounded stocky-skeleton-shimmer" />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full stocky-skeleton-shimmer shrink-0" />
              <div className="flex flex-col gap-2">
                <div className="h-8 w-28 rounded-full stocky-skeleton-shimmer-subtle" />
                <div className="h-3 w-40 rounded stocky-skeleton-shimmer-subtle" />
              </div>
            </div>
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-24 rounded stocky-skeleton-shimmer-subtle" />
                <div className="h-9 w-full rounded-xl stocky-skeleton-shimmer" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-28 rounded stocky-skeleton-shimmer-subtle" />
                <div className="h-9 w-full rounded-xl stocky-skeleton-shimmer" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-stocky-border-subtle rounded-2xl p-6 shadow-card flex flex-col gap-5 stocky-skeleton-glow">
            <div className="h-5 w-48 rounded stocky-skeleton-shimmer" />
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-stocky-border-subtle/60 last:border-b-0">
                  <div className="flex flex-col gap-1">
                    <div className="h-4 w-36 rounded stocky-skeleton-shimmer" />
                    <div className="h-3 w-48 rounded stocky-skeleton-shimmer-subtle" />
                  </div>
                  <div className="w-10 h-6 rounded-full stocky-skeleton-shimmer shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlatformWorkspaceSkeleton;
