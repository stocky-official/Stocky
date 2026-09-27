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
import { useTranslation } from '@/lib/i18n';

export type TransferSortKey = 'transfer' | 'route' | 'items' | 'status' | 'requested';
export type TransferSortDirection = 'asc' | 'desc';

export interface TransfersTableWidgetProps {
  transfers: InventoryTransfer[];
  allTransferLines: InventoryTransferLine[];
  locationMap: Map<string, Location>;
  productMap: Map<string, Product>;
  userRole: CompanyUserRole;
  receiveLocationId?: string;
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

function formatDate(value: string | null | undefined, locale: 'en' | 'ar' = 'en') {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function TransfersTableWidget({
  transfers,
  allTransferLines,
  locationMap,
  productMap,
  userRole,
  receiveLocationId,
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
  const { t, locale } = useTranslation();
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
  const linesForTransfer = (transferId: string) =>
    allTransferLines.filter((line) => line.transferId === transferId);

  const productsForTransfer = (transferId: string) =>
    Array.from(
      new Set(
        linesForTransfer(transferId).map(
          (line) => productMap.get(line.productId)?.name || t('common.items')
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
    <th scope="col" aria-sort={sort.key === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className={`stocky-board-table__header-cell px-4 py-3 align-middle text-start whitespace-nowrap ${className}`}>
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
            className="stocky-transfer-action stocky-transfer-action--primary"
          >
            {t('common.approve')}
          </button>
        )}
      {isApprovedAllowed &&
        (!receiveLocationId || transfer.destinationLocationId === receiveLocationId) &&
        (transfer.status === 'approved' ||
          transfer.status === 'in_transit' ||
          transfer.status === 'partially_received') && (
          <button
            type="button"
            onClick={() => onOpenReceipt(transfer)}
            className="stocky-transfer-action stocky-transfer-action--primary"
          >
            {t('transfers.receiveTransfer')}
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
            {queue === 'action' ? t('transfers.needsAction') : t('transfers.noTransfersFound')}
          </h2>
          <p className="mt-1 text-sm text-stocky-text-sub">
            {t('transfers.subtitle')}
          </p>
          <button
            type="button"
            onClick={onRequestStock}
            className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <PlusIcon size="xs" /> {t('transfers.requestStock')}
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
                  {header(t('transfers.title'), 'transfer')}
                  {header(t('transfers.route'), 'route', 'stocky-transfer-secondary-column')}
                  {header(t('transfers.lines'), 'items', 'stocky-transfer-secondary-column')}
                  {header(t('common.status'), 'status')}
                  {header(t('transfers.statusRequested'), 'requested', 'stocky-transfer-secondary-column')}
                  <th
                    className="stocky-board-table__header-cell px-4 py-3 text-end align-middle whitespace-nowrap"
                    aria-label={t('common.actions')}
                    scope="col"
                  >
                    <span className="sr-only">{t('common.actions')}</span>
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
                              <bdi>#{transfer.id.slice(0, 8)}</bdi>
                            </span>
                            <span className="stocky-transfer-sub text-stocky-text-sub">
                              {transfer.note || t('transfers.title')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="stocky-transfer-cell stocky-transfer-secondary-column">
                        <div className="stocky-transfer-route flex items-center gap-1.5 text-xs text-stocky-text-main">
                           <bdi>{locationMap.get(transfer.sourceLocationId)?.name || t('transfers.source')}</bdi>
                          <ChevronRightIcon size="xs" className="text-stocky-text-sub flex-shrink-0 rtl:rotate-180" />
                           <bdi>{locationMap.get(transfer.destinationLocationId)?.name || t('transfers.destination')}</bdi>
                        </div>
                      </td>
                      <td className="stocky-transfer-cell stocky-transfer-secondary-column">
                        <div className="stocky-transfer-items">
                          <span className="stocky-transfer-main font-medium">
                             {transferLinesForRow.length === 1 ? t('transfers.itemCount', { count: transferLinesForRow.length }) : t('transfers.itemCountPlural', { count: transferLinesForRow.length })}
                          </span>
                          <span className="stocky-transfer-sub text-stocky-text-sub">
                             <bdi>{productNames.slice(0, 2).join(', ') || t('common.notRecorded')}</bdi>
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
                          <bdi>{formatDate(transfer.requestedAt, locale)}</bdi>
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
          <div className="stocky-transfer-mobile-list divide-y divide-stocky-border-subtle sm:hidden w-full">
            {pageTransfers.map((transfer) => {
              const transferLinesForRow = linesForTransfer(transfer.id);
              const sourceName = locationMap.get(transfer.sourceLocationId)?.name || t('transfers.source');
              const destName = locationMap.get(transfer.destinationLocationId)?.name || t('transfers.destination');
              const lineCount = transferLinesForRow.length || 0;

              const isActionableReceive =
                isApprovedAllowed &&
                (!receiveLocationId || transfer.destinationLocationId === receiveLocationId) &&
                (transfer.status === 'approved' ||
                  transfer.status === 'in_transit' ||
                  transfer.status === 'partially_received');
              const isActionableApprove = isApprovedAllowed && transfer.status === 'requested';

              const handleCardClick = () => {
                if (isActionableReceive) {
                  onOpenReceipt(transfer);
                } else if (isActionableApprove) {
                  onApprove(transfer);
                }
              };

              return (
                <div
                  key={transfer.id}
                  role={isActionableReceive || isActionableApprove ? 'button' : undefined}
                  tabIndex={isActionableReceive || isActionableApprove ? 0 : undefined}
                  onClick={handleCardClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick();
                    }
                  }}
                  className={`p-3.5 flex items-center justify-between gap-3 bg-stocky-bg-widget hover:bg-stocky-bg-global/30 active:bg-stocky-bg-global/50 transition-colors text-left ${
                    isActionableReceive || isActionableApprove ? 'cursor-pointer' : ''
                  }`}
                >
                  {/* Left Stack: Icon Badge + Reference & Route */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center shrink-0 text-stocky-primary">
                      <ArrowUpDownIcon size="xs" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stocky-text-main text-xs truncate leading-tight">
                         <bdi>#{transfer.id.slice(0, 8)}</bdi>
                        {transfer.note ? (
                          <span className="font-normal text-stocky-text-sub ml-1">· {transfer.note}</span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-stocky-text-sub truncate mt-0.5">
                         <bdi>{sourceName}</bdi> <ChevronRightIcon size="xs" className="inline-block align-middle rtl:rotate-180" /> <bdi>{destName}</bdi> · {lineCount === 1 ? t('transfers.itemCount', { count: lineCount }) : t('transfers.itemCountPlural', { count: lineCount })}
                      </p>
                    </div>
                  </div>

                  {/* Right Stack: Status & Action/Date */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`stocky-transfer-status text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusTone[transfer.status]}`}>
                      {statusLabels[transfer.status]}
                    </span>
                    {isActionableApprove ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove(transfer);
                        }}
                         className="stocky-transfer-action h-11 min-w-[44px] px-3 rounded-full stocky-status-info text-[10px] font-medium border shadow-none hover:brightness-95 transition-all cursor-pointer"
                      >
                         {t('common.approve')}
                      </button>
                    ) : isActionableReceive ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReceipt(transfer);
                        }}
                         className="stocky-transfer-action stocky-transfer-action--primary h-11 min-w-[44px] px-3 rounded-full text-[10px] font-medium shadow-none hover:bg-stocky-primary-hover transition-colors cursor-pointer"
                      >
                         {t('transfers.receiveTransfer')}
                      </button>
                    ) : (
                      <span className="text-[10px] text-stocky-text-sub">
                         {formatDate(transfer.requestedAt, locale)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination Footer */}
      <footer className="stocky-board-table__footer flex items-center justify-between border-t border-stocky-border-subtle p-3 text-[11px] text-stocky-text-sub">
        <div className="flex items-center gap-3">
          <span>
            {t('common.showing')} {firstRowNumber.toLocaleString()}–{lastRowNumber.toLocaleString()} {t('common.of')} {transfers.length.toLocaleString()} {t('transfers.title').toLowerCase()}
          </span>
          <span>
            {t('inventory.rowsPerPage')}{' '}
            <select
              aria-label={t('inventory.rowsPerPage')}
              value={pageSize}
              onChange={(event) => {
                onPageSizeChange(Number(event.target.value));
                onPageChange(0);
              }}
              className="stocky-table-page-size rounded border border-stocky-border-subtle bg-stocky-bg-widget px-1.5 py-0.5"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>
            {t('common.page')} {currentPage + 1} {t('common.of')} {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="stocky-table-page-button"
             aria-label={t('common.prevPage')}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
            disabled={currentPage >= pageCount - 1}
            className="stocky-table-page-button"
             aria-label={t('common.nextPage')}
          >
            ›
          </button>
        </div>
      </footer>
    </div>
  );
}
