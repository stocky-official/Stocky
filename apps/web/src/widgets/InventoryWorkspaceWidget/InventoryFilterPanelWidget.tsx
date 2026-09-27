'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ChevronDownIcon,
  DollarSignIcon,
  FilterIcon,
  RefreshIcon,
  SearchIcon,
  TagIcon,
  TruckIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

export interface FilterColumnScope {
  product: boolean;
  barcode: boolean;
  category: boolean;
  location: boolean;
  supplier: boolean;
}

export interface InventoryFilterPanelWidgetProps {
  className?: string;
  // Search in columns
  selectedColumns: FilterColumnScope;
  onToggleColumn: (column: keyof FilterColumnScope) => void;
  onSelectAllColumns: () => void;

  // Categories (Search & select with tags)
  availableCategories: Array<{ name: string; count: number }>;
  filterCategories: string[];
  onToggleCategory: (categoryName: string) => void;
  onClearCategories: () => void;

  // Locations (Search & select with tags)
  availableLocations: Array<{ id: string; name: string; count: number }>;
  filterLocationIds: string[];
  onToggleLocation: (locationId: string) => void;
  onClearLocations: () => void;

  // Suppliers (Search & select with tags)
  availableSuppliers: Array<{ id: string; name: string; count: number }>;
  filterSupplierIds: string[];
  onToggleSupplier: (supplierId: string) => void;
  onClearSuppliers: () => void;

  // Stock Quantity (Min and Max fields only)
  filterQuantityMin: string;
  onQuantityMinChange: (val: string) => void;
  filterQuantityMax: string;
  onQuantityMaxChange: (val: string) => void;

  // Unit Price (Min and Max fields only)
  filterPriceMin: string;
  onPriceMinChange: (val: string) => void;
  filterPriceMax: string;
  onPriceMaxChange: (val: string) => void;

  // Expiry Date (From and To dates only)
  filterExpiryFrom: string;
  onExpiryFromChange: (date: string) => void;
  filterExpiryTo: string;
  onExpiryToChange: (date: string) => void;

  // Metrics & Actions
  activeFilterCount: number;
  matchingCount: number;
  totalCount: number;
  onResetAll: () => void;
  onClose: () => void;
}

export type StockFilterWorkspacePanelProps = InventoryFilterPanelWidgetProps;

/**
 * Reusable Search & Select Tag Field
 * Renders an input field that filters options in a dropdown, adding selected choices as removable tags.
 */
