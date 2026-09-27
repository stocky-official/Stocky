'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  secondaryActions?: StandardToolbarAction[];
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
 *     [ Search ... | ⚙ Filter ] (flex-1) + [ Optional Switcher ] + [ ••• More ] + [ + Action ]
 *   - Secondary / more actions open from the bottom in ActionsBottomSheet drawer.
 *
 * Desktop (>= 640px):
 *   - Full spacious row with search input on left and actions on right.
 *   - Clicking '••• More' opens a floating hovering menu popover anchored to the button.
 */
export function StandardToolbarWidget({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  isFilterOpen = false,
  onToggleFilter,
  activeFilterCount = 0,
  primaryAction,
  secondaryActions = [],
  moreActions = [],
  moreActionsTitle,
  viewSwitcher,
  children,
  className = '',
}: StandardToolbarWidgetProps) {
  const { t, isRtl } = useTranslation();
  const [isActionsDrawerOpen, setIsActionsDrawerOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const hasMoreActions = Boolean(moreActions && moreActions.length > 0);
  const hasSecondaryActions = Boolean(secondaryActions && secondaryActions.length > 0);

  // Dismiss desktop hovering menu on click outside or Escape key
  useEffect(() => {
    if (!isDesktopMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsDesktopMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDesktopMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDesktopMenuOpen]);

  // For phone viewports: combine secondaryActions (if any) and moreActions into the bottom drawer
  const allMobileActions: ActionItem[] = [
    ...secondaryActions.map((action, idx) => ({
      id: `sec-${idx}`,
      label: action.label,
      icon: action.icon,
      onClick: action.onClick,
      disabled: action.disabled,
      description: action.title,
    })),
    ...moreActions,
  ];
  const hasMobileActions = allMobileActions.length > 0;

  const handleMoreButtonClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setIsActionsDrawerOpen(true);
    } else {
      setIsDesktopMenuOpen((prev) => !prev);
    }
  };

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

          {/* ••• More Actions Trigger Container (anchors hovering menu on desktop) */}
          {(hasMoreActions || hasMobileActions) && (
            <div className="relative shrink-0" ref={moreMenuRef}>
              <button
                type="button"
                onClick={handleMoreButtonClick}
                aria-label={t('toolbar.moreActions') || 'More actions'}
                title={t('toolbar.moreActions') || 'More actions'}
                aria-expanded={isDesktopMenuOpen}
                aria-haspopup="menu"
                className={`stocky-standard-toolbar__circle-btn stocky-standard-toolbar__circle-btn--secondary text-xs cursor-pointer active:scale-95 shrink-0 ${
                  isDesktopMenuOpen ? 'stocky-standard-toolbar__circle-btn--active bg-stocky-bg-global border-stocky-border-default' : ''
                } ${hasMoreActions ? '' : 'sm:hidden'}`}
              >
                <MoreHorizontalIcon size="xs" />
              </button>

              {/* Desktop Hovering Menu Popover */}
              {hasMoreActions && (
                <AnimatePresence>
                  {isDesktopMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="hidden sm:flex absolute top-[calc(100%+6px)] right-0 z-50 min-w-[220px] max-w-xs flex-col p-1.5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl shadow-bevel-float"
                      role="menu"
                      aria-orientation="vertical"
                      dir={isRtl ? 'rtl' : 'ltr'}
                    >
                      {moreActions.map((action, idx) => {
                        const isCritical = action.tone === 'critical';
                        return (
                          <button
                            key={action.id || action.label || idx}
                            type="button"
                            role="menuitem"
                            disabled={action.disabled}
                            onClick={() => {
                              if (action.disabled) return;
                              setIsDesktopMenuOpen(false);
                              action.onClick();
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-start transition-colors cursor-pointer select-none ${
                              action.disabled
                                ? 'opacity-40 cursor-not-allowed'
                                : isCritical
                                ? 'hover:bg-stocky-status-critical-bg active:bg-stocky-status-critical-bg text-stocky-status-critical-fg'
                                : 'hover:bg-stocky-bg-global active:bg-stocky-border-subtle/50 text-stocky-text-main'
                            }`}
                          >
                            {action.icon && (
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                  isCritical
                                    ? 'bg-stocky-status-critical-bg text-stocky-status-critical-fg'
                                    : 'bg-stocky-bg-global text-stocky-text-main border border-stocky-border-subtle'
                                }`}
                              >
                                {action.icon}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-xs font-semibold truncate ${
                                  isCritical ? 'text-stocky-status-critical-fg' : 'text-stocky-text-main'
                                }`}
                              >
                                {action.label}
                              </div>
                              {action.description && (
                                <div className="text-[11px] text-stocky-text-sub truncate mt-0.5">
                                  {action.description}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* Desktop Only: Explicit Secondary Action Pills (Inline) */}
          {hasSecondaryActions && (
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
              {secondaryActions.map((action, idx) => (
                <button
                  key={action.title || action.label || idx}
                  type="button"
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className={`stocky-table-toolbar-button h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                    action.className || ''
                  }`.trim()}
                  title={action.title || action.label}
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
        </div>
      </div>

      {/* Mobile Actions Bottom Sheet Drawer */}
      {hasMobileActions && (
        <ActionsBottomSheet
          isOpen={isActionsDrawerOpen}
          onClose={() => setIsActionsDrawerOpen(false)}
          title={resolvedMoreActionsTitle}
          actions={allMobileActions}
          mobileOnly
        />
      )}
    </>
  );
}

