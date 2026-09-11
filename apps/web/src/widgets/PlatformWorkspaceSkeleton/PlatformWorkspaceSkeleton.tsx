'use client';

import React from 'react';

export interface PlatformWorkspaceSkeletonProps {
  variant?: 'table' | 'dashboard' | 'cards';
  eyebrow?: boolean;
  hasTabs?: boolean;
  rowsCount?: number;
  className?: string;
}

export function PlatformWorkspaceSkeleton({
  variant = 'table',
  eyebrow = true,
  hasTabs = true,
  rowsCount = 7,
  className = '',
}: PlatformWorkspaceSkeletonProps) {
  return (
    <div
      className={`stocky-subview-layout flex flex-col gap-5 w-full max-w-[1600px] mx-auto select-none ${className}`}
      aria-busy="true"
      aria-label="Loading workspace..."
    >
      {/* 1. Header Skeleton */}
      <header className="stocky-subview-header flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="stocky-subview-title-group min-w-0 flex flex-col gap-2">
          {eyebrow && (
            <div className="h-3 w-20 rounded-full stocky-skeleton-shimmer" />
          )}
          <div className="h-8 w-52 sm:w-72 rounded-xl stocky-skeleton-shimmer" />
          <div className="h-4 w-64 sm:w-96 rounded-lg stocky-skeleton-shimmer-subtle" />
        </div>
        <div className="stocky-subview-actions flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-32 rounded-full stocky-skeleton-shimmer stocky-skeleton-glow shadow-sm" />
        </div>
      </header>

      {/* 2. Navigation Subtabs Pill Rail Skeleton */}
      {hasTabs && (
        <div className="flex items-center gap-2 pb-1 border-b border-stocky-border-subtle/80 overflow-x-auto">
          <div className="h-8 w-24 rounded-full stocky-skeleton-shimmer" />
          <div className="h-8 w-28 rounded-full stocky-skeleton-shimmer-subtle" />
          <div className="h-8 w-24 rounded-full stocky-skeleton-shimmer-subtle hidden sm:block" />
        </div>
      )}

      {/* 3. Main Workspace Body */}
      {variant === 'table' && (
        <div className="flex flex-col gap-4">
          {/* Controls Toolbar: Split Search & Action Buttons */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              {/* Split Search Field Placeholder */}
              <div className="h-9.5 w-full max-w-sm rounded-full bg-white border border-stocky-border-subtle shadow-2xs flex items-center px-3.5 gap-2.5 stocky-skeleton-glow">
                <div className="w-4 h-4 rounded-full stocky-skeleton-shimmer shrink-0" />
                <div className="h-3.5 w-40 rounded stocky-skeleton-shimmer-subtle" />
                <div className="w-px h-4 bg-stocky-border-subtle ml-auto shrink-0" />
                <div className="w-5 h-5 rounded-full stocky-skeleton-shimmer shrink-0" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-8.5 w-20 rounded-full stocky-skeleton-shimmer-subtle" />
              <div className="h-8.5 w-24 rounded-full stocky-skeleton-shimmer-subtle hidden sm:block" />
              <div className="h-8.5 w-28 rounded-full stocky-skeleton-shimmer stocky-skeleton-glow" />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-stocky-border-subtle rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/70 text-[10px] uppercase tracking-wide text-stocky-text-sub">
                  <th className="px-3 py-3 w-[4%]">
                    <div className="w-3.5 h-3.5 rounded stocky-skeleton-shimmer" />
                  </th>
                  <th className="px-3 py-3 w-[15%]">
                    <div className="h-3 w-16 rounded stocky-skeleton-shimmer" />
                  </th>
                  <th className="px-3 py-3 w-[12%]">
                    <div className="h-3 w-14 rounded stocky-skeleton-shimmer" />
                  </th>
                  <th className="px-3 py-3 w-[12%]">
                    <div className="h-3 w-16 rounded stocky-skeleton-shimmer" />
                  </th>
                  <th className="px-3 py-3 w-[15%]">
                    <div className="h-3 w-18 rounded stocky-skeleton-shimmer" />
                  </th>
                  <th className="px-3 py-3 w-[10%]">
                    <div className="h-3 w-14 rounded stocky-skeleton-shimmer" />
                  </th>
                  <th className="px-3 py-3 w-[10%]">
                    <div className="h-3 w-12 rounded stocky-skeleton-shimmer" />
                  </th>
                  <th className="px-3 py-3 w-[11%]">
                    <div className="h-3 w-18 rounded stocky-skeleton-shimmer" />
                  </th>
                  <th className="px-3 py-3 w-[11%]">
                    <div className="h-3 w-16 rounded stocky-skeleton-shimmer" />
                  </th>
                  <th className="px-3 py-3 w-[8%] text-left">
                    <div className="h-3 w-12 rounded stocky-skeleton-shimmer" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle/80">
                {Array.from({ length: rowsCount }).map((_, index) => {
                  const isExpiring = index % 3 === 1;
                  const isCritical = index % 3 === 2;
                  return (
                    <tr key={index} className="hover:bg-stocky-bg-global/30">
                      <td className="px-3 py-3.5">
                        <div className="w-3.5 h-3.5 rounded stocky-skeleton-shimmer-subtle" />
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg stocky-skeleton-shimmer shrink-0" />
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <div
                              className="h-3.5 rounded stocky-skeleton-shimmer"
                              style={{ width: `${Math.max(90, (index % 4) * 25 + 95)}px` }}
                            />
                            <div className="h-2.5 w-16 rounded stocky-skeleton-shimmer-subtle" />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="h-5 w-24 rounded-full stocky-skeleton-shimmer-subtle" />
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="h-4 w-20 rounded-full stocky-skeleton-shimmer-subtle" />
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="h-5 w-20 rounded-full stocky-skeleton-shimmer-subtle" />
                          {index % 2 === 0 && (
                            <div className="h-5 w-16 rounded-full stocky-skeleton-shimmer-subtle" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="h-3.5 w-14 rounded stocky-skeleton-shimmer" />
                          <div className="h-2.5 w-10 rounded stocky-skeleton-shimmer-subtle" />
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="h-3.5 w-16 rounded stocky-skeleton-shimmer" />
                          <div className="h-2.5 w-12 rounded stocky-skeleton-shimmer-subtle" />
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div
                          className={`h-5 w-24 rounded-full ${
                            isCritical
                              ? 'stocky-skeleton-badge-critical'
                              : isExpiring
                              ? 'stocky-skeleton-badge-warning'
                              : 'stocky-skeleton-badge-healthy'
                          }`}
                        />
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="h-4 w-20 rounded stocky-skeleton-shimmer-subtle" />
                      </td>
                      <td className="px-3 py-3.5 text-left">
                        <div className="w-6 h-6 rounded-full stocky-skeleton-shimmer-subtle" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Table Pagination Footer */}
            <div className="flex items-center justify-between p-3.5 border-t border-stocky-border-subtle bg-stocky-bg-global/30">
              <div className="h-3.5 w-44 rounded stocky-skeleton-shimmer-subtle" />
              <div className="flex items-center gap-2">
                <div className="h-7 w-16 rounded-full stocky-skeleton-shimmer-subtle" />
                <div className="h-7 w-20 rounded-full stocky-skeleton-shimmer-subtle" />
              </div>
            </div>
          </div>

          {/* Mobile Card List Skeleton */}
          <div className="md:hidden flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-2xs flex flex-col gap-3 stocky-skeleton-glow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-4 h-4 rounded stocky-skeleton-shimmer shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="h-4 w-36 rounded stocky-skeleton-shimmer" />
                      <div className="h-3 w-28 rounded stocky-skeleton-shimmer-subtle" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="h-4 w-12 rounded stocky-skeleton-shimmer" />
                    <div className="h-4 w-20 rounded-full stocky-skeleton-badge-healthy" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stocky-border-subtle/60">
                  <div className="h-7 w-20 rounded-full stocky-skeleton-shimmer-subtle" />
                  <div className="h-7 w-24 rounded-full stocky-skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Variant */}
      {variant === 'dashboard' && (
        <div className="flex flex-col gap-6">
          {/* 4 Luminous Metric Cards */}
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

          {/* Action Row */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-36 rounded-full bg-white border border-stocky-border-subtle shadow-2xs shrink-0 stocky-skeleton-shimmer-subtle"
              />
            ))}
          </div>

          {/* 2 Detail Preview Cards */}
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

      {/* Cards Variant (Locations, Team, Settings) */}
      {variant === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-stocky-border-subtle rounded-2xl p-5 shadow-card flex flex-col gap-4 stocky-skeleton-glow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full stocky-skeleton-shimmer shrink-0" />
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="h-4 w-32 rounded stocky-skeleton-shimmer" />
                  <div className="h-3 w-20 rounded stocky-skeleton-shimmer-subtle" />
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-stocky-border-subtle/60">
                <div className="h-3.5 w-full rounded stocky-skeleton-shimmer-subtle" />
                <div className="h-3.5 w-3/4 rounded stocky-skeleton-shimmer-subtle" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-stocky-border-subtle/60">
                <div className="h-5 w-20 rounded-full stocky-skeleton-shimmer-subtle" />
                <div className="h-7 w-20 rounded-full stocky-skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
