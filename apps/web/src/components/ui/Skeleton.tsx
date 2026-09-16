'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// 1. BASE SKELETON PRIMITIVE (Calm, Modern, GPU-Accelerated Shimmer)
// ============================================================================

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rounded' | 'rectangular';
  animation?: 'shimmer' | 'shimmer-subtle' | 'none';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = 'rounded',
  animation = 'shimmer',
  width,
  height,
  className = '',
  style,
  ...rest
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-3.5 w-full rounded-md',
    circular: 'rounded-full shrink-0',
    rounded: 'rounded-xl',
    rectangular: 'rounded-none',
  }[variant];

  const animationStyles = {
    shimmer: 'stocky-skeleton-shimmer',
    'shimmer-subtle': 'stocky-skeleton-shimmer-subtle',
    none: 'bg-stone-200/70',
  }[animation];

  const inlineStyles: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      className={`${variantStyles} ${animationStyles} ${className}`}
      style={inlineStyles}
      {...rest}
    />
  );
}

// ============================================================================
// 2. SKELETON TOOLBAR (Responsive: Mobile Split Search vs Desktop Full Toolbar)
// ============================================================================

export interface SkeletonToolbarProps {
  hasQueueTabs?: boolean;
  queueTabs?: string[];
  actionButtonsCount?: number;
  className?: string;
}

