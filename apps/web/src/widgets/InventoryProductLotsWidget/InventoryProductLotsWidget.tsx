'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BoxesIcon, CheckIcon, EditIcon, SearchIcon, TagIcon, TrashIcon, XIcon } from '@stocky/icons';
import type { Location, Product, StockLot, Supplier } from '@stocky/types';
import type { StockLotUpdateInput } from '../StockLotEditDrawerWidget/StockLotEditDrawerWidget';

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

function getLotState(lot: StockLot) {
  if (lot.status === 'disposed') return { label: 'Removed', tone: 'critical' as const, attention: false, history: true };
  if (lot.status === 'returned') return { label: 'Returned', tone: 'critical' as const, attention: false, history: true };
  if (lot.quantityOnHand <= 0 || lot.status === 'depleted') return { label: 'Out of stock', tone: 'muted' as const, attention: false, history: true };
  if (lot.status === 'on_hold') return { label: 'On hold', tone: 'hold' as const, attention: true, history: false };
  if (!lot.expiryDate) return { label: 'Missing expiry', tone: 'critical' as const, attention: true, history: false };
  const days = Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: 'Expired', tone: 'critical' as const, attention: true, history: false };
  if (days <= (lot.expiryNotificationDays ?? 0)) return { label: `${days}d left`, tone: 'warning' as const, attention: true, history: false };
  return { label: `${days}d left`, tone: 'success' as const, attention: false, history: false };
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
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
    if (!editDraft.receivedDate) return setRowError('Add the received date.');
    if (editDraft.expiryDate && (parsedNotificationDays === null || !Number.isInteger(parsedNotificationDays) || parsedNotificationDays < 0)) return setRowError('Enter a valid alert window.');
    if (!editDraft.supplierId) return setRowError('Choose a supplier.');
    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) return setRowError('Cost must be zero or more.');

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
      setRowError(error?.message || 'The lot could not be saved.');
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
      setRowError(error?.message || 'The lot could not be deleted.');
    } finally {
      setDeletingLotId(null);
    }
  };

  const counts = useMemo(() => lots.reduce((result, lot) => {
    const state = getLotState(lot);
    result[state.history ? 'history' : state.attention ? 'attention' : 'active'] += 1;
    return result;
  }, { active: 0, attention: 0, history: 0 }), [lots]);

  const visibleLots = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return lots
      .filter((lot) => {
        const state = getLotState(lot);
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
  }, [locationNames, lots, search, supplierNames, view]);

  const pageCount = Math.max(1, Math.ceil(visibleLots.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageLots = visibleLots.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  return (
    <section className="stocky-product-lots flex flex-col gap-3" aria-label={`${product.name} lots and batches`}>
      <nav className="stocky-product-lots__tabs" aria-label="Lot views">
        {([['active', 'Active', counts.active], ['attention', 'Needs attention', counts.attention], ['history', 'History', counts.history]] as const).map(([key, label, count]) => (
          <button type="button" key={key} onClick={() => setView(key)} className={view === key ? 'stocky-product-lots__tab stocky-product-lots__tab--active' : 'stocky-product-lots__tab'}>
            {label}<span>{count}</span>
          </button>
        ))}
      </nav>

      <div className="stocky-product-lots__toolbar">
        <div className="stocky-product-lots__search">
          <SearchIcon size="xs" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search lot, location, or supplier..." aria-label="Search lots" />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear lot search"><XIcon size="xs" /></button>}
        </div>
        <span className="text-xs text-stocky-text-sub">{visibleLots.length.toLocaleString()} batch{visibleLots.length === 1 ? '' : 'es'}</span>
      </div>

      <div className="flex flex-col gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {pageLots.map((lot) => {
          const state = getLotState(lot);
          const lotLabel = lot.lotNumber || `Receipt ${lot.id.slice(0, 8)}`;
          const supplierName = lot.supplierId ? supplierNames.get(lot.supplierId) || 'Supplier' : 'Not recorded';
          const locationName = locationNames.get(lot.locationId) || 'Location';
          const isEditing = editingLotId === lot.id && editDraft;
          const isConfirmingDelete = deleteConfirmLotId === lot.id;

          return (
            <article
              key={lot.id}
              className={`rounded-widget border ${
                isEditing
                  ? 'border-stocky-primary bg-stocky-bg-widget ring-1 ring-stocky-primary'
                  : isConfirmingDelete
                  ? 'border-red-300 bg-red-50/20'
                  : 'border-stocky-border-subtle bg-stocky-bg-widget hover:border-stocky-border-default'
              } p-3.5 transition-all flex flex-col gap-3`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-stocky-bg-global text-stocky-text-main border border-stocky-border-subtle">
                    Batch #{lotLabel}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-normal border ${
                      state.tone === 'critical'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : state.tone === 'warning'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : state.tone === 'hold'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : state.tone === 'muted'
                        ? 'bg-gray-50 text-gray-600 border-gray-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {state.label}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs text-stocky-text-sub truncate max-w-[150px]" title={locationName}>
                  {locationName}
                </span>
              </div>

              {/* Card Body: Editing Mode vs View Mode */}
              {isEditing ? (
                <div className="flex flex-col gap-3 pt-1 border-t border-stocky-border-subtle">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">Lot / Batch Number</label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        value={editDraft.lotNumber}
                        onChange={(event) => setEditDraft({ ...editDraft, lotNumber: event.target.value })}
                        placeholder="e.g. LOT-2024-001"
                        aria-label="Lot number"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">Supplier</label>
                      <select
                        className="w-full h-8 px-2 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        value={editDraft.supplierId}
                        onChange={(event) => setEditDraft({ ...editDraft, supplierId: event.target.value })}
                        aria-label="Supplier"
                      >
                        <option value="">Choose supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">Received Date</label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        type="date"
                        value={editDraft.receivedDate}
                        onChange={(event) => setEditDraft({ ...editDraft, receivedDate: event.target.value })}
                        aria-label="Received date"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">Expiry Date</label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        type="date"
                        value={editDraft.expiryDate}
                        onChange={(event) => setEditDraft({ ...editDraft, expiryDate: event.target.value })}
                        aria-label="Expiry date"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">Alert Window (Days before)</label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        type="number"
                        min="0"
                        step="1"
                        value={editDraft.expiryNotificationDays}
                        onChange={(event) => setEditDraft({ ...editDraft, expiryNotificationDays: event.target.value })}
                        placeholder="e.g. 14"
                        aria-label="Expiry alert days"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">Unit Cost (EGP)</label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editDraft.unitCost}
                        onChange={(event) => setEditDraft({ ...editDraft, unitCost: event.target.value })}
                        aria-label="Unit cost"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-stocky-text-sub mb-1">Notes</label>
                    <input
                      className="w-full h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                      value={editDraft.notes}
                      onChange={(event) => setEditDraft({ ...editDraft, notes: event.target.value })}
                      placeholder="Optional lot batch notes..."
                      aria-label="Notes"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stocky-border-subtle">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={savingLotId === lot.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stocky-border-subtle text-xs font-normal text-stocky-text-main hover:bg-stocky-bg-global transition-colors"
                    >
                      <XIcon size="xs" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveEdit(lot)}
                      disabled={savingLotId === lot.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stocky-primary text-white text-xs font-medium hover:bg-stocky-primary-hover transition-colors disabled:opacity-50"
                    >
                      <CheckIcon size="xs" />
                      {savingLotId === lot.id ? 'Saving…' : 'Save Batch'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1 bg-stocky-bg-global/60 p-2.5 rounded-lg border border-stocky-border-subtle/70">
                    <div>
                      <span className="block text-[10px] uppercase font-medium text-stocky-text-sub/70 tracking-wider">Quantity</span>
                      <span className="text-sm font-medium text-stocky-text-main">
                        {lot.quantityOnHand.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-stocky-text-sub">{product.unitName || 'units'}</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-medium text-stocky-text-sub/70 tracking-wider">Unit Cost</span>
                      <span className="text-sm font-medium text-stocky-text-main">
                        {formatCurrency(lot.unitCost)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-medium text-stocky-text-sub/70 tracking-wider">Expiry</span>
                      <span className={`text-xs font-medium ${state.tone === 'critical' ? 'text-red-600' : state.tone === 'warning' ? 'text-amber-600' : 'text-stocky-text-main'}`}>
                        {formatDate(lot.expiryDate)}
                      </span>
                      <span className="block text-[10px] text-stocky-text-sub">
                        {lot.expiryNotificationDays != null ? `${lot.expiryNotificationDays}d alert` : 'No alert'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-medium text-stocky-text-sub/70 tracking-wider">Supplier</span>
                      <span className="text-xs font-normal text-stocky-text-main truncate block" title={supplierName}>
                        {supplierName}
                      </span>
                      <span className="block text-[10px] text-stocky-text-sub">
                        Rec: {formatDate(lot.receivedAt)}
                      </span>
                    </div>
                  </div>

                  {lot.notes && (
                    <p className="text-xs text-stocky-text-sub bg-stocky-bg-global px-2.5 py-1.5 rounded-md border border-stocky-border-subtle/60 italic">
                      {lot.notes}
                    </p>
                  )}

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-stocky-border-subtle/50 text-xs">
                    <span className="text-[11px] text-stocky-text-sub">
                      Total Value: <strong className="font-medium text-stocky-text-main">{formatCurrency(lot.quantityOnHand * lot.unitCost)}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-md border border-red-200">
                          <span className="text-xs text-red-700 px-1">Delete batch?</span>
                          <button
                            type="button"
                            onClick={() => void confirmDelete(lot)}
                            disabled={deletingLotId === lot.id}
                            className="px-2 py-0.5 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                          >
                            {deletingLotId === lot.id ? 'Deleting…' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmLotId(null)}
                            className="px-2 py-0.5 rounded bg-white text-gray-700 border border-gray-200 text-xs hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          {onSaveLot && (
                            <button
                              type="button"
                              onClick={() => beginEdit(lot)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stocky-border-subtle text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors"
                              aria-label={`Edit ${lotLabel}`}
                            >
                              <EditIcon size="xs" />
                              Edit
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
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-normal text-red-600 hover:bg-red-50 transition-colors"
                              aria-label={`Delete ${lotLabel}`}
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
            <strong>{search ? 'No batches match this search' : view === 'history' ? 'No batch history' : view === 'attention' ? 'Nothing needs attention' : 'No active batches'}</strong>
            <span>{search ? 'Try another batch number, location, or supplier.' : 'Add a batch when new inventory arrives.'}</span>
          </div>
        )}
      </div>

      <footer className="stocky-product-lots__footer">
        <span>Showing {visibleLots.length === 0 ? 0 : currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, visibleLots.length)} of {visibleLots.length}</span>
        <div>
          <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={currentPage === 0} className="stocky-table-page-button" aria-label="Previous lots">‹</button>
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={currentPage >= pageCount - 1} className="stocky-table-page-button" aria-label="Next lots">›</button>
        </div>
      </footer>
    </section>
  );
}

export const StockProductLotsWidget = InventoryProductLotsWidget;