function SearchSelectTagField({
  label,
  icon,
  placeholder,
  selectedIds,
  options,
  onToggle,
  onClear,
}: {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  selectedIds: string[];
  options: Array<{ id: string; label: string; count?: number }>;
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter unselected options based on search query
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((opt) => {
      const matches = !q || opt.label.toLowerCase().includes(q);
      return matches;
    });
  }, [options, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const selectedOptions = useMemo(() => {
    return selectedIds
      .map((id) => options.find((opt) => opt.id === id) || { id, label: id })
      .filter(Boolean);
  }, [selectedIds, options]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stocky-text-main">
          {icon}
          <span>{label}</span>
          {selectedIds.length > 0 && (
            <span className="rounded-full bg-stocky-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-stocky-primary">
              {selectedIds.length}
            </span>
          )}
        </div>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-stocky-text-sub hover:text-stocky-status-critical-fg cursor-pointer"
          >
            {t('filters.clearAll')}
          </button>
        )}
      </div>

      {/* Input container with tags & search */}
      <div
        onClick={() => setIsOpen(true)}
        className={`min-h-[38px] w-full rounded-xl border bg-stocky-bg-widget px-2.5 py-1.5 transition-colors cursor-text flex flex-wrap items-center gap-1.5 ${
          isOpen
            ? 'border-stocky-primary ring-2 ring-stocky-primary/10'
            : 'border-stocky-border-subtle hover:border-stocky-text-sub/40'
        }`}
      >
        {/* Selected Tags */}
        {selectedOptions.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1 rounded-lg bg-stocky-bg-global px-2 py-0.5 text-[11px] font-medium text-stocky-text-main border border-stocky-border-subtle shrink-0"
          >
            <span className="truncate max-w-[140px]">{item.label}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(item.id);
              }}
              className="text-stocky-text-sub hover:text-stocky-status-critical-fg cursor-pointer p-0.5"
              title={t('filters.remove')}
            >
              <XIcon size="xs" />
            </button>
          </span>
        ))}

        {/* Search input inside tag field */}
        <div className="flex items-center gap-1 flex-1 min-w-[120px]">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={selectedIds.length === 0 ? placeholder : t('filters.addMore')}
            className="w-full bg-transparent text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:outline-none"
          />
          <ChevronDownIcon
            size="xs"
            className={`text-stocky-text-sub transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] inset-x-0 z-50 max-h-52 overflow-y-auto rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget p-1 shadow-lg">
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-stocky-text-sub text-center">
              {t('filters.noMatching')}
            </p>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onToggle(opt.id);
                    setQuery('');
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-start cursor-pointer ${
                    isSelected
                      ? 'bg-stocky-primary/10 text-stocky-primary font-medium'
                      : 'text-stocky-text-main hover:bg-stocky-bg-global'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ms-2">
                    {opt.count !== undefined && (
                      <span className="text-[10px] text-stocky-text-sub tabular-nums">
                        {opt.count}
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[10px] text-stocky-primary font-bold">✓</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function InventoryFilterPanelWidget({
  selectedColumns,
  onToggleColumn,
  onSelectAllColumns,
  availableCategories,
  filterCategories,
  onToggleCategory,
  onClearCategories,
  availableLocations,
  filterLocationIds,
  onToggleLocation,
  onClearLocations,
  availableSuppliers,
  filterSupplierIds,
  onToggleSupplier,
  onClearSuppliers,
  filterQuantityMin,
  onQuantityMinChange,
  filterQuantityMax,
  onQuantityMaxChange,
  filterPriceMin,
  onPriceMinChange,
  filterPriceMax,
  onPriceMaxChange,
  filterExpiryFrom,
  onExpiryFromChange,
  filterExpiryTo,
  onExpiryToChange,
  activeFilterCount,
  matchingCount,
  totalCount,
  onResetAll,
  onClose,
  className,
}: InventoryFilterPanelWidgetProps) {
  const { t } = useTranslation();
  const allColumnsSelected =
    selectedColumns.product &&
    selectedColumns.barcode &&
    selectedColumns.category &&
    selectedColumns.location &&
    selectedColumns.supplier;

  const categoryOptions = useMemo(
    () => availableCategories.map((c) => ({ id: c.name, label: c.name, count: c.count })),
    [availableCategories]
  );

  const locationOptions = useMemo(
    () => availableLocations.map((l) => ({ id: l.id, label: l.name, count: l.count })),
    [availableLocations]
  );

  const supplierOptions = useMemo(() => {
    const list = availableSuppliers.map((s) => ({ id: s.id, label: s.name, count: s.count }));
    return [{ id: 'unassigned', label: t('filters.noSupplierAssigned') }, ...list];
  }, [availableSuppliers, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-label={t('filters.inventoryFilters')}
      className={className || "w-full rounded-2xl bg-stocky-bg-widget border border-stocky-border-subtle shadow-bevel-float overflow-hidden flex flex-col z-50 text-start select-none"}
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stocky-border-subtle bg-stocky-bg-widget shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-stocky-primary/10 text-stocky-primary flex items-center justify-center shrink-0">
            <FilterIcon size="xs" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-stocky-text-main">{t('filters.title')}</h2>
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-stocky-primary px-2 py-0.5 text-[10px] font-semibold text-stocky-text-inverse">
                  {t('filters.activeCount', { count: activeFilterCount })}
                </span>
              ) : (
                <span className="text-[10px] text-stocky-text-sub">{t('filters.noFiltersApplied')}</span>
              )}
            </div>
            <p className="text-[10px] text-stocky-text-sub mt-0.5">
              {t('filters.inventorySubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetAll}
              className="text-xs font-medium text-stocky-text-sub hover:text-stocky-status-critical-fg px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshIcon size="xs" />
              {t('filters.resetAll')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('filters.closeFilters')}
            className="w-7 h-7 rounded-full flex items-center justify-center text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
          >
            <XIcon size="xs" />
          </button>
        </div>
      </div>

      {/* 2. Simplified Body */}
      <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(100vh-14rem)] overscroll-contain flex flex-col gap-4">
        
        {/* ROW 1: Categorical Columns with Search & Select Tag Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category */}
          <SearchSelectTagField
            label={t('filters.category')}
            icon={<TagIcon size="xs" className="text-stocky-primary" />}
            placeholder={t('filters.searchCategory')}
            selectedIds={filterCategories}
            options={categoryOptions}
            onToggle={onToggleCategory}
            onClear={onClearCategories}
          />

          {/* Location */}
          <SearchSelectTagField
            label={t('filters.locations')}
            icon={<WarehouseIcon size="xs" className="text-stocky-primary" />}
            placeholder={t('filters.searchLocation')}
            selectedIds={filterLocationIds}
            options={locationOptions}
            onToggle={onToggleLocation}
            onClear={onClearLocations}
          />

          {/* Supplier */}
          <SearchSelectTagField
            label={t('filters.suppliers')}
            icon={<TruckIcon size="xs" className="text-stocky-primary" />}
            placeholder={t('filters.searchSupplier')}
            selectedIds={filterSupplierIds}
            options={supplierOptions}
            onToggle={onToggleSupplier}
            onClear={onClearSuppliers}
          />
        </div>

        {/* ROW 2: Numerical Ranges (Min & Max only) and Date Range (From & To only) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-stocky-border-subtle">
          
          {/* Numerical 1: Stock Quantity (Min and Max fields only) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stocky-text-main">{t('filters.stockQuantity')}</span>
              {(filterQuantityMin || filterQuantityMax) && (
                <button
                  type="button"
                  onClick={() => {
                    onQuantityMinChange('');
                    onQuantityMaxChange('');
                  }}
                  className="text-[10px] text-stocky-text-sub hover:text-stocky-status-critical-fg cursor-pointer"
                >
                  {t('filters.clear')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  value={filterQuantityMin}
                  onChange={(e) => onQuantityMinChange(e.target.value)}
                  placeholder={t('filters.minQuantity')}
                  className="w-full h-9 rounded-xl bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
              <span className="text-xs text-stocky-text-sub font-medium">{t('filters.to')}</span>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  value={filterQuantityMax}
                  onChange={(e) => onQuantityMaxChange(e.target.value)}
                  placeholder={t('filters.maxQuantity')}
                  className="w-full h-9 rounded-xl bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Numerical 2: Unit Price (Min and Max fields only) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs font-semibold text-stocky-text-main">
                <DollarSignIcon size="xs" className="text-stocky-primary" />
                <span>{t('filters.unitPriceCurrency')}</span>
              </div>
              {(filterPriceMin || filterPriceMax) && (
                <button
                  type="button"
                  onClick={() => {
                    onPriceMinChange('');
                    onPriceMaxChange('');
                  }}
                  className="text-[10px] text-stocky-text-sub hover:text-stocky-status-critical-fg cursor-pointer"
                >
                  {t('filters.clear')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={filterPriceMin}
                  onChange={(e) => onPriceMinChange(e.target.value)}
                  placeholder={t('filters.minPrice')}
                  className="w-full h-9 rounded-xl bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
              <span className="text-xs text-stocky-text-sub font-medium">{t('filters.to')}</span>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={filterPriceMax}
                  onChange={(e) => onPriceMaxChange(e.target.value)}
                  placeholder={t('filters.maxPrice')}
                  className="w-full h-9 rounded-xl bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Date Column: Next Expiry Date (From and To dates only) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs font-semibold text-stocky-text-main">
                <CalendarIcon size="xs" className="text-stocky-primary" />
                <span>{t('filters.nextExpiryDate')}</span>
              </div>
              {(filterExpiryFrom || filterExpiryTo) && (
                <button
                  type="button"
                  onClick={() => {
                    onExpiryFromChange('');
                    onExpiryToChange('');
                  }}
                  className="text-[10px] text-stocky-text-sub hover:text-stocky-status-critical-fg cursor-pointer"
                >
                  {t('filters.clear')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="date"
                  value={filterExpiryFrom}
                  onChange={(e) => onExpiryFromChange(e.target.value)}
                  title={t('filters.fromDate')}
                  aria-label={t('filters.expiryFromDate')}
                  className="w-full h-9 rounded-xl bg-stocky-bg-widget px-2.5 text-xs text-stocky-text-main border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
              <span className="text-xs text-stocky-text-sub font-medium">{t('filters.to')}</span>
              <div className="flex-1 relative">
                <input
                  type="date"
                  value={filterExpiryTo}
                  onChange={(e) => onExpiryToChange(e.target.value)}
                  title={t('filters.toDate')}
                  aria-label={t('filters.expiryToDate')}
                  className="w-full h-9 rounded-xl bg-stocky-bg-widget px-2.5 text-xs text-stocky-text-main border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Search Scope Toggles */}
        <div className="pt-3 border-t border-stocky-border-subtle flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SearchIcon size="xs" className="text-stocky-primary" />
            <span className="text-xs font-semibold text-stocky-text-main">{t('filters.searchMatches')}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { key: 'product', label: t('filters.columns.product') },
                  { key: 'barcode', label: t('filters.columns.barcode') },
                  { key: 'category', label: t('filters.columns.category') },
                  { key: 'location', label: t('filters.columns.location') },
                  { key: 'supplier', label: t('filters.columns.supplier') },
                ] as const
              ).map(({ key, label }) => {
                const isChecked = selectedColumns[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onToggleColumn(key)}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                      isChecked
                        ? 'bg-stocky-primary/10 border-stocky-primary/30 text-stocky-primary'
                        : 'bg-stocky-bg-widget border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-text-main'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onSelectAllColumns}
            className="text-[10px] text-stocky-text-sub hover:text-stocky-primary cursor-pointer"
          >
            {allColumnsSelected ? t('filters.allActive') : t('filters.selectAll')}
          </button>
        </div>

      </div>

      {/* 3. Footer */}
      <div className="px-5 py-3 border-t border-stocky-border-subtle bg-stocky-bg-widget flex items-center justify-between shrink-0">
        <div className="text-xs text-stocky-text-sub">
          {t('filters.productsMatching', { matching: matchingCount, total: totalCount })}
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetAll}
              className="h-8 px-3 rounded-full text-xs font-medium text-stocky-text-sub hover:text-stocky-status-critical-fg hover:bg-stocky-status-critical-bg transition-colors cursor-pointer"
            >
              {t('filters.resetAll')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-5 rounded-full bg-stocky-text-main text-stocky-text-inverse text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            {t('filters.done')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Backward-compatible alias
export const StockFilterWorkspacePanel = InventoryFilterPanelWidget;

