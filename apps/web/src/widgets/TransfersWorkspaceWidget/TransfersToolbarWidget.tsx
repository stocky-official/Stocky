'use client';

import React from 'react';
import { FilterIcon, PlusIcon, SearchIcon, XIcon } from '@stocky/icons';

export type TransferQueue = 'all' | 'action' | 'incoming' | 'outgoing';

export interface TransfersToolbarWidgetProps {
  search: string;
  onSearchChange: (value: string) => void;
  queue: TransferQueue;
  onQueueChange: (queue: TransferQueue) => void;
  onRequestStock: () => void;
  filterPanelOpen?: boolean;
  onToggleFilterPanel?: () => void;
  isFilterActive?: boolean;
  activeFilterCount?: number;
}

export function TransfersToolbarWidget({
  search,
  onSearchChange,
  queue,
  onQueueChange,
  onRequestStock,
  filterPanelOpen = false,
  onToggleFilterPanel,
  isFilterActive = false,
  activeFilterCount = 0,
}: TransfersToolbarWidgetProps) {
  const queueTabs: Array<{ id: TransferQueue; label: string }> = [
    { id: 'action', label: 'Needs action' },
    { id: 'incoming', label: 'Incoming' },
    { id: 'outgoing', label: 'Outgoing' },
    { id: 'all', label: 'All transfers' },
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
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search transfers, locations, or products..."
            className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget pl-9 pr-16 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <XIcon size="xs" />
            </button>
          )}
          {onToggleFilterPanel && (
            <button
              type="button"
              onClick={onToggleFilterPanel}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                filterPanelOpen || isFilterActive || activeFilterCount > 0
                  ? 'bg-stocky-primary text-white hover:bg-stocky-primary-hover'
                  : 'text-stocky-text-sub hover:bg-stocky-bg-hover hover:text-stocky-text-main'
              }`}
              title="Open transfers filter panel"
              aria-label="Filter transfers"
            >
              <FilterIcon size="xs" />
              {activeFilterCount > 0 && (
                <span className="sr-only">({activeFilterCount} active)</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Queue Tabs & Primary Action */}
      <div className="stocky-stock-table-toolbar__actions flex items-center justify-between sm:justify-end gap-2 flex-1 sm:flex-initial min-w-0 max-w-full">
        <div
          className="stocky-transfer-toolbar__queues stocky-mobile-pill-rail flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5"
          role="tablist"
          aria-label="Transfer queues"
        >
          {queueTabs.map((tab) => {
            const isActive = queue === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onQueueChange(tab.id)}
                className={`stocky-table-toolbar-button shrink-0 h-10 px-3.5 sm:px-4 rounded-full text-xs font-medium inline-flex items-center justify-center whitespace-nowrap cursor-pointer transition-colors ${
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
          onClick={onRequestStock}
          className="stocky-table-toolbar-button stocky-table-toolbar-button--primary shrink-0 h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <PlusIcon size="xs" /> <span>Request stock</span>
        </button>
      </div>
    </div>
  );
}
