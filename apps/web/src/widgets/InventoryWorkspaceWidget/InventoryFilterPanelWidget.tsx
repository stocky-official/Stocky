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
            className="text-[10px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Input container with tags & search */}
      <div
        onClick={() => setIsOpen(true)}
        className={`min-h-[38px] w-full rounded-xl border bg-white px-2.5 py-1.5 transition-colors cursor-text flex flex-wrap items-center gap-1.5 ${
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
              className="text-stocky-text-sub hover:text-red-600 cursor-pointer p-0.5"
              title="Remove"
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
            placeholder={selectedIds.length === 0 ? placeholder : 'Add more...'}
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
        <div className="absolute top-[calc(100%+4px)] inset-x-0 z-50 max-h-52 overflow-y-auto rounded-xl border border-stocky-border-subtle bg-white p-1 shadow-lg">
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-stocky-text-sub text-center">
              No matching options
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
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isSelected
                      ? 'bg-stocky-primary/10 text-stocky-primary font-medium'
                      : 'text-stocky-text-main hover:bg-stocky-bg-global'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
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
    return [{ id: 'unassigned', label: 'No supplier assigned' }, ...list];
  }, [availableSuppliers]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-label="Inventory filters"
      className={className || "w-full rounded-2xl bg-white border border-stocky-border-subtle shadow-bevel-float overflow-hidden flex flex-col z-50 text-left select-none"}
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stocky-border-subtle bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-stocky-primary/10 text-stocky-primary flex items-center justify-center shrink-0">
            <FilterIcon size="xs" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-stocky-text-main">Filters</h2>
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-stocky-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                  {activeFilterCount} active
                </span>
              ) : (
                <span className="text-[10px] text-stocky-text-sub">No filters applied</span>
              )}
            </div>
            <p className="text-[10px] text-stocky-text-sub mt-0.5">
              Refine active inventory by search tags, quantity ranges, price boundaries, and expiry date windows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetAll}
              className="text-xs font-medium text-stocky-text-sub hover:text-red-600 px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshIcon size="xs" />
              Reset all
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
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
            label="Category"
            icon={<TagIcon size="xs" className="text-stocky-primary" />}
            placeholder="Search or select category..."
            selectedIds={filterCategories}
            options={categoryOptions}
            onToggle={onToggleCategory}
            onClear={onClearCategories}
          />

          {/* Location */}
          <SearchSelectTagField
            label="Locations"
            icon={<WarehouseIcon size="xs" className="text-stocky-primary" />}
            placeholder="Search or select location..."
            selectedIds={filterLocationIds}
            options={locationOptions}
            onToggle={onToggleLocation}
            onClear={onClearLocations}
          />

          {/* Supplier */}
          <SearchSelectTagField
            label="Suppliers"
            icon={<TruckIcon size="xs" className="text-stocky-primary" />}
            placeholder="Search or select supplier..."
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
              <span className="text-xs font-semibold text-stocky-text-main">Stock Quantity</span>
              {(filterQuantityMin || filterQuantityMax) && (
                <button
                  type="button"
                  onClick={() => {
                    onQuantityMinChange('');
                    onQuantityMaxChange('');
                  }}
                  className="text-[10px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
                >
                  Clear
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
                  placeholder="Min quantity"
                  className="w-full h-9 rounded-xl bg-white px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
              <span className="text-xs text-stocky-text-sub font-medium">to</span>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  value={filterQuantityMax}
                  onChange={(e) => onQuantityMaxChange(e.target.value)}
                  placeholder="Max quantity"
                  className="w-full h-9 rounded-xl bg-white px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Numerical 2: Unit Price (Min and Max fields only) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs font-semibold text-stocky-text-main">
                <DollarSignIcon size="xs" className="text-stocky-primary" />
                <span>Unit Price (EGP)</span>
              </div>
              {(filterPriceMin || filterPriceMax) && (
                <button
                  type="button"
                  onClick={() => {
                    onPriceMinChange('');
                    onPriceMaxChange('');
                  }}
                  className="text-[10px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
                >
                  Clear
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
                  placeholder="Min price"
                  className="w-full h-9 rounded-xl bg-white px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
              <span className="text-xs text-stocky-text-sub font-medium">to</span>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={filterPriceMax}
                  onChange={(e) => onPriceMaxChange(e.target.value)}
                  placeholder="Max price"
                  className="w-full h-9 rounded-xl bg-white px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Date Column: Next Expiry Date (From and To dates only) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs font-semibold text-stocky-text-main">
                <CalendarIcon size="xs" className="text-stocky-primary" />
                <span>Next Expiry Date</span>
              </div>
              {(filterExpiryFrom || filterExpiryTo) && (
                <button
                  type="button"
                  onClick={() => {
                    onExpiryFromChange('');
                    onExpiryToChange('');
                  }}
                  className="text-[10px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="date"
                  value={filterExpiryFrom}
                  onChange={(e) => onExpiryFromChange(e.target.value)}
                  title="From date"
                  aria-label="Expiry from date"
                  className="w-full h-9 rounded-xl bg-white px-2.5 text-xs text-stocky-text-main border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
              <span className="text-xs text-stocky-text-sub font-medium">to</span>
              <div className="flex-1 relative">
                <input
                  type="date"
                  value={filterExpiryTo}
                  onChange={(e) => onExpiryToChange(e.target.value)}
                  title="To date"
                  aria-label="Expiry to date"
                  className="w-full h-9 rounded-xl bg-white px-2.5 text-xs text-stocky-text-main border border-stocky-border-subtle focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Search Scope Toggles */}
        <div className="pt-3 border-t border-stocky-border-subtle flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SearchIcon size="xs" className="text-stocky-primary" />
            <span className="text-xs font-semibold text-stocky-text-main">Search matches:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { key: 'product', label: 'Product' },
                  { key: 'barcode', label: 'Barcode' },
                  { key: 'category', label: 'Category' },
                  { key: 'location', label: 'Location' },
                  { key: 'supplier', label: 'Supplier' },
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
                        : 'bg-white border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-text-main'
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
            {allColumnsSelected ? 'All active' : 'Select all'}
          </button>
        </div>

      </div>

      {/* 3. Footer */}
      <div className="px-5 py-3 border-t border-stocky-border-subtle bg-white flex items-center justify-between shrink-0">
        <div className="text-xs text-stocky-text-sub">
          Showing <strong className="font-semibold text-stocky-text-main">{matchingCount}</strong> of{' '}
          <span className="tabular-nums">{totalCount}</span> products matching
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetAll}
              className="h-8 px-3 rounded-full text-xs font-medium text-stocky-text-sub hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Reset all
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-5 rounded-full bg-stocky-text-main text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Backward-compatible alias
export const StockFilterWorkspacePanel = InventoryFilterPanelWidget;

