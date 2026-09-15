'use client';

import React, { useState } from 'react';
import {
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

  const activeFilterCount =
    (locationFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const handleResetFilters = () => {
    onLocationFilterChange?.('all');
    onStatusFilterChange?.('all');
  };

  const moreActions: ActionItem[] = [
    {
      id: 'export-excel',
      label: 'Export Timesheets',
      description: 'Download timesheet logs and shift records to Excel',
      icon: <FileSpreadsheetIcon size="xs" />,
      onClick: onExportExcel,
    },
  ];

  return (
    <>
      <StandardToolbarWidget
        searchQuery={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search employee, branch, status..."
        isFilterOpen={isFilterDrawerOpen}
        onToggleFilter={onLocationFilterChange ? () => setIsFilterDrawerOpen(true) : undefined}
        activeFilterCount={activeFilterCount}
        primaryAction={
          onRequestLeave
            ? {
                label: 'Request Leave',
                icon: <PlusIcon size="xs" />,
                onClick: onRequestLeave,
                title: 'Request time off / leave',
              }
            : undefined
        }
        moreActions={moreActions}
        moreActionsTitle="Attendance Actions"
      />

      {/* Filter Bottom Sheet Drawer */}
      <BottomSheet
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Timesheets"
        subtitle="Filter shifts by branch location and punch status"
        footer={
          <div className="flex items-center justify-between gap-3">
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
              className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-9 px-4 rounded-full text-xs font-semibold cursor-pointer shadow-xs"
            >
              Apply filters
            </button>
          </div>
        }
      >
        <div className="space-y-4">
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
      </BottomSheet>
    </>
  );
}
