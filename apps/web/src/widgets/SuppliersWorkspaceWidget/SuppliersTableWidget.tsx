'use client';

import React from 'react';
import { PlusIcon } from '@stocky/icons';
import type { CompanyUserRole, Supplier, SupplierContact, SupplierProduct, SupplierRequest } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();
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
          <h3 className="mt-3 text-sm font-medium text-stocky-text-main">{t('suppliers.noMatchingSuppliers')}</h3>
          <p className="mt-1 text-xs text-stocky-text-sub">
            {t('suppliers.noMatchingSuppliersDesc')}
          </p>
          {canManage && (
            <button
              type="button"
              onClick={onAddSupplier}
              className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <PlusIcon size="xs" /> {t('suppliers.addSupplierBtn')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. Desktop Table (hidden on mobile) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[780px] table-fixed text-start text-[11px] stocky-board-table">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[24%]" />
                <col className="w-[22%]" />
                <col className="w-[20%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/60 text-[10px] uppercase tracking-wide text-stocky-text-sub h-11">
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">{t('suppliers.colSupplier')}</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">{t('suppliers.colAddress')}</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">{t('suppliers.colProducts')}</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap align-middle">{t('suppliers.colContacts')}</th>
                  <th className="px-4 py-3 text-end font-medium whitespace-nowrap align-middle">{t('suppliers.colActions')}</th>
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
                            <p className="font-semibold text-stocky-text-main text-xs truncate">
                              {supplier.name}
                            </p>
                              <p className="text-[10px] text-stocky-text-sub truncate">
                                {supplier.contactName || t('suppliers.noContactSpecified')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-stocky-text-main truncate max-w-[200px]">
                            {supplier.address || <span className="text-stocky-text-sub italic">{t('suppliers.notRecorded')}</span>}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-stocky-text-main">
                            {linked.length === 1
                              ? t('suppliers.linkedProducts', { count: linked.length })
                              : t('suppliers.linkedProductsPlural', { count: linked.length })}
                          </p>
                          <p className="text-[10px] text-stocky-text-sub truncate max-w-[180px]">
                            {linkedNames.slice(0, 2).join(', ') || t('suppliers.noCatalogItems')}
                            {linkedNames.length > 2 ? ` +${linkedNames.length - 2}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-stocky-text-main truncate max-w-[160px]">
                            {primary?.phone || primary?.email || t('suppliers.noPrimaryDetails')}
                          </p>
                          <p className="text-[10px] text-stocky-text-sub truncate max-w-[160px]">
                            {supplier.contactPhone ||
                              supplier.contactEmail ||
                              primary?.phone ||
                              (contacts.length === 1
                                ? t('suppliers.savedContacts', { count: contacts.length })
                                : t('suppliers.savedContactsPlural', { count: contacts.length }))}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onRequestFromSupplier(supplier)}
                              className="h-8 rounded-full border stocky-status-info px-3 text-[11px] font-medium cursor-pointer inline-flex items-center justify-center transition-colors"
                            >
                              {t('suppliers.requestAction')}
                            </button>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => onLinkProductToSupplier(supplier)}
                                className="h-8 rounded-full border border-stocky-border-subtle bg-white px-3 text-[11px] font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary cursor-pointer inline-flex items-center justify-center transition-colors"
                              >
                                {t('suppliers.productAction')}
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

          {/* 2. Mobile Card List (sm:hidden) */}
          <div className="sm:hidden divide-y divide-stocky-border-subtle w-full">
            {pagedSuppliers.map((supplier) => {
              const linked = supplierProducts.filter((link) => link.supplierId === supplier.id);
              const supplierRequests = requests.filter((r) => r.supplierId === supplier.id);
              const openRequests = supplierRequests.filter(
                (r) => !['closed', 'cancelled'].includes(r.status)
              ).length;
              const contacts = supplierContactsMap.get(supplier.id) || [];
              const primary = contacts.find((contact) => contact.isPrimary) || contacts[0];
              const contactSnippet = primary?.name || supplier.contactName || (contacts.length > 0 ? `${contacts.length} contacts` : null);

              return (
                <article
                  key={supplier.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectSupplier(supplier)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectSupplier(supplier);
                    }
                  }}
                  className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-stocky-bg-global/30 active:bg-stocky-bg-global/60 transition-colors cursor-pointer text-start"
                >
                  {/* Left Anchor + Center Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-stocky-text-sub select-none font-medium">
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
                      <h4 className="text-xs font-semibold text-stocky-text-main leading-tight truncate">
                        {supplier.name}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-stocky-text-sub flex items-center gap-1.5 truncate">
                        <span className="truncate max-w-[130px]">{supplier.address || t('suppliers.noAddress')}</span>
                        {contactSnippet && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[100px]">{contactSnippet}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right Metric & Requests Stack */}
                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                    <span className="text-xs font-semibold text-stocky-text-main">
                      {linked.length === 1
                        ? t('suppliers.linkedProducts', { count: linked.length })
                        : t('suppliers.linkedProductsPlural', { count: linked.length })}
                    </span>
                    <span className={`text-[10px] font-medium mt-0.5 ${openRequests > 0 ? 'text-stocky-text-warning' : 'text-stocky-text-sub'}`}>
                      {openRequests > 0
                        ? t('suppliers.openReqCount', { count: openRequests })
                        : t('suppliers.noOpenReq')}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <footer className="stocky-board-table__footer flex flex-wrap items-center justify-between gap-3 border-t border-stocky-border-subtle p-3.5">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-stocky-text-sub">
              <span>
                {t('suppliers.showingSuppliers', {
                  from: firstRowNumber.toLocaleString(),
                  to: lastRowNumber.toLocaleString(),
                  total: suppliers.length.toLocaleString(),
                })}
              </span>
              <span>
                {t('suppliers.rowsPerPage')}{' '}
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
                {t('suppliers.pageOf', { page: currentPage + 1, pages: pageCount })}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="stocky-table-page-button"
                aria-label={t('suppliers.prevPage')}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
                disabled={currentPage >= pageCount - 1}
                className="stocky-table-page-button"
                aria-label={t('suppliers.nextPage')}
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
