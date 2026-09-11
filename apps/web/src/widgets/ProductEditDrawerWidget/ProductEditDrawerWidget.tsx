'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BoxesIcon, XIcon } from '@stocky/icons';
import type { Product, Supplier } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';

export interface ProductUpdateInput {
  name: string;
  barcode: string;
  categoryName: string;
  unitName: string;
  reorderPoint: number;
  defaultExpiryNotificationDays: number | null;
  defaultSupplierId: string | null;
  unitCost: number;
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
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryName, setCategoryName] = useState('General');
  const [unitName, setUnitName] = useState('unit');
  const [reorderPoint, setReorderPoint] = useState('0');
  const [alertDays, setAlertDays] = useState('30');
  const [supplierId, setSupplierId] = useState('');
  const [unitCost, setUnitCost] = useState('0');
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
    setError(null);
  }, [isOpen, product?.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product) return;
    const cleanName = name.trim();
    const parsedReorderPoint = Number(reorderPoint);
    const parsedAlertDays = alertDays.trim() === '' ? null : Number(alertDays);
    const parsedUnitCost = Number(unitCost);

    if (!cleanName) return setError('Enter a product name.');
    if (!Number.isInteger(parsedReorderPoint) || parsedReorderPoint < 0) return setError('Reorder point must be a whole number of zero or more.');
    if (parsedAlertDays !== null && (!Number.isInteger(parsedAlertDays) || parsedAlertDays < 0)) return setError('Alert days must be a whole number of zero or more.');
    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) return setError('Unit cost must be zero or more.');

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
      });
      onClose();
    } catch (saveError: any) {
      setError(saveError?.message || 'The product could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel="Edit product">
      <div className="flex items-start justify-between gap-4 border-b border-stocky-border-subtle px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border stocky-status-info"><BoxesIcon size="xs" /></span>
          <div className="min-w-0">
            <p className="stocky-page-eyebrow">Product details</p>
            <h2 className="mt-1 truncate text-lg font-medium text-stocky-text-main">Edit product</h2>
            <p className="mt-1 text-xs text-stocky-text-sub">Update the catalog details without changing stock quantities.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-stocky-text-sub hover:bg-stocky-bg-global" aria-label="Close"><XIcon size="xs" /></button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-5">
        <label className="block text-xs font-medium text-stocky-text-main">Product name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Bottled water" className="stocky-form-input mt-1.5" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-stocky-text-main">Barcode<input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Optional" className="stocky-form-input mt-1.5" /></label>
          <label className="block text-xs font-medium text-stocky-text-main">Unit<input value={unitName} onChange={(event) => setUnitName(event.target.value)} placeholder="e.g. piece" className="stocky-form-input mt-1.5" /></label>
        </div>
        <label className="block text-xs font-medium text-stocky-text-main">Category<input list="stocky-product-category-options" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Search or add category" className="stocky-form-input mt-1.5" /><datalist id="stocky-product-category-options">{categoryOptions.map((category) => <option key={category} value={category} />)}</datalist></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-stocky-text-main">Reorder point<input type="number" min="0" step="1" value={reorderPoint} onChange={(event) => setReorderPoint(event.target.value)} placeholder="0" className="stocky-form-input mt-1.5" /></label>
          <label className="block text-xs font-medium text-stocky-text-main">Unit cost<input type="number" min="0" step="0.01" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} placeholder="0" className="stocky-form-input mt-1.5" /></label>
        </div>
        <label className="block text-xs font-medium text-stocky-text-main">Default expiry alert<input type="number" min="0" step="1" value={alertDays} onChange={(event) => setAlertDays(event.target.value)} placeholder="Days before expiry" className="stocky-form-input mt-1.5" /><span className="mt-1 block text-[10px] font-normal text-stocky-text-sub">This is used when receiving a new batch and can be changed per batch.</span></label>
        <label className="block text-xs font-medium text-stocky-text-main">Default supplier<select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="stocky-form-input mt-1.5"><option value="">No default supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
        {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      </form>

      <div className="flex gap-2 border-t border-stocky-border-subtle p-5">
        <button type="button" onClick={onClose} className="h-10 flex-1 cursor-pointer rounded-lg border border-stocky-border-subtle text-sm">Cancel</button>
        <button type="submit" disabled={saving || !product} className="h-10 flex-1 cursor-pointer rounded-lg bg-stocky-primary text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
      </div>
    </SideDrawer>
  );
}
