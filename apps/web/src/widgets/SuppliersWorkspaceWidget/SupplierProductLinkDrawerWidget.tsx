'use client';

import React, { useState } from 'react';
import { XIcon } from '@stocky/icons';
import type { Product, Supplier, SupplierProduct } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';

export interface SupplierProductLinkDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  products: Product[];
  supplierProducts: SupplierProduct[];
  onLinkProduct: (input: {
    supplierId: string;
    productId: string;
    supplierSku?: string;
    unitCost?: number;
  }) => Promise<void>;
}

export function SupplierProductLinkDrawerWidget({
  isOpen,
  onClose,
  supplier,
  products,
  supplierProducts,
  onLinkProduct,
}: SupplierProductLinkDrawerWidgetProps) {
  const [productId, setProductId] = useState('');
  const [supplierSku, setSupplierSku] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingLinkedProductIds = new Set(
    supplierProducts
      .filter((link) => link.supplierId === supplier?.id)
      .map((link) => link.productId)
  );

  const availableProducts = products.filter(
    (product) => !existingLinkedProductIds.has(product.id)
  );

  const resetForm = () => {
    setProductId('');
    setSupplierSku('');
    setUnitCost('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supplier) {
      setError('No supplier selected.');
      return;
    }
    if (!productId) {
      setError('Please select a product to link.');
      return;
    }

    const parsedCost = unitCost ? parseFloat(unitCost) : undefined;
    if (parsedCost !== undefined && (isNaN(parsedCost) || parsedCost < 0)) {
      setError('Unit cost must be a non-negative number.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onLinkProduct({
        supplierId: supplier.id,
        productId,
        supplierSku: supplierSku.trim() || undefined,
        unitCost: parsedCost,
      });
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Could not link product to this supplier.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={handleClose} ariaLabel="Link catalog product">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stocky-border-subtle p-5 sm:p-6 shrink-0 bg-white">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stocky-border-subtle bg-stocky-bg-global text-stocky-text-sub select-none font-medium">
              {supplier?.imageUrl ? (
                <img
                  src={supplier.imageUrl}
                  alt={supplier.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-sm font-semibold tracking-tight text-stocky-text-main">
                  {(supplier?.name || 'SU').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-stocky-text-main tracking-tight leading-snug">
                Link catalog product
              </h2>
              <p className="mt-0.5 text-xs text-stocky-text-sub truncate">
                Assign a product to <strong className="text-stocky-text-main font-semibold">{supplier?.name || 'Supplier'}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer"
            aria-label="Close"
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6 gap-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              required
              autoFocus
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="">Choose an unassigned product</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.barcode ? `(${product.barcode})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Supplier SKU <span className="text-stocky-text-sub font-normal">(optional)</span>
            </label>
            <input
              value={supplierSku}
              onChange={(e) => setSupplierSku(e.target.value)}
              placeholder="e.g. SUP-98402"
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Unit cost <span className="text-stocky-text-sub font-normal">(optional agreed price)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="e.g. 14.50"
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="mt-auto flex items-center justify-end gap-2.5 pt-5 border-t border-stocky-border-subtle">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="h-10 rounded-full border border-stocky-border-subtle px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-white hover:bg-stocky-primary-hover transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Linking…' : 'Link product'}
            </button>
          </div>
        </form>
      </div>
    </SideDrawer>
  );
}
