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
      <div className="stocky-stock-table-toolbar__actions flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:ml-auto">
        <div
          className="grid grid-cols-4 gap-1 w-full sm:flex sm:items-center sm:gap-1.5 sm:w-auto"
          role="tablist"
          aria-label="Transfer queues"
        >
          {queueTabs.map((tab) => {
            const isActive = queue === tab.id;
            const mobileLabel =
              tab.id === 'action'
                ? 'Action'
                : tab.id === 'all'
                ? 'All'
                : tab.label;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onQueueChange(tab.id)}
                className={`stocky-table-toolbar-button w-full sm:w-auto h-10 px-1 sm:px-4 rounded-full text-xs font-medium inline-flex items-center justify-center whitespace-nowrap cursor-pointer transition-colors ${
                  isActive
                    ? 'stocky-table-toolbar-button--active border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                    : 'border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary'
                }`}
              >
                <span className="sm:hidden">{mobileLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onRequestStock}
          className="stocky-table-toolbar-button stocky-table-toolbar-button--primary w-full sm:w-auto h-10 px-4 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <PlusIcon size="xs" /> <span><span className="sm:hidden">Request</span><span className="hidden sm:inline">Request stock</span></span>
        </button>
      </div>
    </div>
  );
}
