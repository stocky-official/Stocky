'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BarcodeIcon, XIcon } from '@stocky/icons';
import type { InventoryTransfer, InventoryTransferLine, Product } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { useTranslation } from '@/lib/i18n';

export interface TransferReceiveDrawerWidgetProps {
  isOpen: boolean;
  transfer: InventoryTransfer | null;
  transferLines: InventoryTransferLine[];
  products: Product[];
  onClose: () => void;
  onReceive: (
    transfer: InventoryTransfer,
    lines?: Array<{ lineId: string; quantityReceived: number }>,
    note?: string
  ) => void | Promise<void>;
}

export function TransferReceiveDrawerWidget({
  isOpen,
  transfer,
  transferLines,
  products,
  onClose,
  onReceive,
}: TransferReceiveDrawerWidgetProps) {
  const { t } = useTranslation();
  // Exit State Preservation (Rule 8 of stocky-page-redesign skill)
  const lastTransferRef = useRef<InventoryTransfer | null>(null);
  if (transfer) {
    lastTransferRef.current = transfer;
  }
  const activeTransfer = transfer || lastTransferRef.current;

  const [receiptQuantities, setReceiptQuantities] = useState<Record<string, string>>({});
  const [receiptNote, setReceiptNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const productMap = useRef<Map<string, Product>>(new Map());
  useEffect(() => {
    productMap.current = new Map(products.map((p) => [p.id, p]));
  }, [products]);

  const activeLines = activeTransfer
    ? transferLines.filter((line) => line.transferId === activeTransfer.id)
    : [];

  useEffect(() => {
    if (activeTransfer && activeLines.length > 0) {
      setReceiptQuantities(
        Object.fromEntries(
          activeLines.map((line) => [
            line.id,
            String(
              Math.max(
                0,
                (line.quantityApproved ?? line.quantityRequested) - line.quantityReceived
              )
            ),
          ])
        )
      );
      setReceiptNote('');
      setError(null);
    }
  }, [activeTransfer?.id, activeLines.length]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeTransfer) return;
    setError(null);

    const rows = activeLines.map((line) => {
      const remaining = Math.max(
        0,
        (line.quantityApproved ?? line.quantityRequested) - line.quantityReceived
      );
      const quantityReceived = Number(receiptQuantities[line.id] || 0);
      return {
        lineId: line.id,
        quantityReceived,
        remaining,
      };
    });

    const hasShortage = rows.some((line) => line.quantityReceived < line.remaining);
    if (hasShortage && !receiptNote.trim()) {
      setError(t('drawers.transferReceive.errors.shortageNoteRequired'));
      return;
    }

    try {
      await onReceive(
        activeTransfer,
        rows.map(({ lineId, quantityReceived }) => ({ lineId, quantityReceived })),
        receiptNote.trim() || undefined
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : t('common.error'));
      return;
    }
    onClose();
  };

  if (!activeTransfer) return null;

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t('drawers.transferReceive.title')}>
      <div className="flex h-full flex-col bg-stocky-bg-widget">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stocky-border-subtle p-4 sm:p-5">
          <div>
            <h2 className="text-base font-medium text-stocky-text-main">
              {t('drawers.transferReceive.drawerTitle')}
            </h2>
            <p className="mt-0.5 text-xs text-stocky-text-sub">
              {t('drawers.transferReceive.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer"
            aria-label={t('drawers.transferReceive.close')}
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-5 gap-5">
          {error && (
            <div className="rounded-xl border border-stocky-status-critical-border bg-stocky-status-critical-bg p-3 text-xs text-stocky-status-critical-fg">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-stocky-border-subtle divide-y divide-stocky-border-subtle">
            {activeLines.map((line) => {
              const prod = productMap.current.get(line.productId);
              const maxAllowed = Math.max(
                0,
                (line.quantityApproved ?? line.quantityRequested) - line.quantityReceived
              );
              return (
                <div key={line.id} className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-stocky-text-main">
                      {prod?.name || t('drawers.transferReceive.product')}
                    </span>
                    <span className="block text-[11px] text-stocky-text-sub mt-0.5">
                      {t('drawers.transferReceive.lineApprovedReceived', {
                        approved: line.quantityApproved ?? line.quantityRequested,
                        received: line.quantityReceived,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative w-32">
                      <BarcodeIcon size="xs" className="absolute start-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub" />
                      <input
                        type="number"
                        min="0"
                        max={maxAllowed}
                        value={receiptQuantities[line.id] || ''}
                        onChange={(event) =>
                          setReceiptQuantities((current) => ({
                            ...current,
                            [line.id]: event.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-widget ps-8 pe-2.5 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              {t('drawers.transferReceive.differenceNote')}{' '}
              {activeLines.some(
                (line) =>
                  Number(receiptQuantities[line.id] || 0) <
                  Math.max(0, (line.quantityApproved ?? line.quantityRequested) - line.quantityReceived)
              ) ? (
                <span className="text-stocky-status-critical-fg">{t('drawers.transferReceive.shortageRequired')}</span>
              ) : (
                <span className="text-stocky-text-sub font-normal">{t('drawers.transferReceive.optional')}</span>
              )}
            </label>
            <textarea
              value={receiptNote}
              onChange={(event) => setReceiptNote(event.target.value)}
              rows={3}
              placeholder={t('drawers.transferReceive.notePlaceholder')}
              className="mt-1.5 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget p-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none resize-none"
            />
          </div>

          <div className="mt-auto flex items-center justify-end gap-2.5 pt-4 border-t border-stocky-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-full border border-stocky-border-subtle px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              {t('drawers.transferReceive.cancel')}
            </button>
            <button
              type="submit"
              className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-stocky-text-inverse hover:bg-stocky-primary-hover transition-colors cursor-pointer shadow-sm"
            >
              {t('drawers.transferReceive.saveReceipt')}
            </button>
          </div>
        </form>
      </div>
    </SideDrawer>
  );
}
