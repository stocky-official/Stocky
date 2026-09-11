'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDownIcon, CheckCircleIcon, FilterIcon, PlusIcon, SearchIcon, XIcon } from '@stocky/icons';
import type { CompanyUserRole, Location, Product, Supplier, SupplierContact, SupplierProduct, SupplierRequest } from '@stocky/types';
import { SupplierContactsDrawerWidget, type SupplierContactInput } from '../SupplierContactsDrawerWidget/SupplierContactsDrawerWidget';
import { exportSuppliersToExcel } from '@/lib/excel/export';

export interface SupplierRequestsWidgetProps {
  requests: SupplierRequest[];
  products: Product[];
  locations: Location[];
  suppliers: Supplier[];
  supplierContacts: SupplierContact[];
  supplierProducts: SupplierProduct[];
  userRole: CompanyUserRole;
  selectedLocationId: string;
  defaultProductId?: string;
  onCreate: (input: { productId: string; locationId: string; supplierId?: string; requestType: 'replenish' | 'return' | 'replace'; quantity?: number }) => void;
  onCreateSupplier?: (input: { name: string; address?: string; contactName: string; contactPhone: string; contactEmail?: string }) => Promise<unknown>;
  onCreateSupplierContact: (input: SupplierContactInput) => Promise<void>;
  onUpdateSupplierContact: (contact: SupplierContact, input: SupplierContactInput) => Promise<void>;
  onDeleteSupplierContact: (contact: SupplierContact) => Promise<void>;
  onSetPrimarySupplierContact: (contact: SupplierContact) => Promise<void>;
  onStatusChange: (request: SupplierRequest, status: SupplierRequest['status']) => void;
  onLinkProduct: (input: { supplierId: string; productId: string; supplierSku?: string; unitCost?: number }) => Promise<void>;
  onUnlinkProduct: (supplierProductId: string) => Promise<void>;
}

const statusOrder: SupplierRequest['status'][] = ['open', 'contacted', 'ordered', 'received', 'closed'];

const supplierPhoneCountries = [
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' }
] as const;

