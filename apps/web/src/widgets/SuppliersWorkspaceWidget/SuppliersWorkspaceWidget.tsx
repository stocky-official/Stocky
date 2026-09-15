'use client';

import React, { useMemo, useState } from 'react';
import type {
  CompanyUserRole,
  Location,
  Product,
  Supplier,
  SupplierContact,
  SupplierProduct,
  SupplierRequest,
} from '@stocky/types';
import { CheckIcon, FilterIcon, TruckIcon, WarehouseIcon, XIcon } from '@stocky/icons';
import { SideDrawer, BottomSheet } from '@/components/ui';
import { exportSuppliersToExcel } from '@/lib/excel/export';
import { SupplierContactsDrawerWidget, type SupplierContactInput } from '../SupplierContactsDrawerWidget/SupplierContactsDrawerWidget';
import { SuppliersToolbarWidget } from './SuppliersToolbarWidget';
import { SuppliersFilterPanelWidget } from './SuppliersFilterPanelWidget';
import { SuppliersTableWidget } from './SuppliersTableWidget';
import { SupplierRequestsToolbarWidget, type SupplierRequestStatusFilter } from './SupplierRequestsToolbarWidget';
import { SupplierRequestsTableWidget } from './SupplierRequestsTableWidget';
import { SupplierCreateDrawerWidget } from './SupplierCreateDrawerWidget';
import { SupplierRequestDrawerWidget } from './SupplierRequestDrawerWidget';
import { SupplierProductLinkDrawerWidget } from './SupplierProductLinkDrawerWidget';

export interface SuppliersWorkspaceWidgetProps {
  requests: SupplierRequest[];
  products: Product[];
  locations: Location[];
  suppliers: Supplier[];
  supplierContacts: SupplierContact[];
  supplierProducts: SupplierProduct[];
  userRole: CompanyUserRole;
  selectedLocationId: string;
  defaultProductId?: string;
  canImport?: boolean;
  onImport?: () => void;
  onCreate: (input: {
    productId: string;
    locationId: string;
    supplierId?: string;
    requestType: 'replenish' | 'return' | 'replace';
    quantity?: number;
  }) => void;
  onCreateSupplier?: (input: {
    name: string;
    address?: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    imageUrl?: string;
  }) => Promise<unknown>;
  onCreateSupplierContact: (input: SupplierContactInput) => Promise<void>;
  onUpdateSupplierContact: (contact: SupplierContact, input: SupplierContactInput) => Promise<void>;
  onDeleteSupplierContact: (contact: SupplierContact) => Promise<void>;
  onSetPrimarySupplierContact: (contact: SupplierContact) => Promise<void>;
  onStatusChange: (request: SupplierRequest, status: SupplierRequest['status']) => void;
  onLinkProduct: (input: {
    supplierId: string;
    productId: string;
    supplierSku?: string;
    unitCost?: number;
  }) => Promise<void>;
  onUnlinkProduct: (supplierProductId: string) => Promise<void>;
  activeSupplierTab?: 'suppliers' | 'requests';
  onSupplierTabChange?: (tab: 'suppliers' | 'requests') => void;
}

