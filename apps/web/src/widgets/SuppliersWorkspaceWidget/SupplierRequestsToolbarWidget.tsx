'use client';

import React from 'react';
import { FilterIcon, PlusIcon, SearchIcon, XIcon } from '@stocky/icons';
import type { SupplierRequest } from '@stocky/types';

export type SupplierRequestStatusFilter = 'all' | SupplierRequest['status'];

export interface SupplierRequestsToolbarWidgetProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: SupplierRequestStatusFilter;
  onStatusFilterChange: (status: SupplierRequestStatusFilter) => void;
  onCreateRequest: () => void;
  filterPanelOpen?: boolean;
  onToggleFilterPanel?: () => void;
  isFilterActive?: boolean;
  activeFilterCount?: number;
}

export function SupplierRequestsToolbarWidget({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCreateRequest,
  filterPanelOpen = false,
  onToggleFilterPanel,
  isFilterActive = false,
  activeFilterCount = 0,
}: SupplierRequestsToolbarWidgetProps) {
  const statusTabs: Array<{ id: SupplierRequestStatusFilter; label: string }> = [
    { id: 'all', label: 'All requests' },
    { id: 'open', label: 'Open' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'ordered', label: 'Ordered' },
    { id: 'received', label: 'Received' },
    { id: 'closed', label: 'Closed' },
  ];

  return (
    <div className="stocky-stock-table-toolbar relative">
      {/* Search Input Group */}
      <div className="stocky-stock-table-toolbar__search-group flex items-center gap-2 min-w-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            size="xs"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stocky-text-sub"
          />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search requests by product, supplier, or location..."
            className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget pl-9 pr-16 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <XIcon size="xs" />
            </button>
          ) : null}

          {onToggleFilterPanel && (
            <button
              type="button"
              onClick={onToggleFilterPanel}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                filterPanelOpen || isFilterActive || activeFilterCount > 0
                  ? 'bg-stocky-primary text-white hover:bg-stocky-primary-hover'
                  : 'text-stocky-text-sub hover:bg-stocky-bg-hover hover:text-stocky-text-main'
              }`}
              title="Open requests filter panel"
              aria-label="Filter requests"
            >
              <FilterIcon size="xs" />
              {activeFilterCount > 0 && (
                <span className="sr-only">({activeFilterCount} active)</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status Queue Tabs & Primary Action */}
      <div className="stocky-stock-table-toolbar__actions flex items-center justify-between sm:justify-end gap-2 flex-1 sm:flex-initial min-w-0 max-w-full">
        <div
          className="stocky-mobile-pill-rail flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5"
          role="tablist"
          aria-label="Request status filters"
        >
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onStatusFilterChange(tab.id)}
                className={`stocky-table-toolbar-button shrink-0 h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center whitespace-nowrap cursor-pointer transition-colors ${
                  isActive
                    ? 'stocky-table-toolbar-button--active border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                    : 'border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCreateRequest}
          className="stocky-table-toolbar-button stocky-table-toolbar-button--primary shrink-0 h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <PlusIcon size="xs" />
          <span>New request</span>
        </button>
      </div>
    </div>
  );
}
