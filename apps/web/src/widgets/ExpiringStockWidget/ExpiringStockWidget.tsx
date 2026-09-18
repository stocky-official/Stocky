'use client';

import React, { useMemo, useState } from 'react';
import { AlertCircleIcon, ClockIcon, SearchIcon, XIcon } from '@stocky/icons';
import type { CompanyUserRole, Location, Product, StockLot } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';

export type ExpiryQueueFilter = 'all' | 'expired' | 'soon' | 'missing' | 'on_hold';
export type ExpiryAction = 'hold' | 'dispose' | 'return' | 'replace';

export interface ExpiringStockWidgetProps {
  products: Product[];
  lots: StockLot[];
  locations: Location[];
  selectedLocationId: string;
  userRole: CompanyUserRole;
  onLocationChange: (locationId: string) => void;
  onAction: (lot: StockLot, action: ExpiryAction, reason?: string) => void;
  onSupplierRequest: (input: { productId: string; locationId: string; quantity: number; supplierId?: string; type: 'return' | 'replace' }) => void;
  onTransferRequest: (productId: string, locationId: string) => void;
  onUpdateLot: (lot: StockLot, input: { lotNumber?: string; expiryDate: string; notificationDays: number }) => void;
}

function getQueue(lot: StockLot): ExpiryQueueFilter {
  if (lot.status === 'on_hold') return 'on_hold';
  if (lot.quantityOnHand <= 0) return 'all';
  if (!lot.expiryDate) return 'missing';
  const days = Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'expired';
  if (days <= (lot.expiryNotificationDays ?? 0)) return 'soon';
  return 'all';
}

