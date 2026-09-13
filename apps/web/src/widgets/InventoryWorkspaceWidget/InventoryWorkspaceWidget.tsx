'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  BarcodeIcon,
  BoxesIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CloudDownloadIcon,
  CloudUploadIcon,
  EditIcon,
  FilterIcon,
  MailIcon,
  PlusIcon,
  SearchIcon,
  TruckIcon,
  XIcon,
} from '@stocky/icons';
import type { CompanyUserRole, CreateStockTaskCommand, Location, Product, StockLot, StockTask, StockTaskItem, StockTaskType, Supplier } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { AnimatePresence, motion } from 'framer-motion';
import { InventoryTableWidget, type InventoryTableRow } from '../InventoryTableWidget/InventoryTableWidget';
import { StockTaskAssignmentWidget } from '../StockTaskAssignmentWidget/StockTaskAssignmentWidget';
import { InventoryImportModalWidget } from '../InventoryImportModalWidget/InventoryImportModalWidget';
import { InventoryProductLotsWidget } from '../InventoryProductLotsWidget/InventoryProductLotsWidget';
import { SupplierResupplyModalWidget } from '../SupplierResupplyModalWidget/SupplierResupplyModalWidget';
import { InventoryToolbarWidget } from '../InventoryToolbarWidget/InventoryToolbarWidget';
import { InventoryFilterPanelWidget, type FilterColumnScope } from './InventoryFilterPanelWidget';
import type { StockLotUpdateInput } from '../StockLotEditDrawerWidget/StockLotEditDrawerWidget';

interface StockRow extends InventoryTableRow {
  product: Product;
  lots: StockLot[];
  totalQuantity: number;
  earliestExpiry: StockLot | null;
  hasAttention: boolean;
}

export interface InventoryWorkspaceWidgetProps {
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

export type RedesignedStockWorkspaceWidgetProps = InventoryWorkspaceWidgetProps;

function getLotState(lot: StockLot) {
  if (lot.quantityOnHand <= 0 || lot.status === 'depleted') return { label: 'Out of stock', tone: 'slate' };
  if (lot.status === 'on_hold') return { label: 'On hold', tone: 'purple' };
  if (!lot.expiryDate) return { label: 'No expiry date', tone: 'red' };

  const days = Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: 'Expired', tone: 'red' };
  if (days <= (lot.expiryNotificationDays ?? 0)) return { label: `${days}d left`, tone: 'amber' };
  return { label: `${days}d left`, tone: 'green' };
}

