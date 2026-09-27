'use client';

import React, { useEffect, useRef } from 'react';
import { FilterIcon } from '@stocky/icons';
import type { Product } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';

export interface SuppliersFilterPanelWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedColumns: Record<'name' | 'address' | 'products' | 'contacts', boolean>;
  onToggleColumn: (column: 'name' | 'address' | 'products' | 'contacts') => void;
  onSelectAllColumns: () => void;
  filterProductId: string;
  onFilterProductIdChange: (productId: string) => void;
  filterOpenRequests: 'all' | 'has_requests' | 'no_requests';
  onFilterOpenRequestsChange: (val: 'all' | 'has_requests' | 'no_requests') => void;
  filterContactType: 'all' | 'has_phone' | 'has_email';
  onFilterContactTypeChange: (val: 'all' | 'has_phone' | 'has_email') => void;
  activeFilterCount: number;
  onResetAll: () => void;
  matchingCount: number;
  className?: string;
}

export function SuppliersFilterPanelWidget({
  isOpen,
  onClose,
  products,
  selectedColumns,
  onToggleColumn,
  onSelectAllColumns,
  filterProductId,
  onFilterProductIdChange,
  filterOpenRequests,
  onFilterOpenRequestsChange,
  filterContactType,
  onFilterContactTypeChange,
  activeFilterCount,
  onResetAll,
  matchingCount,
  className,
}: SuppliersFilterPanelWidgetProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const columnLabels: Record<'name' | 'address' | 'products' | 'contacts', string> = {
    name: t('supplierPanel.colName'),
    address: t('supplierPanel.colAddress'),
    products: t('supplierPanel.colProducts'),
    contacts: t('supplierPanel.colContacts'),
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t('supplierPanel.dialogAria')}
      className={className || "absolute top-[calc(100%+8px)] inset-x-3 sm:inset-x-3.5 z-50 rounded-2xl border border-stocky-border-subtle bg-stocky-bg-widget shadow-bevel-float overflow-hidden flex flex-col max-h-[80vh]"}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-stocky-border-subtle bg-stocky-bg-widget px-5 py-3.5">
        <div className="flex items-center gap-2">
          <FilterIcon size="xs" className="text-stocky-primary" />
          <h3 className="text-xs font-semibold text-stocky-text-main">{t('supplierPanel.title')}</h3>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-stocky-primary/10 px-2 py-0.5 text-[10px] font-semibold text-stocky-primary">
              {t('supplierPanel.activeCount', { count: activeFilterCount })}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetAll}
            className="text-[11px] font-medium text-stocky-primary hover:underline cursor-pointer"
          >
            {t('supplierPanel.resetAll')}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-start">
        {/* Search In Columns */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
              {t('supplierPanel.searchInColumns')}
            </span>
            <button
              type="button"
              onClick={onSelectAllColumns}
              className="text-[10px] text-stocky-text-sub hover:text-stocky-primary cursor-pointer"
            >
              {t('supplierPanel.selectAll')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['name', 'address', 'products', 'contacts'] as const).map((col) => (
              <label
                key={col}
                className="flex items-center gap-2 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded-lg px-2.5 py-1.5 border border-stocky-border-subtle transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedColumns[col]}
                  onChange={() => onToggleColumn(col)}
                  className="accent-stocky-primary rounded"
                />
                <span>{columnLabels[col]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="space-y-3 border-t border-stocky-border-subtle pt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
            {t('supplierPanel.filterByValues')}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-stocky-text-main">
              {t('supplierPanel.productsSupplied')}
              <select
                value={filterProductId}
                onChange={(e) => onFilterProductIdChange(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-2.5 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                <option value="all">{t('supplierPanel.allProductsCount', { count: products.length })}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-stocky-text-main">
              {t('supplierPanel.openRequests')}
              <select
                value={filterOpenRequests}
                onChange={(e) => onFilterOpenRequestsChange(e.target.value as any)}
                className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-2.5 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                <option value="all">{t('supplierPanel.allStatuses')}</option>
                <option value="has_requests">{t('supplierPanel.hasOpenRequests')}</option>
                <option value="no_requests">{t('supplierPanel.noOpenRequests')}</option>
              </select>
            </label>

            <label className="block text-xs font-medium text-stocky-text-main sm:col-span-2">
              {t('supplierPanel.contactInfo')}
              <select
                value={filterContactType}
                onChange={(e) => onFilterContactTypeChange(e.target.value as any)}
                className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-2.5 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                <option value="all">{t('supplierPanel.anyContactDetails')}</option>
                <option value="has_phone">{t('supplierPanel.hasPhone')}</option>
                <option value="has_email">{t('supplierPanel.hasEmail')}</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between border-t border-stocky-border-subtle bg-stocky-bg-global px-5 py-3">
        <span className="text-xs font-medium text-stocky-text-sub">
          {matchingCount === 1
            ? t('supplierPanel.matchingSuppliers', { count: matchingCount })
            : t('supplierPanel.matchingSuppliersPlural', { count: matchingCount })}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-full bg-stocky-text-main px-5 text-xs font-medium text-stocky-text-inverse hover:bg-stocky-text-main transition-colors cursor-pointer"
        >
          {t('supplierPanel.done')}
        </button>
      </div>
    </div>
  );
}
