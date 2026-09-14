'use client';

import React from 'react';
import {
  SearchIcon,
  PlusIcon,
  FileSpreadsheetIcon,
} from '@stocky/icons';

export type AttendanceTab = 'timesheets' | 'calendar' | 'leaves' | 'kiosk';

export interface AttendanceToolbarWidgetProps {
  search: string;
  onSearchChange: (search: string) => void;
  activeTab?: AttendanceTab;
  onTabChange?: (tab: AttendanceTab) => void;
  onExportExcel: () => void;
  onRequestLeave?: () => void;
  userRole?: string;
}

export function AttendanceToolbarWidget({
  search,
  onSearchChange,
  activeTab = 'timesheets',
  onExportExcel,
  onRequestLeave,
}: AttendanceToolbarWidgetProps) {
  return (
    <div className="stocky-stock-table-toolbar relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* 1. Search Input Group */}
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
      </div>

      {/* 2. Actions Group */}
      <div className="stocky-stock-table-toolbar__actions flex items-center gap-2 justify-end shrink-0">
        {/* Export Excel Button */}
        <button
          type="button"
          onClick={onExportExcel}
          title="Export Timesheets to Excel"
          className="stocky-table-toolbar-button h-10 px-3.5 sm:px-4 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget text-xs font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shadow-sm"
        >
          <FileSpreadsheetIcon size="xs" />
          <span className="hidden sm:inline">Export Excel</span>
          <span className="sm:hidden">Excel</span>
        </button>

        {/* Optional Action Button: Request Leave */}
        {onRequestLeave && (
          <button
            type="button"
            onClick={onRequestLeave}
            className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
          >
            <PlusIcon size="xs" />
            <span>Request Leave</span>
          </button>
        )}
      </div>
    </div>
  );
}