export function InventoryWorkspaceWidget({
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
}: InventoryWorkspaceWidgetProps) {
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

  // Full-Width Filter Workspace Panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<FilterColumnScope>({
    product: true,
    barcode: true,
    category: true,
    location: true,
    supplier: true,
  });
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterLocationIds, setFilterLocationIds] = useState<string[]>([]);
  const [filterSupplierIds, setFilterSupplierIds] = useState<string[]>([]);
  const [filterQuantityMin, setFilterQuantityMin] = useState<string>('');
  const [filterQuantityMax, setFilterQuantityMax] = useState<string>('');
  const [filterPriceMin, setFilterPriceMin] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');
  const [filterExpiryFrom, setFilterExpiryFrom] = useState<string>('');
  const [filterExpiryTo, setFilterExpiryTo] = useState<string>('');
  const [resupplyModalOpen, setResupplyModalOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (!selectedColumns.product || !selectedColumns.barcode || !selectedColumns.category || !selectedColumns.location || !selectedColumns.supplier) {
      count += 1;
    }
    if (filterCategories.length > 0) count += filterCategories.length;
    if (filterLocationIds.length > 0) count += filterLocationIds.length;
    if (filterSupplierIds.length > 0) count += filterSupplierIds.length;
    if (filterQuantityMin !== '' || filterQuantityMax !== '') count += 1;
    if (filterPriceMin !== '' || filterPriceMax !== '') count += 1;
    if (filterExpiryFrom !== '' || filterExpiryTo !== '') count += 1;
    return count;
  }, [
    selectedColumns,
    filterCategories,
    filterLocationIds,
    filterSupplierIds,
    filterQuantityMin,
    filterQuantityMax,
    filterPriceMin,
    filterPriceMax,
    filterExpiryFrom,
    filterExpiryTo,
  ]);

  const handleResetAllFilters = () => {
    setSelectedColumns({
      product: true,
      barcode: true,
      category: true,
      location: true,
      supplier: true,
    });
    setFilterCategories([]);
    setFilterLocationIds([]);
    setFilterSupplierIds([]);
    setFilterQuantityMin('');
    setFilterQuantityMax('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterExpiryFrom('');
    setFilterExpiryTo('');
  };

  const filterBarRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isFilterPanelOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setIsFilterPanelOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterPanelOpen]);

  const availableCategories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.categoryName?.trim() || 'General';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const availableLocations = useMemo(() => {
    const counts = new Map<string, number>();
    lots.forEach((lot) => {
      if (Number(lot.quantityOnHand) > 0) {
        counts.set(lot.locationId, (counts.get(lot.locationId) || 0) + 1);
      }
    });
    return (locations || []).map((loc) => ({
      id: loc.id,
      name: loc.name,
      count: counts.get(loc.id) || 0,
    }));
  }, [locations, lots]);

  const availableSuppliers = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      if (p.defaultSupplierId) {
        counts.set(p.defaultSupplierId, (counts.get(p.defaultSupplierId) || 0) + 1);
      }
    });
    lots.forEach((lot) => {
      if (lot.supplierId) {
        counts.set(lot.supplierId, (counts.get(lot.supplierId) || 0) + 1);
      }
    });
    return (suppliers || []).map((sup) => ({
      id: sup.id,
      name: sup.name,
      count: counts.get(sup.id) || 0,
    }));
  }, [suppliers, products, lots]);

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
          .filter((lot) => {
            if (filterLocationIds.length > 0) {
              return filterLocationIds.includes(lot.locationId);
            }
            return selectedLocationId === 'all' || lot.locationId === selectedLocationId;
          })
          .filter((lot) => {
            if (filterSupplierIds.length > 0) {
              const matchesLot = lot.supplierId && filterSupplierIds.includes(lot.supplierId);
              const matchesDefault = product.defaultSupplierId && filterSupplierIds.includes(product.defaultSupplierId);
              const matchesUnassigned = filterSupplierIds.includes('unassigned') && !lot.supplierId && !product.defaultSupplierId;
              return matchesLot || matchesDefault || matchesUnassigned;
            }
            return true;
          });

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
        // 1. Categorical: Category Tags
        if (filterCategories.length > 0) {
          const cat = row.product.categoryName?.trim() || 'General';
          if (!filterCategories.includes(cat)) return false;
        }

        // 2. Numerical: Quantity Min & Max only
        if (filterQuantityMin !== '' && !isNaN(Number(filterQuantityMin))) {
          if (row.totalQuantity < Number(filterQuantityMin)) return false;
        }
        if (filterQuantityMax !== '' && !isNaN(Number(filterQuantityMax))) {
          if (row.totalQuantity > Number(filterQuantityMax)) return false;
        }

        // 3. Numerical: Price Min & Max only
        const cost = Number(row.product.unitCost) || 0;
        if (filterPriceMin !== '' && !isNaN(Number(filterPriceMin))) {
          if (cost < Number(filterPriceMin)) return false;
        }
        if (filterPriceMax !== '' && !isNaN(Number(filterPriceMax))) {
          if (cost > Number(filterPriceMax)) return false;
        }

        // 4. Date Column: Next Expiry Date (From and To dates only)
        if (filterExpiryFrom) {
          if (!row.earliestExpiry?.expiryDate) return false;
          const expiryTs = new Date(row.earliestExpiry.expiryDate).getTime();
          const fromTs = new Date(filterExpiryFrom).getTime();
          if (expiryTs < fromTs) return false;
        }
        if (filterExpiryTo) {
          if (!row.earliestExpiry?.expiryDate) return false;
          const expiryTs = new Date(row.earliestExpiry.expiryDate).getTime();
          const toDate = new Date(filterExpiryTo);
          toDate.setHours(23, 59, 59, 999);
          if (expiryTs > toDate.getTime()) return false;
        }

        // 5. Categorical: Suppliers (if product has 0 lots in scope)
        if (filterSupplierIds.length > 0 && row.lots.length === 0) {
          const matchesDefault = row.product.defaultSupplierId && filterSupplierIds.includes(row.product.defaultSupplierId);
          const matchesUnassigned = filterSupplierIds.includes('unassigned') && !row.product.defaultSupplierId;
          if (!matchesDefault && !matchesUnassigned) return false;
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
  }, [
    activeFilterCount,
    filterCategories,
    filterExpiryFrom,
    filterExpiryTo,
    filterLocationIds,
    filterPriceMax,
    filterPriceMin,
    filterQuantityMax,
    filterQuantityMin,
    filterSupplierIds,
    locationNames,
    lots,
    products,
    search,
    selectedColumns,
    selectedLocationId,
    supplierNames,
  ]);

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

  const lastDetailRowRef = React.useRef<StockRow | null>(null);
  if (detailRow) {
    lastDetailRowRef.current = detailRow;
  }
  const activeDetailRow = detailRow || lastDetailRowRef.current;

  const closeLotsDrawer = () => {
    setSelectedProductId(null);
    setDetailRow(null);
  };

  const renderLotsDrawer = () => {
    if (!activeDetailRow) return null;

    const drawerSupplierName = activeDetailRow.product.defaultSupplierId
      ? supplierNames.get(activeDetailRow.product.defaultSupplierId)
      : (activeDetailRow.lots.find((lot) => lot.supplierId && supplierNames.has(lot.supplierId))?.supplierId
          ? supplierNames.get(activeDetailRow.lots.find((lot) => lot.supplierId && supplierNames.has(lot.supplierId))!.supplierId!)
          : null);

    const earliestState = activeDetailRow.earliestExpiry
      ? getLotState(activeDetailRow.earliestExpiry)
      : { label: 'No expiry date', tone: 'red' };

    return (
      <SideDrawer
        isOpen={Boolean(detailRow)}
        onClose={closeLotsDrawer}
        ariaLabel={`${activeDetailRow.product.name} lots and batches`}
        panelClassName="stocky-stock-lots-drawer"
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* Header with Product Image next to Product Name */}
          <div className="shrink-0 border-b border-stocky-border-subtle bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {/* Rounded square product image */}
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stocky-border-subtle bg-stocky-bg-global text-stocky-text-sub select-none">
                  {activeDetailRow.product.imageUrl ? (
                    <img
                      src={activeDetailRow.product.imageUrl}
                      alt={activeDetailRow.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold tracking-tight text-stocky-text-main">
                      {activeDetailRow.product.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Product Name & Badges */}
                <div className="min-w-0">
                  <h2
                    className="truncate text-base font-semibold text-stocky-text-main tracking-tight leading-snug"
                    title={activeDetailRow.product.name}
                  >
                    {activeDetailRow.product.name}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-stocky-text-sub">
                    <span className="inline-flex items-center rounded-md bg-stocky-bg-global px-2 py-0.5 text-[11px] font-medium text-stocky-text-main border border-stocky-border-subtle">
                      {activeDetailRow.product.categoryName || 'General'}
                    </span>
                    {activeDetailRow.product.barcode && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-stocky-text-sub">
                        <BarcodeIcon size="xs" /> {activeDetailRow.product.barcode}
                      </span>
                    )}
                    {drawerSupplierName && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-stocky-text-sub">
                        <TruckIcon size="xs" /> {drawerSupplierName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions: Edit Product & Close */}
              <div className="flex items-center gap-1.5 shrink-0">
                {onEditProduct && (
                  <button
                    type="button"
                    onClick={() => onEditProduct(activeDetailRow.product)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stocky-border-subtle bg-white px-2.5 py-1.5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
                  >
                    <EditIcon size="xs" /> Edit product
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeLotsDrawer}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-stocky-text-sub hover:bg-stocky-bg-global transition-colors"
                  aria-label="Close lots drawer"
                >
                  <XIcon size="xs" />
                </button>
              </div>
            </div>

            {/* Profile Stats Strip */}
            <div className="mt-3 flex items-center gap-4 border-t border-stocky-border-subtle/70 pt-2.5 text-xs">
              <div>
                <span className="font-semibold text-stocky-text-main">
                  {activeDetailRow.totalQuantity.toLocaleString()}
                </span>{' '}
                <span className="text-[11px] text-stocky-text-sub">
                  {activeDetailRow.product.unitName}{activeDetailRow.totalQuantity === 1 ? '' : 's'} in stock
                </span>
              </div>
              <div className="h-3 w-px bg-stocky-border-subtle" />
              <div>
                <span className="font-semibold text-stocky-text-main">
                  {activeDetailRow.lots.length}
                </span>{' '}
                <span className="text-[11px] text-stocky-text-sub">
                  {activeDetailRow.lots.length === 1 ? 'batch' : 'batches'}
                </span>
              </div>
              <div className="h-3 w-px bg-stocky-border-subtle" />
              <div>
                <span className={`inline-flex items-center text-[11px] font-medium ${earliestState.tone === 'red' ? 'text-stocky-text-critical' : earliestState.tone === 'amber' ? 'text-stocky-text-warning' : 'text-stocky-text-success'}`}>
                  {earliestState.label}
                </span>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden p-3 md:p-4">
            <InventoryProductLotsWidget
              product={activeDetailRow.product}
              lots={activeDetailRow.lots}
              locations={locations}
              suppliers={suppliers}
              onSaveLot={isStaff ? undefined : onSaveLot}
              onDeleteLot={isStaff ? undefined : onDeleteLot}
            />
          </div>
        </div>
      </SideDrawer>
    );
  };

  const mobileStockList = (
    <div className="stocky-mobile-stock-list">
      {rows.length === 0 ? <div className="stocky-mobile-stock-empty"><BoxesIcon size="md" className="text-stocky-text-sub/50" /><p>No inventory matches this search.</p><button type="button" onClick={() => onReceive()} className="stocky-table-toolbar-button stocky-table-toolbar-button--primary"><PlusIcon size="xs" /> Add inventory</button></div> : rows.map((row) => {
        const state = row.earliestExpiry ? getLotState(row.earliestExpiry) : { label: 'No expiry date', tone: 'red' };
        const isSelected = selectedProductIds.includes(row.product.id);
        const supplierName = row.product.defaultSupplierId
          ? supplierNames.get(row.product.defaultSupplierId)
          : (row.lots.find((lot) => lot.supplierId && supplierNames.has(lot.supplierId))?.supplierId
              ? supplierNames.get(row.lots.find((lot) => lot.supplierId && supplierNames.has(lot.supplierId))!.supplierId!)
              : null);
        return <div key={row.product.id} role="button" tabIndex={0} onClick={() => setSelectedProductId(row.product.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedProductId(row.product.id); } }} className={`stocky-mobile-stock-row ${isSelected ? 'stocky-mobile-stock-row--selected' : ''}`}>
          {canManageTasks && <input type="checkbox" checked={isSelected} onClick={(event) => event.stopPropagation()} onChange={() => setSelectedProductIds((current) => current.includes(row.product.id) ? current.filter((id) => id !== row.product.id) : [...current, row.product.id])} aria-label={`Select ${row.product.name}`} className="stocky-mobile-stock-row__checkbox" />}
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-stocky-text-sub select-none">
            {row.product.imageUrl ? (
              <img src={row.product.imageUrl} alt={row.product.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[11px] font-medium text-stocky-text-sub uppercase tracking-wider">{row.product.name.slice(0, 2)}</span>
            )}
          </div>
          <span className="stocky-mobile-stock-row__body min-w-0 flex-1">
            <strong>{row.product.name}</strong>
            <small>{supplierName ? `${supplierName} · ` : ''}{row.product.categoryName || 'General'} · <span className="stocky-mobile-stock-row__barcode">{row.product.barcode || 'No barcode'}</span></small>
          </span>
          <span className="stocky-mobile-stock-row__summary"><strong>{row.totalQuantity.toLocaleString()}</strong><small className={state.tone === 'red' ? 'stocky-text-critical' : state.tone === 'amber' ? 'stocky-text-warning' : 'stocky-text-success'}>{state.label}</small></span>
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
    <InventoryToolbarWidget
      searchQuery={search}
      onSearchChange={setSearch}
      filterPanelOpen={isFilterPanelOpen}
      onToggleFilterPanel={() => setIsFilterPanelOpen((open) => !open)}
      isFilterActive={activeFilterCount > 0}
      canImport={canImport}
      onImport={() => setImportOpen(true)}
      onExport={onExport}
      canManageTasks={canManageTasks}
      onAudit={() => openTaskAssignment('count', [])}
      onResupply={() => setResupplyModalOpen(true)}
      onReceive={() => onReceive()}
    />
  );

  return (
    <div className="stocky-stock-workspace flex flex-col gap-4">
      {canManageTasks && selectedProductIds.length > 0 && <section className="stocky-selection-actionbar" aria-label="Selected stock actions">
        <span className="stocky-selection-actionbar__count">{selectedProductIds.length} selected</span>
        <span className="stocky-selection-actionbar__hint">Choose an action</span>
        <div className="stocky-selection-actionbar__actions">
          <button type="button" onClick={() => setResupplyModalOpen(true)} className="stocky-selection-actionbar__button"><MailIcon size="xs" /> Resupply</button>
          <button type="button" onClick={() => openTaskAssignment('count')} className="stocky-selection-actionbar__button stocky-selection-actionbar__button--primary">Assign count</button>
          <button type="button" onClick={() => openTaskAssignment('expiry')} className="stocky-selection-actionbar__button">Assign expiry check</button>
          <button type="button" onClick={() => setSelectedProductIds([])} className="stocky-selection-actionbar__clear">Clear</button>
        </div>
      </section>}

      {/* Unified Table Workspace Card */}
      <div className="stocky-stock-unified-card rounded-2xl bg-white border border-stocky-border-subtle shadow-sm flex flex-col relative z-20 overflow-visible">
        {/* 1. Integrated Toolbar Header */}
        <div ref={filterBarRef} className="p-3 sm:p-3.5 border-b border-stocky-border-subtle relative z-30">
          {stockToolbarContent}

          <AnimatePresence>
            {isFilterPanelOpen && (
              <div className="absolute top-[calc(100%+8px)] inset-x-3 sm:inset-x-3.5 z-50">
                <InventoryFilterPanelWidget
                  selectedColumns={selectedColumns}
                  onToggleColumn={(column) =>
                    setSelectedColumns((prev) => ({ ...prev, [column]: !prev[column] }))
                  }
                  onSelectAllColumns={() =>
                    setSelectedColumns({
                      product: true,
                      barcode: true,
                      category: true,
                      location: true,
                      supplier: true,
                    })
                  }
                  availableCategories={availableCategories}
                  filterCategories={filterCategories}
                  onToggleCategory={(categoryName) =>
                    setFilterCategories((prev) =>
                      prev.includes(categoryName)
                        ? prev.filter((c) => c !== categoryName)
                        : [...prev, categoryName]
                    )
                  }
                  onClearCategories={() => setFilterCategories([])}
                  availableLocations={availableLocations}
                  filterLocationIds={filterLocationIds}
                  onToggleLocation={(locationId) =>
                    setFilterLocationIds((prev) =>
                      prev.includes(locationId)
                        ? prev.filter((id) => id !== locationId)
                        : [...prev, locationId]
                    )
                  }
                  onClearLocations={() => setFilterLocationIds([])}
                  availableSuppliers={availableSuppliers}
                  filterSupplierIds={filterSupplierIds}
                  onToggleSupplier={(supplierId) =>
                    setFilterSupplierIds((prev) =>
                      prev.includes(supplierId)
                        ? prev.filter((id) => id !== supplierId)
                        : [...prev, supplierId]
                    )
                  }
                  onClearSuppliers={() => setFilterSupplierIds([])}
                  filterQuantityMin={filterQuantityMin}
                  onQuantityMinChange={setFilterQuantityMin}
                  filterQuantityMax={filterQuantityMax}
                  onQuantityMaxChange={setFilterQuantityMax}
                  filterPriceMin={filterPriceMin}
                  onPriceMinChange={setFilterPriceMin}
                  filterPriceMax={filterPriceMax}
                  onPriceMaxChange={setFilterPriceMax}
                  filterExpiryFrom={filterExpiryFrom}
                  onExpiryFromChange={setFilterExpiryFrom}
                  filterExpiryTo={filterExpiryTo}
                  onExpiryToChange={setFilterExpiryTo}
                  activeFilterCount={activeFilterCount}
                  matchingCount={rows.length}
                  totalCount={products.length}
                  onResetAll={handleResetAllFilters}
                  onClose={() => setIsFilterPanelOpen(false)}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Integrated Table Area */}
        <div className="w-full">
          {rows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <BoxesIcon size="md" className="mx-auto text-stocky-text-sub/50" />
              <h2 className="mt-3 text-base font-medium text-stocky-text-main">No inventory found</h2>
              <p className="mt-1 text-sm text-stocky-text-sub">Try another search or receive your first delivery.</p>
              <button type="button" onClick={() => onReceive()} className="mt-4 h-9 px-4 rounded-lg bg-stocky-primary text-white text-xs font-medium cursor-pointer">Receive inventory</button>
            </div>
          ) : isTableView ? (
            <>
              <div className="stocky-stock-desktop-view">
                <InventoryTableWidget rows={rows} locations={locations} suppliers={suppliers} onReceive={onReceive} onEdit={onEditProduct} onDelete={onDeleteProduct} selectedProductId={selectedProductId} onSelectProduct={(productId) => setSelectedProductId(productId)} canSelect={canManageTasks} selectedProductIds={selectedProductIds} onToggleProduct={(productId) => setSelectedProductIds((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId])} onToggleAll={(productIds) => setSelectedProductIds(productIds)} lastAuditByProduct={lastAuditByProduct} />
              </div>
              <div className="stocky-stock-mobile-view">
                {mobileStockList}
              </div>
            </>
          ) : (
            <div className="stocky-stock-mobile-view stocky-stock-mobile-view--staff">{mobileStockList}</div>
          )}
        </div>
      </div>
      {renderLotsDrawer()}
      {onCreateTask && <StockTaskAssignmentWidget isOpen={taskAssignmentOpen} taskType={taskType} selectedProductIds={selectedProductIds} products={products} locations={locations} members={members} assignments={assignments} selectedLocationId={selectedLocationId} userRole={userRole} onClose={() => setTaskAssignmentOpen(false)} onCreate={onCreateTask} />}
      {canImport && <InventoryImportModalWidget isOpen={importOpen} onClose={() => setImportOpen(false)} companyId={companyId} products={products} locations={locations} selectedLocationId={selectedLocationId} onImportSuccess={() => { setImportOpen(false); onImportSuccess?.(); }} />}
      <SupplierResupplyModalWidget
        isOpen={resupplyModalOpen}
        onClose={() => setResupplyModalOpen(false)}
        suppliers={suppliers}
        products={products}
        lots={lots}
        locations={locations}
        selectedProductIds={selectedProductIds}
      />
    </div>
  );
}

export const RedesignedStockWorkspaceWidget = InventoryWorkspaceWidget;

