'use client';

import React from 'react';
import { CheckCircleIcon, MailIcon, PlusIcon, WarehouseIcon, TruckIcon } from '@stocky/icons';
import type { CompanyUserRole, Location, Product, Supplier, SupplierRequest } from '@stocky/types';
import { SupplierEmailModal } from './SupplierEmailModal';

export interface SupplierRequestsTableWidgetProps {
  requests: SupplierRequest[];
  products: Product[];
  locations: Location[];
  suppliers: Supplier[];
  userRole: CompanyUserRole;
  onStatusChange: (request: SupplierRequest, status: SupplierRequest['status']) => void;
  onCreateRequest: () => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const statusOrder: SupplierRequest['status'][] = ['open', 'contacted', 'ordered', 'received', 'closed'];

const statusBadgeClasses: Record<SupplierRequest['status'], string> = {
  open: 'bg-stocky-status-warning-bg text-stocky-status-warning-fg border border-stocky-status-warning-border',
  contacted: 'bg-stocky-status-info-bg text-stocky-status-info-fg border border-stocky-status-info-border',
  ordered: 'bg-stocky-status-info-bg text-stocky-status-info-fg border border-stocky-status-info-border',
  received: 'bg-stocky-status-success-bg text-stocky-status-success-fg border border-stocky-status-success-border',
  closed: 'bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle',
  cancelled: 'bg-stocky-status-danger-bg text-stocky-status-danger-fg border border-stocky-status-danger-border',
};

export function SupplierRequestsTableWidget({
  requests,
  products,
  locations,
  suppliers,
  userRole,
  onStatusChange,
  onCreateRequest,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: SupplierRequestsTableWidgetProps) {
  const productMap = React.useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const locationMap = React.useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);
  const supplierMap = React.useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);
  const [emailRequest, setEmailRequest] = React.useState<SupplierRequest | null>(null);

