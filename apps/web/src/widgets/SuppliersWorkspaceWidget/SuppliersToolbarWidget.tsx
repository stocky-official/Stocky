'use client';

import React from 'react';
import { ArrowDownIcon, FilterIcon, PlusIcon, SearchIcon, XIcon } from '@stocky/icons';

export interface SuppliersToolbarWidgetProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterPanelOpen: boolean;
  onToggleFilterPanel: () => void;
  activeFilterCount: number;
  canManageSuppliers: boolean;
  onExport: () => void;
  onAddSupplier: () => void;
}

export function SuppliersToolbarWidget({
  searchQuery,
  onSearchChange,
  filterPanelOpen,
  onToggleFilterPanel,
  activeFilterCount,
  canManageSuppliers,
  onExport,
  onAddSupplier,
}: SuppliersToolbarWidgetProps) {
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
            placeholder="Search suppliers, addresses, products, or contacts..."
            className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget pl-9 pr-10 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
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

          {/* Filter Popover Button */}
          <button
            type="button"
            onClick={onToggleFilterPanel}
            aria-label="Filter columns"
            aria-expanded={filterPanelOpen}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              filterPanelOpen || activeFilterCount > 0
                ? 'bg-stocky-primary text-white hover:bg-stocky-primary-hover'
                : 'text-stocky-text-sub hover:bg-stocky-bg-hover hover:text-stocky-text-main'
            }`}
            title="Filter by column"
          >
            <FilterIcon size="xs" />
            {activeFilterCount > 0 && !filterPanelOpen && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-stocky-primary px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="stocky-stock-table-toolbar__actions flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onExport}
          className="stocky-table-toolbar-button h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary"
          title="Export suppliers to Excel"
        >
          <ArrowDownIcon size="xs" />
          <span>Export</span>
        </button>

        {canManageSuppliers && (
          <button
            type="button"
            onClick={onAddSupplier}
            className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <PlusIcon size="xs" />
            <span>Add supplier</span>
          </button>
        )}
      </div>
    </div>
  );
}
