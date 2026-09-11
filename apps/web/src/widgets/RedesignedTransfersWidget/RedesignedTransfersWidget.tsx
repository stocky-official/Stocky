'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, BarcodeIcon, ChevronRightIcon, PlusIcon, SearchIcon, XIcon } from '@stocky/icons';
import type { CompanyUserRole, InventoryTransfer, InventoryTransferLine, Location, Product, StockLot } from '@stocky/types';
import { supabase } from '@/lib/supabase/client';

type TransferLineDraft = { productId: string; quantity: string };
type TransferQueue = 'all' | 'action' | 'incoming' | 'outgoing';
type TransferSortKey = 'transfer' | 'route' | 'items' | 'status' | 'requested';
type SortDirection = 'asc' | 'desc';

export interface RedesignedTransfersWidgetProps {
  transfers: InventoryTransfer[];
  transferLines?: InventoryTransferLine[];
  products: Product[];
  lots: StockLot[];
  locations: Location[];
  selectedLocationId: string;
  defaultProductId?: string;
  userRole: CompanyUserRole;
  onCreate: (input: { sourceLocationId: string; destinationLocationId: string; lines: Array<{ productId: string; quantity: number }>; note?: string }) => void;
  onApprove: (transfer: InventoryTransfer) => void;
  onReceive: (transfer: InventoryTransfer, lines?: Array<{ lineId: string; quantityReceived: number }>, note?: string) => void;
}

