'use client';

import React from 'react';
import { FilterIcon, PlusIcon, SearchIcon, XIcon } from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

export type TransferQueue = 'all' | 'action' | 'incoming' | 'outgoing';

export interface TransfersToolbarWidgetProps {
  search: string;
  onSearchChange: (value: string) => void;
  queue?: TransferQueue;
  onQueueChange?: (queue: TransferQueue) => void;
  onRequestStock: () => void;
  filterPanelOpen?: boolean;
  onToggleFilterPanel?: () => void;
  isFilterActive?: boolean;
  activeFilterCount?: number;
}

export function TransfersToolbarWidget({
  search,
  onSearchChange,
  queue = 'all',
  onQueueChange,
  onRequestStock,
  filterPanelOpen = false,
  onToggleFilterPanel,
  isFilterActive = false,
  activeFilterCount = 0,
}: TransfersToolbarWidgetProps) {
  const { t } = useTranslation();

  return (
    <div className="stocky-stock-table-toolbar relative">
      {/* Search Input Group */}
      <div className="stocky-stock-table-toolbar__search-group flex items-center gap-2 min-w-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            size="xs"
            className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-stocky-text-sub"
          />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('transfers.searchPlaceholder')}
            className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget ps-9 pe-16 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute end-9 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main transition-colors cursor-pointer"
              aria-label={t('common.close')}
            >
              <XIcon size="xs" />
            </button>
          )}
          {onToggleFilterPanel && (
            <button
              type="button"
              onClick={onToggleFilterPanel}
                className={`absolute end-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                filterPanelOpen || isFilterActive || activeFilterCount > 0
                  ? 'bg-stocky-primary text-white hover:bg-stocky-primary-hover'
                  : 'text-stocky-text-sub hover:bg-stocky-bg-hover hover:text-stocky-text-main'
              }`}
              title={t('transfers.filterTransfers')}
              aria-label={t('transfers.filterTransfers')}
              aria-expanded={filterPanelOpen}
            >
              <FilterIcon size="xs" />
              {activeFilterCount > 0 && (
                <span className="sr-only">({activeFilterCount} active)</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Primary Action */}
      <div className="stocky-stock-table-toolbar__actions flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
        {onQueueChange && (
          <div className="stocky-transfer-toolbar__queues flex-wrap" role="tablist" aria-label={t('transfers.transferStatus')}>
            {([
              ['all', t('transfers.allQueues')],
              ['action', t('transfers.needsAction')],
              ['incoming', t('transfers.incoming')],
              ['outgoing', t('transfers.outgoing')],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={queue === id}
                onClick={() => onQueueChange(id)}
                className={`stocky-table-toolbar-button h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${queue === id ? 'stocky-table-toolbar-button--active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onRequestStock}
          className="stocky-table-toolbar-button stocky-table-toolbar-button--primary w-full sm:w-auto h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <PlusIcon size="xs" /> <span>{t('transfers.requestStock')}</span>
        </button>
      </div>
    </div>
  );
}
