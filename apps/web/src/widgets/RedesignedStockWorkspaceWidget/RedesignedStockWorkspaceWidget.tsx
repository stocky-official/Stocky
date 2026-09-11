'use client';

import React, { useMemo, useState } from 'react';
import { BoxesIcon, CheckCircleIcon, ChevronRightIcon, CloudDownloadIcon, CloudUploadIcon, FilterIcon, PlusIcon, SearchIcon, XIcon } from '@stocky/icons';
import type { CompanyUserRole, CreateStockTaskCommand, Location, Product, StockLot, StockTask, StockTaskItem, StockTaskType, Supplier } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { StockInventoryTableWidget, type StockInventoryTableRow } from '../StockInventoryTableWidget/StockInventoryTableWidget';
import { StockTaskAssignmentWidget } from '../StockTaskAssignmentWidget/StockTaskAssignmentWidget';
import { StockImportModalWidget } from '../StockImportModalWidget/StockImportModalWidget';
import { StockProductLotsWidget } from '../StockProductLotsWidget/StockProductLotsWidget';
import type { StockLotUpdateInput } from '../StockLotEditDrawerWidget/StockLotEditDrawerWidget';

interface StockRow extends StockInventoryTableRow {
  product: Product;
  lots: StockLot[];
  totalQuantity: number;
  earliestExpiry: StockLot | null;
  hasAttention: boolean;
}

export interface RedesignedStockWorkspaceWidgetProps {
  companyId: string;
  products: Product[];
  lots: StockLot[];
  locations: Location[];
  suppliers: Supplier[];
  selectedLocationId: string;
  userRole: CompanyUserRole;
  searchQuery?: string;
  onReceive: (productId?: string) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  onSaveLot?: (lot: StockLot, input: StockLotUpdateInput) => Promise<void>;
  onDeleteLot?: (lot: StockLot) => void | Promise<void>;
  onExpiry: () => void;
  onTransfer: (productId?: string) => void;
  onSupplierRequest: (productId?: string) => void;
  onExport?: () => void;
  onImportSuccess?: () => void;
  members?: Array<{ id: string; email: string; full_name?: string | null; role: CompanyUserRole; status?: string }>;
  assignments?: Array<{ user_id: string; location_id: string }>;
  tasks?: StockTask[];
  taskItems?: StockTaskItem[];
  canManageTasks?: boolean;
  onCreateTask?: (input: CreateStockTaskCommand) => Promise<void>;
}

function getLotState(lot: StockLot) {
  if (lot.quantityOnHand <= 0 || lot.status === 'depleted') return { label: 'Out of stock', tone: 'slate' };
  if (lot.status === 'on_hold') return { label: 'On hold', tone: 'purple' };
  if (!lot.expiryDate) return { label: 'No expiry date', tone: 'red' };

  const days = Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: 'Expired', tone: 'red' };
  if (days <= (lot.expiryNotificationDays ?? 0)) return { label: `${days}d left`, tone: 'amber' };
  return { label: `${days}d left`, tone: 'green' };
}