export function SkeletonToolbar({
  hasQueueTabs = true,
  queueTabs = ['All', 'In Stock', 'Low Stock', 'Out of Stock'],
  actionButtonsCount = 2,
  className = '',
}: SkeletonToolbarProps) {
  return (
    <div className={`flex flex-col gap-2.5 sm:gap-3 w-full ${className}`}>
      {/* Mobile Toolbar (<sm): Split search bar + circular filter button */}
      <div className="flex sm:hidden items-center gap-2 w-full">
        <div className="flex-1 h-10 rounded-full bg-white border border-stocky-border-subtle shadow-2xs flex items-center px-3.5 gap-2.5">
          <Skeleton variant="circular" width={16} height={16} animation="shimmer-subtle" />
          <Skeleton variant="text" width={110} animation="shimmer-subtle" />
        </div>
        <div className="w-10 h-10 rounded-full bg-white border border-stocky-border-subtle shadow-2xs flex items-center justify-center shrink-0">
          <Skeleton variant="circular" width={18} height={18} animation="shimmer-subtle" />
        </div>
      </div>

      {/* Desktop Toolbar (sm+): Search input + action buttons */}
      <div className="hidden sm:flex items-center justify-between gap-3">
        <div className="flex-1 max-w-md h-10 rounded-full bg-white border border-stocky-border-subtle shadow-2xs flex items-center px-3.5 gap-2.5">
          <Skeleton variant="circular" width={16} height={16} animation="shimmer-subtle" />
          <Skeleton variant="text" width={140} animation="shimmer-subtle" />
          <div className="w-px h-4 bg-stocky-border-subtle ml-auto shrink-0" />
          <Skeleton variant="rounded" width={20} height={20} className="rounded-md" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {Array.from({ length: actionButtonsCount }).map((_, idx) => (
            <Skeleton
              key={idx}
              variant="rounded"
              height={38}
              width={idx === actionButtonsCount - 1 ? 110 : 85}
              className="rounded-full shadow-xs"
            />
          ))}
        </div>
      </div>

      {/* Horizontal Queue Pill Rail (Responsive scroll rail) */}
      {hasQueueTabs && queueTabs.length > 0 && (
        <div className="stocky-mobile-pill-rail flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
          {queueTabs.map((tab, idx) => (
            <Skeleton
              key={tab || idx}
              variant="rounded"
              height={32}
              width={idx === 0 ? 84 : 96}
              animation={idx === 0 ? 'shimmer' : 'shimmer-subtle'}
              className={`rounded-full shrink-0 ${idx === 0 ? 'shadow-2xs' : 'opacity-75'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. SKELETON CARD (Metric KPI, Entity Item, Location, or General Container)
// ============================================================================

export interface SkeletonCardProps {
  variant?: 'metric' | 'item' | 'location' | 'default';
  className?: string;
}

export function SkeletonCard({
  variant = 'default',
  className = '',
}: SkeletonCardProps) {
  if (variant === 'metric') {
    return (
      <div
        className={`bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-card flex flex-col gap-3 ${className}`}
      >
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={96} animation="shimmer-subtle" />
          <Skeleton variant="rounded" width={28} height={28} className="rounded-lg" />
        </div>
        <Skeleton variant="rounded" width={80} height={30} className="rounded-xl" />
        <Skeleton variant="text" width={130} animation="shimmer-subtle" />
      </div>
    );
  }

  if (variant === 'location') {
    return (
      <div
        className={`bg-white border border-stocky-border-subtle rounded-2xl overflow-hidden shadow-card flex flex-col ${className}`}
      >
        {/* Banner placeholder */}
        <div className="h-32 w-full bg-stocky-bg-global/50 relative">
          <Skeleton variant="rectangular" className="w-full h-full" animation="shimmer-subtle" />
          <div className="absolute top-3 right-3">
            <Skeleton variant="rounded" width={68} height={22} className="rounded-full" />
          </div>
        </div>
        {/* Content body */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="flex flex-col gap-1.5 min-w-0">
            <Skeleton variant="text" width={130} height={18} />
            <Skeleton variant="text" width={100} animation="shimmer-subtle" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stocky-border-subtle/70">
            <Skeleton variant="text" width={70} animation="shimmer-subtle" />
            <Skeleton variant="text" width={70} animation="shimmer-subtle" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-stocky-border-subtle/70 mt-auto">
            <Skeleton variant="rounded" width={84} height={28} className="rounded-full" />
            <Skeleton variant="rounded" width={84} height={28} className="rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'item') {
    return (
      <div
        className={`bg-white border border-stocky-border-subtle rounded-2xl p-3.5 shadow-2xs flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Skeleton variant="rounded" width={44} height={44} className="rounded-xl shrink-0" />
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <Skeleton variant="text" width={140} />
            <Skeleton variant="text" width={90} animation="shimmer-subtle" />
          </div>
        </div>
        <Skeleton variant="rounded" width={72} height={24} className="rounded-full shrink-0" />
      </div>
    );
  }

  // Default container card
  return (
    <div
      className={`bg-white border border-stocky-border-subtle rounded-2xl p-5 shadow-card flex flex-col gap-4 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-stocky-border-subtle/70">
        <Skeleton variant="text" width={140} height={18} />
        <Skeleton variant="rounded" width={64} height={24} className="rounded-full" />
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="75%" animation="shimmer-subtle" />
        <Skeleton variant="text" width="60%" animation="shimmer-subtle" />
      </div>
    </div>
  );
}

// ============================================================================
// 4. SKELETON TABLE (Desktop Multi-Column Table vs Mobile Calm Uniform Cards)
// ============================================================================

export interface SkeletonTableProps {
  columns?: string[];
  rowsCount?: number;
  hasMobileCards?: boolean;
  className?: string;
}

export function SkeletonTable({
  columns = ['4%', '24%', '14%', '12%', '14%', '10%', '12%', '10%'],
  rowsCount = 6,
  hasMobileCards = true,
  className = '',
}: SkeletonTableProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Multi-column Table (hidden on mobile) */}
      <div className="hidden md:block bg-white border border-stocky-border-subtle rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/70 text-[10px] uppercase tracking-wide text-stocky-text-sub">
              {columns.map((width, idx) => (
                <th key={idx} className="px-3 py-3" style={{ width }}>
                  {idx === 0 ? (
                    <Skeleton variant="rounded" width={16} height={16} className="rounded" />
                  ) : (
                    <Skeleton variant="text" width={Math.max(48, 80 - idx * 6)} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stocky-border-subtle/80">
            {Array.from({ length: rowsCount }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-stocky-bg-global/30">
                {columns.map((_, colIdx) => (
                  <td key={colIdx} className="px-3 py-3.5">
                    {colIdx === 0 ? (
                      <Skeleton variant="rounded" width={16} height={16} className="rounded" animation="shimmer-subtle" />
                    ) : colIdx === 1 ? (
                      <div className="flex items-center gap-2.5">
                        <Skeleton variant="rounded" width={34} height={34} className="rounded-lg shrink-0" />
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <Skeleton variant="text" width={Math.max(90, ((rowIdx + colIdx) % 3) * 25 + 95)} />
                          <Skeleton variant="text" width={60} animation="shimmer-subtle" />
                        </div>
                      </div>
                    ) : colIdx === columns.length - 1 ? (
                      <Skeleton variant="circular" width={26} height={26} className="ml-auto" animation="shimmer-subtle" />
                    ) : colIdx % 3 === 0 ? (
                      <Skeleton variant="rounded" width={76} height={22} className="rounded-full" animation="shimmer-subtle" />
                    ) : (
                      <Skeleton variant="text" width={colIdx % 2 === 0 ? 56 : 72} animation="shimmer-subtle" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Calm Uniform Cards Fallback (md:hidden) */}
      {hasMobileCards && (
        <div className="md:hidden flex flex-col gap-2.5">
          {Array.from({ length: Math.min(rowsCount, 6) }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-stocky-border-subtle rounded-2xl p-3.5 shadow-2xs flex flex-col gap-2.5"
            >
              {/* Top Row: Thumbnail (44x44) + Title & Subtitle + Status Pill */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton variant="rounded" width={44} height={44} className="rounded-xl shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <Skeleton variant="text" width={140} height={15} />
                    <Skeleton variant="text" width={90} animation="shimmer-subtle" />
                  </div>
                </div>
                <Skeleton variant="rounded" width={68} height={22} className="rounded-full shrink-0" />
              </div>

              {/* Bottom Row: 2 Key Value Indicators + Details Arrow */}
              <div className="flex items-center justify-between pt-2 border-t border-stocky-border-subtle/70 text-xs">
                <div className="flex items-center gap-3">
                  <Skeleton variant="text" width={64} animation="shimmer-subtle" />
                  <span className="text-stone-300">·</span>
                  <Skeleton variant="text" width={56} animation="shimmer-subtle" />
                </div>
                <Skeleton variant="circular" width={20} height={20} animation="shimmer-subtle" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. SKELETON CALENDAR (Samsung/Stocky Month Grid + Selected Day Agenda)
// ============================================================================

export interface SkeletonCalendarProps {
  selectedDayShiftsCount?: number;
  className?: string;
}

export function SkeletonCalendar({
  selectedDayShiftsCount = 3,
  className = '',
}: SkeletonCalendarProps) {
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={`flex flex-col gap-5 w-full ${className}`}>
      {/* Month Calendar Card */}
      <div className="bg-white border border-stocky-border-subtle rounded-2xl p-4 sm:p-5 shadow-card flex flex-col gap-4">
        {/* Month Header Navigation */}
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={140} height={22} />
          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" width={56} height={30} className="rounded-full" />
            <Skeleton variant="circular" width={30} height={30} />
            <Skeleton variant="circular" width={30} height={30} />
          </div>
        </div>

        {/* Weekdays Row */}
        <div className="grid grid-cols-7 gap-1 text-center py-1 border-b border-stocky-border-subtle/70">
          {weekdays.map((day, i) => (
            <div key={i} className="flex justify-center">
              <Skeleton variant="text" width={16} height={12} animation="shimmer-subtle" />
            </div>
          ))}
        </div>

        {/* 5-Week Day Grid (35 cells) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 35 }).map((_, idx) => {
            const isToday = idx === 14;
            const hasEvents = [3, 7, 10, 14, 18, 22, 27].includes(idx);
            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl ${
                  isToday ? 'bg-stocky-bg-global border border-stocky-border-subtle' : ''
                }`}
              >
                <Skeleton
                  variant="circular"
                  width={28}
                  height={28}
                  animation={isToday ? 'shimmer' : 'shimmer-subtle'}
                  className={isToday ? 'shadow-2xs' : 'opacity-80'}
                />
                {hasEvents && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {idx % 2 === 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Schedule Agenda */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Skeleton variant="text" width={120} height={18} />
            <Skeleton variant="rounded" width={56} height={20} className="rounded-full" />
          </div>
          <Skeleton variant="text" width={64} animation="shimmer-subtle" />
        </div>

        {/* Agenda Cards with Left Color Accents */}
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: selectedDayShiftsCount }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-stocky-border-subtle rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4 border-l-4 border-l-stocky-primary"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Skeleton variant="circular" width={38} height={38} />
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <Skeleton variant="text" width={130} />
                  <Skeleton variant="text" width={90} animation="shimmer-subtle" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Skeleton variant="rounded" width={68} height={22} className="rounded-full" />
                <Skeleton variant="text" width={45} animation="shimmer-subtle" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. SKELETON SIDEBAR (Desktop Fixed Rail Shell for Standalone Loading)
// ============================================================================

export function SkeletonSidebar({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`hidden md:flex flex-col justify-between h-full bg-white border-r border-stocky-border-subtle p-2.5 shrink-0 w-[var(--stocky-sidebar-rail-width,4.5rem)] z-20 select-none ${className}`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Brand mark placeholder */}
        <div className="pt-1">
          <Skeleton variant="rounded" width={36} height={36} className="rounded-xl" />
        </div>
        {/* Search button placeholder */}
        <Skeleton variant="rounded" width={36} height={36} className="rounded-xl" animation="shimmer-subtle" />
        {/* Nav Items placeholders */}
        <div className="flex flex-col items-center gap-2.5 w-full pt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={38}
              height={38}
              className={`rounded-xl ${i === 0 ? 'bg-stocky-primary/10' : ''}`}
              animation={i === 0 ? 'shimmer' : 'shimmer-subtle'}
            />
          ))}
        </div>
      </div>

      {/* Footer notifications + account avatar */}
      <div className="flex flex-col items-center gap-3 pb-2 w-full pt-3 border-t border-stocky-border-subtle/70">
        <Skeleton variant="circular" width={32} height={32} animation="shimmer-subtle" />
        <Skeleton variant="circular" width={36} height={36} />
      </div>
    </aside>
  );
}

// ============================================================================
// 7. HYDRATION FADE WRAPPER (Smooth Cross-fade with Framer Motion)
// ============================================================================

export interface HydrationFadeWrapperProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function HydrationFadeWrapper({
  isLoading,
  skeleton,
  children,
  className = '',
}: HydrationFadeWrapperProps) {
  return (
    <div className={`relative min-h-[inherit] w-full ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full"
          >
            {skeleton as any}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full"
          >
            {children as any}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Skeleton;

