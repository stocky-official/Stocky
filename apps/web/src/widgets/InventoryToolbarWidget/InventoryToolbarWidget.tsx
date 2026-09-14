'use client';

import React from 'react';
import {
  CheckCircleIcon,
  CloudDownloadIcon,
  CloudUploadIcon,
  FilterIcon,
  MailIcon,
  PlusIcon,
  SearchIcon,
} from '@stocky/icons';

export interface InventoryToolbarWidgetProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterPanelOpen?: boolean;
  onToggleFilterPanel?: () => void;
  isFilterActive?: boolean;
  filterContent?: React.ReactNode;
  canImport?: boolean;
  onImport?: () => void;
  onExport?: () => void;
  canManageTasks?: boolean;
  onAudit?: () => void;
  onResupply?: () => void;
  onReceive: () => void;
}

/**
 * Modular toolbar component for Inventory workspace.
 * Follows strict 4/8-point spatial tokens:
 * - Height: var(--stocky-height-control) (40px)
 * - Gap: var(--stocky-element-gap) (8px)
 * - Radii: var(--stocky-radius-full)
 */
export function InventoryToolbarWidget({
  searchQuery,
  onSearchChange,
  filterPanelOpen = false,
  onToggleFilterPanel,
  isFilterActive = false,
  filterContent,
  canImport = false,
  onImport,
  onExport,
  canManageTasks = false,
  onAudit,
  onResupply,
  onReceive,
}: InventoryToolbarWidgetProps) {
  return (
    <div className="stocky-stock-table-toolbar relative">
      <div className="stocky-stock-table-toolbar__search-group flex items-center gap-2 min-w-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            size="xs"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stocky-text-sub"
          />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search product or barcode..."
            className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget pl-9 pr-10 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none"
          />
          {onToggleFilterPanel && (
            <button
              type="button"
              onClick={onToggleFilterPanel}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                filterPanelOpen || isFilterActive
                  ? 'bg-stocky-primary text-white hover:bg-stocky-primary-hover'
                  : 'text-stocky-text-sub hover:bg-stocky-bg-hover hover:text-stocky-text-main'
              }`}
              title="Open advanced filter panel"
              aria-label="Filter inventory"
            >
              <FilterIcon size="xs" />
            </button>
          )}
        </div>
      </div>

      <div className="stocky-stock-table-toolbar__actions flex items-center gap-2 overflow-x-auto py-0.5">
        {canImport && onImport && (
          <button
            type="button"
            onClick={onImport}
            className="stocky-table-toolbar-button shrink-0"
            title="Import stock data"
          >
            <CloudUploadIcon size="xs" />
            <span>Import</span>
          </button>
        )}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="stocky-table-toolbar-button shrink-0"
            title="Export stock data"
          >
            <CloudDownloadIcon size="xs" />
            <span>Export</span>
          </button>
        )}
        {canManageTasks && onAudit && (
          <button
            type="button"
            onClick={onAudit}
            className="stocky-table-toolbar-button shrink-0"
          >
            <CheckCircleIcon size="xs" /> <span>Audit</span>
          </button>
        )}
        {onResupply && (
          <button
            type="button"
            onClick={onResupply}
            className="stocky-table-toolbar-button shrink-0"
            title="Compose supplier resupply email"
          >
            <MailIcon size="xs" /> <span>Resupply</span>
          </button>
        )}
        <button
          type="button"
          onClick={onReceive}
          className="stocky-table-toolbar-button stocky-table-toolbar-button--primary shrink-0"
        >
          <PlusIcon size="xs" /> <span>Add inventory</span>
        </button>
      </div>
    </div>
  );
}
