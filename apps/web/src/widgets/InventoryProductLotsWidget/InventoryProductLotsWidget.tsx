'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BoxesIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  EditIcon,
  SearchIcon,
  TagIcon,
  TrashIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import type { Location, Product, StockLot, Supplier } from '@stocky/types';
import type { StockLotUpdateInput } from '../StockLotEditDrawerWidget/StockLotEditDrawerWidget';
import { useTranslation } from '@/lib/i18n';

type LotView = 'active' | 'attention' | 'history';

export interface InventoryProductLotsWidgetProps {
  product: Product;
  lots: StockLot[];
  locations: Location[];
  suppliers: Supplier[];
  onSaveLot?: (lot: StockLot, input: StockLotUpdateInput) => Promise<void>;
  onDeleteLot?: (lot: StockLot) => void | Promise<void>;
}

export type StockProductLotsWidgetProps = InventoryProductLotsWidgetProps;

function getLotState(lot: StockLot, t: (key: any, params?: any) => string) {
  if (lot.status === 'disposed') return { label: t('drawers.inventoryLots.states.removed'), countdown: null, tone: 'critical' as const, attention: false, history: true };
  if (lot.status === 'returned') return { label: t('drawers.inventoryLots.states.returned'), countdown: null, tone: 'critical' as const, attention: false, history: true };
  if (lot.quantityOnHand <= 0 || lot.status === 'depleted') return { label: t('drawers.inventoryLots.states.depleted'), countdown: null, tone: 'muted' as const, attention: false, history: true };
  if (lot.status === 'on_hold') return { label: t('drawers.inventoryLots.states.onHold'), countdown: null, tone: 'hold' as const, attention: true, history: false };
  if (!lot.expiryDate) return { label: t('drawers.inventoryLots.states.noExpiry'), countdown: null, tone: 'warning' as const, attention: true, history: false };
  const days = Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: t('drawers.inventoryLots.states.expired'), countdown: t('drawers.inventoryLots.states.daysAgo', { days: Math.abs(days) }), tone: 'critical' as const, attention: true, history: false };
  if (days <= (lot.expiryNotificationDays ?? 14)) return { label: t('drawers.inventoryLots.states.expiringSoon'), countdown: t('drawers.inventoryLots.states.daysLeft', { days }), tone: 'warning' as const, attention: true, history: false };
  return { label: t('drawers.inventoryLots.states.valid'), countdown: t('drawers.inventoryLots.states.daysLeft', { days }), tone: 'success' as const, attention: false, history: false };
}

