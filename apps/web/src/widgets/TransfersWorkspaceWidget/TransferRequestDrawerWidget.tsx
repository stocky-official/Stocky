'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightIcon, BoxesIcon, PlusIcon, TrashIcon, WarehouseIcon, XIcon } from '@stocky/icons';
import type { Location, Product, StockLot } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { useTranslation } from '@/lib/i18n';

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
  }) => void | Promise<void>;
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
  const { t } = useTranslation();
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

  const selectedSourceLoc = useMemo(
    () => locations.find((location) => location.id === sourceLocationId),
    [locations, sourceLocationId]
  );
  const selectedDestLoc = useMemo(
    () => locations.find((location) => location.id === destinationLocationId),
    [locations, destinationLocationId]
  );

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!sourceLocationId) {
      setError(t('drawers.transferRequest.errors.chooseSource'));
      return;
    }
    if (!destinationLocationId) {
      setError(t('drawers.transferRequest.errors.chooseDest'));
      return;
    }
    if (sourceLocationId === destinationLocationId) {
      setError(t('drawers.transferRequest.errors.sameLocation'));
      return;
    }

    const normalized = lines.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
    }));

    if (normalized.length === 0 || normalized.some((line) => !line.productId)) {
      setError(t('drawers.transferRequest.errors.selectProduct'));
      return;
    }

    for (const line of normalized) {
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        setError(t('drawers.transferRequest.errors.wholeNumbers'));
        return;
      }
      const available = availableFor(line.productId);
      if (line.quantity > available) {
        const prod = products.find((p) => p.id === line.productId);
        setError(
          t('drawers.transferRequest.errors.exceedsAvailable', {
            product: prod?.name || 'product',
            available,
          })
        );
        return;
      }
    }

    try {
      await onCreate({
        sourceLocationId,
        destinationLocationId,
        lines: normalized,
        note: requestNote.trim() || undefined,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : t('common.error'));
      return;
    }

    onClose();
    setLines([{ productId: '', quantity: '' }]);
    setRequestNote('');
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t('drawers.transferRequest.title')}>
      <div className="flex h-full flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stocky-border-subtle p-4 sm:p-5">
          <div>
            <h2 className="text-base font-medium text-stocky-text-main">{t('drawers.transferRequest.title')}</h2>
            <p className="mt-0.5 text-xs text-stocky-text-sub">
              {t('drawers.transferRequest.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer"
            aria-label={t('drawers.transferRequest.close')}
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

          {/* Paired Location Selectors (TASK-TRF-02) */}
          <div className="rounded-2xl border border-stocky-border-subtle bg-stocky-bg-global/50 p-3.5 sm:p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stocky-text-sub">{t('drawers.transferRequest.transferRoute')}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stocky-primary">
                <span>{selectedSourceLoc?.name || t('drawers.transferRequest.origin')}</span>
                <ArrowRightIcon size="xs" className="rtl:rotate-180" />
                <span>{selectedDestLoc?.name || t('drawers.transferRequest.destination')}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center relative">
              {/* Source Location Card */}
              <div className="rounded-xl border border-stocky-border-subtle bg-white p-3 flex flex-col gap-1.5 focus-within:border-stocky-primary transition-colors shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-stocky-text-sub uppercase tracking-wider flex items-center gap-1">
                    <WarehouseIcon size="xs" className="text-stocky-primary" />
                    <span>{t('drawers.transferRequest.originFrom')}</span>
                  </label>
                  {selectedSourceLoc && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stocky-primary/10 text-stocky-primary border border-stocky-primary/20 capitalize">
                      {selectedSourceLoc.type}
                    </span>
                  )}
                </div>
                <select
                  required
                  value={sourceLocationId}
                  onChange={(event) => {
                    setSourceLocationId(event.target.value);
                    setLines([{ productId: '', quantity: '' }]);
                    setError(null);
                  }}
                  className="h-9 w-full bg-transparent text-xs font-semibold text-stocky-text-main outline-none cursor-pointer"
                >
                  <option value="">{t('drawers.transferRequest.chooseSource')}</option>
                  {locations.map((loc) => {
                    const skuCountAtLoc = lots.filter(
                      (l) => l.locationId === loc.id && l.quantityOnHand > 0
                    ).length;
                    return (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type.toUpperCase()}) — {t('drawers.transferRequest.itemsInStock', { count: skuCountAtLoc })}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Directional arrow between them */}
              <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-stocky-border-subtle shadow-2xs items-center justify-center text-stocky-primary">
                <ArrowRightIcon size="xs" className="rtl:rotate-180" />
              </div>

              {/* Destination Location Card */}
              <div className="rounded-xl border border-stocky-border-subtle bg-white p-3 flex flex-col gap-1.5 focus-within:border-stocky-primary transition-colors shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-stocky-text-sub uppercase tracking-wider flex items-center gap-1">
                    <WarehouseIcon size="xs" className="text-stocky-accent" />
                    <span>{t('drawers.transferRequest.destinationTo')}</span>
                  </label>
                  {selectedDestLoc && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle capitalize">
                      {selectedDestLoc.type}
                    </span>
                  )}
                </div>
                <select
                  required
                  value={destinationLocationId}
                  onChange={(event) => {
                    setDestinationLocationId(event.target.value);
                    setError(null);
                  }}
                  className="h-9 w-full bg-transparent text-xs font-semibold text-stocky-text-main outline-none cursor-pointer"
                >
                  <option value="">{t('drawers.transferRequest.chooseDestination')}</option>
                  {locations
                    .filter((loc) => loc.id !== sourceLocationId)
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lines Section (TASK-TRF-03) */}
          <div className="rounded-2xl border border-stocky-border-subtle overflow-hidden bg-white">
            <div className="flex items-center justify-between bg-stocky-bg-global px-4 py-3 border-b border-stocky-border-subtle">
              <div>
                <span className="text-xs font-semibold text-stocky-text-main">
                  {t('drawers.transferRequest.productsInTransfer')}
                </span>
                <span className="ms-1.5 text-[11px] text-stocky-text-sub">
                  {t('drawers.transferRequest.selectedCount', { count: lines.filter((l) => l.productId).length })}
                </span>
              </div>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stocky-border-subtle text-xs font-medium text-stocky-primary hover:border-stocky-primary transition-colors cursor-pointer shadow-2xs"
              >
                <PlusIcon size="xs" /> {t('drawers.transferRequest.addProduct')}
              </button>
            </div>

            <div className="flex flex-col gap-2.5 p-3 sm:p-3.5 bg-stocky-bg-global/30">
              {lines.map((line, index) => {
                const available = line.productId ? availableFor(line.productId) : 0;
                const selectedProd = products.find((p) => p.id === line.productId);
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-stocky-border-subtle bg-white p-3.5 flex flex-col gap-3 shadow-2xs"
                  >
                    {/* Top: Product Selection & Stock Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub mb-1">
                          {t('drawers.transferRequest.productLine', { index: index + 1 })}
                        </label>
                        <select
                          required
                          value={line.productId}
                          onChange={(event) => updateLine(index, 'productId', event.target.value)}
                          className="h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs font-medium text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        >
                          <option value="">{t('drawers.transferRequest.selectProductFromOrigin')}</option>
                          {sourceProducts.map((product) => {
                            const avail = availableFor(product.id);
                            return (
                              <option key={product.id} value={product.id}>
                                {product.name} {product.barcode ? `(${product.barcode})` : ''} — {t('drawers.transferRequest.availableCount', { count: avail })}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {line.productId && (
                        <div className="self-start sm:self-end shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                              available > 0
                                ? 'bg-stocky-status-success-bg text-stocky-status-success-fg border-stocky-status-success-border'
                                : 'bg-stocky-status-critical-bg text-stocky-status-critical-fg border-stocky-status-critical-border'
                            }`}
                          >
                            <BoxesIcon size="xs" />
                            <span>{t('drawers.transferRequest.inStockAtOrigin', { count: available })}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Quantity Stepper & Remove */}
                    <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-stocky-border-subtle/60">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-medium text-stocky-text-sub">{t('drawers.transferRequest.transferQty')}</span>
                        <div className="inline-flex items-center rounded-xl border border-stocky-border-subtle bg-stocky-bg-global p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(line.quantity || '0', 10);
                              if (current > 1) updateLine(index, 'quantity', String(current - 1));
                            }}
                            disabled={!line.quantity || parseInt(line.quantity, 10) <= 1}
                            className="h-8 w-8 rounded-lg bg-white border border-stocky-border-subtle/80 flex items-center justify-center text-stocky-text-main hover:bg-stocky-bg-hover disabled:opacity-40 cursor-pointer font-bold text-sm"
                            aria-label={t('drawers.transferRequest.decreaseQuantity')}
                          >
                            -
                          </button>
                          <input
                            required
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min="1"
                            max={available || undefined}
                            value={line.quantity}
                            onKeyDown={(event) => {
                              if (['e', 'E', '+', '-', '.', ','].includes(event.key)) event.preventDefault();
                            }}
                            onChange={(event) => {
                              const digitsOnly = event.target.value.replace(/\D/g, '');
                              const nextValue = available > 0 ? digitsOnly.slice(0, String(available).length) : digitsOnly;
                              updateLine(index, 'quantity', nextValue);
                            }}
                            placeholder="0"
                            className="w-16 h-8 text-center text-xs font-bold text-stocky-text-main bg-transparent outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(line.quantity || '0', 10);
                              if (!available || current < available)
                                updateLine(index, 'quantity', String(current + 1));
                            }}
                            disabled={Boolean(available && parseInt(line.quantity || '0', 10) >= available)}
                            className="h-8 w-8 rounded-lg bg-white border border-stocky-border-subtle/80 flex items-center justify-center text-stocky-text-main hover:bg-stocky-bg-hover disabled:opacity-40 cursor-pointer font-bold text-sm"
                            aria-label={t('drawers.transferRequest.increaseQuantity')}
                          >
                            +
                          </button>
                        </div>
                        {selectedProd && (
                          <span className="text-xs font-medium text-stocky-text-sub">
                            {selectedProd.unitName || t('drawers.transferRequest.units')}
                          </span>
                        )}
                      </div>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="h-8 px-3 rounded-full border border-stocky-border-subtle text-xs text-stocky-text-sub hover:border-stocky-status-critical-border hover:text-stocky-status-critical-fg hover:bg-stocky-status-critical-bg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          aria-label={t('drawers.transferRequest.removeProduct')}
                        >
                          <TrashIcon size="xs" />
                          <span className="hidden sm:inline">{t('drawers.transferRequest.remove')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request Note */}
          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              {t('drawers.transferRequest.note')} <span className="text-stocky-text-sub font-normal">{t('drawers.transferRequest.optional')}</span>
            </label>
            <textarea
              value={requestNote}
              onChange={(event) => setRequestNote(event.target.value)}
              rows={3}
              placeholder={t('drawers.transferRequest.notePlaceholder')}
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
              {t('drawers.transferRequest.cancel')}
            </button>
            <button
              type="submit"
              className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-white hover:bg-stocky-primary-hover transition-colors cursor-pointer shadow-sm"
            >
              {t('drawers.transferRequest.sendRequest')}
            </button>
          </div>
        </form>
      </div>
    </SideDrawer>
  );
}
