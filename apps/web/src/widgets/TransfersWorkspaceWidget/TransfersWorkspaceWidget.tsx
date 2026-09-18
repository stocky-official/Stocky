'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CompanyUserRole, InventoryTransfer, InventoryTransferLine, Location, Product, StockLot } from '@stocky/types';
import { supabase } from '@/lib/supabase/client';
import { CheckIcon, FilterIcon, WarehouseIcon, XIcon } from '@stocky/icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TransfersToolbarWidget, type TransferQueue } from './TransfersToolbarWidget';
import { TransfersTableWidget, type TransferSortKey, type TransferSortDirection } from './TransfersTableWidget';
import { TransferRequestDrawerWidget } from './TransferRequestDrawerWidget';
import { TransferReceiveDrawerWidget } from './TransferReceiveDrawerWidget';

export interface TransfersWorkspaceWidgetProps {
  transfers: InventoryTransfer[];
  transferLines?: InventoryTransferLine[];
  products: Product[];
  lots: StockLot[];
  locations: Location[];
  selectedLocationId: string;
  defaultProductId?: string;
  userRole: CompanyUserRole;
  onCreate: (input: {
    sourceLocationId: string;
    destinationLocationId: string;
    lines: Array<{ productId: string; quantity: number }>;
    note?: string;
  }) => void;
  canApprove?: boolean;
  onApprove: (transfer: InventoryTransfer) => void;
  onReceive: (
    transfer: InventoryTransfer,
    lines?: Array<{ lineId: string; quantityReceived: number }>,
    note?: string
  ) => void;
}

export type RedesignedTransfersWidgetProps = TransfersWorkspaceWidgetProps;

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

function compareValues(left: string | number, right: string | number) {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
}