function formatDate(value: string | null | undefined, locale: string, notRecordedLabel: string) {
  if (!value) return notRecordedLabel;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

type LotDraft = {
  lotNumber: string;
  receivedDate: string;
  expiryDate: string;
  expiryNotificationDays: string;
  supplierId: string;
  unitCost: string;
  notes: string;
};

function getLotDraft(lot: StockLot): LotDraft {
  return {
    lotNumber: lot.lotNumber || '',
    receivedDate: lot.receivedAt ? lot.receivedAt.slice(0, 10) : '',
    expiryDate: lot.expiryDate ? lot.expiryDate.slice(0, 10) : '',
    expiryNotificationDays: lot.expiryNotificationDays == null ? '' : String(lot.expiryNotificationDays),
    supplierId: lot.supplierId || '',
    unitCost: String(lot.unitCost ?? 0),
    notes: lot.notes || '',
  };
}

export function InventoryProductLotsWidget({ product, lots, locations, suppliers, onSaveLot, onDeleteLot }: InventoryProductLotsWidgetProps) {
  const { t, locale } = useTranslation();
  const [view, setView] = useState<LotView>('active');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [editingLotId, setEditingLotId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<LotDraft | null>(null);
  const [savingLotId, setSavingLotId] = useState<string | null>(null);
  const [deleteConfirmLotId, setDeleteConfirmLotId] = useState<string | null>(null);
  const [deletingLotId, setDeletingLotId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const pageSize = 12;
  const locationNames = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);
  const supplierNames = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])), [suppliers]);

  useEffect(() => {
    setPage(0);
  }, [product.id, search, view]);

  useEffect(() => {
    if (!editingLotId && !deleteConfirmLotId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setEditingLotId(null);
      setEditDraft(null);
      setDeleteConfirmLotId(null);
      setRowError(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [deleteConfirmLotId, editingLotId]);

  const beginEdit = (lot: StockLot) => {
    setDeleteConfirmLotId(null);
    setRowError(null);
    setEditingLotId(lot.id);
    setEditDraft(getLotDraft(lot));
  };

  const cancelEdit = () => {
    setEditingLotId(null);
    setEditDraft(null);
    setRowError(null);
  };

  const saveEdit = async (lot: StockLot) => {
    if (!onSaveLot || !editDraft) return;
    const parsedNotificationDays = editDraft.expiryNotificationDays.trim() === '' ? null : Number(editDraft.expiryNotificationDays);
    const parsedUnitCost = Number(editDraft.unitCost);
    if (!editDraft.receivedDate) return setRowError(t('drawers.inventoryLots.errors.addReceivedDate'));
    if (editDraft.expiryDate && (parsedNotificationDays === null || !Number.isInteger(parsedNotificationDays) || parsedNotificationDays < 0)) return setRowError(t('drawers.inventoryLots.errors.validAlertWindow'));
    if (!editDraft.supplierId) return setRowError(t('drawers.inventoryLots.errors.chooseSupplier'));
    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) return setRowError(t('drawers.inventoryLots.errors.validCost'));

    setSavingLotId(lot.id);
    setRowError(null);
    try {
      await onSaveLot(lot, {
        lotNumber: editDraft.lotNumber.trim(),
        receivedDate: editDraft.receivedDate,
        expiryDate: editDraft.expiryDate,
        expiryNotificationDays: editDraft.expiryDate ? parsedNotificationDays : null,
        supplierId: editDraft.supplierId,
        unitCost: parsedUnitCost,
        notes: editDraft.notes.trim(),
      });
      cancelEdit();
    } catch (error: any) {
      setRowError(error?.message || t('drawers.inventoryLots.errors.saveFailed'));
    } finally {
      setSavingLotId(null);
    }
  };

  const confirmDelete = async (lot: StockLot) => {
    if (!onDeleteLot) return;
    setDeletingLotId(lot.id);
    setRowError(null);
    try {
      await onDeleteLot(lot);
      setDeleteConfirmLotId(null);
    } catch (error: any) {
      setRowError(error?.message || t('drawers.inventoryLots.errors.deleteFailed'));
    } finally {
      setDeletingLotId(null);
    }
  };

  const counts = useMemo(() => lots.reduce((result, lot) => {
    const state = getLotState(lot, t);
    result[state.history ? 'history' : state.attention ? 'attention' : 'active'] += 1;
    return result;
  }, { active: 0, attention: 0, history: 0 }), [lots, t]);

  const visibleLots = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return lots
      .filter((lot) => {
        const state = getLotState(lot, t);
        if (view === 'history' && !state.history) return false;
        if (view === 'attention' && !state.attention) return false;
        if (view === 'active' && state.history) return false;
        if (!normalized) return true;
        return [lot.lotNumber, locationNames.get(lot.locationId), lot.supplierId ? supplierNames.get(lot.supplierId) : null, state.label]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      })
      .sort((left, right) => {
        if (view === 'history') return new Date(right.updatedAt || right.createdAt).getTime() - new Date(left.updatedAt || left.createdAt).getTime();
        if (!left.expiryDate) return 1;
        if (!right.expiryDate) return -1;
        return new Date(left.expiryDate).getTime() - new Date(right.expiryDate).getTime();
      });
  }, [locationNames, lots, search, supplierNames, t, view]);

  const pageCount = Math.max(1, Math.ceil(visibleLots.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageLots = visibleLots.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <section className="stocky-product-lots flex flex-col gap-3 text-start" aria-label={t('drawers.inventoryLots.drawerAria', { name: product.name })}>
      <nav className="stocky-product-lots__tabs" aria-label={t('drawers.inventoryLots.lotViewsAria')}>
        {([
          ['active', t('drawers.inventoryLots.activeTab'), counts.active],
          ['attention', t('drawers.inventoryLots.attentionTab'), counts.attention],
          ['history', t('drawers.inventoryLots.historyTab'), counts.history],
        ] as const).map(([key, label, count]) => (
          <button type="button" key={key} onClick={() => setView(key)} className={view === key ? 'stocky-product-lots__tab stocky-product-lots__tab--active' : 'stocky-product-lots__tab'}>
            {label}<span>{count}</span>
          </button>
        ))}
      </nav>

      <div className="stocky-product-lots__toolbar">
        <div className="stocky-product-lots__search">
          <SearchIcon size="xs" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('drawers.inventoryLots.searchPlaceholder')}
            aria-label={t('drawers.inventoryLots.searchAria')}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label={t('drawers.inventoryLots.clearSearchAria')}>
              <XIcon size="xs" />
            </button>
          )}
        </div>
        <span className="text-xs text-stocky-text-sub">
          {visibleLots.length === 1
            ? t('drawers.inventoryLots.batchCountSingular', { count: visibleLots.length.toLocaleString() })
            : t('drawers.inventoryLots.batchCountPlural', { count: visibleLots.length.toLocaleString() })}
        </span>
      </div>

      <div className="flex flex-col gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {pageLots.map((lot) => {
          const state = getLotState(lot, t);
          const lotLabel = lot.lotNumber || t('drawers.inventoryLots.receiptBadge', { id: lot.id.slice(0, 8) });
          const supplierName = lot.supplierId ? supplierNames.get(lot.supplierId) || t('drawers.inventoryLots.defaultSupplier') : t('drawers.inventoryLots.notRecorded');
          const locationName = locationNames.get(lot.locationId) || t('drawers.inventoryLots.defaultLocation');
          const isEditing = editingLotId === lot.id && editDraft;
          const isConfirmingDelete = deleteConfirmLotId === lot.id;

          return (
            <article
              key={lot.id}
              className={`rounded-2xl border transition-all ${
                isEditing
                  ? 'border-stocky-primary bg-white ring-1 ring-stocky-primary p-4'
                  : isConfirmingDelete
                  ? 'border-stocky-status-critical-border bg-stocky-status-critical-bg/20 p-4'
                  : 'border-stocky-border-subtle bg-white hover:border-stocky-border-strong hover:shadow-xs p-4'
              } flex flex-col gap-3`}
            >
              {/* Card Header: Lot Badge + Status Badge + Location */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stocky-bg-global text-stocky-text-main border border-stocky-border-subtle">
                    <TagIcon size="xs" className="text-stocky-text-sub" />
                    <span>{t('drawers.inventoryLots.batchBadge', { lotLabel })}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      state.tone === 'critical'
                        ? 'bg-stocky-status-critical-bg text-stocky-status-critical-fg border-stocky-status-critical-border'
                        : state.tone === 'warning'
                        ? 'bg-stocky-status-warning-bg text-stocky-status-warning-fg border-stocky-status-warning-border'
                        : state.tone === 'hold'
                        ? 'bg-stocky-status-hold-bg text-stocky-status-hold-fg border-stocky-status-hold-border'
                        : state.tone === 'muted'
                        ? 'bg-stocky-status-muted-bg text-stocky-status-muted-fg border-stocky-status-muted-border'
                        : 'bg-stocky-status-success-bg text-stocky-status-success-fg border-stocky-status-success-border'
                    }`}
                  >
                    {state.tone === 'critical' && <AlertCircleIcon size="xs" />}
                    {state.tone === 'warning' && <AlertTriangleIcon size="xs" />}
                    {state.tone === 'success' && <CheckCircleIcon size="xs" />}
                    {state.tone === 'hold' && <ClockIcon size="xs" />}
                    {state.tone === 'muted' && <BoxesIcon size="xs" />}
                    <span>{state.label}</span>
                    {state.countdown && <span className="opacity-75">· {state.countdown}</span>}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-stocky-text-sub bg-stocky-bg-global border border-stocky-border-subtle truncate max-w-[170px]" title={locationName}>
                  <WarehouseIcon size="xs" />
                  <span className="truncate">{locationName}</span>
                </span>
              </div>

              {/* Card Body: Editing Mode vs View Mode */}
              {isEditing ? (
                <div className="flex flex-col gap-3 pt-2 border-t border-stocky-border-subtle">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">{t('drawers.inventoryLots.lotNumberLabel')}</label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        value={editDraft.lotNumber}
                        onChange={(event) => setEditDraft({ ...editDraft, lotNumber: event.target.value })}
                        placeholder={t('drawers.inventoryLots.lotNumberPlaceholder')}
                        aria-label={t('drawers.inventoryLots.lotNumberLabel')}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">{t('drawers.inventoryLots.supplierLabel')}</label>
                      <select
                        className="w-full h-8 px-2 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        value={editDraft.supplierId}
                        onChange={(event) => setEditDraft({ ...editDraft, supplierId: event.target.value })}
                        aria-label={t('drawers.inventoryLots.supplierLabel')}
                      >
                        <option value="">{t('drawers.inventoryLots.chooseSupplier')}</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">{t('drawers.inventoryLots.receivedDateLabel')}</label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        type="date"
                        value={editDraft.receivedDate}
                        onChange={(event) => setEditDraft({ ...editDraft, receivedDate: event.target.value })}
                        aria-label={t('drawers.inventoryLots.receivedDateLabel')}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">{t('drawers.inventoryLots.expiryDateLabel')}</label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        type="date"
                        value={editDraft.expiryDate}
                        onChange={(event) => setEditDraft({ ...editDraft, expiryDate: event.target.value })}
                        aria-label={t('drawers.inventoryLots.expiryDateLabel')}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">{t('drawers.inventoryLots.alertWindowLabel')}</label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        type="number"
                        min="0"
                        step="1"
                        value={editDraft.expiryNotificationDays}
                        onChange={(event) => setEditDraft({ ...editDraft, expiryNotificationDays: event.target.value })}
                        placeholder={t('drawers.inventoryLots.alertWindowPlaceholder')}
                        aria-label={t('drawers.inventoryLots.alertWindowLabel')}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">{t('drawers.inventoryLots.unitCostLabel')}</label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editDraft.unitCost}
                        onChange={(event) => setEditDraft({ ...editDraft, unitCost: event.target.value })}
                        aria-label={t('drawers.inventoryLots.unitCostLabel')}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">{t('drawers.inventoryLots.notesLabel')}</label>
                    <input
                      className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                      value={editDraft.notes}
                      onChange={(event) => setEditDraft({ ...editDraft, notes: event.target.value })}
                      placeholder={t('drawers.inventoryLots.notesPlaceholder')}
                      aria-label={t('drawers.inventoryLots.notesLabel')}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stocky-border-subtle">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={savingLotId === lot.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-stocky-border-subtle text-xs font-normal text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
                    >
                      <XIcon size="xs" />
                      {t('drawers.inventoryLots.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveEdit(lot)}
                      disabled={savingLotId === lot.id}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-stocky-primary text-white text-xs font-medium hover:bg-stocky-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <CheckIcon size="xs" />
                      {savingLotId === lot.id ? t('drawers.inventoryLots.saving') : t('drawers.inventoryLots.saveBatch')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1 bg-stocky-bg-global/70 p-3 rounded-xl border border-stocky-border-subtle">
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-stocky-text-sub tracking-wider">{t('drawers.inventoryLots.quantityOnHand')}</span>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-stocky-text-main">
                        {lot.quantityOnHand.toLocaleString()}
                        <span className="text-xs font-normal text-stocky-text-sub">{product.unitName || t('common.items')}</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-stocky-text-sub tracking-wider">{t('drawers.inventoryLots.unitCost')}</span>
                      <span className="mt-0.5 block text-sm font-semibold text-stocky-text-main">
                        {formatCurrency(lot.unitCost, locale)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-stocky-text-sub tracking-wider">{t('drawers.inventoryLots.expiry')}</span>
                      <span className={`mt-0.5 block text-xs font-semibold ${
                        state.tone === 'critical'
                          ? 'text-stocky-status-critical-fg'
                          : state.tone === 'warning'
                          ? 'text-stocky-status-warning-fg'
                          : 'text-stocky-text-main'
                      }`}>
                        {formatDate(lot.expiryDate, locale, t('drawers.inventoryLots.notRecorded'))}
                      </span>
                      <span className="block text-[10px] text-stocky-text-sub">
                        {lot.expiryNotificationDays != null ? t('drawers.inventoryLots.alertDays', { days: lot.expiryNotificationDays }) : t('drawers.inventoryLots.noAlert')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-stocky-text-sub tracking-wider">{t('drawers.inventoryLots.supplier')}</span>
                      <span className="mt-0.5 text-xs font-medium text-stocky-text-main truncate block" title={supplierName}>
                        {supplierName}
                      </span>
                      <span className="block text-[10px] text-stocky-text-sub">
                        {t('drawers.inventoryLots.recDate', { date: formatDate(lot.receivedAt, locale, t('drawers.inventoryLots.notRecorded')) })}
                      </span>
                    </div>
                  </div>

                  {lot.notes && (
                    <p className="text-xs text-stocky-text-sub bg-stocky-bg-global px-3 py-1.5 rounded-lg border border-stocky-border-subtle italic">
                      {lot.notes}
                    </p>
                  )}

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-stocky-border-subtle text-xs">
                    <span className="text-[11px] text-stocky-text-sub">
                      {t('drawers.inventoryLots.totalValue', { value: formatCurrency(lot.quantityOnHand * lot.unitCost, locale) })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 bg-stocky-status-critical-bg px-2 py-1 rounded-lg border border-stocky-status-critical-border">
                          <span className="text-xs font-medium text-stocky-status-critical-fg px-1">{t('drawers.inventoryLots.deleteBatchQuestion')}</span>
                          <button
                            type="button"
                            onClick={() => void confirmDelete(lot)}
                            disabled={deletingLotId === lot.id}
                            className="px-2.5 py-0.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors cursor-pointer"
                          >
                            {deletingLotId === lot.id ? t('drawers.inventoryLots.deleting') : t('drawers.inventoryLots.yes')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmLotId(null)}
                            className="px-2.5 py-0.5 rounded-md bg-white text-stocky-text-main border border-stocky-border-subtle text-xs hover:bg-stocky-bg-global transition-colors cursor-pointer"
                          >
                            {t('drawers.inventoryLots.cancel')}
                          </button>
                        </div>
                      ) : (
                        <>
                          {onSaveLot && (
                            <button
                              type="button"
                              onClick={() => beginEdit(lot)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-stocky-border-subtle bg-white text-xs font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary transition-colors cursor-pointer"
                              aria-label={t('drawers.inventoryLots.editAria', { lotLabel })}
                            >
                              <EditIcon size="xs" />
                              <span>{t('drawers.inventoryLots.edit')}</span>
                            </button>
                          )}
                          {onDeleteLot && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLotId(null);
                                setEditDraft(null);
                                setRowError(null);
                                setDeleteConfirmLotId(lot.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-stocky-border-subtle text-xs font-normal text-stocky-text-sub hover:border-stocky-status-critical-border hover:text-stocky-status-critical-fg hover:bg-stocky-status-critical-bg transition-colors cursor-pointer"
                              aria-label={t('drawers.inventoryLots.deleteAria', { lotLabel })}
                            >
                              <TrashIcon size="xs" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}
        {rowError && <p className="stocky-product-lots__row-error" role="alert">{rowError}</p>}
        {pageLots.length === 0 && (
          <div className="stocky-product-lots__empty">
            <BoxesIcon size="sm" />
            <strong>
              {search
                ? t('drawers.inventoryLots.empty.searchMatch')
                : view === 'history'
                ? t('drawers.inventoryLots.empty.history')
                : view === 'attention'
                ? t('drawers.inventoryLots.empty.attention')
                : t('drawers.inventoryLots.empty.active')}
            </strong>
            <span>
              {search
                ? t('drawers.inventoryLots.empty.searchHint')
                : t('drawers.inventoryLots.empty.addHint')}
            </span>
          </div>
        )}
      </div>

      <footer className="stocky-product-lots__footer">
        <span>
          {t('drawers.inventoryLots.showingBatches', {
            from: visibleLots.length === 0 ? 0 : (currentPage * pageSize + 1).toLocaleString(),
            to: Math.min((currentPage + 1) * pageSize, visibleLots.length).toLocaleString(),
            total: visibleLots.length.toLocaleString(),
          })}
        </span>
        <div>
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={currentPage === 0}
            className="stocky-table-page-button cursor-pointer disabled:opacity-40"
            aria-label={t('drawers.inventoryLots.previousLots')}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
            disabled={currentPage >= pageCount - 1}
            className="stocky-table-page-button cursor-pointer disabled:opacity-40"
            aria-label={t('drawers.inventoryLots.nextLots')}
          >
            ›
          </button>
        </div>
      </footer>
    </section>
  );
}

export const StockProductLotsWidget = InventoryProductLotsWidget;