export function ExpiringStockWidget({
  products,
  lots,
  locations,
  selectedLocationId,
  userRole,
  onLocationChange,
  onAction,
  onSupplierRequest,
  onTransferRequest,
  onUpdateLot,
}: ExpiringStockWidgetProps) {
  const { t, locale } = useTranslation();

  function daysLabel(lot: StockLot) {
    if (!lot.expiryDate) return t('expiring.missing');
    const days = Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000);
    if (days < 0) {
      const absDays = Math.abs(days);
      return absDays === 1 ? t('expiring.dayOverdue') : t('expiring.daysOverdue', { days: absDays });
    }
    if (days === 0) return t('expiring.expiresToday');
    return days === 1 ? t('expiring.dayLeft') : t('expiring.daysLeft', { days });
  }
  const [filter, setFilter] = useState<ExpiryQueueFilter>('soon');
  const [search, setSearch] = useState('');
  const [editingLot, setEditingLot] = useState<StockLot | null>(null);
  const [editLotNumber, setEditLotNumber] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editNotificationDays, setEditNotificationDays] = useState('30');
  const canAct = userRole !== 'staff';
  const runAction = (lot: StockLot, action: ExpiryAction) => {
    const reason = window.prompt(
      action === 'dispose'
        ? t('expiring.disposePrompt')
        : t('expiring.actionNotePrompt'),
      t('expiring.defaultReason')
    );
    if (reason === null) return;
    onAction(lot, action, reason.trim() || t('expiring.defaultReason'));
  };
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const locationMap = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations]);
  const openLotEditor = (lot: StockLot) => { setEditingLot(lot); setEditLotNumber(lot.lotNumber || ''); setEditExpiryDate(lot.expiryDate ? lot.expiryDate.slice(0, 10) : ''); setEditNotificationDays(String(lot.expiryNotificationDays ?? 30)); };

  const queue = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return lots
      .filter((lot) => lot.quantityOnHand > 0)
      .filter((lot) => selectedLocationId === 'all' || lot.locationId === selectedLocationId)
      .filter((lot) => filter === 'all' ? getQueue(lot) !== 'all' : getQueue(lot) === filter)
      .filter((lot) => {
        if (!normalized) return true;
        const product = productMap.get(lot.productId);
        return [product?.name, product?.barcode, lot.lotNumber, locationMap.get(lot.locationId)?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });
  }, [filter, locationMap, lots, productMap, search, selectedLocationId]);

  const counts = useMemo(() => {
    const scoped = lots.filter((lot) => lot.quantityOnHand > 0 && (selectedLocationId === 'all' || lot.locationId === selectedLocationId));
    return {
      expired: scoped.filter((lot) => getQueue(lot) === 'expired').length,
      soon: scoped.filter((lot) => getQueue(lot) === 'soon').length,
      missing: scoped.filter((lot) => getQueue(lot) === 'missing').length,
      on_hold: scoped.filter((lot) => getQueue(lot) === 'on_hold').length,
    };
  }, [lots, selectedLocationId]);

  const filters: Array<{ id: ExpiryQueueFilter; label: string; count?: number }> = [
    { id: 'soon', label: t('expiring.soon'), count: counts.soon },
    { id: 'expired', label: t('expiring.expired'), count: counts.expired },
    { id: 'missing', label: t('expiring.missing'), count: counts.missing },
    { id: 'on_hold', label: t('expiring.onHold'), count: counts.on_hold },
    { id: 'all', label: t('expiring.all'), count: counts.soon + counts.expired + counts.missing + counts.on_hold },
  ];

  return (
    <div className="stocky-expiring-workspace flex flex-col gap-6">

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((option) => (
          <button key={option.id} type="button" onClick={() => setFilter(option.id)} className={`shrink-0 h-8 px-3 rounded-full border text-xs cursor-pointer ${filter === option.id ? 'bg-stocky-text-main text-white border-stocky-text-main' : 'bg-white text-stocky-text-sub border-stocky-border-subtle hover:border-stocky-primary/40'}`}>
            {option.label} <span className="ms-1 opacity-70">{option.count}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <SearchIcon size="xs" className="absolute start-3 top-1/2 -translate-y-1/2 text-stocky-text-sub pointer-events-none" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('expiring.searchPlaceholder')} className="w-full h-10 rounded-xl bg-white border border-stocky-border-subtle ps-9 pe-9 text-sm focus:outline-none focus:border-stocky-primary text-start" />
        {search && <button type="button" onClick={() => setSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-stocky-text-sub cursor-pointer" aria-label={t('expiring.clearSearch')}><XIcon size="xs" /></button>}
      </div>

      <section className="rounded-2xl bg-white border border-stocky-border-subtle overflow-hidden">
        {queue.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ClockIcon size="md" className="mx-auto text-emerald-600/60" />
            <h2 className="mt-3 text-base font-medium text-stocky-text-main">{t('expiring.emptyTitle')}</h2>
            <p className="mt-1 text-sm text-stocky-text-sub">{t('expiring.emptyDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-stocky-border-subtle">
            {queue.map((lot) => {
              const product = productMap.get(lot.productId);
              const location = locationMap.get(lot.locationId);
              const state = getQueue(lot);
              return (
                <div key={lot.id} className="p-4 sm:p-6 flex flex-col xl:flex-row xl:items-center gap-4">
                  <div className="w-10 h-10 rounded-xl stocky-status-warning border flex items-center justify-center shrink-0"><AlertCircleIcon size="sm" /></div>
                  <div className="flex-1 min-w-0 text-start">
                    <p className="text-sm font-medium text-stocky-text-main truncate">{product?.name || t('expiring.unknownProduct')}</p>
                    <p className="text-xs text-stocky-text-sub mt-1">{location?.name || t('expiring.location')} · {t('expiring.batchPrefix', { batch: lot.lotNumber || t('expiring.notRecorded'), quantity: lot.quantityOnHand })}</p>
                    <p className={`text-xs mt-1 ${state === 'expired' || state === 'missing' ? 'stocky-text-critical' : 'stocky-text-warning'}`}>{daysLabel(lot)}{lot.expiryDate ? ` · ${new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(lot.expiryDate))}` : ''}</p>
                  </div>
                  {canAct ? (
                    <div className="flex flex-wrap gap-2">
                      {state === 'expired' || state === 'soon' ? <button type="button" onClick={() => runAction(lot, 'hold')} className="h-8 px-3 rounded-lg border border-stocky-border-subtle text-[11px] cursor-pointer">{t('expiring.putOnHold')}</button> : null}
                      {state === 'expired' ? <button type="button" onClick={() => runAction(lot, 'dispose')} className="h-8 px-3 rounded-lg border stocky-status-critical text-[11px] cursor-pointer">{t('expiring.markRemoved')}</button> : null}
                      {state === 'expired' ? <button type="button" onClick={() => onSupplierRequest({ productId: lot.productId, locationId: lot.locationId, quantity: lot.quantityOnHand, supplierId: lot.supplierId || undefined, type: 'return' })} className="h-8 px-3 rounded-lg border stocky-status-critical text-[11px] cursor-pointer">{t('expiring.returnToSupplier')}</button> : null}
                      {state === 'soon' ? <button type="button" onClick={() => onSupplierRequest({ productId: lot.productId, locationId: lot.locationId, quantity: lot.quantityOnHand, supplierId: lot.supplierId || undefined, type: 'replace' })} className="h-8 px-3 rounded-lg bg-stocky-primary text-white text-[11px] font-medium cursor-pointer">{t('expiring.requestReplacement')}</button> : null}
                      {canAct && (state === 'soon' || state === 'expired') ? <button type="button" onClick={() => onTransferRequest(lot.productId, lot.locationId)} className="h-8 px-3 rounded-lg border border-stocky-border-subtle text-[11px] cursor-pointer">{t('expiring.moveToLocation')}</button> : null}
                      {state === 'on_hold' ? <button type="button" onClick={() => runAction(lot, 'dispose')} className="h-8 px-3 rounded-lg border stocky-status-critical text-[11px] cursor-pointer">{t('expiring.markRemoved')}</button> : null}
                      {state === 'missing' ? <button type="button" onClick={() => openLotEditor(lot)} className="h-8 px-3 rounded-lg bg-stocky-primary text-white text-[11px] font-medium cursor-pointer">{t('expiring.addExpiry')}</button> : null}
                    </div>
                  ) : (
                    <span className="text-xs text-stocky-text-sub">{t('expiring.tellManager')}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {editingLot ? (
        <div className="fixed inset-0 z-[70] stocky-overlay flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={t('expiring.addExpiryDetails')}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-stocky-border-subtle p-5 space-y-4 text-start">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-amber-700 uppercase tracking-[0.12em]">{t('expiring.missingBatchData')}</p>
                <h2 className="text-lg font-medium text-stocky-text-main mt-1">{t('expiring.addExpiryDetails')}</h2>
                <p className="text-xs text-stocky-text-sub mt-1">{t('expiring.addExpiryDesc')}</p>
              </div>
              <button type="button" onClick={() => setEditingLot(null)} className="text-stocky-text-sub hover:text-stocky-text-main cursor-pointer" aria-label={t('common.close')}><XIcon size="xs" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs text-stocky-text-sub sm:col-span-2">{t('expiring.batchLotNumber')}
                <input value={editLotNumber} onChange={(event) => setEditLotNumber(event.target.value)} placeholder={t('common.optional')} className="mt-1 w-full h-10 rounded-lg border border-stocky-border-subtle px-3 text-sm focus:outline-none focus:border-stocky-primary" />
              </label>
              <label className="text-xs text-stocky-text-sub sm:col-span-2">{t('expiring.expiryDate')}
                <input type="date" value={editExpiryDate} onChange={(event) => setEditExpiryDate(event.target.value)} className="mt-1 w-full h-10 rounded-lg border border-stocky-border-subtle px-3 text-sm focus:outline-none focus:border-stocky-primary" />
              </label>
              <label className="text-xs text-stocky-text-sub sm:col-span-2">{t('expiring.warnDaysBefore')}
                <input type="number" min="0" step="1" value={editNotificationDays} onChange={(event) => setEditNotificationDays(event.target.value)} className="mt-1 w-full h-10 rounded-lg border border-stocky-border-subtle px-3 text-sm focus:outline-none focus:border-stocky-primary" />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditingLot(null)} className="h-9 px-3 rounded-lg border border-stocky-border-subtle text-xs cursor-pointer">{t('common.cancel')}</button>
              <button type="button" disabled={!editExpiryDate} onClick={() => { onUpdateLot(editingLot, { lotNumber: editLotNumber.trim() || undefined, expiryDate: editExpiryDate, notificationDays: Math.max(0, Number.parseInt(editNotificationDays || '0', 10) || 0) }); setEditingLot(null); }} className="h-9 px-3 rounded-lg bg-stocky-primary text-white text-xs font-medium disabled:opacity-50 cursor-pointer">{t('expiring.saveExpiryDetails')}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