export function SupplierRequestsWidget({ requests, products, locations, suppliers, supplierContacts, supplierProducts, userRole, selectedLocationId, defaultProductId, onCreate, onCreateSupplier, onCreateSupplierContact, onUpdateSupplierContact, onDeleteSupplierContact, onSetPrimarySupplierContact, onStatusChange, onLinkProduct, onUnlinkProduct }: SupplierRequestsWidgetProps) {
  const [activeSupplierTab, setActiveSupplierTab] = useState<'suppliers' | 'requests'>('suppliers');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierContactName, setSupplierContactName] = useState('');
  const [supplierPhoneCountryCode, setSupplierPhoneCountryCode] = useState('+20');
  const [supplierPhoneNumber, setSupplierPhoneNumber] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierSaving, setSupplierSaving] = useState(false);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [contactSupplierId, setContactSupplierId] = useState<string | null>(null);
  const [productId, setProductId] = useState(defaultProductId || '');
  const [locationId, setLocationId] = useState(selectedLocationId === 'all' ? locations[0]?.id || '' : selectedLocationId);
  const [supplierId, setSupplierId] = useState('');
  const [linkSupplierId, setLinkSupplierId] = useState('');
  const [linkProductId, setLinkProductId] = useState('');
  const [linkSupplierSku, setLinkSupplierSku] = useState('');
  const [linkUnitCost, setLinkUnitCost] = useState('');
  const [requestType, setRequestType] = useState<'replenish' | 'return' | 'replace'>('replenish');
  const [quantity, setQuantity] = useState('');

  // Floating Column Filter Panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Record<'name' | 'address' | 'products' | 'contacts', boolean>>({
    name: true,
    address: true,
    products: true,
    contacts: true,
  });
  const [filterProductId, setFilterProductId] = useState<string>('all');
  const [filterOpenRequests, setFilterOpenRequests] = useState<'all' | 'has_requests' | 'no_requests'>('all');
  const [filterContactType, setFilterContactType] = useState<'all' | 'has_phone' | 'has_email'>('all');
  const filterPanelRef = React.useRef<HTMLDivElement>(null);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (!selectedColumns.name || !selectedColumns.address || !selectedColumns.products || !selectedColumns.contacts) {
      count += 1;
    }
    if (filterProductId !== 'all') count += 1;
    if (filterOpenRequests !== 'all') count += 1;
    if (filterContactType !== 'all') count += 1;
    return count;
  }, [selectedColumns, filterProductId, filterOpenRequests, filterContactType]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setIsFilterPanelOpen(false);
      }
    };
    if (isFilterPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterPanelOpen]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const locationMap = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations]);
  const supplierMap = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers]);
  const supplierContactsMap = useMemo(() => {
    const map = new Map<string, SupplierContact[]>();
    supplierContacts.forEach((contact) => map.set(contact.supplierId, [...(map.get(contact.supplierId) || []), contact]));
    return map;
  }, [supplierContacts]);

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearchQuery.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      // 1. Column specific filters
      if (filterProductId !== 'all') {
        const hasLinkedProduct = supplierProducts.some(
          (link) => link.supplierId === supplier.id && link.productId === filterProductId
        );
        const prod = productMap.get(filterProductId);
        const hasNamedProduct = prod && supplier.itemsSupplied?.some((item) => item.toLowerCase() === prod.name.toLowerCase());
        if (!hasLinkedProduct && !hasNamedProduct) return false;
      }

      if (filterOpenRequests !== 'all') {
        const supplierReqs = requests.filter((r) => r.supplierId === supplier.id);
        const openReqs = supplierReqs.filter((r) => !['closed', 'cancelled'].includes(r.status)).length;
        if (filterOpenRequests === 'has_requests' && openReqs === 0) return false;
        if (filterOpenRequests === 'no_requests' && openReqs > 0) return false;
      }

      if (filterContactType !== 'all') {
        const contacts = supplierContactsMap.get(supplier.id) || [];
        const hasPhone = Boolean(supplier.contactPhone || contacts.some((c) => Boolean(c.phone)));
        const hasEmail = Boolean(supplier.contactEmail || contacts.some((c) => Boolean(c.email)));
        if (filterContactType === 'has_phone' && !hasPhone) return false;
        if (filterContactType === 'has_email' && !hasEmail) return false;
      }

      // 2. Search query with selected search columns
      if (query) {
        const searchMatches: boolean[] = [];

        if (selectedColumns.name) {
          searchMatches.push(Boolean(supplier.name?.toLowerCase().includes(query)));
        }
        if (selectedColumns.address) {
          searchMatches.push(Boolean(supplier.address?.toLowerCase().includes(query)));
        }
        if (selectedColumns.products) {
          const linkedProductNames = supplierProducts
            .filter((link) => link.supplierId === supplier.id)
            .map((link) => productMap.get(link.productId)?.name || '');
          const productValues = [...(supplier.itemsSupplied || []), ...linkedProductNames];
          searchMatches.push(productValues.some((v) => v.toLowerCase().includes(query)));
        }
        if (selectedColumns.contacts) {
          const contacts = supplierContactsMap.get(supplier.id) || [];
          const contactValues = [
            supplier.contactName,
            supplier.contactPhone,
            supplier.contactEmail,
            ...contacts.flatMap((c) => [c.name, c.role, c.phone, c.email]),
          ];
          searchMatches.push(contactValues.some((v) => v?.toLowerCase().includes(query)));
        }

        const anySelected = selectedColumns.name || selectedColumns.address || selectedColumns.products || selectedColumns.contacts;
        if (anySelected && !searchMatches.some(Boolean)) {
          return false;
        }
      }

      return true;
    });
  }, [
    filterContactType,
    filterOpenRequests,
    filterProductId,
    productMap,
    requests,
    selectedColumns,
    supplierContactsMap,
    supplierProducts,
    supplierSearchQuery,
    suppliers,
  ]);
  const contactSupplier = contactSupplierId ? supplierMap.get(contactSupplierId) || null : null;
  const contactSupplierContacts = useMemo(() => {
    if (!contactSupplier) return [];
    const savedContacts = supplierContactsMap.get(contactSupplier.id) || [];
    if (savedContacts.length || !contactSupplier.contactName) return savedContacts;
    return [{
      id: `legacy-${contactSupplier.id}`,
      companyId: contactSupplier.companyId,
      supplierId: contactSupplier.id,
      name: contactSupplier.contactName,
      role: 'Primary contact',
      phone: contactSupplier.contactPhone,
      email: contactSupplier.contactEmail,
      isPrimary: true,
      createdAt: contactSupplier.createdAt,
      updatedAt: contactSupplier.updatedAt,
    }];
  }, [contactSupplier, supplierContactsMap]);
  const scoped = requests.filter((request) => selectedLocationId === 'all' || request.locationId === selectedLocationId);
  React.useEffect(() => {
    if (!defaultProductId) return;
    setProductId(defaultProductId);
    const product = products.find((candidate) => candidate.id === defaultProductId);
    if (product?.defaultSupplierId) setSupplierId(product.defaultSupplierId);
    setActiveSupplierTab('requests');
    setShowForm(true);
  }, [defaultProductId, products]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId || !locationId) return;
    onCreate({ productId, locationId, supplierId: supplierId || undefined, requestType, quantity: quantity ? Number(quantity) : undefined });
    setShowForm(false); setProductId(''); setQuantity('');
  };
  const submitProductLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!linkSupplierId || !linkProductId) return;
    try {
      await onLinkProduct({ supplierId: linkSupplierId, productId: linkProductId, supplierSku: linkSupplierSku.trim() || undefined, unitCost: linkUnitCost ? Number(linkUnitCost) : undefined });
    } catch (error: any) {
      window.alert(error?.message || 'The product could not be linked.');
      return;
    }
    setShowProductForm(false); setLinkProductId(''); setLinkSupplierSku(''); setLinkUnitCost('');
  };
  const resetSupplierForm = () => {
    setSupplierName('');
    setSupplierAddress('');
    setSupplierContactName('');
    setSupplierPhoneCountryCode('+20');
    setSupplierPhoneNumber('');
    setSupplierEmail('');
    setSupplierError(null);
  };
  const saveSupplier = async () => {
    const phoneNumber = supplierPhoneNumber.trim();
    if (!onCreateSupplier || !supplierName.trim() || !supplierContactName.trim() || !phoneNumber) {
      setSupplierError('Supplier name, contact person, and phone number are required.');
      return;
    }
    setSupplierSaving(true);
    setSupplierError(null);
    try {
      await onCreateSupplier({ name: supplierName.trim(), address: supplierAddress.trim() || undefined, contactName: supplierContactName.trim(), contactPhone: `${supplierPhoneCountryCode} ${phoneNumber}`, contactEmail: supplierEmail.trim() || undefined });
      resetSupplierForm();
      setShowSupplierForm(false);
    } catch (error: any) {
      setSupplierError(error?.message || 'Could not add this supplier.');
    } finally {
      setSupplierSaving(false);
    }
  };
  const submitSupplier = (event: React.FormEvent) => {
    event.preventDefault();
    void saveSupplier();
  };
  const canManageSuppliers = userRole === 'owner' || userRole === 'admin';

  return <div className="stocky-suppliers-workspace flex flex-col gap-4">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <nav className="stocky-context-tabs" aria-label="Supplier views">
        <div className="stocky-context-tabs__list">
          <button type="button" onClick={() => setActiveSupplierTab('suppliers')} aria-current={activeSupplierTab === 'suppliers' ? 'page' : undefined} className={`stocky-context-tabs__item ${activeSupplierTab === 'suppliers' ? 'stocky-context-tabs__item--active' : ''}`}>Suppliers</button>
          <button type="button" onClick={() => setActiveSupplierTab('requests')} aria-current={activeSupplierTab === 'requests' ? 'page' : undefined} className={`stocky-context-tabs__item ${activeSupplierTab === 'requests' ? 'stocky-context-tabs__item--active' : ''}`}>Requests</button>
        </div>
      </nav>
      {activeSupplierTab === 'requests' && <button type="button" onClick={() => setShowForm((value) => !value)} className="h-9 rounded-full bg-stocky-primary px-3 text-xs font-medium text-white cursor-pointer inline-flex items-center gap-1.5"><PlusIcon size="xs" />New request</button>}
    </div>

    {activeSupplierTab === 'suppliers' && <>
      <section className="stocky-stock-filterbar stocky-suppliers-filterbar">
        <div className="stocky-stock-table-toolbar stocky-suppliers-toolbar">
          <div className="relative min-w-0 flex-1" ref={filterPanelRef}>
            <div className="stocky-split-search-field">
              <div className="stocky-split-search-field__input-wrap">
                <SearchIcon size="xs" className="pointer-events-none text-stocky-text-sub shrink-0" />
                <input
                  type="text"
                  value={supplierSearchQuery}
                  onChange={(event) => setSupplierSearchQuery(event.target.value)}
                  placeholder="Search suppliers, addresses, products, or contacts..."
                  aria-label="Search suppliers"
                  className="stocky-split-search-field__input"
                />
                {supplierSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSupplierSearchQuery('')}
                    aria-label="Clear supplier search"
                    className="text-stocky-text-sub hover:text-stocky-text-main cursor-pointer shrink-0"
                  >
                    <XIcon size="xs" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen((open) => !open)}
                aria-label="Filter columns"
                aria-expanded={isFilterPanelOpen}
                className={`stocky-split-search-field__filter-btn ${isFilterPanelOpen || activeFilterCount > 0 ? 'stocky-split-search-field__filter-btn--active' : ''}`}
                title="Filter by column"
              >
                <FilterIcon size="xs" />
                {activeFilterCount > 0 && (
                  <span className="stocky-split-search-field__badge">{activeFilterCount}</span>
                )}
              </button>
            </div>

            {isFilterPanelOpen && (
              <div className="stocky-column-filter-panel" role="dialog" aria-label="Supplier column filters">
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-stocky-border-subtle bg-white px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FilterIcon size="xs" className="text-stocky-primary" />
                    <h3 className="text-xs font-semibold text-stocky-text-main">Column Filters</h3>
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-stocky-primary/10 px-2 py-0.5 text-[10px] font-semibold text-stocky-primary">
                        {activeFilterCount} active
                      </span>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedColumns({ name: true, address: true, products: true, contacts: true });
                        setFilterProductId('all');
                        setFilterOpenRequests('all');
                        setFilterContactType('all');
                      }}
                      className="text-[11px] font-medium text-stocky-primary hover:underline cursor-pointer"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                <div className="stocky-column-filter-panel__body space-y-3">
                  {/* Columns Selection / Search Scope */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Search In Columns</span>
                      <button
                        type="button"
                        onClick={() => setSelectedColumns({ name: true, address: true, products: true, contacts: true })}
                        className="text-[10px] text-stocky-text-sub hover:text-stocky-primary cursor-pointer"
                      >
                        Select all
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                        <input
                          type="checkbox"
                          checked={selectedColumns.name}
                          onChange={(e) => setSelectedColumns((prev) => ({ ...prev, name: e.target.checked }))}
                          className="accent-stocky-primary rounded"
                        />
                        <span className="truncate">Name</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                        <input
                          type="checkbox"
                          checked={selectedColumns.address}
                          onChange={(e) => setSelectedColumns((prev) => ({ ...prev, address: e.target.checked }))}
                          className="accent-stocky-primary rounded"
                        />
                        <span className="truncate">Address</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                        <input
                          type="checkbox"
                          checked={selectedColumns.products}
                          onChange={(e) => setSelectedColumns((prev) => ({ ...prev, products: e.target.checked }))}
                          className="accent-stocky-primary rounded"
                        />
                        <span className="truncate">Products</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                        <input
                          type="checkbox"
                          checked={selectedColumns.contacts}
                          onChange={(e) => setSelectedColumns((prev) => ({ ...prev, contacts: e.target.checked }))}
                          className="accent-stocky-primary rounded"
                        />
                        <span className="truncate">Contacts</span>
                      </label>
                    </div>
                  </div>

                  {/* Column Specific Dropdown Filters */}
                  <div className="space-y-2 border-t border-stocky-border-subtle pt-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Filter By Column Values</span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="block text-xs font-medium text-stocky-text-main">
                        Products Supplied
                        <select
                          value={filterProductId}
                          onChange={(e) => setFilterProductId(e.target.value)}
                          className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        >
                          <option value="all">All products ({products.length})</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-xs font-medium text-stocky-text-main">
                        Open Requests
                        <select
                          value={filterOpenRequests}
                          onChange={(e) => setFilterOpenRequests(e.target.value as any)}
                          className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        >
                          <option value="all">All statuses</option>
                          <option value="has_requests">Has open requests</option>
                          <option value="no_requests">No open requests</option>
                        </select>
                      </label>

                      <label className="block text-xs font-medium text-stocky-text-main sm:col-span-2">
                        Contacts Information
                        <select
                          value={filterContactType}
                          onChange={(e) => setFilterContactType(e.target.value as any)}
                          className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        >
                          <option value="all">Any contact details</option>
                          <option value="has_phone">Has phone number</option>
                          <option value="has_email">Has email address</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between border-t border-stocky-border-subtle bg-stocky-bg-global px-4 py-2">
                  <span className="text-[11px] font-medium text-stocky-text-sub">
                    {filteredSuppliers.length} supplier{filteredSuppliers.length === 1 ? '' : 's'} matching
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFilterPanelOpen(false)}
                    className="h-7 rounded-full bg-stocky-primary px-3 text-xs font-medium text-white hover:bg-stocky-primary-hover cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
          {canManageSuppliers && <div className="stocky-stock-table-toolbar__actions">
            <button type="button" onClick={() => exportSuppliersToExcel(filteredSuppliers)} className="stocky-table-toolbar-button inline-flex items-center justify-center gap-1.5 px-3 text-xs cursor-pointer"><ArrowDownIcon size="xs" /><span>Export</span></button>
            <button type="button" onClick={() => { setSupplierError(null); setShowSupplierForm(true); }} className="stocky-table-toolbar-button stocky-table-toolbar-button--primary inline-flex items-center justify-center gap-1.5 px-3 text-xs font-medium cursor-pointer"><PlusIcon size="xs" /><span>Add supplier</span></button>
          </div>}
        </div>
      </section>
      {showProductForm && userRole !== 'staff' && <form onSubmit={submitProductLink} className="grid grid-cols-1 gap-3 rounded-2xl border border-stocky-border-subtle bg-white p-4 md:grid-cols-2 xl:grid-cols-5"><label className="text-xs font-medium text-stocky-text-main">Supplier<select required value={linkSupplierId} onChange={(event) => setLinkSupplierId(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-stocky-border-subtle px-2 text-xs"><option value="">Choose</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><label className="text-xs font-medium text-stocky-text-main">Product<select required value={linkProductId} onChange={(event) => setLinkProductId(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-stocky-border-subtle px-2 text-xs"><option value="">Choose</option>{products.filter((product) => !supplierProducts.some((link) => link.supplierId === linkSupplierId && link.productId === product.id)).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label className="text-xs font-medium text-stocky-text-main">Supplier SKU<input value={linkSupplierSku} onChange={(event) => setLinkSupplierSku(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-stocky-border-subtle px-2 text-xs" placeholder="Optional" /></label><label className="text-xs font-medium text-stocky-text-main">Unit cost<input type="number" min="0" step="0.01" value={linkUnitCost} onChange={(event) => setLinkUnitCost(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-stocky-border-subtle px-2 text-xs" placeholder="Optional" /></label><div className="flex items-end gap-2"><button type="button" onClick={() => setShowProductForm(false)} className="h-9 rounded-lg border border-stocky-border-subtle px-3 text-xs cursor-pointer">Cancel</button><button type="submit" className="h-9 rounded-lg bg-stocky-primary px-3 text-xs font-medium text-white cursor-pointer">Save product</button></div></form>}
      <form onSubmit={submitSupplier}>
        <section className="overflow-hidden rounded-2xl border border-stocky-border-subtle bg-white">
          <div className="flex flex-col gap-1 border-b border-stocky-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-medium text-stocky-text-main">Supplier directory</h2><p className="mt-1 text-xs text-stocky-text-sub">{supplierSearchQuery.trim() || activeFilterCount > 0 ? `${filteredSuppliers.length} of ${suppliers.length}` : suppliers.length} supplier{(supplierSearchQuery.trim() || activeFilterCount > 0 ? filteredSuppliers.length : suppliers.length) === 1 ? '' : 's'} · Select a supplier to view its contacts.</p></div></div>
          <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed text-left text-[11px]">
                <thead className="border-b border-stocky-border-subtle bg-stocky-bg-global/60 text-[10px] uppercase tracking-wide text-stocky-text-sub"><tr><th className="w-[21%] px-4 py-2.5 font-medium">Supplier</th><th className="w-[26%] px-4 py-2.5 font-medium">Address</th><th className="w-[22%] px-4 py-2.5 font-medium">Products</th><th className="w-[21%] px-4 py-2.5 font-medium">Contacts</th><th className="w-[10%] px-4 py-2.5 text-left font-medium">Actions</th></tr></thead>
                <tbody className="divide-y divide-stocky-border-subtle">
                  {showSupplierForm && canManageSuppliers && <tr className="bg-stocky-bg-global/30 align-top"><td className="px-4 py-3"><input required autoFocus value={supplierName} onChange={(event) => setSupplierName(event.target.value)} placeholder="Supplier name" className="h-9 w-full rounded-lg border border-stocky-border-subtle bg-white px-2.5 text-xs focus:border-stocky-primary focus:outline-none" /></td><td className="px-4 py-3"><input value={supplierAddress} onChange={(event) => setSupplierAddress(event.target.value)} placeholder="Address" className="h-9 w-full rounded-lg border border-stocky-border-subtle bg-white px-2.5 text-xs focus:border-stocky-primary focus:outline-none" /></td><td className="px-4 py-3 text-stocky-text-sub">Add products after saving</td><td className="px-4 py-3"><div className="space-y-1.5"><input required value={supplierContactName} onChange={(event) => setSupplierContactName(event.target.value)} placeholder="Contact person" className="h-8 w-full rounded-lg border border-stocky-border-subtle bg-white px-2.5 text-[11px] focus:border-stocky-primary focus:outline-none" /><div className="flex gap-1"><select value={supplierPhoneCountryCode} onChange={(event) => setSupplierPhoneCountryCode(event.target.value)} aria-label="Country calling code" className="h-8 w-20 shrink-0 rounded-lg border border-stocky-border-subtle bg-white px-1 text-[10px] focus:border-stocky-primary focus:outline-none">{supplierPhoneCountries.map((country) => <option key={country.code} value={country.code}>{country.flag} {country.code}</option>)}</select><input required type="tel" inputMode="tel" value={supplierPhoneNumber} onChange={(event) => setSupplierPhoneNumber(event.target.value)} placeholder="Phone number" aria-label="Phone number" className="h-8 min-w-0 flex-1 rounded-lg border border-stocky-border-subtle bg-white px-2 text-[11px] focus:border-stocky-primary focus:outline-none" /></div><input type="email" value={supplierEmail} onChange={(event) => setSupplierEmail(event.target.value)} placeholder="Email (optional)" className="h-8 w-full rounded-lg border border-stocky-border-subtle bg-white px-2 text-[11px] focus:border-stocky-primary focus:outline-none" /></div></td><td className="px-4 py-3"><div className="flex justify-start gap-1.5"><button type="button" onClick={() => { resetSupplierForm(); setShowSupplierForm(false); }} disabled={supplierSaving} className="h-8 rounded-full border border-stocky-border-subtle bg-white px-2.5 text-[11px] text-stocky-text-main cursor-pointer disabled:opacity-50">Cancel</button><button type="submit" disabled={supplierSaving} className="h-8 rounded-full bg-stocky-primary px-2.5 text-[11px] font-medium text-white cursor-pointer disabled:opacity-50">{supplierSaving ? 'Saving…' : 'Save'}</button></div></td></tr>}
                  {supplierError && showSupplierForm && <tr><td colSpan={5} className="px-4 pb-3"><p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{supplierError}</p></td></tr>}
                  {filteredSuppliers.map((supplier) => { const linked = supplierProducts.filter((link) => link.supplierId === supplier.id); const supplierRequests = requests.filter((request) => request.supplierId === supplier.id); const openRequests = supplierRequests.filter((request) => !['closed', 'cancelled'].includes(request.status)).length; const contacts = supplierContactsMap.get(supplier.id) || []; const primary = contacts.find((contact) => contact.isPrimary) || contacts[0]; const linkedNames = linked.map((link) => productMap.get(link.productId)?.name).filter(Boolean) as string[]; const contactNames = contacts.map((contact) => contact.name); return <tr key={supplier.id} tabIndex={0} onClick={() => setContactSupplierId(supplier.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setContactSupplierId(supplier.id); }} className="cursor-pointer align-middle hover:bg-stocky-bg-global/30 focus:bg-stocky-bg-global/30 focus:outline-none"><td className="px-4 py-3"><p className="font-medium text-stocky-text-main">{supplier.name}</p><p className="mt-1 text-[10px] text-stocky-text-sub">{openRequests} open request{openRequests === 1 ? '' : 's'}</p></td><td className="px-4 py-3 text-stocky-text-sub"><span className="line-clamp-2">{supplier.address || 'Not recorded'}</span></td><td className="px-4 py-3"><p className="line-clamp-2 text-stocky-text-main">{linkedNames.length ? linkedNames.slice(0, 2).join(', ') : supplier.itemsSupplied?.slice(0, 2).join(', ') || 'Not recorded'}{(linkedNames.length > 2 || (supplier.itemsSupplied?.length || 0) > 2) && <span className="text-stocky-text-sub"> · +{Math.max(linkedNames.length, supplier.itemsSupplied?.length || 0) - 2}</span>}</p><p className="mt-1 text-[10px] text-stocky-text-sub">{linked.length || supplier.itemCount || supplier.itemsSupplied?.length || 0} linked</p></td><td className="px-4 py-3"><p className="line-clamp-2 text-stocky-text-main">{contactNames.length ? contactNames.slice(0, 2).join(', ') : primary?.name || supplier.contactName || 'Not recorded'}{contactNames.length > 2 && <span className="text-stocky-text-sub"> · +{contactNames.length - 2}</span>}</p><p className="mt-1 truncate text-[10px] text-stocky-text-sub">{primary?.email || supplier.contactEmail || primary?.phone || supplier.contactPhone || `${contacts.length || 0} saved contact${contacts.length === 1 ? '' : 's'}`}</p></td><td className="px-4 py-3"><div className="flex justify-start gap-1.5"><button type="button" onClick={(event) => { event.stopPropagation(); setSupplierId(supplier.id); setActiveSupplierTab('requests'); setShowForm(true); }} className="h-8 rounded-full border stocky-status-info px-2.5 text-[11px] font-medium cursor-pointer">Request</button>{userRole !== 'staff' && <button type="button" onClick={(event) => { event.stopPropagation(); setLinkSupplierId(supplier.id); setShowProductForm(true); }} className="h-8 rounded-full border border-stocky-border-subtle px-2.5 text-[11px] cursor-pointer">Product</button>}</div></td></tr>; })}
                  {filteredSuppliers.length === 0 && !showSupplierForm && <tr><td colSpan={5} className="px-6 py-14 text-center"><PlusIcon size="md" className="mx-auto text-stocky-text-sub/50" /><h3 className="mt-3 text-sm font-medium text-stocky-text-main">{supplierSearchQuery.trim() || activeFilterCount > 0 ? 'No matching suppliers' : 'No suppliers yet'}</h3><p className="mt-1 text-xs text-stocky-text-sub">{supplierSearchQuery.trim() || activeFilterCount > 0 ? 'Try different search terms or reset your column filters.' : 'Click Add supplier to create the first row.'}</p></td></tr>}
                </tbody>
              </table>
          </div>
        </section>
      </form>
    </>}

    {activeSupplierTab === 'requests' && <>
      {showForm && <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-2xl border border-stocky-border-subtle bg-white p-4 md:grid-cols-2 xl:grid-cols-5"><label className="text-xs font-medium text-stocky-text-main">Product<select required value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-stocky-border-subtle px-2 text-xs"><option value="">Choose</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label className="text-xs font-medium text-stocky-text-main">Location<select required value={locationId} onChange={(event) => setLocationId(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-stocky-border-subtle px-2 text-xs"><option value="">Choose</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label><label className="text-xs font-medium text-stocky-text-main">Type<select value={requestType} onChange={(event) => setRequestType(event.target.value as typeof requestType)} className="mt-1.5 h-9 w-full rounded-lg border border-stocky-border-subtle px-2 text-xs"><option value="replenish">Replenish</option><option value="return">Return</option><option value="replace">Replace</option></select></label><label className="text-xs font-medium text-stocky-text-main">Supplier<select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-stocky-border-subtle px-2 text-xs"><option value="">Not recorded</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><label className="text-xs font-medium text-stocky-text-main">Quantity<input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-stocky-border-subtle px-2 text-xs" /></label><div className="flex items-end justify-end gap-2 md:col-span-2 xl:col-span-5"><button type="button" onClick={() => setShowForm(false)} className="h-9 rounded-full border border-stocky-border-subtle px-3 text-xs cursor-pointer">Cancel</button><button type="submit" className="h-9 rounded-full bg-stocky-primary px-3 text-xs font-medium text-white cursor-pointer">Create request</button></div></form>}
      <section className="overflow-hidden rounded-2xl border border-stocky-border-subtle bg-white">{scoped.length === 0 ? <div className="px-6 py-16 text-center"><CheckCircleIcon size="md" className="mx-auto text-emerald-600/60" /><h2 className="mt-3 text-sm font-medium text-stocky-text-main">No supplier work open</h2><p className="mt-1 text-xs text-stocky-text-sub">Create a request when stock is low or a batch needs replacement.</p></div> : <div className="divide-y divide-stocky-border-subtle">{scoped.map((request) => { const product = productMap.get(request.productId); const location = locationMap.get(request.locationId); const supplier = request.supplierId ? supplierMap.get(request.supplierId) : null; const next = statusOrder[Math.min(statusOrder.indexOf(request.status) + 1, statusOrder.length - 1)]; return <div key={request.id} className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-stocky-text-main">{product?.name || 'Product'} <span className="font-normal text-stocky-text-sub">· {request.requestType}</span></p><p className="mt-1 text-xs text-stocky-text-sub">{location?.name || 'Location'} · {supplier?.name || 'Supplier not recorded'}{request.quantityRequested ? ` · ${request.quantityRequested} units` : ''}</p></div><span className="self-start rounded-full bg-slate-100 px-2.5 py-1 text-[11px] capitalize text-slate-700 lg:self-auto">{request.status}</span>{userRole !== 'staff' && request.status !== 'closed' && request.status !== 'cancelled' && <button type="button" onClick={() => onStatusChange(request, next)} className="h-8 rounded-full border border-stocky-border-subtle px-3 text-xs cursor-pointer">Mark {next}</button>}</div>; })}</div>}</section>
    </>}
    <SupplierContactsDrawerWidget supplier={contactSupplier} contacts={contactSupplierContacts} products={products} supplierProducts={supplierProducts} canManage={canManageSuppliers} onClose={() => setContactSupplierId(null)} onCreate={onCreateSupplierContact} onUpdate={onUpdateSupplierContact} onDelete={onDeleteSupplierContact} onSetPrimary={onSetPrimarySupplierContact} onLinkProduct={onLinkProduct} onUnlinkProduct={onUnlinkProduct} />
  </div>;
}
