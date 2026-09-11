'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BoxesIcon, CheckIcon, EditIcon, SearchIcon, TrashIcon, XIcon } from '@stocky/icons';
import type { Location, Product, StockLot, Supplier } from '@stocky/types';
import type { StockLotUpdateInput } from '../StockLotEditDrawerWidget/StockLotEditDrawerWidget';

type LotView = 'active' | 'attention' | 'history';

export interface StockProductLotsWidgetProps {
  product: Product;
  lots: StockLot[];
  locations: Location[];
  suppliers: Supplier[];
  onSaveLot?: (lot: StockLot, input: StockLotUpdateInput) => Promise<void>;
  onDeleteLot?: (lot: StockLot) => void | Promise<void>;
}

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

export function StockProductLotsWidget({ product, lots, locations, suppliers, onSaveLot, onDeleteLot }: StockProductLotsWidgetProps) {
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
    <section className="stocky-product-lots" aria-label={`${product.name} lots and batches`}>
      <nav className="stocky-product-lots__tabs" aria-label="Lot views">
        {([['active', 'Active', counts.active], ['attention', 'Needs attention', counts.attention], ['history', 'History', counts.history]] as const).map(([key, label, count]) => <button type="button" key={key} onClick={() => setView(key)} className={view === key ? 'stocky-product-lots__tab stocky-product-lots__tab--active' : 'stocky-product-lots__tab'}>{label}<span>{count}</span></button>)}
      </nav>

      <div className="stocky-product-lots__toolbar">
        <div className="stocky-product-lots__search"><SearchIcon size="xs" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search lot, location, or supplier..." aria-label="Search lots" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear lot search"><XIcon size="xs" /></button>}</div>
        <span>{visibleLots.length.toLocaleString()} lot{visibleLots.length === 1 ? '' : 's'}</span>
      </div>

      <div className="stocky-product-lots__list">
        <div className="stocky-product-lots__list-head"><span>Lot / supplier</span><span>Location</span><span>Quantity</span><span>Received</span><span>Expiry</span><span>Alert</span><span>Cost</span><span aria-label="Lot actions" /></div>
        {pageLots.map((lot) => {
          const state = getLotState(lot);
          const lotLabel = lot.lotNumber || `Receipt ${lot.id.slice(0, 8)}`;
          const supplierName = lot.supplierId ? supplierNames.get(lot.supplierId) || 'Supplier' : 'Not recorded';
          const toneClass = state.tone === 'critical' ? 'stocky-status-critical' : state.tone === 'warning' ? 'stocky-status-warning' : state.tone === 'hold' ? 'stocky-status-hold' : state.tone === 'muted' ? 'stocky-status-muted' : 'stocky-status-success';
          const isEditing = editingLotId === lot.id && editDraft;
          const isConfirmingDelete = deleteConfirmLotId === lot.id;
          return <article key={lot.id} className={`stocky-product-lots__row${isEditing ? ' stocky-product-lots__row--editing' : ''}`}>
            <div className="stocky-product-lots__lot">
              {isEditing ? <>
                <input className="stocky-product-lots__edit-input" value={editDraft.lotNumber} onChange={(event) => setEditDraft({ ...editDraft, lotNumber: event.target.value })} aria-label="Lot number" />
                <select className="stocky-product-lots__edit-input stocky-product-lots__edit-select" value={editDraft.supplierId} onChange={(event) => setEditDraft({ ...editDraft, supplierId: event.target.value })} aria-label="Supplier">
                  <option value="">Choose supplier</option>
                  {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                </select>
              </> : <><strong title={lotLabel}>{lotLabel}</strong><span title={supplierName}>{supplierName}</span></>}
            </div>
            <span data-label="Location" title={locationNames.get(lot.locationId) || 'Location'}>{locationNames.get(lot.locationId) || 'Location'}</span>
            <span data-label="Quantity" className="stocky-product-lots__quantity">{lot.quantityOnHand.toLocaleString()} {lot.quantityOnHand === 1 ? 'unit' : 'units'}</span>
            <span data-label="Received">{isEditing ? <input className="stocky-product-lots__edit-input" type="date" value={editDraft.receivedDate} onChange={(event) => setEditDraft({ ...editDraft, receivedDate: event.target.value })} aria-label="Received date" /> : formatDate(lot.receivedAt)}</span>
            <span data-label="Expiry" className={isEditing ? '' : state.tone === 'critical' ? 'stocky-text-critical' : state.tone === 'warning' ? 'stocky-text-warning' : 'stocky-text-success'}>{isEditing ? <input className="stocky-product-lots__edit-input" type="date" value={editDraft.expiryDate} onChange={(event) => setEditDraft({ ...editDraft, expiryDate: event.target.value })} aria-label="Expiry date" /> : formatDate(lot.expiryDate)}</span>
            <span data-label="Alert" className={isEditing ? '' : `stocky-product-lots__status ${toneClass}`}>{isEditing ? <input className="stocky-product-lots__edit-input" type="number" min="0" step="1" value={editDraft.expiryNotificationDays} onChange={(event) => setEditDraft({ ...editDraft, expiryNotificationDays: event.target.value })} placeholder="Days" aria-label="Expiry alert days" /> : <>{lot.expiryNotificationDays == null ? 'Not set' : `${lot.expiryNotificationDays}d before`} · {state.label}</>}</span>
            <span data-label="Cost">{isEditing ? <input className="stocky-product-lots__edit-input" type="number" min="0" step="0.01" value={editDraft.unitCost} onChange={(event) => setEditDraft({ ...editDraft, unitCost: event.target.value })} aria-label="Unit cost" /> : formatCurrency(lot.unitCost)}</span>
            <span className="stocky-product-lots__actions">
              {isEditing ? <>
                <button type="button" className="stocky-product-lots__icon-button stocky-product-lots__icon-button--confirm" onClick={() => void saveEdit(lot)} disabled={savingLotId === lot.id} aria-label={`Save ${lotLabel}`}><CheckIcon size="xs" /></button>
                <button type="button" className="stocky-product-lots__icon-button" onClick={cancelEdit} disabled={savingLotId === lot.id} aria-label={`Cancel editing ${lotLabel}`}><XIcon size="xs" /></button>
              </> : onSaveLot ? <button type="button" className="stocky-product-lots__icon-button" onClick={() => beginEdit(lot)} aria-label={`Edit ${lotLabel}`}><EditIcon size="xs" /></button> : null}
              {isConfirmingDelete ? <button type="button" className="stocky-product-lots__confirm" onClick={() => void confirmDelete(lot)} disabled={deletingLotId === lot.id}>{deletingLotId === lot.id ? 'Deleting…' : 'Sure?'}</button> : onDeleteLot ? <button type="button" className="stocky-product-lots__icon-button stocky-product-lots__icon-button--danger" onClick={() => { setEditingLotId(null); setEditDraft(null); setRowError(null); setDeleteConfirmLotId(lot.id); }} aria-label={`Delete ${lotLabel}`}><TrashIcon size="xs" /></button> : null}
            </span>
          </article>;
        })}
        {rowError && <p className="stocky-product-lots__row-error" role="alert">{rowError}</p>}
        {pageLots.length === 0 && <div className="stocky-product-lots__empty"><BoxesIcon size="sm" /><strong>{search ? 'No lots match this search' : view === 'history' ? 'No lot history' : view === 'attention' ? 'Nothing needs attention' : 'No active lots'}</strong><span>{search ? 'Try another lot, location, or supplier.' : 'Add a lot when new stock arrives.'}</span></div>}
      </div>

      <footer className="stocky-product-lots__footer"><span>Showing {visibleLots.length === 0 ? 0 : currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, visibleLots.length)} of {visibleLots.length}</span><div><button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={currentPage === 0} className="stocky-table-page-button" aria-label="Previous lots">‹</button><button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={currentPage >= pageCount - 1} className="stocky-table-page-button" aria-label="Next lots">›</button></div></footer>
    </section>
  );
}