export function SuppliersWorkspaceWidget({
  requests,
  products,
  locations,
  suppliers,
  supplierContacts,
  supplierProducts,
  userRole,
  selectedLocationId,
  defaultProductId,
  onCreate,
  onCreateSupplier,
  onCreateSupplierContact,
  onUpdateSupplierContact,
  onDeleteSupplierContact,
  onSetPrimarySupplierContact,
  onStatusChange,
  onLinkProduct,
  onUnlinkProduct,
  activeSupplierTab: controlledActiveTab,
  onSupplierTabChange,
  canImport = true,
  onImport,
}: SuppliersWorkspaceWidgetProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<'suppliers' | 'requests'>('suppliers');
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = (tab: 'suppliers' | 'requests') => {
    setInternalActiveTab(tab);
    onSupplierTabChange?.(tab);
  };

  // CSV Import handling for suppliers
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const nameIdx = headers.findIndex((h) => h.includes('name'));
      const addrIdx = headers.findIndex((h) => h.includes('address'));
      const contactIdx = headers.findIndex((h) => h.includes('contact') || h.includes('person'));
      const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));
      const emailIdx = headers.findIndex((h) => h.includes('email'));

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        const name = nameIdx !== -1 ? cols[nameIdx] : cols[0];
        if (!name) continue;
        const address = addrIdx !== -1 ? cols[addrIdx] : '';
        const contactName = contactIdx !== -1 ? cols[contactIdx] : name;
        const contactPhone = phoneIdx !== -1 ? cols[phoneIdx] : '';
        const contactEmail = emailIdx !== -1 ? cols[emailIdx] : '';
        if (onCreateSupplier) {
          await onCreateSupplier({
            name,
            address,
            contactName: contactName || name,
            contactPhone: contactPhone || 'N/A',
            contactEmail: contactEmail || undefined,
          });
        }
      }
    } catch (err) {
      console.error('Failed to parse supplier CSV', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Suppliers state
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
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
  const [suppliersPage, setSuppliersPage] = useState(0);
  const [suppliersPageSize, setSuppliersPageSize] = useState(25);

  // Requests state
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<SupplierRequestStatusFilter>('all');
  const [requestSupplierFilter, setRequestSupplierFilter] = useState<string>('all');
  const [requestLocationFilter, setRequestLocationFilter] = useState<string>('all');
  const [isRequestFilterDrawerOpen, setIsRequestFilterDrawerOpen] = useState(false);
  const [requestsPage, setRequestsPage] = useState(0);
  const [requestsPageSize, setRequestsPageSize] = useState(25);

  // Drawers state
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [contactSupplierId, setContactSupplierId] = useState<string | null>(null);
  const [linkSupplierId, setLinkSupplierId] = useState<string | null>(null);
  const [requestInitialSupplierId, setRequestInitialSupplierId] = useState<string | undefined>(undefined);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const canManageSuppliers = userRole === 'owner' || userRole === 'admin';

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    const query = supplierSearchQuery.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      if (filterProductId !== 'all') {
        const isLinked = supplierProducts.some(
          (sp) => sp.supplierId === supplier.id && sp.productId === filterProductId
        );
        if (!isLinked) return false;
      }

      if (filterOpenRequests !== 'all') {
        const hasOpen = requests.some(
          (r) => r.supplierId === supplier.id && !['closed', 'cancelled'].includes(r.status)
        );
        if (filterOpenRequests === 'has_requests' && !hasOpen) return false;
        if (filterOpenRequests === 'no_requests' && hasOpen) return false;
      }

      if (filterContactType !== 'all') {
        const contacts = supplierContacts.filter((c) => c.supplierId === supplier.id);
        if (filterContactType === 'has_phone') {
          const hasPhone = supplier.contactPhone || contacts.some((c) => Boolean(c.phone));
          if (!hasPhone) return false;
        }
        if (filterContactType === 'has_email') {
          const hasEmail = supplier.contactEmail || contacts.some((c) => Boolean(c.email));
          if (!hasEmail) return false;
        }
      }

      if (!query) return true;

      const matchesName = selectedColumns.name && supplier.name.toLowerCase().includes(query);
      const matchesAddress =
        selectedColumns.address && Boolean(supplier.address?.toLowerCase().includes(query));
      const matchesProducts =
        selectedColumns.products &&
        supplierProducts
          .filter((sp) => sp.supplierId === supplier.id)
          .some((sp) => productMap.get(sp.productId)?.name.toLowerCase().includes(query));
      const matchesContacts =
        selectedColumns.contacts &&
        (supplier.contactName?.toLowerCase().includes(query) ||
          supplier.contactPhone?.toLowerCase().includes(query) ||
          supplier.contactEmail?.toLowerCase().includes(query) ||
          supplierContacts
            .filter((c) => c.supplierId === supplier.id)
            .some(
              (c) =>
                c.name.toLowerCase().includes(query) ||
                c.phone.toLowerCase().includes(query) ||
                Boolean(c.email?.toLowerCase().includes(query))
            ));

      return matchesName || matchesAddress || matchesProducts || matchesContacts;
    });
  }, [
    filterContactType,
    filterOpenRequests,
    filterProductId,
    productMap,
    requests,
    selectedColumns,
    supplierContacts,
    supplierProducts,
    supplierSearchQuery,
    suppliers,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (!selectedColumns.name || !selectedColumns.address || !selectedColumns.products || !selectedColumns.contacts) count++;
    if (filterProductId !== 'all') count++;
    if (filterOpenRequests !== 'all') count++;
    if (filterContactType !== 'all') count++;
    return count;
  }, [filterContactType, filterOpenRequests, filterProductId, selectedColumns]);

  const handleResetFilters = () => {
    setSelectedColumns({ name: true, address: true, products: true, contacts: true });
    setFilterProductId('all');
    setFilterOpenRequests('all');
    setFilterContactType('all');
  };

  const activeRequestFilterCount = useMemo(() => {
    let count = 0;
    if (requestStatusFilter !== 'all') count++;
    if (requestSupplierFilter !== 'all') count++;
    if (requestLocationFilter !== 'all') count++;
    return count;
  }, [requestLocationFilter, requestStatusFilter, requestSupplierFilter]);

  const handleResetRequestFilters = () => {
    setRequestStatusFilter('all');
    setRequestSupplierFilter('all');
    setRequestLocationFilter('all');
  };

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    const query = requestSearchQuery.trim().toLowerCase();
    const locationFiltered = requests.filter(
      (r) => selectedLocationId === 'all' || r.locationId === selectedLocationId
    );

    return locationFiltered.filter((r) => {
      if (requestStatusFilter !== 'all' && r.status !== requestStatusFilter) {
        return false;
      }
      if (requestSupplierFilter !== 'all' && r.supplierId !== requestSupplierFilter) {
        return false;
      }
      if (requestLocationFilter !== 'all' && r.locationId !== requestLocationFilter) {
        return false;
      }
      if (!query) return true;

      const productName = productMap.get(r.productId)?.name.toLowerCase() || '';
      const supplierName = suppliers.find((s) => s.id === r.supplierId)?.name.toLowerCase() || '';
      const locationName = locations.find((l) => l.id === r.locationId)?.name.toLowerCase() || '';
      return (
        productName.includes(query) ||
        supplierName.includes(query) ||
        locationName.includes(query) ||
        r.requestType.toLowerCase().includes(query)
      );
    });
  }, [locations, productMap, requestLocationFilter, requestSearchQuery, requestStatusFilter, requestSupplierFilter, requests, selectedLocationId, suppliers]);

  const activeContactSupplier = useMemo(
    () => suppliers.find((s) => s.id === contactSupplierId) || null,
    [contactSupplierId, suppliers]
  );
  const activeLinkSupplier = useMemo(
    () => suppliers.find((s) => s.id === linkSupplierId) || null,
    [linkSupplierId, suppliers]
  );
  const activeSupplierContacts = useMemo(
    () => supplierContacts.filter((c) => c.supplierId === contactSupplierId),
    [contactSupplierId, supplierContacts]
  );

  const supplierFilterPanelElement = (isMobile = false) => (
    <SuppliersFilterPanelWidget
      className={isMobile ? 'flex-1 flex flex-col min-h-0 bg-white border-0 shadow-none rounded-none max-h-none' : undefined}
      isOpen={isFilterPanelOpen}
      onClose={() => setIsFilterPanelOpen(false)}
      products={products}
      selectedColumns={selectedColumns}
      onToggleColumn={(col) => setSelectedColumns((prev) => ({ ...prev, [col]: !prev[col] }))}
      onSelectAllColumns={() => setSelectedColumns({ name: true, address: true, products: true, contacts: true })}
      filterProductId={filterProductId}
      onFilterProductIdChange={(id) => {
        setFilterProductId(id);
        setSuppliersPage(0);
      }}
      filterOpenRequests={filterOpenRequests}
      onFilterOpenRequestsChange={(val) => {
        setFilterOpenRequests(val);
        setSuppliersPage(0);
      }}
      filterContactType={filterContactType}
      onFilterContactTypeChange={(val) => {
        setFilterContactType(val);
        setSuppliersPage(0);
      }}
      activeFilterCount={activeFilterCount}
      onResetAll={handleResetFilters}
      matchingCount={filteredSuppliers.length}
    />
  );

  return (
    <div className="stocky-suppliers-workspace flex flex-col gap-4">
      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" aria-hidden="true" />

      {/* Unified Table Workspace Card */}
      <div className="stocky-stock-unified-card rounded-2xl bg-white border border-stocky-border-subtle shadow-sm flex flex-col relative z-20 overflow-visible">
        {/* 1. Integrated Toolbar Header */}
        <div className="p-3 sm:p-3.5 border-b border-stocky-border-subtle relative z-30">
          {activeTab === 'suppliers' ? (
            <>
              <SuppliersToolbarWidget
                searchQuery={supplierSearchQuery}
                onSearchChange={(val) => {
                  setSupplierSearchQuery(val);
                  setSuppliersPage(0);
                }}
                filterPanelOpen={isFilterPanelOpen}
                onToggleFilterPanel={() => setIsFilterPanelOpen((prev) => !prev)}
                activeFilterCount={activeFilterCount}
                canManageSuppliers={canManageSuppliers}
                canImport={canImport}
                onImport={onImport || handleImportClick}
                onExport={() => exportSuppliersToExcel(filteredSuppliers)}
                onAddSupplier={() => setIsCreateSupplierOpen(true)}
              />

              {/* Floating Filter Panel (Desktop) */}
              <div className="hidden sm:block">
                {supplierFilterPanelElement(false)}
              </div>
            </>
          ) : (
            <SupplierRequestsToolbarWidget
              searchQuery={requestSearchQuery}
              onSearchChange={(val) => {
                setRequestSearchQuery(val);
                setRequestsPage(0);
              }}
              statusFilter={requestStatusFilter}
              onStatusFilterChange={(status) => {
                setRequestStatusFilter(status);
                setRequestsPage(0);
              }}
              onCreateRequest={() => {
                setRequestInitialSupplierId(undefined);
                setIsCreateRequestOpen(true);
              }}
              filterPanelOpen={isRequestFilterDrawerOpen}
              onToggleFilterPanel={() => setIsRequestFilterDrawerOpen((prev) => !prev)}
              isFilterActive={activeRequestFilterCount > 0}
              activeFilterCount={activeRequestFilterCount}
            />
          )}
        </div>

        {/* 2. Integrated Data / Table Body */}
        <div className="w-full">
          {activeTab === 'suppliers' ? (
            <SuppliersTableWidget
              suppliers={filteredSuppliers}
              supplierContacts={supplierContacts}
              supplierProducts={supplierProducts}
              requests={requests}
              productMap={productMap}
              userRole={userRole}
              onSelectSupplier={(supplier) => setContactSupplierId(supplier.id)}
              onRequestFromSupplier={(supplier) => {
                setRequestInitialSupplierId(supplier.id);
                setIsCreateRequestOpen(true);
              }}
              onLinkProductToSupplier={(supplier) => setLinkSupplierId(supplier.id)}
              onAddSupplier={() => setIsCreateSupplierOpen(true)}
              page={suppliersPage}
              pageSize={suppliersPageSize}
              onPageChange={setSuppliersPage}
              onPageSizeChange={setSuppliersPageSize}
            />
          ) : (
            <SupplierRequestsTableWidget
              requests={filteredRequests}
              products={products}
              locations={locations}
              suppliers={suppliers}
              userRole={userRole}
              onStatusChange={onStatusChange}
              onCreateRequest={() => {
                setRequestInitialSupplierId(undefined);
                setIsCreateRequestOpen(true);
              }}
              page={requestsPage}
              pageSize={requestsPageSize}
              onPageChange={setRequestsPage}
              onPageSizeChange={setRequestsPageSize}
            />
          )}
        </div>
      </div>

      {/* Mobile Suppliers Filter Bottom Sheet Drawer */}
      <div className="sm:hidden">
        <BottomSheet
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
          title="Supplier Filters"
          subtitle={`Showing ${filteredSuppliers.length} of ${suppliers.length} suppliers`}
        >
          <div className="flex h-full flex-col min-h-0 bg-white">
            {supplierFilterPanelElement(true)}
          </div>
        </BottomSheet>
      </div>

      {/* Requests Filter Drawer */}
      <SideDrawer
        isOpen={isRequestFilterDrawerOpen}
        onClose={() => setIsRequestFilterDrawerOpen(false)}
        ariaLabel="Filter requests"
        panelClassName="flex flex-col"
      >
        <div className="flex h-full flex-col min-h-0 bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stocky-border-subtle bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-stocky-primary/10 text-stocky-primary flex items-center justify-center shrink-0">
                <FilterIcon size="xs" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-stocky-text-main">Filter Requests</h2>
                  {activeRequestFilterCount > 0 && (
                    <span className="rounded-full bg-stocky-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                      {activeRequestFilterCount} active
                    </span>
                  )}
                </div>
                <p className="text-xs text-stocky-text-sub mt-0.5">Filter by request status, supplier, and destination</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsRequestFilterDrawerOpen(false)}
              aria-label="Close request filters"
              className="w-8 h-8 rounded-full flex items-center justify-center text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              <XIcon size="xs" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-stocky-text-main">Request Status</label>
                {requestStatusFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setRequestStatusFilter('all')}
                    className="text-[11px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'all', label: 'All requests' },
                    { id: 'open', label: 'Open' },
                    { id: 'contacted', label: 'Contacted' },
                    { id: 'ordered', label: 'Ordered' },
                    { id: 'received', label: 'Received' },
                    { id: 'closed', label: 'Closed' },
                  ] as const
                ).map((st) => {
                  const isChecked = requestStatusFilter === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setRequestStatusFilter(st.id)}
                      className={`h-8 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-stocky-primary/10 border-stocky-primary/40 text-stocky-primary font-semibold'
                          : 'bg-white border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-text-main'
                      }`}
                    >
                      {isChecked && <CheckIcon size="xs" />}
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5">
                  <TruckIcon size="xs" className="text-stocky-primary" />
                  Supplier
                </label>
                {requestSupplierFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setRequestSupplierFilter('all')}
                    className="text-[11px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={requestSupplierFilter}
                onChange={(e) => setRequestSupplierFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                <option value="all">All suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5">
                  <WarehouseIcon size="xs" className="text-stocky-primary" />
                  Destination Location
                </label>
                {requestLocationFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setRequestLocationFilter('all')}
                    className="text-[11px] text-stocky-text-sub hover:text-red-500 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={requestLocationFilter}
                onChange={(e) => setRequestLocationFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                <option value="all">All locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-5 py-3.5 border-t border-stocky-border-subtle bg-white flex items-center justify-between shrink-0">
            <span className="text-xs text-stocky-text-sub">
              Showing <strong className="font-semibold text-stocky-text-main">{filteredRequests.length}</strong> requests
            </span>
            <div className="flex items-center gap-2">
              {activeRequestFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetRequestFilters}
                  className="h-8 px-3 rounded-full text-xs font-medium text-stocky-text-sub hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsRequestFilterDrawerOpen(false)}
                className="h-8 px-5 rounded-full bg-stocky-text-main text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </SideDrawer>

      {/* Side Drawers */}
      <SupplierCreateDrawerWidget
        isOpen={isCreateSupplierOpen}
        onClose={() => setIsCreateSupplierOpen(false)}
        onCreateSupplier={onCreateSupplier}
      />

      <SupplierRequestDrawerWidget
        isOpen={isCreateRequestOpen}
        onClose={() => {
          setIsCreateRequestOpen(false);
          setRequestInitialSupplierId(undefined);
        }}
        products={products}
        locations={locations}
        suppliers={suppliers}
        defaultProductId={defaultProductId}
        defaultSupplierId={requestInitialSupplierId}
        selectedLocationId={selectedLocationId}
        onCreate={onCreate}
      />

      <SupplierProductLinkDrawerWidget
        isOpen={Boolean(linkSupplierId)}
        onClose={() => setLinkSupplierId(null)}
        supplier={activeLinkSupplier}
        products={products}
        supplierProducts={supplierProducts}
        onLinkProduct={onLinkProduct}
      />

      <SupplierContactsDrawerWidget
        supplier={activeContactSupplier}
        contacts={activeSupplierContacts}
        products={products}
        supplierProducts={supplierProducts}
        canManage={canManageSuppliers}
        onClose={() => setContactSupplierId(null)}
        onCreate={onCreateSupplierContact}
        onUpdate={onUpdateSupplierContact}
        onDelete={onDeleteSupplierContact}
        onSetPrimary={onSetPrimarySupplierContact}
        onLinkProduct={onLinkProduct}
        onUnlinkProduct={onUnlinkProduct}
      />
    </div>
  );
}
