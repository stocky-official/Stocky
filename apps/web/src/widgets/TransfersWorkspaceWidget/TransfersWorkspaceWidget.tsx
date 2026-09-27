'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CompanyUserRole, InventoryTransfer, InventoryTransferLine, Location, Product, StockLot } from '@stocky/types';
import { CheckIcon, FilterIcon, WarehouseIcon, XIcon } from '@stocky/icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TransfersToolbarWidget, type TransferQueue } from './TransfersToolbarWidget';
import { TransfersTableWidget, type TransferSortKey, type TransferSortDirection } from './TransfersTableWidget';
import { TransferRequestDrawerWidget } from './TransferRequestDrawerWidget';
import { TransferReceiveDrawerWidget } from './TransferReceiveDrawerWidget';
import { useTranslation } from '@/lib/i18n';

export interface TransfersWorkspaceWidgetProps {
  transfers: InventoryTransfer[];
  transferLines?: InventoryTransferLine[];
  products: Product[];
  lots: StockLot[];
  locations: Location[];
  selectedLocationId: string;
  defaultProductId?: string;
  userRole: CompanyUserRole;
  receiveLocationId?: string;
  onCreate: (input: {
    sourceLocationId: string;
    destinationLocationId: string;
    lines: Array<{ productId: string; quantity: number }>;
    note?: string;
  }) => void | Promise<void>;
  canApprove?: boolean;
  onApprove: (transfer: InventoryTransfer) => void | Promise<void>;
  onReceive: (
    transfer: InventoryTransfer,
    lines?: Array<{ lineId: string; quantityReceived: number }>,
    note?: string
  ) => void | Promise<void>;
}

