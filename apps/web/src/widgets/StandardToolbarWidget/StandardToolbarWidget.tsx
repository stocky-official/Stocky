'use client';

import React, { useState } from 'react';
import { FilterIcon, MoreHorizontalIcon, PlusIcon, SearchIcon, XIcon } from '@stocky/icons';
import { ActionsBottomSheet, type ActionItem } from '@/components/ui/ActionsBottomSheet';
import { useTranslation } from '@/lib/i18n';

export interface StandardToolbarAction {
  label: string;
  shortLabel?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export interface StandardToolbarWidgetProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;

  // Filter
  isFilterOpen?: boolean;
  onToggleFilter?: () => void;
  activeFilterCount?: number;

  // Actions
  primaryAction?: StandardToolbarAction;
  moreActions?: ActionItem[];
  moreActionsTitle?: string;

  // View Switcher / Slots
  viewSwitcher?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Standardized Platform Page Toolbar.
 *
 * Mobile (< 640px):
 *   - Strictly a single 40px row:
 *     [ Search ... | ⚙ Filter ] (flex-1) + [ Optional Switcher ] + [ + Action ] + [ ••• More ]
 *   - Secondary actions collapse into the ActionsBottomSheet (slide from bottom).
 *
 * Desktop (>= 640px):
 *   - Full spacious row with search input on left and inline pill buttons on right.
 */
export function StandardToolbarWidget({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  isFilterOpen = false,
  onToggleFilter,
  activeFilterCount = 0,
  primaryAction,
  moreActions = [],
  moreActionsTitle,
  viewSwitcher,
  children,
  className = '',
}: StandardToolbarWidgetProps) {
  const { t } = useTranslation();
  const [isActionsDrawerOpen, setIsActionsDrawerOpen] = useState(false);
  const hasMoreActions = moreActions && moreActions.length > 0;
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('toolbar.searchPlaceholder');
  const resolvedMoreActionsTitle = moreActionsTitle ?? t('toolbar.actions');

  return (
    <>
      <div
        className={`stocky-standard-toolbar relative flex items-center justify-between gap-2 sm:gap-3 w-full ${className}`.trim()}
      >
        {/* 1. Search + Split Filter Pill */}
        <div className="stocky-standard-toolbar__search-group min-w-0 flex-1">
          <div
            className={`stocky-split-search-field min-w-0 flex-1 ${
              !onToggleFilter ? 'stocky-split-search-field--no-filter' : ''
            }`}
          >
            <div className="stocky-split-search-field__input-wrap">
              <SearchIcon
                size="xs"
                className="pointer-events-none text-stocky-text-sub shrink-0"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={resolvedSearchPlaceholder}
                className="stocky-split-search-field__input"
                aria-label={t('toolbar.search')}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="stocky-split-search-field__clear-btn"
                  aria-label={t('toolbar.clearSearch')}
                  title={t('toolbar.clearSearch')}
                >
                  <XIcon size="xs" />
                </button>
              ) : null}
            </div>

            {onToggleFilter && (
              <button
                type="button"
                onClick={onToggleFilter}
                aria-label={t('toolbar.filter')}
                aria-expanded={isFilterOpen}
                className={`stocky-split-search-field__filter-btn ${
                  isFilterOpen || activeFilterCount > 0
                    ? 'stocky-split-search-field__filter-btn--active'
                    : ''
                }`}
                title={t('toolbar.openFilters')}
              >
                <FilterIcon size="xs" />
                {activeFilterCount > 0 && (
                  <span className="stocky-split-search-field__badge">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 2. Actions & Optional View Switcher */}
        <div className="stocky-standard-toolbar__actions flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Optional View Switcher slot (e.g. Table / Kanban, Table / Org) */}
          {viewSwitcher && (
            <div className="flex items-center shrink-0">
              {viewSwitcher}
            </div>
          )}

          {/* Desktop Only: Secondary Action Pills (Inline) */}
          {hasMoreActions && (
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
              {moreActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className="stocky-table-toolbar-button"
                  title={action.description || action.label}
                >
                  {action.icon && <span className="shrink-0">{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Custom Children slot (desktop) */}
          {children && (
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
              {children}
            </div>
          )}

          {/* Primary Action Button: Perfect 40x40 circle on mobile, pill with text on desktop */}
          {primaryAction && (
            <button
              type="button"
              disabled={primaryAction.disabled}
              onClick={primaryAction.onClick}
              title={primaryAction.title || primaryAction.label}
              className={`stocky-standard-toolbar__circle-btn stocky-standard-toolbar__circle-btn--primary sm:w-auto text-xs font-semibold cursor-pointer active:scale-95 shrink-0 ${
                primaryAction.className || ''
              }`.trim()}
            >
              {primaryAction.icon || <PlusIcon size="xs" />}
              <span className="hidden sm:inline sm:ms-1.5">{primaryAction.label}</span>
            </button>
          )}

          {/* Mobile Only: ••• More Actions Trigger: Perfect 40x40 circle */}
          {hasMoreActions && (
            <button
              type="button"
              onClick={() => setIsActionsDrawerOpen(true)}
              aria-label={t('toolbar.moreActions')}
              title={t('toolbar.moreActions')}
              className="stocky-standard-toolbar__circle-btn stocky-standard-toolbar__circle-btn--secondary flex sm:hidden text-xs cursor-pointer active:scale-95 shrink-0"
            >
              <MoreHorizontalIcon size="xs" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Actions Bottom Sheet Drawer */}
      {hasMoreActions && (
        <ActionsBottomSheet
          isOpen={isActionsDrawerOpen}
          onClose={() => setIsActionsDrawerOpen(false)}
          title={resolvedMoreActionsTitle}
          actions={moreActions}
        />
      )}
    </>
  );
}
