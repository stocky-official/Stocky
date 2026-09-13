'use client';

import React from 'react';
import { PlusIcon } from '@stocky/icons';
import type { CompanyUserRole, Supplier, SupplierContact, SupplierProduct, SupplierRequest } from '@stocky/types';

export interface SuppliersTableWidgetProps {
  suppliers: Supplier[];
  supplierContacts: SupplierContact[];
  supplierProducts: SupplierProduct[];
  requests: SupplierRequest[];
  productMap: Map<string, { id: string; name: string }>;
  userRole: CompanyUserRole;
  onSelectSupplier: (supplier: Supplier) => void;
  onRequestFromSupplier: (supplier: Supplier) => void;
  onLinkProductToSupplier: (supplier: Supplier) => void;
  onAddSupplier: () => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function SuppliersTableWidget({
  suppliers,
  supplierContacts,
  supplierProducts,
  requests,
  productMap,
  userRole,
  onSelectSupplier,
  onRequestFromSupplier,
  onLinkProductToSupplier,
  onAddSupplier,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: SuppliersTableWidgetProps) {
  const canManage = userRole === 'owner' || userRole === 'admin';
  const pageCount = Math.max(1, Math.ceil(suppliers.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pagedSuppliers = suppliers.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const firstRowNumber = suppliers.length === 0 ? 0 : currentPage * pageSize + 1;
  const lastRowNumber = Math.min((currentPage + 1) * pageSize, suppliers.length);

  const supplierContactsMap = React.useMemo(() => {
    const map = new Map<string, SupplierContact[]>();
    for (const contact of supplierContacts) {
      const list = map.get(contact.supplierId) || [];
      list.push(contact);
      map.set(contact.supplierId, list);
    }
    return map;
  }, [supplierContacts]);

  return (
    <div className="flex flex-col w-full">
      {pagedSuppliers.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <PlusIcon size="md" className="mx-auto text-stocky-text-sub/50" />
          <h3 className="mt-3 text-sm font-medium text-stocky-text-main">No matching suppliers</h3>
          <p className="mt-1 text-xs text-stocky-text-sub">
            Try adjusting your search terms or column filters.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={onAddSupplier}
              className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <PlusIcon size="xs" /> Add supplier
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-[11px] stocky-board-table">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[24%]" />
                <col className="w-[22%]" />
                <col className="w-[20%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/60 text-[10px] uppercase tracking-wide text-stocky-text-sub h-11">
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">Supplier</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">Address</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">Products</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">Contacts</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle">
                {pagedSuppliers.map((supplier) => {
                  const linked = supplierProducts.filter((link) => link.supplierId === supplier.id);
                  const supplierRequests = requests.filter((r) => r.supplierId === supplier.id);
                  const openRequests = supplierRequests.filter(
                    (r) => !['closed', 'cancelled'].includes(r.status)
                  ).length;
                  const contacts = supplierContactsMap.get(supplier.id) || [];
                  const primary = contacts.find((contact) => contact.isPrimary) || contacts[0];
                  const linkedNames = linked
                    .map((link) => productMap.get(link.productId)?.name)
                    .filter(Boolean) as string[];
                  const contactNames = contacts.map((contact) => contact.name);

                  return (
                    <tr
                      key={supplier.id}
                      tabIndex={0}
                      onClick={() => onSelectSupplier(supplier)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          onSelectSupplier(supplier);
                        }
                      }}
                      className="cursor-pointer align-middle hover:bg-stocky-bg-global/30 focus:bg-stocky-bg-global/30 focus:outline-none transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-stocky-text-sub select-none font-medium">
                            {supplier.imageUrl ? (
                              <img
                                src={supplier.imageUrl}
                                alt={supplier.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-[11px] font-semibold text-stocky-text-main uppercase tracking-wider">
                                {supplier.name.slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-stocky-text-main text-xs truncate" title={supplier.name}>
                              {supplier.name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-stocky-text-sub">
                              {openRequests} open request{openRequests === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stocky-text-sub">
                        <span className="line-clamp-2">{supplier.address || 'Not recorded'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="line-clamp-2 text-stocky-text-main text-xs">
                          {linkedNames.length
                            ? linkedNames.slice(0, 2).join(', ')
                            : supplier.itemsSupplied?.slice(0, 2).join(', ') || 'Not recorded'}
                          {(linkedNames.length > 2 || (supplier.itemsSupplied?.length || 0) > 2) && (
                            <span className="text-stocky-text-sub">
                              {' '}
                              · +{Math.max(linkedNames.length, supplier.itemsSupplied?.length || 0) - 2}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[10px] text-stocky-text-sub">
                          {linked.length || supplier.itemCount || supplier.itemsSupplied?.length || 0} linked
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="line-clamp-2 text-stocky-text-main text-xs">
                          {contactNames.length
                            ? contactNames.slice(0, 2).join(', ')
                            : primary?.name || supplier.contactName || 'Not recorded'}
                          {contactNames.length > 2 && (
                            <span className="text-stocky-text-sub"> · +{contactNames.length - 2}</span>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-stocky-text-sub">
                          {primary?.email ||
                            supplier.contactEmail ||
                            primary?.phone ||
                            supplier.contactPhone ||
                            `${contacts.length || 0} saved contact${contacts.length === 1 ? '' : 's'}`}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onRequestFromSupplier(supplier)}
                            className="h-8 rounded-full border stocky-status-info px-3 text-[11px] font-medium cursor-pointer inline-flex items-center justify-center transition-colors"
                          >
                            Request
                          </button>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => onLinkProductToSupplier(supplier)}
                              className="h-8 rounded-full border border-stocky-border-subtle bg-white px-3 text-[11px] font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary cursor-pointer inline-flex items-center justify-center transition-colors"
                            >
                              Product
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <footer className="stocky-board-table__footer flex flex-wrap items-center justify-between gap-3 border-t border-stocky-border-subtle p-3.5">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-stocky-text-sub">
              <span>
                Showing {firstRowNumber.toLocaleString()}–{lastRowNumber.toLocaleString()} of{' '}
                {suppliers.length.toLocaleString()} suppliers
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
    </div>
  );
}
