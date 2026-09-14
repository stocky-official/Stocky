'use client';

import React from 'react';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@stocky/icons';
import type { CompanyUserRole, InventoryTransfer, InventoryTransferLine, Location, Product } from '@stocky/types';

export type TransferSortKey = 'transfer' | 'route' | 'items' | 'status' | 'requested';
export type TransferSortDirection = 'asc' | 'desc';

export interface TransfersTableWidgetProps {
  transfers: InventoryTransfer[];
  allTransferLines: InventoryTransferLine[];
  locationMap: Map<string, Location>;
  productMap: Map<string, Product>;
  userRole: CompanyUserRole;
  sort: { key: TransferSortKey; direction: TransferSortDirection };
  onSort: (key: TransferSortKey) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  canApprove?: boolean;
  onApprove: (transfer: InventoryTransfer) => void;
  onOpenReceipt: (transfer: InventoryTransfer) => void;
  onRequestStock: () => void;
  queue: string;
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

export function TransfersTableWidget({
  transfers,
  allTransferLines,
  locationMap,
  productMap,
  userRole,
  sort,
  onSort,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  canApprove,
  onApprove,
  onOpenReceipt,
  onRequestStock,
  queue,
}: TransfersTableWidgetProps) {
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

  const pageCount = Math.max(1, Math.ceil(transfers.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageTransfers = transfers.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const firstRowNumber = transfers.length === 0 ? 0 : currentPage * pageSize + 1;
  const lastRowNumber = Math.min((currentPage + 1) * pageSize, transfers.length);

  const sortIndicator = (key: TransferSortKey) => {
    if (sort.key !== key) return <ArrowUpDownIcon size={10} />;
    return sort.direction === 'asc' ? <ArrowUpIcon size={10} /> : <ArrowDownIcon size={10} />;
  };

  const header = (label: string, key: TransferSortKey, className = '') => (
    <th className={`stocky-board-table__header-cell px-4 py-3 align-middle text-left whitespace-nowrap ${className}`}>
      <button
        type="button"
        onClick={() => onSort(key)}
        className="stocky-transfer-table__sort-button"
        aria-label={`Sort by ${label}`}
      >
        <span>{label}</span>
        <span className="stocky-table-sort-indicator" aria-hidden="true">
          {sortIndicator(key)}
        </span>
      </button>
    </th>
  );

  const isApprovedAllowed = canApprove !== undefined ? canApprove : userRole !== 'staff';

  const renderTransferActions = (transfer: InventoryTransfer) => (
    <div className="stocky-board-actions justify-end">
      {isApprovedAllowed && transfer.status === 'requested' && (
        <button
          type="button"
          onClick={() => onApprove(transfer)}
          className="stocky-transfer-action"
        >
          Approve
        </button>
      )}
      {isApprovedAllowed &&
        (transfer.status === 'approved' ||
          transfer.status === 'in_transit' ||
          transfer.status === 'partially_received') && (
          <button
            type="button"
            onClick={() => onOpenReceipt(transfer)}
            className="stocky-transfer-action stocky-transfer-action--primary"
          >
            Receive
          </button>
        )}
      {transfer.status !== 'requested' &&
        transfer.status !== 'approved' &&
        transfer.status !== 'in_transit' &&
        transfer.status !== 'partially_received' && (
          <span className="stocky-transfer-action-placeholder">—</span>
        )}
    </div>
  );

  return (
    <div className="flex flex-col w-full">
      {pageTransfers.length === 0 ? (
        <div className="stocky-transfer-empty px-6 py-16 text-center">
          <ArrowUpDownIcon size="md" className="mx-auto text-stocky-text-sub/50" />
          <h2 className="mt-3 text-base font-medium text-stocky-text-main">
            {queue === 'action' ? 'Nothing needs your action' : 'No transfers in this view'}
          </h2>
          <p className="mt-1 text-sm text-stocky-text-sub">
            Requests, approvals, and receipts will appear here.
          </p>
          <button
            type="button"
            onClick={onRequestStock}
            className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <PlusIcon size="xs" /> Request stock
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="stocky-transfer-desktop-table overflow-x-auto">
            <table className="stocky-board-table stocky-transfer-table w-full">
              <colgroup>
                <col className="stocky-transfer-col-transfer" />
                <col className="stocky-transfer-col-route stocky-transfer-secondary-column" />
                <col className="stocky-transfer-col-items stocky-transfer-secondary-column" />
                <col className="stocky-transfer-col-status" />
                <col className="stocky-transfer-col-requested stocky-transfer-secondary-column" />
                <col className="stocky-transfer-col-actions" />
              </colgroup>
              <thead>
                <tr className="stocky-board-table__column-row text-[10px] uppercase tracking-wide text-stocky-text-sub h-11 border-b border-stocky-border-subtle">
                  {header('Transfer', 'transfer')}
                  {header('Route', 'route', 'stocky-transfer-secondary-column')}
                  {header('Items', 'items', 'stocky-transfer-secondary-column')}
                  {header('Status', 'status')}
                  {header('Requested', 'requested', 'stocky-transfer-secondary-column')}
                  <th
                    className="stocky-board-table__header-cell px-4 py-3 text-right align-middle whitespace-nowrap"
                    aria-label="Transfer actions"
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle">
                {pageTransfers.map((transfer) => {
                  const transferLinesForRow = linesForTransfer(transfer.id);
                  const productNames = productsForTransfer(transfer.id);
                  return (
                    <tr key={transfer.id} className="stocky-board-row align-middle hover:bg-stocky-bg-global/30 transition-colors">
                      <td className="stocky-transfer-cell">
                        <div className="stocky-transfer-id">
                          <span className="stocky-transfer-icon stocky-status-info">
                            <ArrowUpDownIcon size="xs" />
                          </span>
                          <div className="min-w-0">
                            <span className="stocky-transfer-main font-medium">
                              #{transfer.id.slice(0, 8)}
                            </span>
                            <span className="stocky-transfer-sub text-stocky-text-sub">
                              {transfer.note || 'Stock movement request'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="stocky-transfer-cell stocky-transfer-secondary-column">
                        <div className="stocky-transfer-route flex items-center gap-1.5 text-xs text-stocky-text-main">
                          <span>{locationMap.get(transfer.sourceLocationId)?.name || 'Source'}</span>
                          <ChevronRightIcon size="xs" className="text-stocky-text-sub flex-shrink-0" />
                          <span>{locationMap.get(transfer.destinationLocationId)?.name || 'Destination'}</span>
                        </div>
                      </td>
                      <td className="stocky-transfer-cell stocky-transfer-secondary-column">
                        <div className="stocky-transfer-items">
                          <span className="stocky-transfer-main font-medium">
                            {transferLinesForRow.length || 0} product{transferLinesForRow.length === 1 ? '' : 's'}
                          </span>
                          <span className="stocky-transfer-sub text-stocky-text-sub">
                            {productNames.slice(0, 2).join(', ') || 'Line details pending'}
                            {productNames.length > 2 ? ` +${productNames.length - 2}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="stocky-transfer-cell">
                        <span className={`stocky-transfer-status ${statusTone[transfer.status]}`}>
                          {statusLabels[transfer.status]}
                        </span>
                      </td>
                      <td className="stocky-transfer-cell stocky-transfer-secondary-column">
                        <span className="stocky-transfer-date text-xs text-stocky-text-sub">
                          {formatDate(transfer.requestedAt)}
                        </span>
                      </td>
                      <td className="stocky-transfer-cell stocky-transfer-actions-cell">
                        {renderTransferActions(transfer)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="stocky-transfer-mobile-list divide-y divide-stocky-border-subtle sm:hidden">
            {pageTransfers.map((transfer) => {
              const productNames = productsForTransfer(transfer.id);
              const transferLinesForRow = linesForTransfer(transfer.id);
              return (
                <article key={transfer.id} className="stocky-transfer-mobile-card p-4 flex flex-col gap-3">
                  <div className="stocky-transfer-mobile-card__top flex items-center justify-between">
                    <div className="stocky-transfer-id flex items-center gap-2">
                      <span className="stocky-transfer-icon stocky-status-info">
                        <ArrowUpDownIcon size="xs" />
                      </span>
                      <div>
                        <span className="stocky-transfer-main font-medium text-xs">
                          #{transfer.id.slice(0, 8)}
                        </span>
                        <span className="stocky-transfer-sub text-[11px] text-stocky-text-sub block">
                          {formatDate(transfer.requestedAt)}
                        </span>
                      </div>
                    </div>
                    <span className={`stocky-transfer-status ${statusTone[transfer.status]}`}>
                      {statusLabels[transfer.status]}
                    </span>
                  </div>

                  <div className="stocky-transfer-mobile-card__route flex items-center gap-1.5 text-xs text-stocky-text-main">
                    <span>{locationMap.get(transfer.sourceLocationId)?.name || 'Source'}</span>
                    <ChevronRightIcon size="xs" className="text-stocky-text-sub" />
                    <span>{locationMap.get(transfer.destinationLocationId)?.name || 'Destination'}</span>
                  </div>

                  <p className="stocky-transfer-mobile-card__items text-xs text-stocky-text-sub">
                    {transferLinesForRow.length || 0} product{transferLinesForRow.length === 1 ? '' : 's'}
                    {productNames.length > 0 ? ` · ${productNames.slice(0, 2).join(', ')}` : ''}
                    {productNames.length > 2 ? ` +${productNames.length - 2}` : ''}
                  </p>

                  <div className="stocky-transfer-mobile-card__actions flex justify-end pt-1">
                    {renderTransferActions(transfer)}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination Footer */}
      <footer className="stocky-board-table__footer flex items-center justify-between border-t border-stocky-border-subtle p-3 text-[11px] text-stocky-text-sub">
        <div className="flex items-center gap-3">
          <span>
            Showing {firstRowNumber.toLocaleString()}–{lastRowNumber.toLocaleString()} of {transfers.length.toLocaleString()} transfers
          </span>
          <span>
            Rows per page{' '}
            <select
              value={pageSize}
              onChange={(event) => {
                onPageSizeChange(Number(event.target.value));
                onPageChange(0);
              }}
              className="stocky-table-page-size rounded border border-stocky-border-subtle bg-white px-1.5 py-0.5"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>
            Page {currentPage + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="stocky-table-page-button"
            aria-label="Previous page"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
            disabled={currentPage >= pageCount - 1}
            className="stocky-table-page-button"
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </footer>
    </div>
  );
}
