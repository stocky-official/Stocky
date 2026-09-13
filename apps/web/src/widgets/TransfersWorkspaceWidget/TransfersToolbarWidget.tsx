'use client';

import React from 'react';
import { PlusIcon, SearchIcon, XIcon } from '@stocky/icons';

export type TransferQueue = 'all' | 'action' | 'incoming' | 'outgoing';

export interface TransfersToolbarWidgetProps {
  search: string;
  onSearchChange: (value: string) => void;
  queue: TransferQueue;
  onQueueChange: (queue: TransferQueue) => void;
  onRequestStock: () => void;
}

export function TransfersToolbarWidget({
  search,
  onSearchChange,
  queue,
  onQueueChange,
  onRequestStock,
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
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stocky-text-sub"
          />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search transfers, locations, or products..."
            className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget pl-9 pr-9 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <XIcon size="xs" />
            </button>
          )}
        </div>
      </div>

      {/* Queue Tabs & Primary Action */}
      <div className="stocky-stock-table-toolbar__actions flex items-center gap-2 shrink-0">
        <div
          className="stocky-transfer-toolbar__queues inline-flex items-center gap-1.5"
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
          onClick={onRequestStock}
          className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <PlusIcon size="xs" /> Request stock
        </button>
      </div>
    </div>
  );
}
