'use client';

import React from 'react';
import { PlusIcon, SearchIcon, XIcon } from '@stocky/icons';
import type { SupplierRequest } from '@stocky/types';

export type SupplierRequestStatusFilter = 'all' | SupplierRequest['status'];

export interface SupplierRequestsToolbarWidgetProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: SupplierRequestStatusFilter;
  onStatusFilterChange: (status: SupplierRequestStatusFilter) => void;
  onCreateRequest: () => void;
}

export function SupplierRequestsToolbarWidget({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCreateRequest,
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
            className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget pl-9 pr-9 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <XIcon size="xs" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Status Queue Tabs & Primary Action */}
      <div className="stocky-stock-table-toolbar__actions flex items-center gap-2 shrink-0">
        <div className="inline-flex items-center gap-1.5 overflow-x-auto" role="tablist" aria-label="Request status filters">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onStatusFilterChange(tab.id)}
                className={`stocky-table-toolbar-button h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center whitespace-nowrap cursor-pointer transition-colors ${
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
          className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <PlusIcon size="xs" />
          <span>New request</span>
        </button>
      </div>
    </div>
  );
}
