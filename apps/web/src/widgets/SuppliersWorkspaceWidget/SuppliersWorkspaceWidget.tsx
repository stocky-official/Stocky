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
}: SuppliersWorkspaceWidgetProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<'suppliers' | 'requests'>('suppliers');
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = (tab: 'suppliers' | 'requests') => {
    setInternalActiveTab(tab);
    onSupplierTabChange?.(tab);
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
  }, [locations, productMap, requestSearchQuery, requestStatusFilter, requests, selectedLocationId, suppliers]);

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

  return (
    <div className="stocky-suppliers-workspace flex flex-col gap-4">
      {/* Mobile-only tab switcher */}
      <div className="flex md:hidden items-center gap-1.5 p-1 rounded-full bg-stocky-bg-subtle border border-stocky-border-subtle w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`h-8 px-4 rounded-full text-xs font-medium transition-colors ${
            activeTab === 'suppliers'
              ? 'bg-white text-stocky-text-main shadow-xs font-semibold'
              : 'text-stocky-text-sub hover:text-stocky-text-main'
          }`}
        >
          Suppliers
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`h-8 px-4 rounded-full text-xs font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-white text-stocky-text-main shadow-xs font-semibold'
              : 'text-stocky-text-sub hover:text-stocky-text-main'
          }`}
        >
          Requests
        </button>
      </div>

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
                onExport={() => exportSuppliersToExcel(filteredSuppliers)}
                onAddSupplier={() => setIsCreateSupplierOpen(true)}
              />

              {/* Floating Filter Panel */}
              <SuppliersFilterPanelWidget
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
