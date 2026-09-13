'use client';

import React, { useState } from 'react';
import { XIcon } from '@stocky/icons';
import type { Location, Product, Supplier } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';

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
  const [productId, setProductId] = useState(defaultProductId || '');
  const [locationId, setLocationId] = useState(
    selectedLocationId === 'all' ? locations[0]?.id || '' : selectedLocationId
  );
  const [supplierId, setSupplierId] = useState(defaultSupplierId || '');
  const [requestType, setRequestType] = useState<'replenish' | 'return' | 'replace'>('replenish');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setProductId(defaultProductId || '');
    setLocationId(selectedLocationId === 'all' ? locations[0]?.id || '' : selectedLocationId);
    setSupplierId(defaultSupplierId || '');
    setRequestType('replenish');
    setQuantity('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId || !locationId) {
      setError('Please select a product and target location.');
      return;
    }

    const parsedQty = quantity ? parseInt(quantity, 10) : undefined;
    if (parsedQty !== undefined && (isNaN(parsedQty) || parsedQty <= 0)) {
      setError('Quantity must be a positive whole number.');
      return;
    }

    onCreate({
      productId,
      locationId,
      supplierId: supplierId || undefined,
      requestType,
      quantity: parsedQty,
    });
    handleClose();
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={handleClose} ariaLabel="Create supplier request">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stocky-border-subtle p-5 sm:p-6">
          <div>
            <h2 className="text-base font-medium text-stocky-text-main">New supplier request</h2>
            <p className="mt-0.5 text-xs text-stocky-text-sub">
              Request replenishment, returns, or replacements for inventory batches.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer"
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
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="">Choose product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.barcode ? `(${product.barcode})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="">Choose location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Request type <span className="text-red-500">*</span>
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as typeof requestType)}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="replenish">Replenish (Order new stock)</option>
              <option value="return">Return (Send damaged/excess items back)</option>
              <option value="replace">Replace (Exchange defective batch)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Supplier <span className="text-stocky-text-sub font-normal">(optional)</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="">Choose supplier (or leave unassigned)</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Quantity <span className="text-stocky-text-sub font-normal">(optional units)</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 100"
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="mt-auto flex items-center justify-end gap-2.5 pt-5 border-t border-stocky-border-subtle">
            <button
              type="button"
              onClick={handleClose}
              className="h-10 rounded-full border border-stocky-border-subtle px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-white hover:bg-stocky-primary-hover transition-colors cursor-pointer shadow-sm"
            >
              Create request
            </button>
          </div>
        </form>
      </div>
    </SideDrawer>
  );
}