  const pageCount = Math.max(1, Math.ceil(requests.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pagedRequests = requests.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const firstRowNumber = requests.length === 0 ? 0 : currentPage * pageSize + 1;
  const lastRowNumber = Math.min((currentPage + 1) * pageSize, requests.length);

  return (
    <div className="flex flex-col w-full">
      {pagedRequests.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <CheckCircleIcon size="md" className="mx-auto text-stocky-status-success-fg/70" />
          <h2 className="mt-3 text-sm font-medium text-stocky-text-main">No supplier requests</h2>
          <p className="mt-1 text-xs text-stocky-text-sub">
            Create a request when inventory is low or a batch needs replacement.
          </p>
          <button
            type="button"
            onClick={onCreateRequest}
            className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <PlusIcon size="xs" /> New request
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table (hidden on mobile) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full table-fixed text-left text-[11px] stocky-board-table">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[20%]" />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/60 text-[10px] uppercase tracking-wide text-stocky-text-sub h-11">
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">Product & Request</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">Location</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">Supplier</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">Status</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap align-middle">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle">
                {pagedRequests.map((request) => {
                  const product = productMap.get(request.productId);
                  const location = locationMap.get(request.locationId);
                  const supplier = request.supplierId ? supplierMap.get(request.supplierId) : null;
                  const currentStatusIndex = statusOrder.indexOf(request.status);
                  const nextStatus =
                    currentStatusIndex >= 0 && currentStatusIndex < statusOrder.length - 1
                      ? statusOrder[currentStatusIndex + 1]
                      : null;

                  return (
                    <tr key={request.id} className="align-middle hover:bg-stocky-bg-global/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-stocky-text-main text-xs">{product?.name || 'Product'}</p>
                        <p className="mt-0.5 text-[10px] text-stocky-text-sub capitalize">
                          Type: {request.requestType}
                          {request.quantityRequested ? ` · ${request.quantityRequested} units` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-stocky-text-main text-xs">
                        {location?.name || 'Location'}
                      </td>
                      <td className="px-4 py-3 text-stocky-text-main text-xs">
                        {supplier?.name || <span className="text-stocky-text-sub">Not recorded</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${
                            statusBadgeClasses[request.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEmailRequest(request)}
                            title="Email supplier"
                            className="h-8 w-8 rounded-full border border-stocky-border-subtle bg-white text-stocky-text-sub hover:border-stocky-primary hover:text-stocky-primary inline-flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Email supplier"
                          >
                            <MailIcon size="xs" />
                          </button>
                          {userRole !== 'staff' &&
                          request.status !== 'closed' &&
                          request.status !== 'cancelled' &&
                          nextStatus ? (
                            <button
                              type="button"
                              onClick={() => onStatusChange(request, nextStatus)}
                              className="h-8 rounded-full border border-stocky-border-subtle bg-white px-3 text-[11px] font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary cursor-pointer inline-flex items-center justify-center transition-colors"
                            >
                              Mark {nextStatus}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (sm:hidden) */}
          <div className="sm:hidden divide-y divide-stocky-border-subtle w-full">
            {pagedRequests.map((request) => {
              const product = productMap.get(request.productId);
              const location = locationMap.get(request.locationId);
              const supplier = request.supplierId ? supplierMap.get(request.supplierId) : null;
              const currentStatusIndex = statusOrder.indexOf(request.status);
              const nextStatus =
                currentStatusIndex >= 0 && currentStatusIndex < statusOrder.length - 1
                  ? statusOrder[currentStatusIndex + 1]
                  : null;

              return (
                <article key={request.id} className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-stocky-bg-global/30 transition-colors text-left">
                  {/* Left Anchor + Center Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stocky-border-subtle bg-stocky-bg-global text-stocky-text-sub">
                      <TruckIcon size="xs" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-stocky-text-main leading-tight truncate">
                        {product?.name || 'Product'}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-stocky-text-sub flex items-center gap-1.5 truncate">
                        <span className="truncate max-w-[100px]">{location?.name || 'Branch'}</span>
                        <span>·</span>
                        <span className="truncate max-w-[100px]">{supplier?.name || 'Supplier'}</span>
                        {request.quantityRequested ? (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-stocky-text-main">{request.quantityRequested} units</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  {/* Right Status & Action Stack */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                        statusBadgeClasses[request.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {request.status}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setEmailRequest(request)}
                        title="Email supplier"
                        className="h-6 w-6 rounded-full border border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-primary hover:border-stocky-primary inline-flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Email supplier"
                      >
                        <MailIcon size="xs" />
                      </button>
                      {userRole !== 'staff' &&
                      request.status !== 'closed' &&
                      request.status !== 'cancelled' &&
                      nextStatus ? (
                        <button
                          type="button"
                          onClick={() => onStatusChange(request, nextStatus)}
                          className="h-6 px-2 rounded-full border border-stocky-border-subtle bg-white text-[10px] font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary cursor-pointer transition-colors shadow-2xs"
                        >
                          → {nextStatus}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <footer className="stocky-board-table__footer flex flex-wrap items-center justify-between gap-3 border-t border-stocky-border-subtle p-3.5">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-stocky-text-sub">
              <span>
                Showing {firstRowNumber.toLocaleString()}–{lastRowNumber.toLocaleString()} of{' '}
                {requests.length.toLocaleString()} requests
              </span>
              <span>
                Rows per page{' '}
                <select
                  value={pageSize}
                  onChange={(event) => {
                    onPageSizeChange(Number(event.target.value));
                    onPageChange(0);
                  }}
                  className="stocky-table-page-size"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stocky-text-sub">
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
        </>
      )}

      {emailRequest && (
        <SupplierEmailModal
          isOpen={Boolean(emailRequest)}
          onClose={() => setEmailRequest(null)}
          request={emailRequest}
          product={productMap.get(emailRequest.productId)}
          supplier={emailRequest.supplierId ? supplierMap.get(emailRequest.supplierId) ?? null : null}
          location={locationMap.get(emailRequest.locationId)}
          onMarkContacted={(req) => onStatusChange(req, 'contacted')}
        />
      )}
    </div>
  );
}
