'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckIcon,
  FileSpreadsheetIcon,
  FilterIcon,
  PlusIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import type { Location } from '@stocky/types';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { StandardToolbarWidget } from '../StandardToolbarWidget/StandardToolbarWidget';
import type { ActionItem } from '@/components/ui/ActionsBottomSheet';
import { useTranslation } from '@/lib/i18n';

export type AttendanceTab = 'timesheets' | 'calendar' | 'leaves' | 'kiosk';

export interface AttendanceToolbarWidgetProps {
  search: string;
  onSearchChange: (search: string) => void;
  activeTab?: AttendanceTab;
  onTabChange?: (tab: AttendanceTab) => void;
  onExportExcel: () => void;
  onRequestLeave?: () => void;
  userRole?: string;
  locationFilter?: string;
  onLocationFilterChange?: (locationId: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  locations?: Location[];
}

export function AttendanceToolbarWidget({
  search,
  onSearchChange,
  activeTab = 'timesheets',
  onExportExcel,
  onRequestLeave,
  locationFilter = 'all',
  onLocationFilterChange,
  statusFilter = 'all',
  onStatusFilterChange,
  locations = [],
}: AttendanceToolbarWidgetProps) {
  const { t } = useTranslation();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);

  const activeFilterCount =
    (locationFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const handleResetFilters = () => {
    onLocationFilterChange?.('all');
    onStatusFilterChange?.('all');
  };

  useEffect(() => {
    if (!isFilterDrawerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(e.target as Node)
      ) {
        setIsFilterDrawerOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterDrawerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterDrawerOpen]);

  const moreActions: ActionItem[] = [
    {
      id: 'export-excel',
      label: t('attendance.exportExcel') || 'Export Timesheets',
      description: t('attendance.exportExcelDesc') || 'Download timesheet logs and shift records to Excel',
      icon: <FileSpreadsheetIcon size="xs" />,
      onClick: onExportExcel,
    },
  ];

  const attendanceFilterContent = (isMobile = false) => (
    <motion.div
      initial={isMobile ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
      animate={isMobile ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={isMobile ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-label="Attendance filters"
      className={
        isMobile
          ? "flex flex-col min-h-0 bg-white"
          : "w-full rounded-2xl bg-white border border-stocky-border-subtle shadow-bevel-float overflow-hidden flex flex-col z-50 text-left select-none"
      }
    >
      {/* Desktop Header */}
      {!isMobile && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stocky-border-subtle bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stocky-primary/10 text-stocky-primary flex items-center justify-center shrink-0">
              <FilterIcon size="xs" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-stocky-text-main">Filter Timesheets</h2>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-stocky-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              <p className="text-xs text-stocky-text-sub mt-0.5">
                Filter shifts by branch location and punch status
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(false)}
            aria-label="Close attendance filters"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
          >
            <XIcon size="xs" />
          </button>
        </div>
      )}

      {/* Filter Body */}
      <div className={`flex-1 min-h-0 overflow-y-auto space-y-5 ${isMobile ? 'py-1' : 'p-5'}`}>
        {/* Branch / Location */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5">
              <WarehouseIcon size="xs" className="text-stocky-primary" />
              Branch / Location
            </label>
            {locationFilter !== 'all' && (
              <button
                type="button"
                onClick={() => onLocationFilterChange?.('all')}
                className="text-[11px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <select
            value={locationFilter}
            onChange={(e) => onLocationFilterChange?.(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Shift Status */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-semibold text-stocky-text-main">Shift Status</label>
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => onStatusFilterChange?.('all')}
                className="text-[11px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'active', label: 'Active Now' },
              { id: 'on_time', label: 'On Time' },
              { id: 'late', label: 'Late Arrival' },
              { id: 'overtime', label: 'Overtime' },
            ].map((s) => {
              const isChecked = statusFilter === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onStatusFilterChange?.(s.id)}
                  className={`h-8 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isChecked
                      ? 'bg-stocky-primary/10 border-stocky-primary/40 text-stocky-primary font-semibold'
                      : 'bg-white border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-text-main'
                  }`}
                >
                  {isChecked && <CheckIcon size="xs" />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Footer */}
      {!isMobile && (
        <div className="px-5 py-3.5 border-t border-stocky-border-subtle bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-stocky-text-sub">
            {activeFilterCount > 0 ? (
              <span><strong className="font-semibold text-stocky-text-main">{activeFilterCount}</strong> active filters</span>
            ) : (
              'Showing all shifts'
            )}
          </span>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-8 px-3 rounded-full text-xs font-medium text-stocky-text-sub hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              className="h-8 px-5 rounded-full bg-stocky-text-main text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <>
      <StandardToolbarWidget
        searchQuery={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={t('attendance.searchPlaceholder') || "Search employee, branch, status..."}
        isFilterOpen={isFilterDrawerOpen}
        onToggleFilter={onLocationFilterChange ? () => setIsFilterDrawerOpen((prev) => !prev) : undefined}
        activeFilterCount={activeFilterCount}
        primaryAction={
          onRequestLeave
            ? {
                label: t('attendance.requestLeave') || 'Request Leave',
                shortLabel: t('attendance.timeOff') || 'Time Off',
                icon: <PlusIcon size="xs" />,
                onClick: onRequestLeave,
                title: t('attendance.requestLeave') || 'Request time off / leave',
              }
            : undefined
        }
        moreActions={moreActions}
        moreActionsTitle={t('common.actions') || "Attendance Actions"}
      />

      {/* Floating Filter Panel (Desktop) */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <div
            ref={filterPanelRef}
            className="hidden sm:block absolute top-[calc(100%+8px)] inset-x-3 sm:inset-x-3.5 z-50"
          >
            {attendanceFilterContent(false)}
          </div>
        )}
      </AnimatePresence>

      {/* Filter Bottom Sheet Drawer (Mobile) */}
      <div className="sm:hidden">
        <BottomSheet
          mobileOnly
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title={t('attendance.filterTimesheets') || "Filter Timesheets"}
          subtitle={t('attendance.filterTimesheetsSubtitle') || "Filter shifts by branch location and punch status"}
          footer={
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={activeFilterCount === 0}
                className="text-xs font-medium text-stocky-text-sub hover:text-stocky-text-main disabled:opacity-40 cursor-pointer"
              >
                {t('common.resetFilters') || "Reset filters"}
              </button>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-semibold cursor-pointer shadow-xs"
              >
                {t('common.apply') || "Apply filters"}
              </button>
            </div>
          }
        >
          {attendanceFilterContent(true)}
        </BottomSheet>
      </div>
    </>
  );
}