export function RedesignedStockWorkspaceWidget({
  companyId,
  products = [],
  lots = [],
  locations = [],
  suppliers = [],
  selectedLocationId = 'all',
  userRole,
  searchQuery: externalSearchQuery = '',
  onReceive,
  onEditProduct,
  onDeleteProduct,
  onSaveLot,
  onDeleteLot,
  onExpiry,
  onTransfer,
  onSupplierRequest,
  onExport,
  onImportSuccess,
  members = [],
  assignments = [],
  tasks = [],
  taskItems = [],
  canManageTasks = false,
  onCreateTask,
}: RedesignedStockWorkspaceWidgetProps) {
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<StockRow | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [taskType, setTaskType] = useState<StockTaskType>('count');
  const [taskAssignmentOpen, setTaskAssignmentOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const isStaff = userRole === 'staff';
  const canChooseLocation = userRole === 'owner' || userRole === 'admin';
  const isCompanyView = canChooseLocation && selectedLocationId === 'all';
  const isManagerView = userRole === 'manager';
  const isTableView = isCompanyView || isManagerView;
  const canImport = userRole !== 'staff';

  // Floating Column Filter Panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Record<'product' | 'barcode' | 'category' | 'location' | 'supplier', boolean>>({
    product: true,
    barcode: true,
    category: true,
    location: true,
    supplier: true,
  });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLocationId, setFilterLocationId] = useState<string>('all');
  const [filterStockLevel, setFilterStockLevel] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [filterExpiryStatus, setFilterExpiryStatus] = useState<'all' | 'healthy' | 'warning' | 'expired' | 'missing'>('all');
  const [filterSupplierId, setFilterSupplierId] = useState<string>('all');
  const [filterAuditStatus, setFilterAuditStatus] = useState<'all' | 'audited' | 'unaudited'>('all');
  const filterPanelRef = React.useRef<HTMLDivElement>(null);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (!selectedColumns.product || !selectedColumns.barcode || !selectedColumns.category || !selectedColumns.location || !selectedColumns.supplier) {
      count += 1;
    }
    if (filterCategory !== 'all') count += 1;
    if (filterLocationId !== 'all') count += 1;
    if (filterStockLevel !== 'all') count += 1;
    if (filterExpiryStatus !== 'all') count += 1;
    if (filterSupplierId !== 'all') count += 1;
    if (filterAuditStatus !== 'all') count += 1;
    return count;
  }, [selectedColumns, filterCategory, filterLocationId, filterStockLevel, filterExpiryStatus, filterSupplierId, filterAuditStatus]);

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

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName?.trim()) set.add(p.categoryName.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  React.useEffect(() => {
    setSelectedProductIds([]);
  }, [selectedLocationId]);

  React.useEffect(() => {
    setSearch(externalSearchQuery);
  }, [externalSearchQuery]);

  const locationNames = useMemo(
    () => new Map((locations || []).map((location) => [location.id, location.name])),
    [locations]
  );
  const supplierNames = useMemo(
    () => new Map((suppliers || []).map((supplier) => [supplier.id, supplier.name])),
    [suppliers]
  );

  const lastAuditByProduct = useMemo(() => {
    const latest: Record<string, string | null> = {};
    tasks.filter((task) => task.status === 'approved' && (selectedLocationId === 'all' || task.locationId === selectedLocationId)).forEach((task) => {
      taskItems.filter((item) => item.taskId === task.id).forEach((item) => {
        if (!latest[item.productId] || new Date(task.reviewedAt || task.updatedAt).getTime() > new Date(latest[item.productId] as string).getTime()) latest[item.productId] = task.reviewedAt || task.updatedAt;
      });
    });
    return latest;
  }, [selectedLocationId, taskItems, tasks]);

  const rows = useMemo<StockRow[]>(() => {
    const normalized = search.trim().toLowerCase();
    const safeProducts = products || [];
    const safeLots = lots || [];
    return safeProducts
      .map((product) => {
        const productLots = safeLots
          .filter((lot) => lot.productId === product.id)
          .filter((lot) => (filterLocationId !== 'all' ? lot.locationId === filterLocationId : (selectedLocationId === 'all' || lot.locationId === selectedLocationId)))
          .filter((lot) => (filterSupplierId !== 'all' ? (lot.supplierId === filterSupplierId || product.defaultSupplierId === filterSupplierId) : true));
        const totalQuantity = productLots.reduce((sum, lot) => sum + (Number(lot.quantityOnHand) || 0), 0);
        const earliestExpiry = productLots
          .filter((lot) => Number(lot.quantityOnHand) > 0 && lot.expiryDate)
          .sort((a, b) => new Date(a.expiryDate as string).getTime() - new Date(b.expiryDate as string).getTime())[0] ?? null;
        const hasAttention = productLots.some((lot) => {
          const state = getLotState(lot);
          return state.tone === 'red' || state.tone === 'amber' || totalQuantity <= (product.reorderPoint ?? 0);
        });
        return { product, lots: productLots, totalQuantity, earliestExpiry, hasAttention };
      })
      .filter((row) => {
        if (filterCategory !== 'all' && (row.product.categoryName || 'General') !== filterCategory) return false;
        if (filterStockLevel === 'in_stock' && row.totalQuantity <= 0) return false;
        if (filterStockLevel === 'out_of_stock' && row.totalQuantity > 0) return false;
        if (filterStockLevel === 'low_stock') {
          const reorder = row.product.reorderPoint ?? 0;
          if (row.totalQuantity <= 0 || row.totalQuantity > reorder) return false;
        }
        if (filterExpiryStatus !== 'all') {
          if (filterExpiryStatus === 'missing' && row.earliestExpiry !== null) return false;
          if (filterExpiryStatus !== 'missing') {
            if (!row.earliestExpiry) return false;
            const state = getLotState(row.earliestExpiry);
            if (filterExpiryStatus === 'expired' && state.label !== 'Expired') return false;
            if (filterExpiryStatus === 'warning' && state.tone !== 'amber') return false;
            if (filterExpiryStatus === 'healthy' && state.tone !== 'green') return false;
          }
        }
        if (filterAuditStatus !== 'all') {
          const hasAudit = Boolean(lastAuditByProduct[row.product.id]);
          if (filterAuditStatus === 'audited' && !hasAudit) return false;
          if (filterAuditStatus === 'unaudited' && hasAudit) return false;
        }
        if (filterSupplierId !== 'all' && row.lots.length === 0 && row.product.defaultSupplierId !== filterSupplierId) {
          return false;
        }
        return true;
      })
      .filter((row) => row.lots.length > 0 || !normalized || activeFilterCount > 0)
      .filter((row) => {
        if (!normalized) return true;
        const matches: boolean[] = [];
        if (selectedColumns.product) matches.push(row.product.name.toLowerCase().includes(normalized));
        if (selectedColumns.barcode) matches.push(Boolean(row.product.barcode?.toLowerCase().includes(normalized)));
        if (selectedColumns.category) matches.push(Boolean(row.product.categoryName?.toLowerCase().includes(normalized)));
        if (selectedColumns.location) matches.push(row.lots.some((lot) => locationNames.get(lot.locationId)?.toLowerCase().includes(normalized)));
        if (selectedColumns.supplier) {
          matches.push(
            row.lots.some((lot) => lot.supplierId && supplierNames.get(lot.supplierId)?.toLowerCase().includes(normalized)) ||
            Boolean(row.product.defaultSupplierId && supplierNames.get(row.product.defaultSupplierId)?.toLowerCase().includes(normalized))
          );
        }
        const anySelected = selectedColumns.product || selectedColumns.barcode || selectedColumns.category || selectedColumns.location || selectedColumns.supplier;
        return anySelected ? matches.some(Boolean) : true;
      })
      .sort((a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''));
  }, [activeFilterCount, filterAuditStatus, filterCategory, filterExpiryStatus, filterLocationId, filterStockLevel, filterSupplierId, lastAuditByProduct, locationNames, lots, products, search, selectedColumns, selectedLocationId, supplierNames]);

  const selectedRow = rows.find((row) => row.product.id === selectedProductId) || null;

  React.useEffect(() => {
    if (selectedRow) setDetailRow(selectedRow);
  }, [selectedRow]);

  React.useEffect(() => {
    if (selectedProductId && !rows.some((row) => row.product.id === selectedProductId)) {
      setSelectedProductId(null);
      setDetailRow(null);
    }
  }, [rows, selectedProductId]);

  const closeLotsDrawer = () => {
    setSelectedProductId(null);
    setDetailRow(null);
  };

  const renderLotsDrawer = () => (
    <SideDrawer isOpen={Boolean(detailRow)} onClose={closeLotsDrawer} ariaLabel={detailRow ? `${detailRow.product.name} lots and batches` : 'Lots and batches'} panelClassName="stocky-stock-lots-drawer">
      {detailRow && <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-stocky-border-subtle px-4 py-4 md:px-5">
          <div className="min-w-0"><p className="stocky-page-eyebrow">Product lots</p><h2 className="mt-1 truncate text-lg font-medium text-stocky-text-main">{detailRow.product.name}</h2><p className="mt-1 truncate text-xs text-stocky-text-sub">{detailRow.product.categoryName || 'General'} · {detailRow.product.barcode || 'No barcode'}</p></div>
          <button type="button" onClick={closeLotsDrawer} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global cursor-pointer" aria-label="Close lots drawer"><XIcon size="xs" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-3 md:p-4"><StockProductLotsWidget product={detailRow.product} lots={detailRow.lots} locations={locations} suppliers={suppliers} onSaveLot={isStaff ? undefined : onSaveLot} onDeleteLot={isStaff ? undefined : onDeleteLot} /></div>
      </div>}
    </SideDrawer>
  );

  const mobileStockList = (
    <div className="stocky-mobile-stock-list">
      {rows.length === 0 ? <div className="stocky-mobile-stock-empty"><BoxesIcon size="md" className="text-stocky-text-sub/50" /><p>No stock matches this search.</p><button type="button" onClick={() => onReceive()} className="stocky-table-toolbar-button stocky-table-toolbar-button--primary"><PlusIcon size="xs" /> Add stock</button></div> : rows.map((row) => {
        const state = row.earliestExpiry ? getLotState(row.earliestExpiry) : { label: 'No expiry date', tone: 'red' };
        const isSelected = selectedProductIds.includes(row.product.id);
        return <div key={row.product.id} role="button" tabIndex={0} onClick={() => setSelectedProductId(row.product.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedProductId(row.product.id); } }} className={`stocky-mobile-stock-row ${isSelected ? 'stocky-mobile-stock-row--selected' : ''}`}>
          {canManageTasks && <input type="checkbox" checked={isSelected} onClick={(event) => event.stopPropagation()} onChange={() => setSelectedProductIds((current) => current.includes(row.product.id) ? current.filter((id) => id !== row.product.id) : [...current, row.product.id])} aria-label={`Select ${row.product.name}`} className="stocky-mobile-stock-row__checkbox" />}
          <span className="stocky-mobile-stock-row__body"><strong>{row.product.name}</strong><small>{row.product.categoryName || 'General'} · <span className="stocky-mobile-stock-row__barcode">{row.product.barcode || 'No barcode'}</span></small></span>
          <span className="stocky-mobile-stock-row__summary"><strong>{row.totalQuantity.toLocaleString()}</strong><small className={state.tone === 'red' ? 'stocky-text-critical' : state.tone === 'amber' ? 'stocky-text-warning' : 'stocky-text-success'}>{state.label}</small></span>
          <span className="stocky-mobile-stock-row__actions"><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedProductId(row.product.id); }} className="stocky-mobile-stock-row__open">View lots <ChevronRightIcon size="xs" /></button><button type="button" onClick={(event) => { event.stopPropagation(); onReceive(row.product.id); }} className="stocky-mobile-stock-row__receive"><PlusIcon size="xs" /> Add stock</button></span>
        </div>;
      })}
    </div>
  );

  const openTaskAssignment = (type: StockTaskType, productIds = selectedProductIds) => {
    if (!canManageTasks || !onCreateTask) return;
    setTaskType(type);
    setSelectedProductIds(productIds);
    setTaskAssignmentOpen(true);
  };
  const stockToolbarContent = (
    <div className="stocky-stock-table-toolbar">
      <div className="relative min-w-0 flex-1" ref={filterPanelRef}>
        <div className="stocky-split-search-field">
          <div className="stocky-split-search-field__input-wrap">
            <SearchIcon size="xs" className="pointer-events-none text-stocky-text-sub shrink-0" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product or barcode..."
              aria-label="Search stock"
              className="stocky-split-search-field__input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-stocky-text-sub hover:text-stocky-text-main cursor-pointer shrink-0"
                aria-label="Clear search"
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
          <div className="stocky-column-filter-panel" role="dialog" aria-label="Stock column filters">
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
                    setSelectedColumns({ product: true, barcode: true, category: true, location: true, supplier: true });
                    setFilterCategory('all');
                    setFilterLocationId('all');
                    setFilterStockLevel('all');
                    setFilterExpiryStatus('all');
                    setFilterSupplierId('all');
                    setFilterAuditStatus('all');
                  }}
                  className="text-[11px] font-medium text-stocky-primary hover:underline cursor-pointer"
                >
                  Reset all
                </button>
              )}
            </div>

            <div className="stocky-column-filter-panel__body space-y-3">
              {/* Search In Columns */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Search In Columns</span>
                  <button
                    type="button"
                    onClick={() => setSelectedColumns({ product: true, barcode: true, category: true, location: true, supplier: true })}
                    className="text-[10px] text-stocky-text-sub hover:text-stocky-primary cursor-pointer"
                  >
                    Select all
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                    <input
                      type="checkbox"
                      checked={selectedColumns.product}
                      onChange={(e) => setSelectedColumns((prev) => ({ ...prev, product: e.target.checked }))}
                      className="accent-stocky-primary rounded"
                    />
                    <span className="truncate">Product</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                    <input
                      type="checkbox"
                      checked={selectedColumns.barcode}
                      onChange={(e) => setSelectedColumns((prev) => ({ ...prev, barcode: e.target.checked }))}
                      className="accent-stocky-primary rounded"
                    />
                    <span className="truncate">Barcode</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                    <input
                      type="checkbox"
                      checked={selectedColumns.category}
                      onChange={(e) => setSelectedColumns((prev) => ({ ...prev, category: e.target.checked }))}
                      className="accent-stocky-primary rounded"
                    />
                    <span className="truncate">Category</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                    <input
                      type="checkbox"
                      checked={selectedColumns.location}
                      onChange={(e) => setSelectedColumns((prev) => ({ ...prev, location: e.target.checked }))}
                      className="accent-stocky-primary rounded"
                    />
                    <span className="truncate">Location</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                    <input
                      type="checkbox"
                      checked={selectedColumns.supplier}
                      onChange={(e) => setSelectedColumns((prev) => ({ ...prev, supplier: e.target.checked }))}
                      className="accent-stocky-primary rounded"
                    />
                    <span className="truncate">Supplier</span>
                  </label>
                </div>
              </div>

              {/* Column Value Filters */}
              <div className="space-y-2 border-t border-stocky-border-subtle pt-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Filter By Column Values</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Category */}
                  <label className="block text-xs font-medium text-stocky-text-main">
                    Category
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                    >
                      <option value="all">All categories ({categories.length})</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Location */}
                  {selectedLocationId === 'all' && (
                    <label className="block text-xs font-medium text-stocky-text-main">
                      Location
                      <select
                        value={filterLocationId}
                        onChange={(e) => setFilterLocationId(e.target.value)}
                        className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                      >
                        <option value="all">All locations ({locations.length})</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {/* Stock Level */}
                  <label className="block text-xs font-medium text-stocky-text-main">
                    Stock Level
                    <select
                      value={filterStockLevel}
                      onChange={(e) => setFilterStockLevel(e.target.value as any)}
                      className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                    >
                      <option value="all">All stock levels</option>
                      <option value="in_stock">In stock (&gt; 0)</option>
                      <option value="low_stock">Low stock (≤ reorder point)</option>
                      <option value="out_of_stock">Out of stock (0)</option>
                    </select>
                  </label>

                  {/* Expiry Health */}
                  <label className="block text-xs font-medium text-stocky-text-main">
                    Expiry Health
                    <select
                      value={filterExpiryStatus}
                      onChange={(e) => setFilterExpiryStatus(e.target.value as any)}
                      className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                    >
                      <option value="all">All expiry statuses</option>
                      <option value="healthy">Healthy stock</option>
                      <option value="warning">Expiring soon</option>
                      <option value="expired">Expired</option>
                      <option value="missing">No expiry date</option>
                    </select>
                  </label>

                  {/* Supplier */}
                  <label className="block text-xs font-medium text-stocky-text-main">
                    Supplier
                    <select
                      value={filterSupplierId}
                      onChange={(e) => setFilterSupplierId(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                    >
                      <option value="all">All suppliers ({suppliers.length})</option>
                      {suppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Audit Status */}
                  <label className="block text-xs font-medium text-stocky-text-main">
                    Audit Status
                    <select
                      value={filterAuditStatus}
                      onChange={(e) => setFilterAuditStatus(e.target.value as any)}
                      className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                    >
                      <option value="all">All products</option>
                      <option value="audited">Audited</option>
                      <option value="unaudited">Never audited</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between border-t border-stocky-border-subtle bg-stocky-bg-global px-4 py-2">
              <span className="text-[11px] font-medium text-stocky-text-sub">
                {rows.length} product{rows.length === 1 ? '' : 's'} matching
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
      <div className="stocky-stock-table-toolbar__actions">
        {canManageTasks && <button type="button" onClick={() => openTaskAssignment('count', [])} className="stocky-table-toolbar-button"><CheckCircleIcon size="xs" /> Audit</button>}
        {canImport && <button type="button" onClick={() => setImportOpen(true)} className="stocky-table-toolbar-button"><CloudUploadIcon size="xs" /> Import</button>}
        {onExport && <button type="button" onClick={onExport} className="stocky-table-toolbar-button"><CloudDownloadIcon size="xs" /> Export</button>}
        <button type="button" onClick={() => onReceive()} className="stocky-table-toolbar-button stocky-table-toolbar-button--primary"><PlusIcon size="xs" /> Add stock</button>
      </div>
    </div>
  );

  return (
    <div className="stocky-stock-workspace flex flex-col gap-4">
      {canManageTasks && selectedProductIds.length > 0 && <section className="stocky-selection-actionbar" aria-label="Selected stock actions">
        <span className="stocky-selection-actionbar__count">{selectedProductIds.length} selected</span>
        <span className="stocky-selection-actionbar__hint">Choose an action</span>
        <div className="stocky-selection-actionbar__actions">
          <button type="button" onClick={() => openTaskAssignment('count')} className="stocky-selection-actionbar__button stocky-selection-actionbar__button--primary">Assign count</button>
          <button type="button" onClick={() => openTaskAssignment('expiry')} className="stocky-selection-actionbar__button">Assign expiry check</button>
          <button type="button" onClick={() => setSelectedProductIds([])} className="stocky-selection-actionbar__clear">Clear</button>
        </div>
      </section>}

      <section className="stocky-stock-filterbar">{stockToolbarContent}</section>

      <section className={isTableView ? 'stocky-stock-table-shell' : 'rounded-2xl bg-white border border-stocky-border-subtle overflow-hidden'}>
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <BoxesIcon size="md" className="mx-auto text-stocky-text-sub/50" />
            <h2 className="mt-3 text-base font-medium text-stocky-text-main">No stock found</h2>
            <p className="mt-1 text-sm text-stocky-text-sub">Try another search or receive your first delivery.</p>
            <button type="button" onClick={() => onReceive()} className="mt-4 h-9 px-4 rounded-lg bg-stocky-primary text-white text-xs font-medium cursor-pointer">Receive stock</button>
          </div>
        ) : isTableView ? (
          <>
            <div className="stocky-stock-desktop-view">
              <StockInventoryTableWidget rows={rows} locations={locations} onReceive={onReceive} onEdit={onEditProduct} onDelete={onDeleteProduct} selectedProductId={selectedProductId} onSelectProduct={(productId) => setSelectedProductId(productId)} canSelect={canManageTasks} selectedProductIds={selectedProductIds} onToggleProduct={(productId) => setSelectedProductIds((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId])} onToggleAll={(productIds) => setSelectedProductIds(productIds)} lastAuditByProduct={lastAuditByProduct} />
            </div>
            <div className="stocky-stock-mobile-view">
              {mobileStockList}
            </div>
          </>
        ) : (
          <div className="stocky-stock-mobile-view stocky-stock-mobile-view--staff">{mobileStockList}</div>
        )}
      </section>
      {renderLotsDrawer()}
      {onCreateTask && <StockTaskAssignmentWidget isOpen={taskAssignmentOpen} taskType={taskType} selectedProductIds={selectedProductIds} products={products} locations={locations} members={members} assignments={assignments} selectedLocationId={selectedLocationId} userRole={userRole} onClose={() => setTaskAssignmentOpen(false)} onCreate={onCreateTask} />}
      {canImport && <StockImportModalWidget isOpen={importOpen} onClose={() => setImportOpen(false)} companyId={companyId} products={products} locations={locations} selectedLocationId={selectedLocationId} onImportSuccess={() => { setImportOpen(false); onImportSuccess?.(); }} />}
    </div>
  );
}