export function TransfersWorkspaceWidget({
  transfers,
  transferLines = [],
  products,
  lots,
  locations,
  selectedLocationId,
  defaultProductId,
  userRole,
  canApprove,
  onCreate,
  onApprove,
  onReceive,
}: TransfersWorkspaceWidgetProps) {
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(Boolean(defaultProductId));
  const [receivingTransfer, setReceivingTransfer] = useState<InventoryTransfer | null>(null);
  const [queue, setQueue] = useState<TransferQueue>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: TransferSortKey; direction: TransferSortDirection }>({
    key: 'requested',
    direction: 'desc',
  });

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterStatuses, setFilterStatuses] = useState<InventoryTransfer['status'][]>([]);
  const [filterOriginId, setFilterOriginId] = useState<string>('');
  const [filterDestinationId, setFilterDestinationId] = useState<string>('');

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatuses.length > 0) count += filterStatuses.length;
    if (filterOriginId) count += 1;
    if (filterDestinationId) count += 1;
    return count;
  }, [filterStatuses, filterOriginId, filterDestinationId]);

  const handleResetFilters = () => {
    setFilterStatuses([]);
    setFilterOriginId('');
    setFilterDestinationId('');
  };

  const filterPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFilterDrawerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(e.target as Node)
      ) {
        setIsFilterDrawerOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterDrawerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterDrawerOpen]);

  const [loadedTransferLines, setLoadedTransferLines] = useState<InventoryTransferLine[]>([]);
  const allTransferLines = transferLines.length > 0 ? transferLines : loadedTransferLines;

  useEffect(() => {
    if (defaultProductId) {
      setIsRequestDrawerOpen(true);
    }
  }, [defaultProductId]);

  useEffect(() => {
    if (transferLines.length > 0 || transfers.length === 0) return;
    supabase
      .from('stock_transfer_lines')
      .select('*')
      .in('transfer_id', transfers.map((transfer) => transfer.id))
      .then(({ data }) => {
        setLoadedTransferLines(
          (data || []).map((row: any) => ({
            id: row.id,
            transferId: row.transfer_id,
            productId: row.product_id,
            sourceLotId: row.source_lot_id,
            quantityRequested: Number(row.quantity_requested || 0),
            quantityApproved:
              row.quantity_approved == null ? null : Number(row.quantity_approved),
            quantityReceived: Number(row.quantity_received || 0),
            createdAt: row.created_at,
          }))
        );
      });
  }, [transferLines.length, transfers]);

  const locationMap = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations]
  );
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const scopedTransfers = useMemo(
    () =>
      transfers.filter(
        (transfer) =>
          selectedLocationId === 'all' ||
          transfer.sourceLocationId === selectedLocationId ||
          transfer.destinationLocationId === selectedLocationId
      ),
    [selectedLocationId, transfers]
  );

  const linesForTransfer = (transferId: string) =>
    allTransferLines.filter((line) => line.transferId === transferId);

  const productsForTransfer = (transferId: string) =>
    Array.from(
      new Set(
        linesForTransfer(transferId).map(
          (line) => productMap.get(line.productId)?.name || 'Product'
        )
      )
    );

  const routeForTransfer = (transfer: InventoryTransfer) =>
    `${locationMap.get(transfer.sourceLocationId)?.name || 'Source'} to ${
      locationMap.get(transfer.destinationLocationId)?.name || 'Destination'
    }`;

  const filteredTransfers = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const activeTransfers = scopedTransfers.filter(
      (transfer) => !['received', 'rejected', 'cancelled'].includes(transfer.status)
    );

    return scopedTransfers
      .filter((transfer) => {
        const queueMatch =
          queue === 'all' ||
          (queue === 'action' && activeTransfers.some((item) => item.id === transfer.id)) ||
          (queue === 'incoming' &&
            (selectedLocationId === 'all' || transfer.destinationLocationId === selectedLocationId)) ||
          (queue === 'outgoing' &&
            (selectedLocationId === 'all' || transfer.sourceLocationId === selectedLocationId));

        if (!queueMatch) return false;

        if (filterStatuses.length > 0 && !filterStatuses.includes(transfer.status)) {
          return false;
        }
        if (filterOriginId && transfer.sourceLocationId !== filterOriginId) {
          return false;
        }
        if (filterDestinationId && transfer.destinationLocationId !== filterDestinationId) {
          return false;
        }

        const lineText = productsForTransfer(transfer.id).join(' ');
        const searchable = `${transfer.id} ${routeForTransfer(transfer)} ${lineText} ${
          transfer.note || ''
        } ${statusLabels[transfer.status]}`.toLowerCase();

        return !searchText || searchable.includes(searchText);
      })
      .sort((left, right) => {
        const leftItems = productsForTransfer(left.id).join(', ');
        const rightItems = productsForTransfer(right.id).join(', ');
        const values: Record<TransferSortKey, string | number> = {
          transfer: left.id,
          route: routeForTransfer(left),
          items: leftItems,
          status: statusLabels[left.status],
          requested: new Date(left.requestedAt).getTime(),
        };
        const rightValues: Record<TransferSortKey, string | number> = {
          transfer: right.id,
          route: routeForTransfer(right),
          items: rightItems,
          status: statusLabels[right.status],
          requested: new Date(right.requestedAt).getTime(),
        };
        const result = compareValues(values[sort.key], rightValues[sort.key]);
        return sort.direction === 'asc' ? result : -result;
      });
  }, [allTransferLines, locationMap, productMap, queue, scopedTransfers, search, selectedLocationId, sort]);

  const handleSort = (key: TransferSortKey) => {
    setPage(0);
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const handleOpenReceipt = (transfer: InventoryTransfer) => {
    const rows = linesForTransfer(transfer.id);
    if (rows.length === 0) {
      return onReceive(transfer);
    }
    setReceivingTransfer(transfer);
  };

  const transferFilterContent = (isMobile = false) => (
    <motion.div
      initial={isMobile ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
      animate={isMobile ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={isMobile ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-label="Transfer filters"
      className={
        isMobile
          ? "flex flex-col min-h-0 bg-white"
          : "w-full rounded-2xl bg-white border border-stocky-border-subtle shadow-bevel-float overflow-hidden flex flex-col z-50 text-left select-none"
      }
    >
      {/* Header (Desktop only) */}
      {!isMobile && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stocky-border-subtle bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stocky-primary/10 text-stocky-primary flex items-center justify-center shrink-0">
              <FilterIcon size="xs" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-stocky-text-main">Filter Transfers</h2>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-stocky-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              <p className="text-xs text-stocky-text-sub mt-0.5">Filter by transfer status and routing locations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(false)}
            aria-label="Close transfer filters"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
          >
            <XIcon size="xs" />
          </button>
        </div>
      )}

      {/* Body */}
      <div className={`${isMobile ? 'p-4 space-y-5' : 'p-5 space-y-6 max-h-[60vh] overflow-y-auto'}`}>
        {/* Status Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-semibold text-stocky-text-main">Transfer Status</label>
            {filterStatuses.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterStatuses([])}
                className="text-[11px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                'requested',
                'approved',
                'in_transit',
                'partially_received',
                'received',
                'rejected',
                'cancelled',
              ] as const
            ).map((st) => {
              const isChecked = filterStatuses.includes(st);
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() =>
                    setFilterStatuses((prev) =>
                      isChecked ? prev.filter((s) => s !== st) : [...prev, st]
                    )
                  }
                  className={`h-8 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isChecked
                      ? 'bg-stocky-primary/10 border-stocky-primary/40 text-stocky-primary font-semibold'
                      : 'bg-white border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-text-main'
                  }`}
                >
                  {isChecked && <CheckIcon size="xs" />}
                  {statusLabels[st]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Origin Location */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5">
              <WarehouseIcon size="xs" className="text-stocky-primary" />
              Origin Location (From)
            </label>
            {filterOriginId && (
              <button
                type="button"
                onClick={() => setFilterOriginId('')}
                className="text-[11px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <select
            value={filterOriginId}
            onChange={(e) => setFilterOriginId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer"
          >
            <option value="">All origin locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Destination Location */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5">
              <WarehouseIcon size="xs" className="text-stocky-primary" />
              Destination Location (To)
            </label>
            {filterDestinationId && (
              <button
                type="button"
                onClick={() => setFilterDestinationId('')}
                className="text-[11px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <select
            value={filterDestinationId}
            onChange={(e) => setFilterDestinationId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer"
          >
            <option value="">All destination locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-5 py-3.5 border-t border-stocky-border-subtle bg-white flex items-center justify-between shrink-0 ${isMobile ? 'mt-auto' : ''}`}>
        <span className="text-xs text-stocky-text-sub">
          Showing <strong className="font-semibold text-stocky-text-main">{filteredTransfers.length}</strong> transfers
        </span>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-8 px-3 rounded-full text-xs font-medium text-stocky-text-sub hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(false)}
            className="h-8 px-5 rounded-full bg-stocky-text-main text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="stocky-transfers-workspace flex flex-col gap-4">
      {/* Unified Table Workspace Card (stocky-page-redesign standard) */}
      <div className="stocky-stock-unified-card rounded-2xl bg-white border border-stocky-border-subtle shadow-sm flex flex-col relative z-20 overflow-visible">
        {/* 1. Integrated Toolbar Header */}
        <div className="p-3 sm:p-3.5 border-b border-stocky-border-subtle relative z-30">
          <TransfersToolbarWidget
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
            queue={queue}
            onQueueChange={(nextQueue) => {
              setQueue(nextQueue);
              setPage(0);
            }}
            onRequestStock={() => setIsRequestDrawerOpen(true)}
            filterPanelOpen={isFilterDrawerOpen}
            onToggleFilterPanel={() => setIsFilterDrawerOpen((open) => !open)}
            isFilterActive={activeFilterCount > 0}
            activeFilterCount={activeFilterCount}
          />

          {/* Floating Filter Panel (Desktop) */}
          <AnimatePresence>
            {isFilterDrawerOpen && (
              <div
                ref={filterPanelRef}
                className="hidden sm:block absolute top-[calc(100%+8px)] inset-x-3 sm:inset-x-3.5 z-50"
              >
                {transferFilterContent(false)}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Integrated Data / Table Body */}
        <div className="w-full">
          <TransfersTableWidget
            transfers={filteredTransfers}
            allTransferLines={allTransferLines}
            locationMap={locationMap}
            productMap={productMap}
            userRole={userRole}
            sort={sort}
            onSort={handleSort}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            canApprove={canApprove}
            onApprove={onApprove}
            onOpenReceipt={handleOpenReceipt}
            onRequestStock={() => setIsRequestDrawerOpen(true)}
            queue={queue}
          />
        </div>
      </div>

      {/* Mobile Transfers Filter Bottom Sheet Drawer */}
      <div className="sm:hidden">
        <BottomSheet
          mobileOnly
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filter Transfers"
          subtitle={`Showing ${filteredTransfers.length} of ${transfers.length} transfers`}
        >
          {transferFilterContent(true)}
        </BottomSheet>
      </div>

      {/* Side Drawers */}
      <TransferRequestDrawerWidget
        isOpen={isRequestDrawerOpen}
        onClose={() => setIsRequestDrawerOpen(false)}
        locations={locations}
        products={products}
        lots={lots}
        selectedLocationId={selectedLocationId}
        defaultProductId={defaultProductId}
        onCreate={onCreate}
      />

      <TransferReceiveDrawerWidget
        isOpen={Boolean(receivingTransfer)}
        transfer={receivingTransfer}
        transferLines={allTransferLines}
        products={products}
        onClose={() => setReceivingTransfer(null)}
        onReceive={onReceive}
      />
    </div>
  );
}

export const RedesignedTransfersWidget = TransfersWorkspaceWidget;
