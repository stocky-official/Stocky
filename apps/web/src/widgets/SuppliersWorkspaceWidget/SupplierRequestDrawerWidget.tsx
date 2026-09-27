'use client';

import React, { useMemo, useState } from 'react';
import {
  CalendarIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from '@stocky/icons';
import type { Location, Product, Supplier } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { useTranslation } from '@/lib/i18n';

export interface SupplierRequestDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  locations: Location[];
  suppliers: Supplier[];
  defaultProductId?: string;
  defaultSupplierId?: string;
  selectedLocationId: string;
  onCreate: (input: {
    productId: string;
    locationId: string;
    supplierId?: string;
    requestType: 'replenish' | 'return' | 'replace';
    quantity?: number;
    targetDate?: string;
    notes?: string;
  }) => void;
}

export function SupplierRequestDrawerWidget({
  isOpen,
  onClose,
  products,
  locations,
  suppliers,
  defaultProductId,
  defaultSupplierId,
  selectedLocationId,
  onCreate,
}: SupplierRequestDrawerWidgetProps) {
  const { t } = useTranslation();
  const [requestType, setRequestType] = useState<'replenish' | 'return' | 'replace'>('replenish');
  const [supplierId, setSupplierId] = useState(defaultSupplierId || '');
  const [productId, setProductId] = useState(defaultProductId || '');
  const [locationId, setLocationId] = useState(
    selectedLocationId === 'all' ? locations[0]?.id || '' : selectedLocationId
  );
  const [quantity, setQuantity] = useState('1');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const requestTypes = useMemo(() => [
    { id: 'replenish' as const, label: t('drawers.supplierRequest.types.replenish.label'), description: t('drawers.supplierRequest.types.replenish.description') },
    { id: 'return' as const, label: t('drawers.supplierRequest.types.return.label'), description: t('drawers.supplierRequest.types.return.description') },
    { id: 'replace' as const, label: t('drawers.supplierRequest.types.replace.label'), description: t('drawers.supplierRequest.types.replace.description') },
  ], [t]);

  // Sync defaults when drawer opens or defaults change
  React.useEffect(() => {
    if (isOpen) {
      if (defaultProductId) setProductId(defaultProductId);
      if (defaultSupplierId) setSupplierId(defaultSupplierId);
      if (selectedLocationId && selectedLocationId !== 'all') {
        setLocationId(selectedLocationId);
      } else if (!locationId && locations[0]?.id) {
        setLocationId(locations[0].id);
      }
    }
  }, [isOpen, defaultProductId, defaultSupplierId, selectedLocationId, locations]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const filteredProducts = useMemo(() => {
    if (!supplierId) return products;
    return [...products].sort((a, b) => {
      const aMatch = a.defaultSupplierId === supplierId ? 1 : 0;
      const bMatch = b.defaultSupplierId === supplierId ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [products, supplierId]);

  const resetForm = () => {
    setProductId(defaultProductId || '');
    setLocationId(selectedLocationId === 'all' ? locations[0]?.id || '' : selectedLocationId);
    setSupplierId(defaultSupplierId || '');
    setRequestType('replenish');
    setQuantity('1');
    setTargetDate('');
    setNotes('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleQuantityStep = (delta: number) => {
    const current = parseInt(quantity, 10) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId || !locationId) {
      setError(t('drawers.supplierRequest.errors.selectProductAndLocation'));
      return;
    }

    const parsedQty = quantity ? parseInt(quantity, 10) : undefined;
    if (parsedQty !== undefined && (isNaN(parsedQty) || parsedQty <= 0)) {
      setError(t('drawers.supplierRequest.errors.positiveQuantity'));
      return;
    }

    onCreate({
      productId,
      locationId,
      supplierId: supplierId || undefined,
      requestType,
      quantity: parsedQty,
      targetDate: targetDate || undefined,
      notes: notes.trim() || undefined,
    });
    handleClose();
  };

  // Today ISO string for date picker min
  const todayIso = new Date().toISOString().split('T')[0];

  return (
    <SideDrawer isOpen={isOpen} onClose={handleClose} ariaLabel={t('drawers.supplierRequest.title')}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stocky-border-subtle p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-stocky-text-main">{t('drawers.supplierRequest.title')}</h2>
            <p className="mt-0.5 text-xs text-stocky-text-sub">
              {t('drawers.supplierRequest.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer"
            aria-label={t('common.close')}
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Form Body - Ordered 1 to 7 */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6 gap-4">
          {error && (
            <div className="rounded-xl border border-stocky-status-danger-border bg-stocky-status-danger-bg p-3 text-xs text-stocky-status-danger-fg">
              {error}
            </div>
          )}

          {/* 1. Request Type */}
          <div>
            <label className="block text-xs font-medium text-stocky-text-main mb-1.5">
              {t('drawers.supplierRequest.step1')} <span className="text-stocky-status-danger-fg">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {requestTypes.map((type) => {
                const isSelected = requestType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setRequestType(type.id)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stocky-primary bg-stocky-primary/5 ring-1 ring-stocky-primary'
                        : 'border-stocky-border-subtle bg-stocky-bg-widget hover:border-stocky-border-strong'
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-stocky-primary' : 'text-stocky-text-main'
                      }`}
                    >
                      {type.label}
                    </span>
                    <span className="mt-0.5 text-[10px] text-stocky-text-sub line-clamp-1">
                      {type.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Supplier Select */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-stocky-text-main">
                {t('drawers.supplierRequest.step2')} <span className="text-stocky-text-sub font-normal">({t('common.optional')})</span>
              </label>
              {supplierId && (
                <button
                  type="button"
                  onClick={() => setSupplierId('')}
                  className="text-[11px] text-stocky-text-sub hover:text-stocky-primary cursor-pointer"
                >
                  {t('drawers.supplierRequest.clearSupplier')}
                </button>
              )}
            </div>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="">{t('drawers.supplierRequest.chooseSupplier')}</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Product Selection */}
          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              {t('drawers.supplierRequest.step3')} <span className="text-stocky-status-danger-fg">*</span>
            </label>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="">{t('drawers.supplierRequest.selectProduct')}</option>
              {filteredProducts.map((product) => {
                const isPreferred = supplierId && product.defaultSupplierId === supplierId;
                return (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.barcode ? `(${product.barcode})` : ''}{' '}
                    {isPreferred ? t('drawers.supplierRequest.preferred') : ''}
                  </option>
                );
              })}
            </select>

            {selectedProduct && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global/50 p-2.5 text-xs text-stocky-text-sub">
                <span className="rounded bg-stocky-bg-widget px-2 py-0.5 text-[11px] font-medium text-stocky-text-main border border-stocky-border-subtle">
                  {selectedProduct.categoryName}
                </span>
                {selectedProduct.barcode && (
                  <span className="font-sans text-[10px]">BC: {selectedProduct.barcode}</span>
                )}
                <span className="text-stocky-primary font-medium">
                  ${selectedProduct.unitCost.toFixed(2)} / {selectedProduct.unitName || 'unit'}
                </span>
                {selectedProduct.reorderPoint > 0 && (
                  <span className="text-[10px]">
                    {t('drawers.supplierRequest.reorderPoint', { count: selectedProduct.reorderPoint, unit: selectedProduct.unitName || t('common.items') })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 4. Destination Location */}
          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              {t('drawers.supplierRequest.step4')} <span className="text-stocky-status-danger-fg">*</span>
            </label>
            <select
              required
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="">{t('drawers.supplierRequest.chooseLocation')}</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type || 'Location'})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Quantity & Units */}
          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              {t('drawers.supplierRequest.step5')} <span className="text-stocky-text-sub font-normal">({selectedProduct?.unitName || t('common.items')})</span>
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuantityStep(-10)}
                title={t('drawers.supplierRequest.subtract10')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget text-xs font-semibold text-stocky-text-main hover:bg-stocky-bg-global active:scale-95 transition-all cursor-pointer"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => handleQuantityStep(-1)}
                title={t('drawers.supplierRequest.subtract1')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget text-stocky-text-main hover:bg-stocky-bg-global active:scale-95 transition-all cursor-pointer"
              >
                <MinusIcon size="xs" />
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
                className="h-10 min-w-0 flex-1 rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-center text-xs font-semibold text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleQuantityStep(1)}
                title={t('drawers.supplierRequest.add1')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget text-stocky-text-main hover:bg-stocky-bg-global active:scale-95 transition-all cursor-pointer"
              >
                <PlusIcon size="xs" />
              </button>
              <button
                type="button"
                onClick={() => handleQuantityStep(10)}
                title={t('drawers.supplierRequest.add10')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget text-xs font-semibold text-stocky-text-main hover:bg-stocky-bg-global active:scale-95 transition-all cursor-pointer"
              >
                +10
              </button>
            </div>
          </div>

          {/* 6. Target Delivery Date */}
          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              {t('drawers.supplierRequest.step6')} <span className="text-stocky-text-sub font-normal">({t('common.optional')})</span>
            </label>
            <div className="relative mt-1.5">
              <input
                type="date"
                min={todayIso}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              />
            </div>
          </div>

          {/* 7. Notes & Justification */}
          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              {t('drawers.supplierRequest.step7')} <span className="text-stocky-text-sub font-normal">({t('common.optional')})</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('drawers.supplierRequest.notesPlaceholder')}
              className="mt-1.5 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget p-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="mt-auto flex items-center justify-end gap-2.5 pt-5 border-t border-stocky-border-subtle">
            <button
              type="button"
              onClick={handleClose}
              className="h-10 rounded-full border border-stocky-border-subtle px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-stocky-text-inverse hover:bg-stocky-primary-hover transition-colors cursor-pointer shadow-sm"
            >
              {t('drawers.supplierRequest.save')}
            </button>
          </div>
        </form>
      </div>
    </SideDrawer>
  );
}
