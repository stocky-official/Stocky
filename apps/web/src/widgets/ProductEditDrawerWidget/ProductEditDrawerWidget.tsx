'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BoxesIcon, XIcon } from '@stocky/icons';
import type { Product, Supplier } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { useTranslation } from '@/lib/i18n';

export interface ProductUpdateInput {
  name: string;
  barcode: string;
  categoryName: string;
  unitName: string;
  reorderPoint: number;
  defaultExpiryNotificationDays: number | null;
  defaultSupplierId: string | null;
  unitCost: number;
  imageUrl?: string | null;
}

export interface ProductEditDrawerWidgetProps {
  isOpen: boolean;
  product: Product | null;
  categories?: string[];
  suppliers?: Supplier[];
  onClose: () => void;
  onSave: (product: Product, input: ProductUpdateInput) => Promise<void>;
}

export function ProductEditDrawerWidget({ isOpen, product, categories = [], suppliers = [], onClose, onSave }: ProductEditDrawerWidgetProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryName, setCategoryName] = useState('General');
  const [unitName, setUnitName] = useState('unit');
  const [reorderPoint, setReorderPoint] = useState('0');
  const [alertDays, setAlertDays] = useState('30');
  const [supplierId, setSupplierId] = useState('');
  const [unitCost, setUnitCost] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => Array.from(new Set([...categories, categoryName, 'General'].filter(Boolean))).sort((left, right) => left.localeCompare(right)),
    [categories, categoryName],
  );

  useEffect(() => {
    if (!isOpen || !product) return;
    setName(product.name);
    setBarcode(product.barcode || '');
    setCategoryName(product.categoryName || 'General');
    setUnitName(product.unitName || 'unit');
    setReorderPoint(String(product.reorderPoint ?? 0));
    setAlertDays(product.defaultExpiryNotificationDays == null ? '' : String(product.defaultExpiryNotificationDays));
    setSupplierId(product.defaultSupplierId || '');
    setUnitCost(String(product.unitCost ?? 0));
    setImageUrl(product.imageUrl || '');
    setError(null);
  }, [isOpen, product?.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product) return;
    const cleanName = name.trim();
    const parsedReorderPoint = Number(reorderPoint);
    const parsedAlertDays = alertDays.trim() === '' ? null : Number(alertDays);
    const parsedUnitCost = Number(unitCost);

    if (!cleanName) return setError(t('drawers.productEdit.errors.enterName'));
    if (!Number.isInteger(parsedReorderPoint) || parsedReorderPoint < 0) return setError(t('drawers.productEdit.errors.reorderZero'));
    if (parsedAlertDays !== null && (!Number.isInteger(parsedAlertDays) || parsedAlertDays < 0)) return setError(t('drawers.productEdit.errors.alertDaysZero'));
    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) return setError(t('drawers.productEdit.errors.costZero'));

    setSaving(true);
    setError(null);
    try {
      await onSave(product, {
        name: cleanName,
        barcode: barcode.trim(),
        categoryName: categoryName.trim() || 'General',
        unitName: unitName.trim() || 'unit',
        reorderPoint: parsedReorderPoint,
        defaultExpiryNotificationDays: parsedAlertDays,
        defaultSupplierId: supplierId || null,
        unitCost: parsedUnitCost,
        imageUrl: imageUrl.trim() || null,
      });
      onClose();
    } catch (saveError: any) {
      setError(saveError?.message || t('drawers.productEdit.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t('drawers.productEdit.title')}>
      <div className="flex items-start justify-between gap-4 border-b border-stocky-border-subtle px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border stocky-status-info"><BoxesIcon size="xs" /></span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-medium text-stocky-text-main">{t('drawers.productEdit.title')}</h2>
            <p className="mt-1 text-xs text-stocky-text-sub">{t('drawers.productEdit.subtitle')}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-stocky-text-sub hover:bg-stocky-bg-global" aria-label={t('common.close')}><XIcon size="xs" /></button>
      </div>

      <form id="product-edit-form" onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-5">
        {/* Product Image Avatar */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-stocky-text-main">{t('drawers.productEdit.image')}</label>
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stocky-border-subtle bg-stocky-bg-global text-stocky-text-sub select-none">
              {imageUrl.trim() ? (
                <img
                  src={imageUrl.trim()}
                  alt={t('drawers.productEdit.imagePreview')}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <BoxesIcon size="xs" className="text-stocky-text-sub/60" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/product.jpg"
                className="stocky-form-input text-xs"
              />
              <p className="mt-1 text-[10px] text-stocky-text-sub">{t('drawers.productEdit.imageHelpText')}</p>
            </div>
          </div>
        </div>

        <label className="block text-xs font-medium text-stocky-text-main">{t('drawers.productEdit.name')}<input required value={name} onChange={(event) => setName(event.target.value)} placeholder={t('drawers.productEdit.namePlaceholder')} className="stocky-form-input mt-1.5" /></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-stocky-text-main">{t('drawers.productEdit.barcode')}<input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder={t('drawers.productEdit.optional')} className="stocky-form-input mt-1.5" /></label>
          <label className="block text-xs font-medium text-stocky-text-main">{t('drawers.productEdit.unit')}<input value={unitName} onChange={(event) => setUnitName(event.target.value)} placeholder={t('drawers.productEdit.unitPlaceholder')} className="stocky-form-input mt-1.5" /></label>
        </div>
        <label className="block text-xs font-medium text-stocky-text-main">{t('drawers.productEdit.category')}<input list="stocky-product-category-options" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder={t('drawers.productEdit.searchOrAddCategory')} className="stocky-form-input mt-1.5" /><datalist id="stocky-product-category-options">{categoryOptions.map((category) => <option key={category} value={category} />)}</datalist></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-stocky-text-main">{t('drawers.productEdit.reorderPoint')}<input type="number" min="0" step="1" value={reorderPoint} onChange={(event) => setReorderPoint(event.target.value)} placeholder="0" className="stocky-form-input mt-1.5" /></label>
          <label className="block text-xs font-medium text-stocky-text-main">{t('drawers.productEdit.unitCost')}<input type="number" min="0" step="0.01" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} placeholder="0" className="stocky-form-input mt-1.5" /></label>
        </div>
        <label className="block text-xs font-medium text-stocky-text-main">{t('drawers.productEdit.defaultExpiryAlert')}<input type="number" min="0" step="1" value={alertDays} onChange={(event) => setAlertDays(event.target.value)} placeholder="30" className="stocky-form-input mt-1.5" /><span className="mt-1 block text-[10px] font-normal text-stocky-text-sub">{t('drawers.productEdit.expiryAlertDesc')}</span></label>
        <label className="block text-xs font-medium text-stocky-text-main">{t('drawers.productEdit.supplier')}<select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="stocky-form-input mt-1.5"><option value="">{t('drawers.productEdit.noDefaultSupplier')}</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
        {error && <p className="rounded-lg border border-stocky-status-critical-border bg-stocky-status-critical-bg px-3 py-2 text-xs text-stocky-status-critical-fg">{error}</p>}
      </form>

      <div className="flex gap-2 border-t border-stocky-border-subtle p-5">
        <button type="button" onClick={onClose} className="h-10 flex-1 cursor-pointer rounded-lg border border-stocky-border-subtle text-sm">{t('drawers.productEdit.cancel')}</button>
        <button type="submit" form="product-edit-form" disabled={saving || !product} className="h-10 flex-1 cursor-pointer rounded-lg bg-stocky-primary text-sm font-medium text-stocky-text-inverse disabled:cursor-not-allowed disabled:opacity-60">{saving ? t('drawers.productEdit.saving') : t('drawers.productEdit.saveChanges')}</button>
      </div>
    </SideDrawer>
  );
}
