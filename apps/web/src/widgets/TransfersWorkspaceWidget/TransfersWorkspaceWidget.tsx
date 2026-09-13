'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { CompanyUserRole, InventoryTransfer, InventoryTransferLine, Location, Product, StockLot } from '@stocky/types';
import { supabase } from '@/lib/supabase/client';
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
  onCreate,
  onApprove,
  onReceive,
}: TransfersWorkspaceWidgetProps) {
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(Boolean(defaultProductId));
  const [receivingTransfer, setReceivingTransfer] = useState<InventoryTransfer | null>(null);
  const [queue, setQueue] = useState<TransferQueue>('action');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: TransferSortKey; direction: TransferSortDirection }>({
    key: 'requested',
    direction: 'desc',
  });

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

        const lineText = productsForTransfer(transfer.id).join(' ');
        const searchable = `${transfer.id} ${routeForTransfer(transfer)} ${lineText} ${
          transfer.note || ''
        } ${statusLabels[transfer.status]}`.toLowerCase();

        return queueMatch && (!searchText || searchable.includes(searchText));
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
          />
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
            onApprove={onApprove}
            onOpenReceipt={handleOpenReceipt}
            onRequestStock={() => setIsRequestDrawerOpen(true)}
            queue={queue}
          />
        </div>
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
