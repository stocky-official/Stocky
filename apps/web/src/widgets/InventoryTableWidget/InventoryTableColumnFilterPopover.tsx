'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircleIcon,
  ArchiveIcon,
  BarcodeIcon,
  BoxesIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  DollarSignIcon,
  SearchIcon,
  TagIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import type { TableFilters, SortKey, ExpiryFilter } from './InventoryTableWidget';
import { useTranslation } from '@/lib/i18n';

export interface InventoryTableColumnFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  columnKey: SortKey;
  columnLabel: string;
  filters: TableFilters;
  onUpdateFilter: <K extends keyof TableFilters>(key: K, value: TableFilters[K]) => void;
  onResetColumn: (key: SortKey) => void;
  options: string[];
  optionCounts?: Record<string, number>;
}

export type StockTableColumnFilterPopoverProps = InventoryTableColumnFilterPopoverProps;

export function InventoryTableColumnFilterPopover({
  isOpen,
  onClose,
  position,
  columnKey,
  columnLabel,
  filters,
  onUpdateFilter,
  onResetColumn,
  options,
  optionCounts = {},
}: StockTableColumnFilterPopoverProps) {
  const { t, isRtl } = useTranslation();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isTextFilter =
    columnKey === 'product' ||
    columnKey === 'barcode' ||
    columnKey === 'category' ||
    columnKey === 'locations';

  const isNumericFilter = columnKey === 'quantity' || columnKey === 'price';
  const isExpiryFilter = columnKey === 'expiry';
  const isAuditFilter = columnKey === 'audit';

  // Check if any filter is active for this column
  const hasActiveFilter = useMemo(() => {
    switch (columnKey) {
      case 'product':
        return Boolean(filters.product || filters.productValues.length);
      case 'barcode':
        return Boolean(filters.barcode || filters.barcodeValues.length);
      case 'category':
        return Boolean(filters.category || filters.categoryValues.length);
      case 'locations':
        return Boolean(filters.locations || filters.locationValues.length);
      case 'quantity':
        return Boolean(filters.quantityPreset && filters.quantityPreset !== 'all') ||
          Boolean(filters.quantityMin) ||
          Boolean(filters.quantityMax) ||
          Boolean(filters.quantity);
      case 'price':
        return Boolean(filters.pricePreset && filters.pricePreset !== 'all') ||
          Boolean(filters.priceMin) ||
          Boolean(filters.priceMax) ||
          Boolean(filters.price);
      case 'expiry':
        return filters.expiry.length > 0;
      case 'audit':
        return filters.audit.length > 0;
      default:
        return false;
    }
  }, [columnKey, filters]);

  // Filtered options for searchable multi-select
  const filteredOptions = useMemo(() => {
    if (!isTextFilter) return [];
    const query = searchValue.trim().toLowerCase();
    if (!query) return options;
    return options.filter((opt) => opt.toLowerCase().includes(query));
  }, [isTextFilter, options, searchValue]);

  const selectedValues = useMemo(() => {
    switch (columnKey) {
      case 'product':
        return filters.productValues;
      case 'barcode':
        return filters.barcodeValues;
      case 'category':
        return filters.categoryValues;
      case 'locations':
        return filters.locationValues;
      default:
        return [];
    }
  }, [columnKey, filters]);

  const toggleOption = (val: string) => {
    const current = [...selectedValues];
    const index = current.indexOf(val);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(val);
    }
    const targetKey =
      columnKey === 'product'
        ? 'productValues'
        : columnKey === 'barcode'
        ? 'barcodeValues'
        : columnKey === 'category'
        ? 'categoryValues'
        : 'locationValues';
    onUpdateFilter(targetKey, current);
  };

  const selectAllVisible = () => {
    const targetKey =
      columnKey === 'product'
        ? 'productValues'
        : columnKey === 'barcode'
        ? 'barcodeValues'
        : columnKey === 'category'
        ? 'categoryValues'
        : 'locationValues';
    const allSelected = filteredOptions.length > 0 && filteredOptions.every((opt) => selectedValues.includes(opt));
    if (allSelected) {
      // Unselect filtered options
      const remaining = selectedValues.filter((val) => !filteredOptions.includes(val));
      onUpdateFilter(targetKey, remaining);
    } else {
      // Add all filtered options
      const combined = Array.from(new Set([...selectedValues, ...filteredOptions]));
      onUpdateFilter(targetKey, combined);
    }
  };

  const getColumnIcon = () => {
    switch (columnKey) {
      case 'product':
        return <ArchiveIcon size="xs" className="text-stocky-primary" />;
      case 'barcode':
        return <BarcodeIcon size="xs" className="text-stocky-primary" />;
      case 'category':
        return <TagIcon size="xs" className="text-stocky-primary" />;
      case 'locations':
        return <WarehouseIcon size="xs" className="text-stocky-primary" />;
      case 'quantity':
        return <BoxesIcon size="xs" className="text-stocky-primary" />;
      case 'price':
        return <DollarSignIcon size="xs" className="text-stocky-primary" />;
      case 'expiry':
        return <ClockIcon size="xs" className="text-stocky-primary" />;
      case 'audit':
        return <CheckCircleIcon size="xs" className="text-stocky-primary" />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="stock-column-filter-popover"
          data-stock-column-filter
          role="dialog"
          dir={isRtl ? 'rtl' : 'ltr'}
          aria-label={t('inventory.filterColumnTitle', { column: columnLabel })}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{ top: position.top, left: position.left }}
          className="fixed z-50 w-72 sm:w-80 rounded-2xl border border-stocky-border-subtle bg-stocky-bg-widget shadow-xl flex flex-col overflow-hidden text-start"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-stocky-border-subtle px-4 py-3 bg-stocky-bg-global/50">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stocky-primary/10">
                {getColumnIcon()}
              </span>
              <span className="text-xs font-semibold text-stocky-text-main truncate">
                {t('inventory.filterColumnTitle', { column: columnLabel })}
              </span>
              {hasActiveFilter && (
                <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium bg-stocky-primary/10 text-stocky-primary rounded-full border border-stocky-primary/20">
                  {t('inventory.activeBadge')}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-hover hover:text-stocky-text-main transition-colors cursor-pointer"
              aria-label={t('inventory.closeFilterAria')}
            >
              <XIcon size="xs" />
            </button>
          </header>

          {/* Body Content */}
          <div className="p-3.5 space-y-3.5 max-h-[22rem] overflow-y-auto">
            {/* 1. Categorical Multiselect */}
            {isTextFilter && (
              <>
                <div className="relative">
                  <SearchIcon
                    size="xs"
                    className="absolute start-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub pointer-events-none"
                  />
                  <input
                    type="text"
                    autoFocus
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={t('inventory.filterValuesPlaceholder', { label: columnLabel })}
                    className="h-8 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global/50 ps-8 pe-7 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/60 focus:border-stocky-primary focus:bg-stocky-bg-widget focus:outline-none"
                  />
                  {searchValue && (
                    <button
                      type="button"
                      onClick={() => setSearchValue('')}
                      className="absolute end-2 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                      aria-label={t('inventory.clearSearchAria')}
                    >
                      <XIcon size="xs" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-stocky-text-sub px-0.5">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="font-medium text-stocky-primary hover:underline cursor-pointer"
                  >
                    {filteredOptions.length > 0 &&
                    filteredOptions.every((opt) => selectedValues.includes(opt))
                      ? t('inventory.deselectAll')
                      : t('inventory.selectAllVisible')}
                  </button>
                  <span>
                    {filteredOptions.length === 1
                      ? t('inventory.optionCountSingle')
                      : t('inventory.optionsCount', { count: filteredOptions.length })}
                  </span>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto pe-0.5">
                  {filteredOptions.length === 0 ? (
                    <p className="py-6 text-center text-xs text-stocky-text-sub">
                      {t('inventory.noMatchingOptions', { label: columnLabel })}
                    </p>
                  ) : (
                    filteredOptions.map((option) => {
                      const isChecked = selectedValues.includes(option);
                      const count = optionCounts[option];
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleOption(option)}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-start ${
                            isChecked
                              ? 'bg-stocky-primary/5 text-stocky-text-main font-medium'
                              : 'hover:bg-stocky-bg-hover text-stocky-text-sub'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                isChecked
                                  ? 'bg-stocky-primary border-stocky-primary text-stocky-text-inverse'
                                  : 'border-stocky-border-default bg-stocky-bg-widget'
                              }`}
                            >
                              {isChecked && <CheckIcon size="xs" />}
                            </span>
                            <span className="truncate">{option}</span>
                          </div>
                          {count !== undefined && (
                            <span className="shrink-0 text-[10px] text-stocky-text-sub font-normal bg-stocky-bg-global px-1.5 py-0.5 rounded-md">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* 2. Total Quantity Filter */}
            {columnKey === 'quantity' && (
              <div className="space-y-3">
                {/* Presets */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-stocky-text-sub uppercase tracking-wider">
                    {t('inventory.stockStatus')}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'all', label: t('inventory.allStock') },
                      { id: 'in_stock', label: t('inventory.inStockOption') },
                      { id: 'low_stock', label: t('inventory.lowStockOption') },
                      { id: 'out_of_stock', label: t('inventory.outOfStockOption') },
                    ].map((preset) => {
                      const isActive = (filters.quantityPreset || 'all') === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            onUpdateFilter('quantityPreset', preset.id as TableFilters['quantityPreset'])
                          }
                          className={`h-8 px-2.5 rounded-xl border text-xs font-medium text-center transition-colors cursor-pointer ${
                            isActive
                              ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary'
                              : 'border-stocky-border-subtle bg-stocky-bg-global/40 text-stocky-text-sub hover:bg-stocky-bg-hover hover:text-stocky-text-main'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Range */}
                <div className="space-y-1.5 pt-1 border-t border-stocky-border-subtle">
                  <label className="text-[11px] font-medium text-stocky-text-sub uppercase tracking-wider">
                    {t('inventory.customRangeUnits')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-stocky-text-sub block mb-1">{t('inventory.minLabel')}</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.quantityMin || ''}
                        onChange={(e) => onUpdateFilter('quantityMin', e.target.value)}
                        placeholder="0"
                        className="h-8 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-2.5 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stocky-text-sub block mb-1">{t('inventory.maxLabel')}</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.quantityMax || ''}
                        onChange={(e) => onUpdateFilter('quantityMax', e.target.value)}
                        placeholder={t('inventory.noLimit')}
                        className="h-8 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-2.5 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Price Filter */}
            {columnKey === 'price' && (
              <div className="space-y-3">
                {/* Presets */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-stocky-text-sub uppercase tracking-wider">
                    {t('inventory.priceBracket')}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'all', label: t('inventory.allPrices') },
                      { id: 'under_100', label: t('inventory.under100') },
                      { id: '100_500', label: t('inventory.between100_500') },
                      { id: 'over_500', label: t('inventory.over500') },
                    ].map((preset) => {
                      const isActive = (filters.pricePreset || 'all') === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            onUpdateFilter('pricePreset', preset.id as TableFilters['pricePreset'])
                          }
                          className={`h-8 px-2.5 rounded-xl border text-xs font-medium text-center transition-colors cursor-pointer ${
                            isActive
                              ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary'
                              : 'border-stocky-border-subtle bg-stocky-bg-global/40 text-stocky-text-sub hover:bg-stocky-bg-hover hover:text-stocky-text-main'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Range */}
                <div className="space-y-1.5 pt-1 border-t border-stocky-border-subtle">
                  <label className="text-[11px] font-medium text-stocky-text-sub uppercase tracking-wider">
                    {t('inventory.customPriceEgp')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-stocky-text-sub block mb-1">{t('inventory.minPriceLabel')}</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.priceMin || ''}
                        onChange={(e) => onUpdateFilter('priceMin', e.target.value)}
                        placeholder="0.00"
                        className="h-8 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-2.5 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stocky-text-sub block mb-1">{t('inventory.maxPriceLabel')}</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.priceMax || ''}
                        onChange={(e) => onUpdateFilter('priceMax', e.target.value)}
                        placeholder={t('inventory.noLimit')}
                        className="h-8 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-2.5 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Expiry Filter */}
            {isExpiryFilter && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-stocky-text-sub uppercase tracking-wider">
                    {t('inventory.expiryCondition')}
                  </label>
                  <span className="text-[11px] text-stocky-text-sub">{t('inventory.thresholdWindow')}</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    {
                      id: 'expired' as const,
                      title: t('inventory.expired'),
                      daysBadge: t('inventory.expiredOverdue'),
                      description: t('inventory.expiredDesc'),
                      tone: 'stocky-status-critical',
                    },
                    {
                      id: 'soon' as const,
                      title: t('inventory.expiringSoon'),
                      daysBadge: t('inventory.expiringSoonDays'),
                      description: t('inventory.expiringSoonDesc'),
                      tone: 'stocky-status-warning',
                    },
                    {
                      id: 'healthy' as const,
                      title: t('inventory.healthyStock'),
                      daysBadge: t('inventory.healthyDays'),
                      description: t('inventory.healthyDesc'),
                      tone: 'stocky-status-success',
                    },
                    {
                      id: 'missing' as const,
                      title: t('inventory.noExpiryDate'),
                      daysBadge: t('inventory.noDateSet'),
                      description: t('inventory.noExpiryDesc'),
                      tone: 'stocky-status-muted',
                    },
                  ].map((status) => {
                    const isChecked = filters.expiry.includes(status.id);
                    const count = optionCounts[status.id];
                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => {
                          const current = [...filters.expiry];
                          const index = current.indexOf(status.id);
                          if (index >= 0) current.splice(index, 1);
                          else current.push(status.id);
                          onUpdateFilter('expiry', current);
                        }}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border transition-colors cursor-pointer text-start ${
                          isChecked
                            ? 'border-stocky-primary bg-stocky-primary/5 text-stocky-text-main'
                            : 'border-stocky-border-subtle/50 hover:bg-stocky-bg-hover hover:border-stocky-border-subtle text-stocky-text-sub'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              isChecked
                                ? 'bg-stocky-primary border-stocky-primary text-stocky-text-inverse'
                                : 'border-stocky-border-default bg-stocky-bg-widget'
                            }`}
                          >
                            {isChecked && <CheckIcon size="xs" />}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-medium ${isChecked ? 'text-stocky-text-main' : 'text-stocky-text-main/90'}`}>
                                {status.title}
                              </span>
                              {count !== undefined && (
                                <span className="text-[10px] text-stocky-text-sub bg-stocky-bg-global px-1.5 py-0.5 rounded font-normal">
                                  {count}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stocky-text-sub truncate">
                              {status.description}
                            </p>
                          </div>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-medium whitespace-nowrap ${status.tone}`}>
                          {status.daysBadge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Audit Filter */}
            {isAuditFilter && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-stocky-text-sub uppercase tracking-wider">
                    {t('inventory.auditStatus')}
                  </label>
                  <span className="text-[11px] text-stocky-text-sub">{t('inventory.verificationRecord')}</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    {
                      id: 'audited' as const,
                      title: t('inventory.audited'),
                      badge: t('inventory.auditLogged'),
                      description: t('inventory.auditedDesc'),
                      tone: 'stocky-status-success',
                    },
                    {
                      id: 'never' as const,
                      title: t('inventory.neverAudited'),
                      badge: t('inventory.pendingAudit'),
                      description: t('inventory.neverAuditedDesc'),
                      tone: 'stocky-status-warning',
                    },
                  ].map((status) => {
                    const isChecked = filters.audit.includes(status.id);
                    const count = optionCounts[status.id];
                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => {
                          const current = [...filters.audit];
                          const index = current.indexOf(status.id);
                          if (index >= 0) current.splice(index, 1);
                          else current.push(status.id);
                          onUpdateFilter('audit', current);
                        }}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border transition-colors cursor-pointer text-start ${
                          isChecked
                            ? 'border-stocky-primary bg-stocky-primary/5 text-stocky-text-main'
                            : 'border-stocky-border-subtle/50 hover:bg-stocky-bg-hover hover:border-stocky-border-subtle text-stocky-text-sub'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              isChecked
                                ? 'bg-stocky-primary border-stocky-primary text-stocky-text-inverse'
                                : 'border-stocky-border-default bg-stocky-bg-widget'
                            }`}
                          >
                            {isChecked && <CheckIcon size="xs" />}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-medium ${isChecked ? 'text-stocky-text-main' : 'text-stocky-text-main/90'}`}>
                                {status.title}
                              </span>
                              {count !== undefined && (
                                <span className="text-[10px] text-stocky-text-sub bg-stocky-bg-global px-1.5 py-0.5 rounded font-normal">
                                  {count}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stocky-text-sub truncate">
                              {status.description}
                            </p>
                          </div>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-medium whitespace-nowrap ${status.tone}`}>
                          {status.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-between border-t border-stocky-border-subtle px-4 py-2.5 bg-stocky-bg-global/40">
            <button
              type="button"
              disabled={!hasActiveFilter}
              onClick={() => onResetColumn(columnKey)}
              className="text-xs text-stocky-text-sub hover:text-stocky-text-main font-medium disabled:opacity-40 disabled:hover:text-stocky-text-sub transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {t('inventory.resetBtn')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 rounded-full bg-stocky-text-main text-stocky-text-inverse hover:bg-stocky-text-main text-xs font-medium transition-colors cursor-pointer"
            >
              {t('inventory.doneBtn')}
            </button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const StockTableColumnFilterPopover = InventoryTableColumnFilterPopover;
