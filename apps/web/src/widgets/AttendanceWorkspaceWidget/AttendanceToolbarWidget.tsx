'use client';

import React, { useState } from 'react';
import {
  SearchIcon,
  PlusIcon,
  FileSpreadsheetIcon,
  FilterIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import type { Location } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';

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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const activeFilterCount = (locationFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const handleResetFilters = () => {
    onLocationFilterChange?.('all');
    onStatusFilterChange?.('all');
  };

  return (
    <>
      <div className="stocky-stock-table-toolbar relative flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* 1. Search Input & Mobile Filter Trigger */}
        <div className="stocky-stock-table-toolbar__search-group flex items-center gap-2 min-w-0 flex-1">
          <div className="relative min-w-0 flex-1">
            <SearchIcon
              size="xs"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stocky-text-sub"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search employee, branch, status, or date..."
              className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget pl-9 pr-9 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Button */}
          {onLocationFilterChange && (
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`h-10 px-3 sm:px-3.5 rounded-full border text-xs font-medium inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                activeFilterCount > 0
                  ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                  : 'border-stocky-border-subtle bg-stocky-bg-widget text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary'
              }`}
              title="Filter timesheets by branch and status"
            >
              <FilterIcon size="xs" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-stocky-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* 2. Actions Group (Full width on mobile) */}
        <div className="stocky-stock-table-toolbar__actions flex items-center gap-2 justify-end shrink-0 w-full sm:w-auto">
          {/* Export Excel Button */}
          <button
            type="button"
            onClick={onExportExcel}
            title="Export Timesheets to Excel"
            className="stocky-table-toolbar-button h-10 px-4 flex-1 sm:flex-initial rounded-full border border-stocky-border-subtle bg-stocky-bg-widget text-xs font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shadow-sm"
          >
            <FileSpreadsheetIcon size="xs" />
            <span>Export Excel</span>
          </button>

          {/* Optional Action Button: Request Leave */}
          {onRequestLeave && (
            <button
              type="button"
              onClick={onRequestLeave}
              className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 flex-1 sm:flex-initial rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
            >
              <PlusIcon size="xs" />
              <span>Request Leave</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bottom Sheet Drawer */}
      <SideDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        ariaLabel="Filter Timesheets"
      >
        <div className="flex flex-col h-full bg-stocky-bg-widget">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stocky-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-stocky-primary/10 border border-stocky-primary/20 flex items-center justify-center text-stocky-primary">
                <FilterIcon size="xs" />
              </div>
              <h3 className="text-sm font-bold text-stocky-text-main">Filter Timesheets</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              className="p-1.5 rounded-full text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              <XIcon size="xs" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Branch / Location */}
            <div>
              <label className="block text-xs font-semibold text-stocky-text-main mb-1.5">
                Branch / Location
              </label>
              <div className="relative">
                <WarehouseIcon
                  size="xs"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stocky-text-sub"
                />
                <select
                  value={locationFilter}
                  onChange={(e) => onLocationFilterChange?.(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stocky-border-subtle bg-stocky-bg-global pl-9 pr-8 text-xs font-medium text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shift Status */}
            <div>
              <label className="block text-xs font-semibold text-stocky-text-main mb-1.5">
                Shift Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'All Statuses' },
                  { id: 'active', label: 'Active Now' },
                  { id: 'on_time', label: 'On Time' },
                  { id: 'late', label: 'Late Arrival' },
                  { id: 'overtime', label: 'Overtime' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onStatusFilterChange?.(s.id)}
                    className={`h-9 px-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer text-left ${
                      statusFilter === s.id
                        ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                        : 'border-stocky-border-subtle bg-stocky-bg-global/50 text-stocky-text-main hover:border-stocky-border-strong'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stocky-border-subtle bg-stocky-bg-global/50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={activeFilterCount === 0}
              className="text-xs font-medium text-stocky-text-sub hover:text-stocky-text-main disabled:opacity-40 cursor-pointer"
            >
              Reset filters
            </button>
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-5 rounded-full text-xs font-semibold cursor-pointer shadow-sm"
            >
              Apply filters
            </button>
          </div>
        </div>
      </SideDrawer>
    </>
  );
}

