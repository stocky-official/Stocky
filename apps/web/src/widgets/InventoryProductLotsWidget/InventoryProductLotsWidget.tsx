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
  canViewCommercials?: boolean;
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

export function LotEditForm({
  lot,
  editDraft,
  setEditDraft,
  suppliers,
  savingLotId,
  saveEdit,
  cancelEdit,
  rowError,
  t,
}: {
  lot: StockLot;
  editDraft: LotDraft;
  setEditDraft: React.Dispatch<React.SetStateAction<LotDraft | null>>;
  suppliers: Supplier[];
  savingLotId: string | null;
  saveEdit: (lot: StockLot) => void | Promise<void>;
  cancelEdit: () => void;
  rowError: string | null;
  t: (key: any, params?: any) => string;
}) {
  return (
    <div className="rounded-xl border border-stocky-border-subtle bg-white p-3.5 sm:p-4 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-stocky-border-subtle/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-stocky-primary/10 text-stocky-primary">
            <EditIcon size="xs" />
          </span>
          <span className="text-xs font-semibold text-stocky-text-main">
            {t('drawers.inventoryLots.editAria', { lotLabel: editDraft.lotNumber || lot.id.slice(0, 8) })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">
            {t('drawers.inventoryLots.lotNumberLabel')}
          </label>
          <input
            className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none transition-colors"
            value={editDraft.lotNumber}
            onChange={(event) => setEditDraft({ ...editDraft, lotNumber: event.target.value })}
            placeholder={t('drawers.inventoryLots.lotNumberPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">
            {t('drawers.inventoryLots.supplierLabel')}
          </label>
          <select
            className="w-full h-8 px-2 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none transition-colors cursor-pointer"
            value={editDraft.supplierId}
            onChange={(event) => setEditDraft({ ...editDraft, supplierId: event.target.value })}
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
          <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">
            {t('drawers.inventoryLots.unitCostLabel')}
          </label>
          <input
            className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none transition-colors"
            type="number"
            min="0"
            step="0.01"
            value={editDraft.unitCost}
            onChange={(event) => setEditDraft({ ...editDraft, unitCost: event.target.value })}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">
            {t('drawers.inventoryLots.receivedDateLabel')}
          </label>
          <input
            className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none transition-colors"
            type="date"
            value={editDraft.receivedDate}
            onChange={(event) => setEditDraft({ ...editDraft, receivedDate: event.target.value })}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">
            {t('drawers.inventoryLots.expiryDateLabel')}
          </label>
          <input
            className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none transition-colors"
            type="date"
            value={editDraft.expiryDate}
            onChange={(event) => setEditDraft({ ...editDraft, expiryDate: event.target.value })}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">
            {t('drawers.inventoryLots.alertWindowLabel')}
          </label>
          <input
            className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none transition-colors"
            type="number"
            min="0"
            step="1"
            value={editDraft.expiryNotificationDays}
            onChange={(event) => setEditDraft({ ...editDraft, expiryNotificationDays: event.target.value })}
            placeholder={t('drawers.inventoryLots.alertWindowPlaceholder')}
          />
        </div>

        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
          <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">
            {t('drawers.inventoryLots.notesLabel')}
          </label>
          <input
            className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none transition-colors"
            value={editDraft.notes}
            onChange={(event) => setEditDraft({ ...editDraft, notes: event.target.value })}
            placeholder={t('drawers.inventoryLots.notesPlaceholder')}
          />
        </div>
      </div>

      {rowError && (
        <p className="text-xs text-stocky-text-critical font-medium" role="alert">
          {rowError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-stocky-border-subtle/80">
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
  );
}

export function InventoryProductLotsWidget({ product, lots, locations, suppliers, canViewCommercials = true, onSaveLot, onDeleteLot }: InventoryProductLotsWidgetProps) {
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
    <section className="stocky-product-lots flex flex-col gap-3 text-start h-full min-h-0" aria-label={t('drawers.inventoryLots.drawerAria', { name: product.name })}>
      <nav className="stocky-product-lots__tabs" aria-label={t('drawers.inventoryLots.lotViewsAria')}>
        {([
          ['active', t('drawers.inventoryLots.activeTab'), counts.active],
          ['attention', t('drawers.inventoryLots.attentionTab'), counts.attention],
          ['history', t('drawers.inventoryLots.historyTab'), counts.history],
        ] as const).map(([key, label, count]) => (
          <button
            type="button"
            key={key}
            onClick={() => setView(key)}
            className={`stocky-product-lots__tab flex items-center justify-center gap-1.5 ${view === key ? 'stocky-product-lots__tab--active font-semibold' : ''}`}
          >
            <span>{label}</span>
            <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              view === key
                ? 'bg-stocky-primary/10 text-stocky-primary'
                : 'bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </nav>

      <div className="stocky-product-lots__toolbar flex items-center justify-between gap-3">
        <div className="stocky-product-lots__search flex-1 max-w-sm">
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
        <span className="text-xs font-medium text-stocky-text-sub shrink-0">
          {visibleLots.length === 1
            ? t('drawers.inventoryLots.batchCountSingular', { count: visibleLots.length.toLocaleString() })
            : t('drawers.inventoryLots.batchCountPlural', { count: visibleLots.length.toLocaleString() })}
        </span>
      </div>

      {/* Batches / Lots Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Desktop View: Condensed Table (md and up) */}
        <div className="hidden md:flex flex-1 min-h-0 overflow-hidden rounded-2xl border border-stocky-border-subtle bg-white shadow-xs flex-col">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="stocky-board-table w-full text-start min-w-[680px] table-fixed border-collapse">
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '13%' }} />
                {canViewCommercials && <col style={{ width: '12%' }} />}
                <col style={{ width: '17%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '11%' }} />
              </colgroup>
              <thead>
                <tr className="sticky top-0 z-10 bg-stocky-bg-global text-[10px] uppercase font-semibold text-stocky-text-sub tracking-wider h-10 border-b border-stocky-border-subtle">
                  <th style={{ width: '22%' }} className="stocky-board-table__header-cell px-3.5 py-2.5 text-start whitespace-nowrap">
                    {t('drawers.inventoryLots.lotNumberLabel')}
                  </th>
                  <th style={{ width: '13%' }} className="stocky-board-table__header-cell px-3 py-2.5 text-start whitespace-nowrap">
                    {t('drawers.inventoryLots.defaultLocation')}
                  </th>
                  <th style={{ width: '13%' }} className="stocky-board-table__header-cell px-3 py-2.5 text-start whitespace-nowrap">
                    {t('drawers.inventoryLots.quantityOnHand')}
                  </th>
                  {canViewCommercials && (
                    <th style={{ width: '12%' }} className="stocky-board-table__header-cell px-3 py-2.5 text-start whitespace-nowrap">
                      {t('drawers.inventoryLots.unitCost')}
                    </th>
                  )}
                  <th style={{ width: '17%' }} className="stocky-board-table__header-cell px-3 py-2.5 text-start whitespace-nowrap">
                    {t('drawers.inventoryLots.expiry')}
                  </th>
                  <th style={{ width: '12%' }} className="stocky-board-table__header-cell px-3 py-2.5 text-start whitespace-nowrap">
                    {t('drawers.inventoryLots.supplier')}
                  </th>
                  <th style={{ width: '11%' }} className="stocky-board-table__header-cell px-3.5 py-2.5 text-end whitespace-nowrap">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle text-xs">
                {pageLots.map((lot) => {
                  const state = getLotState(lot, t);
                  const lotLabel = lot.lotNumber || t('drawers.inventoryLots.receiptBadge', { id: lot.id.slice(0, 8) });
                  const supplierName = lot.supplierId ? supplierNames.get(lot.supplierId) || t('drawers.inventoryLots.defaultSupplier') : t('drawers.inventoryLots.notRecorded');
                  const locationName = locationNames.get(lot.locationId) || t('drawers.inventoryLots.defaultLocation');
                  const isEditing = editingLotId === lot.id && editDraft;
                  const isConfirmingDelete = deleteConfirmLotId === lot.id;

                  return (
                    <React.Fragment key={lot.id}>
                      <tr
                        className={`align-middle transition-colors ${
                          isEditing
                            ? 'bg-stocky-status-info-bg/30'
                            : isConfirmingDelete
                            ? 'bg-stocky-status-critical-bg/20'
                            : 'hover:bg-stocky-bg-global/40'
                        }`}
                      >
                        {/* 1. Batch / Lot # */}
                        <td className="px-3.5 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle">
                              <TagIcon size="xs" />
                            </span>
                            <div className="min-w-0">
                              <span className="font-mono text-xs font-semibold text-stocky-text-main block truncate">
                                {lotLabel}
                              </span>
                              {lot.notes && (
                                <span className="block text-[10px] text-stocky-text-sub truncate italic max-w-[150px]" title={lot.notes}>
                                  {lot.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Location */}
                        <td className="px-3 py-3 align-middle">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-stocky-text-sub bg-stocky-bg-global border border-stocky-border-subtle truncate max-w-[130px]" title={locationName}>
                            <WarehouseIcon size="xs" className="shrink-0 text-stocky-text-sub/70" />
                            <span className="truncate">{locationName}</span>
                          </span>
                        </td>

                        {/* 3. Quantity on Hand & Valuation */}
                        <td className="px-3 py-3 align-middle whitespace-nowrap">
                          <div className="font-semibold text-stocky-text-main text-xs">
                            {lot.quantityOnHand.toLocaleString()}{' '}
                            <span className="text-[10px] font-normal text-stocky-text-sub">{product.unitName || t('common.items')}</span>
                          </div>
                          {canViewCommercials && (
                            <div className="text-[10px] text-stocky-text-sub">
                              {formatCurrency(lot.unitCost * lot.quantityOnHand, locale)}
                            </div>
                          )}
                        </td>

                        {/* 4. Unit Cost */}
                        {canViewCommercials && (
                          <td className="px-3 py-3 align-middle whitespace-nowrap">
                            <span className="font-semibold text-stocky-text-main text-xs">
                              {formatCurrency(lot.unitCost, locale)}
                            </span>
                          </td>
                        )}

                        {/* 5. Expiry */}
                        <td className="px-3 py-3 align-middle whitespace-nowrap">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border max-w-fit ${
                              state.tone === 'critical'
                                ? 'bg-stocky-status-critical-bg text-stocky-status-critical-fg border-stocky-status-critical-border'
                                : state.tone === 'warning'
                                ? 'bg-stocky-status-warning-bg text-stocky-status-warning-fg border-stocky-status-warning-border'
                                : state.tone === 'hold'
                                ? 'bg-stocky-status-warning-bg text-stocky-status-warning-fg border-stocky-status-warning-border'
                                : state.tone === 'muted'
                                ? 'bg-stocky-bg-global text-stocky-text-sub border-stocky-border-subtle'
                                : 'bg-stocky-status-success-bg text-stocky-status-success-fg border-stocky-status-success-border'
                            }`}>
                              {state.tone === 'critical' ? (
                                <AlertCircleIcon size="xs" className="shrink-0" />
                              ) : state.tone === 'warning' ? (
                                <AlertTriangleIcon size="xs" className="shrink-0" />
                              ) : state.tone === 'hold' ? (
                                <ClockIcon size="xs" className="shrink-0" />
                              ) : (
                                <CheckCircleIcon size="xs" className="shrink-0" />
                              )}
                              <span>{state.label}</span>
                              {state.countdown && (
                                <span className="opacity-80">· {state.countdown}</span>
                              )}
                            </span>
                            <span className="text-[10px] text-stocky-text-sub">
                              {formatDate(lot.expiryDate, locale, t('drawers.inventoryLots.noExpiryBadge'))}
                            </span>
                          </div>
                        </td>

                        {/* 6. Supplier */}
                        <td className="px-3 py-3 align-middle whitespace-nowrap">
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-medium text-stocky-text-main max-w-[130px]" title={supplierName}>
                              {supplierName}
                            </span>
                            <span className="block text-[10px] text-stocky-text-sub truncate whitespace-nowrap mt-0.5">
                              {t('drawers.inventoryLots.recDate', { date: formatDate(lot.receivedAt, locale, t('drawers.inventoryLots.notRecorded')) })}
                            </span>
                          </div>
                        </td>

                        {/* 7. Actions */}
                        <td className="px-3.5 py-3 align-middle text-end whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {isConfirmingDelete ? (
                              <div className="inline-flex items-center gap-1.5 bg-stocky-status-critical-bg p-1 rounded-lg border border-stocky-status-critical-border">
                                <span className="text-[11px] font-medium text-stocky-status-critical-fg px-1">
                                  {t('drawers.inventoryLots.deleteBatchQuestion')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void confirmDelete(lot)}
                                  disabled={deletingLotId === lot.id}
                                  className="px-2.5 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-medium hover:bg-red-700 transition-colors cursor-pointer"
                                >
                                  {deletingLotId === lot.id ? t('drawers.inventoryLots.deleting') : t('drawers.inventoryLots.yes')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmLotId(null)}
                                  className="px-2 py-0.5 rounded-md bg-white text-stocky-text-main border border-stocky-border-subtle text-[11px] hover:bg-stocky-bg-global transition-colors cursor-pointer"
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
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-stocky-border-subtle text-stocky-text-sub hover:border-stocky-primary hover:text-stocky-primary hover:bg-stocky-status-info-bg/40 transition-colors cursor-pointer"
                                    aria-label={t('drawers.inventoryLots.editAria', { lotLabel })}
                                    title={t('drawers.inventoryLots.edit')}
                                  >
                                    <EditIcon size="xs" />
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
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-stocky-border-subtle text-stocky-text-sub hover:border-stocky-status-critical-border hover:text-stocky-status-critical-fg hover:bg-stocky-status-critical-bg/50 transition-colors cursor-pointer"
                                    aria-label={t('drawers.inventoryLots.deleteAria', { lotLabel })}
                                    title={t('drawers.inventoryLots.delete')}
                                  >
                                    <TrashIcon size="xs" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Integrated Sub-Row for Inline Editing */}
                      {isEditing && (
                        <tr key={`${lot.id}-edit-form`} className="bg-stocky-bg-global/50 border-b border-stocky-border-subtle">
                          <td colSpan={7} className="p-3 sm:p-4">
                            <LotEditForm
                              lot={lot}
                              editDraft={editDraft}
                              setEditDraft={setEditDraft}
                              suppliers={suppliers}
                              savingLotId={savingLotId}
                              saveEdit={saveEdit}
                              cancelEdit={cancelEdit}
                              rowError={rowError}
                              t={t}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {rowError && !editingLotId && <p className="stocky-product-lots__row-error p-3" role="alert">{rowError}</p>}

            {pageLots.length === 0 && (
              <div className="stocky-product-lots__empty py-12">
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
        </div>

        {/* Mobile View: Condensed Responsive Cards List (below md) */}
        <div className="flex md:hidden flex-1 min-h-0 overflow-y-auto flex-col gap-2.5">
          {pageLots.map((lot) => {
            const state = getLotState(lot, t);
            const lotLabel = lot.lotNumber || t('drawers.inventoryLots.receiptBadge', { id: lot.id.slice(0, 8) });
            const supplierName = lot.supplierId ? supplierNames.get(lot.supplierId) || t('drawers.inventoryLots.defaultSupplier') : t('drawers.inventoryLots.notRecorded');
            const locationName = locationNames.get(lot.locationId) || t('drawers.inventoryLots.defaultLocation');
            const isEditing = editingLotId === lot.id && editDraft;
            const isConfirmingDelete = deleteConfirmLotId === lot.id;

            return (
              <div
                key={lot.id}
                className={`rounded-xl border border-stocky-border-subtle bg-white p-3 shadow-2xs transition-colors flex flex-col gap-2.5 ${
                  isEditing
                    ? 'border-stocky-primary ring-1 ring-stocky-primary/20 bg-stocky-status-info-bg/10'
                    : isConfirmingDelete
                    ? 'border-stocky-status-critical-border bg-stocky-status-critical-bg/15'
                    : 'hover:border-stocky-border-subtle/80'
                }`}
              >
                {/* Top Row: Batch Code & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle">
                      <TagIcon size="xs" />
                    </span>
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-stocky-text-main block truncate">
                        {lotLabel}
                      </span>
                      {lot.notes && (
                        <span className="block text-[10px] text-stocky-text-sub truncate italic max-w-[180px]" title={lot.notes}>
                          {lot.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Edit & Delete) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isConfirmingDelete ? (
                      <div className="inline-flex items-center gap-1 bg-stocky-status-critical-bg p-1 rounded-lg border border-stocky-status-critical-border">
                        <span className="text-[10px] font-medium text-stocky-status-critical-fg px-1">
                          {t('drawers.inventoryLots.deleteBatchQuestion')}
                        </span>
                        <button
                          type="button"
                          onClick={() => void confirmDelete(lot)}
                          disabled={deletingLotId === lot.id}
                          className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-medium hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          {deletingLotId === lot.id ? t('drawers.inventoryLots.deleting') : t('drawers.inventoryLots.yes')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmLotId(null)}
                          className="px-1.5 py-0.5 rounded-md bg-white text-stocky-text-main border border-stocky-border-subtle text-[10px] cursor-pointer"
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stocky-border-subtle text-stocky-text-sub hover:border-stocky-primary hover:text-stocky-primary hover:bg-stocky-status-info-bg/40 transition-colors cursor-pointer"
                            aria-label={t('drawers.inventoryLots.editAria', { lotLabel })}
                            title={t('drawers.inventoryLots.edit')}
                          >
                            <EditIcon size="xs" />
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stocky-border-subtle text-stocky-text-sub hover:border-stocky-status-critical-border hover:text-stocky-status-critical-fg hover:bg-stocky-status-critical-bg/50 transition-colors cursor-pointer"
                            aria-label={t('drawers.inventoryLots.deleteAria', { lotLabel })}
                            title={t('drawers.inventoryLots.delete')}
                          >
                            <TrashIcon size="xs" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Second Row: Status Pill & Expiry & Location Badge */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-stocky-border-subtle/70 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      state.tone === 'critical'
                        ? 'bg-stocky-status-critical-bg text-stocky-status-critical-fg border-stocky-status-critical-border'
                        : state.tone === 'warning'
                        ? 'bg-stocky-status-warning-bg text-stocky-status-warning-fg border-stocky-status-warning-border'
                        : state.tone === 'hold'
                        ? 'bg-stocky-status-warning-bg text-stocky-status-warning-fg border-stocky-status-warning-border'
                        : state.tone === 'muted'
                        ? 'bg-stocky-bg-global text-stocky-text-sub border-stocky-border-subtle'
                        : 'bg-stocky-status-success-bg text-stocky-status-success-fg border-stocky-status-success-border'
                    }`}>
                      {state.tone === 'critical' ? (
                        <AlertCircleIcon size="xs" className="shrink-0" />
                      ) : state.tone === 'warning' ? (
                        <AlertTriangleIcon size="xs" className="shrink-0" />
                      ) : state.tone === 'hold' ? (
                        <ClockIcon size="xs" className="shrink-0" />
                      ) : (
                        <CheckCircleIcon size="xs" className="shrink-0" />
                      )}
                      <span>{state.label}</span>
                      {state.countdown && (
                        <span className="opacity-80">· {state.countdown}</span>
                      )}
                    </span>
                    <span className="text-[10px] text-stocky-text-sub truncate">
                      {formatDate(lot.expiryDate, locale, t('drawers.inventoryLots.noExpiryBadge'))}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-stocky-text-sub bg-stocky-bg-global border border-stocky-border-subtle truncate max-w-[130px]" title={locationName}>
                    <WarehouseIcon size="xs" className="shrink-0 text-stocky-text-sub/70" />
                    <span className="truncate">{locationName}</span>
                  </span>
                </div>

                {/* Third Row: Metrics Grid (Quantity & Total Value, Unit Cost & Supplier) */}
                <div className={`grid ${canViewCommercials ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-2 border-t border-stocky-border-subtle/70 text-xs`}>
                  <div className="bg-stocky-bg-global/50 p-2 rounded-lg border border-stocky-border-subtle/50">
                    <span className="block text-[10px] uppercase font-semibold text-stocky-text-sub">
                      {t('drawers.inventoryLots.quantityOnHand')}
                    </span>
                    <div className="font-semibold text-stocky-text-main text-xs mt-0.5">
                      {lot.quantityOnHand.toLocaleString()}{' '}
                      <span className="text-[10px] font-normal text-stocky-text-sub">{product.unitName || t('common.items')}</span>
                    </div>
                    {canViewCommercials && (
                      <div className="text-[10px] text-stocky-text-sub mt-0.5">
                        {formatCurrency(lot.unitCost * lot.quantityOnHand, locale)}
                      </div>
                    )}
                  </div>

                  {canViewCommercials && (
                    <div className="bg-stocky-bg-global/50 p-2 rounded-lg border border-stocky-border-subtle/50">
                      <span className="block text-[10px] uppercase font-semibold text-stocky-text-sub">
                        {t('drawers.inventoryLots.unitCost')}
                      </span>
                      <div className="font-semibold text-stocky-text-main text-xs mt-0.5">
                        {formatCurrency(lot.unitCost, locale)}
                      </div>
                      <div className="text-[10px] text-stocky-text-sub truncate mt-0.5" title={supplierName}>
                        {supplierName}
                      </div>
                    </div>
                  )}
                </div>

                {/* Inline Editing Form on Mobile */}
                {isEditing && (
                  <div className="pt-2 border-t border-stocky-border-subtle">
                    <LotEditForm
                      lot={lot}
                      editDraft={editDraft}
                      setEditDraft={setEditDraft}
                      suppliers={suppliers}
                      savingLotId={savingLotId}
                      saveEdit={saveEdit}
                      cancelEdit={cancelEdit}
                      rowError={rowError}
                      t={t}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {pageLots.length === 0 && (
            <div className="stocky-product-lots__empty py-12 rounded-xl border border-stocky-border-subtle bg-white">
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