export type RedesignedTransfersWidgetProps = TransfersWorkspaceWidgetProps;

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
  receiveLocationId,
  canApprove,
  onCreate,
  onApprove,
  onReceive,
}: TransfersWorkspaceWidgetProps) {
  const { t } = useTranslation();
  const statusLabels: Record<InventoryTransfer['status'], string> = {
    draft: t('transfers.statusDraft'),
    requested: t('transfers.statusRequested'),
    approved: t('transfers.statusApproved'),
    in_transit: t('transfers.statusInTransit'),
    partially_received: t('transfers.statusPartiallyReceived'),
    received: t('transfers.statusReceived'),
    rejected: t('transfers.statusRejected'),
    cancelled: t('transfers.statusCancelled'),
  };
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(Boolean(defaultProductId));
  const [receivingTransfer, setReceivingTransfer] = useState<InventoryTransfer | null>(null);
  const [queue, setQueue] = useState<TransferQueue>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
  const [operationError, setOperationError] = useState<string | null>(null);

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

  const allTransferLines = transferLines;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search), 150);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (defaultProductId) {
      setIsRequestDrawerOpen(true);
    }
  }, [defaultProductId]);

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
    const searchText = debouncedSearch.trim().toLowerCase();
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
  }, [allTransferLines, debouncedSearch, locationMap, productMap, queue, scopedTransfers, selectedLocationId, sort]);

  const handleSort = (key: TransferSortKey) => {
    setPage(0);
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const handleOpenReceipt = async (transfer: InventoryTransfer) => {
    const rows = linesForTransfer(transfer.id);
    if (rows.length === 0) {
      try {
        setOperationError(null);
        await onReceive(transfer);
      } catch (error) {
        setOperationError(error instanceof Error ? error.message : t('common.error'));
      }
      return;
    }
    setReceivingTransfer(transfer);
  };

  const handleApprove = async (transfer: InventoryTransfer) => {
    try {
      setOperationError(null);
      await onApprove(transfer);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : t('common.error'));
    }
  };

  const transferFilterContent = (isMobile = false) => (
    <motion.div
      initial={isMobile ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
      animate={isMobile ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={isMobile ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-label={t('transfers.filterTransfers')}
      className={
        isMobile
          ? "flex flex-col min-h-0 bg-stocky-bg-widget"
          : "w-full rounded-2xl bg-stocky-bg-widget border border-stocky-border-subtle shadow-bevel-float overflow-hidden flex flex-col z-50 text-left select-none"
      }
    >
      {/* Header (Desktop only) */}
      {!isMobile && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stocky-border-subtle bg-stocky-bg-widget shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stocky-primary/10 text-stocky-primary flex items-center justify-center shrink-0">
              <FilterIcon size="xs" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-stocky-text-main">{t('transfers.filterTransfers')}</h2>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-stocky-primary px-2 py-0.5 text-[10px] font-semibold text-stocky-text-inverse">
                    {t('transfers.activeFilters', { count: activeFilterCount })}
                  </span>
                )}
              </div>
              <p className="text-xs text-stocky-text-sub mt-0.5">{t('transfers.filterTransfersDescription')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(false)}
            aria-label={t('common.close')}
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
            <label className="text-xs font-semibold text-stocky-text-main">{t('transfers.transferStatus')}</label>
            {filterStatuses.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterStatuses([])}
                className="text-[11px] text-stocky-text-sub hover:text-stocky-status-critical-fg cursor-pointer"
              >
                {t('common.clear')}
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
                      : 'bg-stocky-bg-widget border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-text-main'
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
              {t('transfers.originLocation')}
            </label>
            {filterOriginId && (
              <button
                type="button"
                onClick={() => setFilterOriginId('')}
                className="text-[11px] text-stocky-text-sub hover:text-stocky-status-critical-fg cursor-pointer"
              >
                {t('common.clear')}
              </button>
            )}
          </div>
          <select
            value={filterOriginId}
            onChange={(e) => setFilterOriginId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-stocky-bg-widget border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer"
          >
            <option value="">{t('transfers.allOriginLocations')}</option>
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
              {t('transfers.destinationLocationFilter')}
            </label>
            {filterDestinationId && (
              <button
                type="button"
                onClick={() => setFilterDestinationId('')}
                className="text-[11px] text-stocky-text-sub hover:text-stocky-status-critical-fg cursor-pointer"
              >
                {t('common.clear')}
              </button>
            )}
          </div>
          <select
            value={filterDestinationId}
            onChange={(e) => setFilterDestinationId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-stocky-bg-widget border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer"
          >
            <option value="">{t('transfers.allDestinationLocations')}</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-5 py-3.5 border-t border-stocky-border-subtle bg-stocky-bg-widget flex items-center justify-between shrink-0 ${isMobile ? 'mt-auto' : ''}`}>
        <span className="text-xs text-stocky-text-sub">
          {t('transfers.showingTransfers', { count: filteredTransfers.length })}
        </span>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-8 px-3 rounded-full text-xs font-medium text-stocky-text-sub hover:text-stocky-status-critical-fg hover:bg-stocky-status-critical-bg transition-colors cursor-pointer"
            >
              {t('common.reset')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(false)}
            className="h-8 px-5 rounded-full bg-stocky-text-main text-stocky-text-inverse text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            {t('transfers.done')}
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="stocky-transfers-workspace flex flex-col gap-4">
      {operationError && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-stocky-status-critical-border bg-stocky-status-critical-bg px-4 py-3 text-sm text-stocky-status-critical-fg" role="alert">
          <span>{operationError}</span>
          <button type="button" onClick={() => setOperationError(null)} className="text-xs font-semibold underline">
            {t('common.close')}
          </button>
        </div>
      )}
      {/* Unified Table Workspace Card (stocky-page-redesign standard) */}
      <div className="stocky-stock-unified-card rounded-xl bg-stocky-bg-widget border border-stocky-border-subtle shadow-none flex flex-col relative z-20 overflow-visible">
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
            receiveLocationId={receiveLocationId}
            onApprove={handleApprove}
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
          title={t('transfers.filterTransfers')}
          subtitle={t('transfers.showingTransfers', { count: filteredTransfers.length })}
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
