'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, TrashIcon, XIcon } from '@stocky/icons';
import type { Location, Product, StockLot } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';

export type TransferLineDraft = { productId: string; quantity: string };

export interface TransferRequestDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  products: Product[];
  lots: StockLot[];
  selectedLocationId: string;
  defaultProductId?: string;
  onCreate: (input: {
    sourceLocationId: string;
    destinationLocationId: string;
    lines: Array<{ productId: string; quantity: number }>;
    note?: string;
  }) => void;
}

export function TransferRequestDrawerWidget({
  isOpen,
  onClose,
  locations,
  products,
  lots,
  selectedLocationId,
  defaultProductId,
  onCreate,
}: TransferRequestDrawerWidgetProps) {
  const suggestedSourceId =
    defaultProductId && selectedLocationId === 'all'
      ? lots.find(
          (lot) =>
            lot.productId === defaultProductId &&
            lot.quantityOnHand > 0 &&
            locations.some((location) => location.id === lot.locationId)
        )?.locationId || ''
      : selectedLocationId === 'all'
      ? ''
      : selectedLocationId;

  const [sourceLocationId, setSourceLocationId] = useState(suggestedSourceId);
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [lines, setLines] = useState<TransferLineDraft[]>([
    { productId: defaultProductId || '', quantity: '' },
  ]);
  const [requestNote, setRequestNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (defaultProductId) {
      if (!sourceLocationId) {
        const sourceWithStock = lots.find(
          (lot) =>
            lot.productId === defaultProductId &&
            lot.quantityOnHand > 0 &&
            locations.some((location) => location.id === lot.locationId)
        );
        if (sourceWithStock) setSourceLocationId(sourceWithStock.locationId);
      }
      setLines([{ productId: defaultProductId, quantity: '' }]);
    }
  }, [defaultProductId, isOpen, locations, lots, sourceLocationId]);

  const availableFor = (productId: string) =>
    sourceLocationId
      ? lots
          .filter(
            (lot) =>
              lot.locationId === sourceLocationId &&
              lot.productId === productId &&
              lot.quantityOnHand > 0
          )
          .reduce((sum, lot) => sum + lot.quantityOnHand, 0)
      : 0;

  const sourceProducts = useMemo(
    () =>
      sourceLocationId
        ? products.filter((product) =>
            lots.some(
              (lot) =>
                lot.locationId === sourceLocationId &&
                lot.productId === product.id &&
                lot.quantityOnHand > 0
            )
          )
        : products,
    [lots, products, sourceLocationId]
  );

  const updateLine = (index: number, field: keyof TransferLineDraft, value: string) => {
    setError(null);
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      )
    );
  };

  const addLine = () => {
    setLines((current) => [...current, { productId: '', quantity: '' }]);
  };

  const removeLine = (index: number) => {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!sourceLocationId) {
      setError('Please choose a source location.');
      return;
    }
    if (!destinationLocationId) {
      setError('Please choose a destination location.');
      return;
    }
    if (sourceLocationId === destinationLocationId) {
      setError('Source and destination locations must be different.');
      return;
    }

    const normalized = lines.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
    }));

    if (normalized.length === 0 || normalized.some((line) => !line.productId)) {
      setError('Please select a product for each line.');
      return;
    }

    for (const line of normalized) {
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        setError('Quantities must be whole numbers greater than zero.');
        return;
      }
      const available = availableFor(line.productId);
      if (line.quantity > available) {
        const prod = products.find((p) => p.id === line.productId);
        setError(
          `Requested quantity for ${prod?.name || 'product'} exceeds available stock (${available} available).`
        );
        return;
      }
    }

    onCreate({
      sourceLocationId,
      destinationLocationId,
      lines: normalized,
      note: requestNote.trim() || undefined,
    });

    onClose();
    setLines([{ productId: '', quantity: '' }]);
    setRequestNote('');
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel="Request stock">
      <div className="flex h-full flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stocky-border-subtle p-4 sm:p-5">
          <div>
            <h2 className="text-base font-medium text-stocky-text-main">Request stock</h2>
            <p className="mt-0.5 text-xs text-stocky-text-sub">
              Move one or more products between locations.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer"
            aria-label="Close"
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-5 gap-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Location Selectors */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-stocky-text-main">From (Source)</label>
              <select
                required
                value={sourceLocationId}
                onChange={(event) => {
                  setSourceLocationId(event.target.value);
                  setLines([{ productId: '', quantity: '' }]);
                  setError(null);
                }}
                className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                <option value="">Choose source location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stocky-text-main">To (Destination)</label>
              <select
                required
                value={destinationLocationId}
                onChange={(event) => {
                  setDestinationLocationId(event.target.value);
                  setError(null);
                }}
                className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                <option value="">Choose destination location</option>
                {locations
                  .filter((location) => location.id !== sourceLocationId)
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Lines Section */}
          <div className="rounded-xl border border-stocky-border-subtle overflow-hidden">
            <div className="flex items-center justify-between bg-stocky-bg-global px-3.5 py-2.5 border-b border-stocky-border-subtle">
              <span className="text-xs font-medium text-stocky-text-main">
                Products in this transfer
              </span>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 text-xs font-medium text-stocky-primary hover:underline cursor-pointer"
              >
                <PlusIcon size="xs" /> Add product
              </button>
            </div>

            <div className="divide-y divide-stocky-border-subtle p-2">
              {lines.map((line, index) => {
                const available = line.productId ? availableFor(line.productId) : 0;
                return (
                  <div key={index} className="flex flex-col gap-2.5 p-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className="block text-[11px] font-medium text-stocky-text-sub">Product</label>
                      <select
                        required
                        value={line.productId}
                        onChange={(event) => updateLine(index, 'productId', event.target.value)}
                        className="mt-1 h-9 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-widget px-2.5 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                      >
                        <option value="">Choose product</option>
                        {sourceProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-36">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-stocky-text-sub">Quantity</label>
                        {line.productId && (
                          <span className="text-[10px] text-stocky-text-sub">
                            Avail: {available}
                          </span>
                        )}
                      </div>
                      <input
                        required
                        type="number"
                        min="1"
                        max={available || undefined}
                        value={line.quantity}
                        onChange={(event) => updateLine(index, 'quantity', event.target.value)}
                        placeholder="Qty"
                        className="mt-1 h-9 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-widget px-2.5 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                      />
                    </div>

                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-stocky-border-subtle text-stocky-text-sub hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors cursor-pointer self-end"
                        aria-label="Remove product"
                      >
                        <TrashIcon size="xs" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request Note */}
          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Note <span className="text-stocky-text-sub font-normal">(optional)</span>
            </label>
            <textarea
              value={requestNote}
              onChange={(event) => setRequestNote(event.target.value)}
              rows={3}
              placeholder="Why is this stock movement needed? (e.g. Weekly branch replenishment)"
              className="mt-1.5 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget p-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="mt-auto flex items-center justify-end gap-2.5 pt-4 border-t border-stocky-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-full border border-stocky-border-subtle px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-white hover:bg-stocky-primary-hover transition-colors cursor-pointer shadow-sm"
            >
              Send request
            </button>
          </div>
        </form>
      </div>
    </SideDrawer>
  );
}