const statusLabels: Record<InventoryTransfer['status'], string> = {
  draft: 'Draft',
  requested: 'Requested',
  approved: 'Approved',
  in_transit: 'In transit',
  partially_received: 'Partially received',
  received: 'Received',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const statusTone: Record<InventoryTransfer['status'], string> = {
  draft: 'stocky-status-muted',
  requested: 'stocky-status-info',
  approved: 'stocky-status-info',
  in_transit: 'stocky-status-warning',
  partially_received: 'stocky-status-warning',
  received: 'stocky-status-success',
  rejected: 'stocky-status-critical',
  cancelled: 'stocky-status-critical',
};

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function compareValues(left: string | number, right: string | number) {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
}

export function RedesignedTransfersWidget({ transfers, transferLines = [], products, lots, locations, selectedLocationId, defaultProductId, userRole, onCreate, onApprove, onReceive }: RedesignedTransfersWidgetProps) {
  const [showForm, setShowForm] = useState(false);
  const suggestedSourceId = defaultProductId && selectedLocationId === 'all'
    ? lots.find((lot) => lot.productId === defaultProductId && lot.quantityOnHand > 0 && locations.some((location) => location.id === lot.locationId))?.locationId || ''
    : selectedLocationId === 'all' ? '' : selectedLocationId;
  const [sourceLocationId, setSourceLocationId] = useState(suggestedSourceId);
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [lines, setLines] = useState<TransferLineDraft[]>([{ productId: defaultProductId || '', quantity: '' }]);
  const [requestNote, setRequestNote] = useState('');
  const [queue, setQueue] = useState<TransferQueue>('action');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: TransferSortKey; direction: SortDirection }>({ key: 'requested', direction: 'desc' });
  const [receivingTransfer, setReceivingTransfer] = useState<InventoryTransfer | null>(null);
  const [receiptQuantities, setReceiptQuantities] = useState<Record<string, string>>({});
  const [receiptNote, setReceiptNote] = useState('');
  const [loadedTransferLines, setLoadedTransferLines] = useState<InventoryTransferLine[]>([]);
  const allTransferLines = transferLines.length > 0 ? transferLines : loadedTransferLines;

  useEffect(() => {
    if (!defaultProductId) return;
    if (!sourceLocationId) {
      const sourceWithStock = lots.find((lot) => lot.productId === defaultProductId && lot.quantityOnHand > 0 && locations.some((location) => location.id === lot.locationId));
      if (sourceWithStock) setSourceLocationId(sourceWithStock.locationId);
    }
    setLines([{ productId: defaultProductId, quantity: '' }]);
    setShowForm(true);
  }, [defaultProductId, locations, lots, sourceLocationId]);

  useEffect(() => {
    if (transferLines.length > 0 || transfers.length === 0) return;
    supabase.from('stock_transfer_lines').select('*').in('transfer_id', transfers.map((transfer) => transfer.id)).then(({ data }) => {
      setLoadedTransferLines((data || []).map((row: any) => ({
        id: row.id,
        transferId: row.transfer_id,
        productId: row.product_id,
        sourceLotId: row.source_lot_id,
        quantityRequested: Number(row.quantity_requested || 0),
        quantityApproved: row.quantity_approved == null ? null : Number(row.quantity_approved),
        quantityReceived: Number(row.quantity_received || 0),
        createdAt: row.created_at,
      })));
    });
  }, [transferLines.length, transfers]);

  const locationMap = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations]);
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const scopedTransfers = useMemo(() => transfers.filter((transfer) => selectedLocationId === 'all' || transfer.sourceLocationId === selectedLocationId || transfer.destinationLocationId === selectedLocationId), [selectedLocationId, transfers]);
  const linesForTransfer = (transferId: string) => allTransferLines.filter((line) => line.transferId === transferId);
  const productsForTransfer = (transferId: string) => Array.from(new Set(linesForTransfer(transferId).map((line) => productMap.get(line.productId)?.name || 'Product')));
  const routeForTransfer = (transfer: InventoryTransfer) => `${locationMap.get(transfer.sourceLocationId)?.name || 'Source'} to ${locationMap.get(transfer.destinationLocationId)?.name || 'Destination'}`;

  const availableFor = (productId: string) => sourceLocationId
    ? lots.filter((lot) => lot.locationId === sourceLocationId && lot.productId === productId && lot.quantityOnHand > 0).reduce((sum, lot) => sum + lot.quantityOnHand, 0)
    : 0;
  const sourceProducts = useMemo(() => products.filter((product) => lots.some((lot) => lot.locationId === sourceLocationId && lot.productId === product.id && lot.quantityOnHand > 0)), [lots, products, sourceLocationId]);

  const updateLine = (index: number, field: keyof TransferLineDraft, value: string) => {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = lines.map((line) => ({ productId: line.productId, quantity: Number(line.quantity) }));
    if (!sourceLocationId || !destinationLocationId || !normalized.length || normalized.some((line) => !line.productId || !Number.isInteger(line.quantity) || line.quantity <= 0 || line.quantity > availableFor(line.productId))) return;
    onCreate({ sourceLocationId, destinationLocationId, lines: normalized, note: requestNote.trim() || undefined });
    setShowForm(false);
    setLines([{ productId: '', quantity: '' }]);
    setRequestNote('');
  };

  const openReceipt = (transfer: InventoryTransfer) => {
    const rows = linesForTransfer(transfer.id);
    if (rows.length === 0) return onReceive(transfer);
    setReceivingTransfer(transfer);
    setReceiptNote('');
    setReceiptQuantities(Object.fromEntries(rows.map((line) => [line.id, String(Math.max(0, (line.quantityApproved ?? line.quantityRequested) - line.quantityReceived))])));
  };

  const submitReceipt = (event: React.FormEvent) => {
    event.preventDefault();
    if (!receivingTransfer) return;
    const rows = linesForTransfer(receivingTransfer.id).map((line) => ({
      lineId: line.id,
      quantityReceived: Number(receiptQuantities[line.id] || 0),
      remaining: Math.max(0, (line.quantityApproved ?? line.quantityRequested) - line.quantityReceived),
    }));
    const hasShortage = rows.some((line) => line.quantityReceived < line.remaining);
    if (hasShortage && !receiptNote.trim()) return;
    onReceive(receivingTransfer, rows.map(({ lineId, quantityReceived }) => ({ lineId, quantityReceived })), receiptNote.trim() || undefined);
    setReceivingTransfer(null);
  };

  const filteredTransfers = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const activeTransfers = scopedTransfers.filter((transfer) => !['received', 'rejected', 'cancelled'].includes(transfer.status));
    return scopedTransfers.filter((transfer) => {
      const queueMatch = queue === 'all'
        || (queue === 'action' && activeTransfers.some((item) => item.id === transfer.id))
        || (queue === 'incoming' && (selectedLocationId === 'all' || transfer.destinationLocationId === selectedLocationId))
        || (queue === 'outgoing' && (selectedLocationId === 'all' || transfer.sourceLocationId === selectedLocationId));
      const lineText = productsForTransfer(transfer.id).join(' ');
      const searchable = `${transfer.id} ${routeForTransfer(transfer)} ${lineText} ${transfer.note || ''} ${statusLabels[transfer.status]}`.toLowerCase();
      return queueMatch && (!searchText || searchable.includes(searchText));
    }).sort((left, right) => {
      const leftItems = productsForTransfer(left.id).join(', ');
      const rightItems = productsForTransfer(right.id).join(', ');
      const values: Record<TransferSortKey, string | number> = { transfer: left.id, route: routeForTransfer(left), items: leftItems, status: statusLabels[left.status], requested: new Date(left.requestedAt).getTime() };
      const rightValues: Record<TransferSortKey, string | number> = { transfer: right.id, route: routeForTransfer(right), items: rightItems, status: statusLabels[right.status], requested: new Date(right.requestedAt).getTime() };
      const result = compareValues(values[sort.key], rightValues[sort.key]);
      return sort.direction === 'asc' ? result : -result;
    });
  }, [allTransferLines, locationMap, productMap, queue, scopedTransfers, search, selectedLocationId, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredTransfers.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageTransfers = filteredTransfers.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const firstRowNumber = filteredTransfers.length === 0 ? 0 : currentPage * pageSize + 1;
  const lastRowNumber = Math.min((currentPage + 1) * pageSize, filteredTransfers.length);

  const sortBy = (key: TransferSortKey) => {
    setPage(0);
    setSort((current) => current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
  };
  const sortIndicator = (key: TransferSortKey) => sort.key !== key ? <ArrowUpDownIcon size={10} /> : sort.direction === 'asc' ? <ArrowUpIcon size={10} /> : <ArrowDownIcon size={10} />;
  const header = (label: string, key: TransferSortKey, className = '') => (
    <th className={`stocky-board-table__header-cell text-left ${className}`}>
      <button type="button" onClick={() => sortBy(key)} className="stocky-transfer-table__sort-button" aria-label={`Sort by ${label}`}>
        <span>{label}</span>
        <span className="stocky-table-sort-indicator" aria-hidden="true">{sortIndicator(key)}</span>
      </button>
    </th>
  );
  const renderTransferActions = (transfer: InventoryTransfer) => <div className="stocky-board-actions">{userRole !== 'staff' && transfer.status === 'requested' && <button type="button" onClick={() => onApprove(transfer)} className="stocky-transfer-action">Approve</button>}{userRole !== 'staff' && (transfer.status === 'approved' || transfer.status === 'in_transit' || transfer.status === 'partially_received') && <button type="button" onClick={() => openReceipt(transfer)} className="stocky-transfer-action stocky-transfer-action--primary">Receive</button>}{transfer.status !== 'requested' && transfer.status !== 'approved' && transfer.status !== 'in_transit' && transfer.status !== 'partially_received' && <span className="stocky-transfer-action-placeholder">—</span>}</div>;

  return (
    <div className="stocky-transfers-workspace flex flex-col gap-4">
      <section className="stocky-stock-filterbar">
        <div className="stocky-stock-table-toolbar stocky-transfer-toolbar">
          <div className="relative min-w-0 flex-1">
            <SearchIcon size="xs" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search transfers, locations, or products..." className="h-8 w-full rounded-lg border border-transparent bg-stocky-bg-global pl-8 pr-8 text-xs focus:border-stocky-primary focus:outline-none" />
            {search && <button type="button" onClick={() => { setSearch(''); setPage(0); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub cursor-pointer" aria-label="Clear search"><XIcon size="xs" /></button>}
          </div>
          <div className="stocky-transfer-toolbar__queues" role="tablist" aria-label="Transfer views">
            {([['action', 'Needs action'], ['incoming', 'Incoming'], ['outgoing', 'Outgoing'], ['all', 'All transfers']] as const).map(([value, label]) => (
              <button key={value} type="button" role="tab" aria-selected={queue === value} onClick={() => { setQueue(value); setPage(0); }} className={`stocky-table-toolbar-button ${queue === value ? 'stocky-table-toolbar-button--active' : ''}`}>{label}</button>
            ))}
          </div>
          <button type="button" onClick={() => setShowForm((value) => !value)} className="stocky-table-toolbar-button stocky-table-toolbar-button--primary"><PlusIcon size="xs" /> Request stock</button>
        </div>
      </section>

      {showForm && <form onSubmit={submit} className="stocky-transfer-request-form">
        <div className="stocky-transfer-request-form__header">
          <div><p className="stocky-table-toolbar-title">Request stock</p><p className="stocky-table-toolbar-meta">Move one or more products between locations.</p></div>
          <button type="button" onClick={() => setShowForm(false)} className="stocky-icon-button" aria-label="Close request form"><XIcon size="xs" /></button>
        </div>
        <div className="stocky-transfer-request-form__grid">
          <label className="stocky-transfer-field">From<select required value={sourceLocationId} onChange={(event) => { setSourceLocationId(event.target.value); setLines([{ productId: '', quantity: '' }]); }} className="stocky-transfer-input"><option value="">Choose source</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
          <label className="stocky-transfer-field">To<select required value={destinationLocationId} onChange={(event) => setDestinationLocationId(event.target.value)} className="stocky-transfer-input"><option value="">Choose destination</option>{locations.filter((location) => location.id !== sourceLocationId).map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        </div>
        <div className="stocky-transfer-lines">
          <div className="stocky-transfer-lines__header"><p>Products in this transfer</p><button type="button" onClick={() => setLines((current) => [...current, { productId: '', quantity: '' }])}>+ Add product</button></div>
          {lines.map((line, index) => <div key={index} className="stocky-transfer-line">
            <label className="stocky-transfer-field">Product<select required value={line.productId} onChange={(event) => updateLine(index, 'productId', event.target.value)} className="stocky-transfer-input"><option value="">Choose product</option>{sourceProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <label className="stocky-transfer-field">Quantity<input required type="number" min="1" max={availableFor(line.productId) || undefined} value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} className="stocky-transfer-input" /><span className="stocky-transfer-field__hint">Available: {availableFor(line.productId)}</span></label>
            {lines.length > 1 ? <button type="button" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="stocky-table-toolbar-button">Remove</button> : <span />}
          </div>)}
        </div>
        <label className="stocky-transfer-field">Note <span className="stocky-transfer-field__optional">(optional)</span><textarea value={requestNote} onChange={(event) => setRequestNote(event.target.value)} rows={2} placeholder="Why is this stock needed?" className="stocky-transfer-input stocky-transfer-input--textarea" /></label>
        <div className="stocky-transfer-request-form__footer"><button type="button" onClick={() => setShowForm(false)} className="stocky-table-toolbar-button">Cancel</button><button type="submit" className="stocky-table-toolbar-button stocky-table-toolbar-button--primary">Send request</button></div>
      </form>}

      <section className="stocky-board-table-wrap stocky-transfer-table-wrap">
        <div className="stocky-board-table-toolbar"><div><p className="stocky-table-toolbar-title">Transfer list</p><p className="stocky-table-toolbar-meta">Showing {firstRowNumber.toLocaleString()}–{lastRowNumber.toLocaleString()} of {filteredTransfers.length.toLocaleString()} transfers</p></div></div>
        {pageTransfers.length === 0 ? <div className="stocky-transfer-empty"><ArrowUpDownIcon size="md" className="mx-auto text-stocky-text-sub/50" /><h2>{queue === 'action' ? 'Nothing needs your action' : 'No transfers in this view'}</h2><p>Requests, approvals, and receipts will appear here.</p><button type="button" onClick={() => setShowForm(true)} className="stocky-table-toolbar-button stocky-table-toolbar-button--primary"><PlusIcon size="xs" /> Request stock</button></div> : <>
          <div className="stocky-transfer-desktop-table overflow-x-auto"><table className="stocky-board-table stocky-transfer-table w-full">
            <colgroup><col className="stocky-transfer-col-transfer" /><col className="stocky-transfer-col-route stocky-transfer-secondary-column" /><col className="stocky-transfer-col-items stocky-transfer-secondary-column" /><col className="stocky-transfer-col-status" /><col className="stocky-transfer-col-requested stocky-transfer-secondary-column" /><col className="stocky-transfer-col-actions" /></colgroup>
            <thead><tr className="stocky-board-table__column-row text-[10px] uppercase tracking-wide text-stocky-text-sub">{header('Transfer', 'transfer')}{header('Route', 'route', 'stocky-transfer-secondary-column')}{header('Items', 'items', 'stocky-transfer-secondary-column')}{header('Status', 'status')}{header('Requested', 'requested', 'stocky-transfer-secondary-column')}<th className="stocky-board-table__header-cell text-right" aria-label="Transfer actions"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-stocky-border-subtle">{pageTransfers.map((transfer) => {
              const transferLinesForRow = linesForTransfer(transfer.id);
              const productNames = productsForTransfer(transfer.id);
              return <tr key={transfer.id} className="stocky-board-row align-middle">
                <td className="stocky-transfer-cell"><div className="stocky-transfer-id"><span className="stocky-transfer-icon stocky-status-info"><ArrowUpDownIcon size="xs" /></span><div className="min-w-0"><span className="stocky-transfer-main">#{transfer.id.slice(0, 8)}</span><span className="stocky-transfer-sub">{transfer.note || 'Stock movement request'}</span></div></div></td>
                <td className="stocky-transfer-cell stocky-transfer-secondary-column"><div className="stocky-transfer-route"><span>{locationMap.get(transfer.sourceLocationId)?.name || 'Source'}</span><ChevronRightIcon size="xs" /><span>{locationMap.get(transfer.destinationLocationId)?.name || 'Destination'}</span></div></td>
                <td className="stocky-transfer-cell stocky-transfer-secondary-column"><div className="stocky-transfer-items"><span className="stocky-transfer-main">{transferLinesForRow.length || 0} product{transferLinesForRow.length === 1 ? '' : 's'}</span><span className="stocky-transfer-sub">{productNames.slice(0, 2).join(', ') || 'Line details pending'}{productNames.length > 2 ? ` +${productNames.length - 2}` : ''}</span></div></td>
                <td className="stocky-transfer-cell"><span className={`stocky-transfer-status ${statusTone[transfer.status]}`}>{statusLabels[transfer.status]}</span></td>
                <td className="stocky-transfer-cell stocky-transfer-secondary-column"><span className="stocky-transfer-date">{formatDate(transfer.requestedAt)}</span></td>
                <td className="stocky-transfer-cell stocky-transfer-actions-cell">{renderTransferActions(transfer)}</td>
              </tr>;
            })}</tbody>
          </table></div>
          <div className="stocky-transfer-mobile-list">{pageTransfers.map((transfer) => {
            const productNames = productsForTransfer(transfer.id);
            const transferLinesForRow = linesForTransfer(transfer.id);
            return <article key={transfer.id} className="stocky-transfer-mobile-card"><div className="stocky-transfer-mobile-card__top"><div className="stocky-transfer-id"><span className="stocky-transfer-icon stocky-status-info"><ArrowUpDownIcon size="xs" /></span><div className="min-w-0"><span className="stocky-transfer-main">#{transfer.id.slice(0, 8)}</span><span className="stocky-transfer-sub">{formatDate(transfer.requestedAt)}</span></div></div><span className={`stocky-transfer-status ${statusTone[transfer.status]}`}>{statusLabels[transfer.status]}</span></div><div className="stocky-transfer-mobile-card__route"><span>{locationMap.get(transfer.sourceLocationId)?.name || 'Source'}</span><ChevronRightIcon size="xs" /><span>{locationMap.get(transfer.destinationLocationId)?.name || 'Destination'}</span></div><p className="stocky-transfer-mobile-card__items">{transferLinesForRow.length || 0} product{transferLinesForRow.length === 1 ? '' : 's'}{productNames.length > 0 ? ` · ${productNames.slice(0, 2).join(', ')}` : ''}{productNames.length > 2 ? ` +${productNames.length - 2}` : ''}</p><div className="stocky-transfer-mobile-card__actions">{renderTransferActions(transfer)}</div></article>;
          })}</div>
        </>}
        <footer className="stocky-board-table__footer"><div className="text-[11px] text-stocky-text-sub">Rows per page <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className="stocky-table-page-size"><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></div><div className="flex items-center gap-2"><span className="text-[11px] text-stocky-text-sub">Page {currentPage + 1} of {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={currentPage === 0} className="stocky-table-page-button" aria-label="Previous page">‹</button><button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={currentPage >= pageCount - 1} className="stocky-table-page-button" aria-label="Next page">›</button></div></footer>
      </section>

      {receivingTransfer && <div className="fixed inset-0 z-50 stocky-overlay flex items-center justify-center p-4"><form onSubmit={submitReceipt} className="stocky-transfer-receipt-modal"><div className="stocky-transfer-receipt-modal__header"><div><p className="stocky-page-eyebrow">Transfer receipt</p><h2>What actually arrived?</h2><p>Enter the physical quantities. If anything is missing, add a note so the difference is recorded.</p></div><button type="button" onClick={() => setReceivingTransfer(null)} className="stocky-icon-button" aria-label="Close receipt"><XIcon size="xs" /></button></div><div className="stocky-transfer-receipt-modal__body">{linesForTransfer(receivingTransfer.id).map((line) => <label key={line.id} className="stocky-transfer-receipt-line"><span className="stocky-transfer-main">{productMap.get(line.productId)?.name || 'Product'}</span><span className="stocky-transfer-sub">Approved: {line.quantityApproved ?? line.quantityRequested} · Already received: {line.quantityReceived}</span><span className="stocky-transfer-receipt-line__input"><BarcodeIcon size="xs" /><input type="number" min="0" max={Math.max(0, (line.quantityApproved ?? line.quantityRequested) - line.quantityReceived)} value={receiptQuantities[line.id] || ''} onChange={(event) => setReceiptQuantities((current) => ({ ...current, [line.id]: event.target.value }))} /></span></label>)}<label className="stocky-transfer-field">Difference note<textarea value={receiptNote} onChange={(event) => setReceiptNote(event.target.value)} required={linesForTransfer(receivingTransfer.id).some((line) => Number(receiptQuantities[line.id] || 0) < Math.max(0, (line.quantityApproved ?? line.quantityRequested) - line.quantityReceived))} rows={2} placeholder="Required if stock is missing" className="stocky-transfer-input stocky-transfer-input--textarea" /></label></div><div className="stocky-transfer-receipt-modal__footer"><button type="button" onClick={() => setReceivingTransfer(null)} className="stocky-table-toolbar-button">Cancel</button><button type="submit" className="stocky-table-toolbar-button stocky-table-toolbar-button--primary">Save receipt</button></div></form></div>}
    </div>
  );
}
