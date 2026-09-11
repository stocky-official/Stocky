'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, BarcodeIcon, CheckIcon, EditIcon, FilterIcon, MoreHorizontalIcon, PlusIcon, SearchIcon, TrashIcon, XIcon } from '@stocky/icons';
import type { Location, Product, StockLot } from '@stocky/types';

export interface StockInventoryTableRow {
  product: Product;
  lots: StockLot[];
  totalQuantity: number;
  earliestExpiry: StockLot | null;
  hasAttention: boolean;
}

export interface StockInventoryTableWidgetProps {
  rows: StockInventoryTableRow[];
  locations: Location[];
  onReceive: (productId?: string) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  selectedProductId?: string | null;
  onSelectProduct?: (productId: string | null) => void;
  canSelect?: boolean;
  selectedProductIds?: string[];
  onToggleProduct?: (productId: string) => void;
  onToggleAll?: (productIds: string[]) => void;
  lastAuditByProduct?: Record<string, string | null>;
}

type SortKey = 'product' | 'barcode' | 'category' | 'locations' | 'quantity' | 'price' | 'expiry' | 'audit';
type SortDirection = 'asc' | 'desc';
type ExpiryFilter = 'all' | 'expired' | 'soon' | 'missing' | 'healthy';

interface TableFilters {
  product: string;
  productValues: string[];
  barcode: string;
  barcodeValues: string[];
  category: string;
  categoryValues: string[];
  locations: string;
  locationValues: string[];
  quantity: string;
  price: string;
  expiry: ExpiryFilter[];
  audit: Array<'never' | 'audited'>;
}

function getLotState(lot: StockLot | null) {
  if (lot?.status === 'on_hold') return { label: 'On hold', tone: 'warning', category: 'healthy' as ExpiryFilter };
  if (lot?.status === 'returned') return { label: 'Returned', tone: 'critical', category: 'healthy' as ExpiryFilter };
  if (lot?.status === 'disposed') return { label: 'Removed', tone: 'critical', category: 'healthy' as ExpiryFilter };
  if (lot?.quantityOnHand === 0 || lot?.status === 'depleted') return { label: 'Out of stock', tone: 'critical', category: 'healthy' as ExpiryFilter };
  if (!lot || !lot.expiryDate) return { label: 'Missing expiry', tone: 'critical', category: 'missing' as ExpiryFilter };
  const days = Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: 'Expired', tone: 'critical', category: 'expired' as ExpiryFilter };
  if (days <= (lot.expiryNotificationDays ?? 0)) return { label: `${days} day${days === 1 ? '' : 's'} left`, tone: 'warning', category: 'soon' as ExpiryFilter };
  return { label: `${days} day${days === 1 ? '' : 's'} left`, tone: 'success', category: 'healthy' as ExpiryFilter };
}

function formatDate(value?: string | null) {
  if (!value) return 'No expiry date';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function compareValues(left: string | number, right: string | number) {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
}

export function StockInventoryTableWidget({ rows = [], locations = [], onReceive, onEdit, onDelete, selectedProductId: controlledSelectedProductId = null, onSelectProduct, canSelect = false, selectedProductIds = [], onToggleProduct, onToggleAll, lastAuditByProduct = {} }: StockInventoryTableWidgetProps) {
  const [internalSelectedProductId, setInternalSelectedProductId] = useState<string | null>(null);
  const [openFilter, setOpenFilter] = useState<SortKey | null>(null);
  const [filterMenuPosition, setFilterMenuPosition] = useState({ top: 0, left: 0 });
  const [openActionProductId, setOpenActionProductId] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'product', direction: 'asc' });
  const [filters, setFilters] = useState<TableFilters>({ product: '', productValues: [], barcode: '', barcodeValues: [], category: '', categoryValues: [], locations: '', locationValues: [], quantity: '', price: '', expiry: [], audit: [] });
  const locationNames = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);
  const selectedProductId = onSelectProduct ? controlledSelectedProductId : internalSelectedProductId;

  const selectProduct = (productId: string) => {
    const nextProductId = selectedProductId === productId ? null : productId;
    setInternalSelectedProductId(nextProductId);
    onSelectProduct?.(nextProductId);
  };

  useEffect(() => {
    if (!openFilter && !openActionProductId) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-stock-column-filter]')) setOpenFilter(null);
      if (!target.closest('[data-stock-row-actions]')) setOpenActionProductId(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenFilter(null);
        setOpenActionProductId(null);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openActionProductId, openFilter]);

  const updateFilter = <K extends keyof TableFilters>(key: K, value: TableFilters[K]) => {
    setPage(0);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const filteredRows = useMemo(() => rows.filter((row) => {
    if (!row || !row.product) return false;
    const productText = `${row.product.name || ''} ${row.product.barcode || ''} ${row.product.categoryName || ''}`.toLowerCase();
    const lots = Array.isArray(row.lots) ? row.lots : [];
    const locationText = lots.map((lot) => locationNames.get(lot.locationId) || '').join(' ').toLowerCase();
    const expiryCategory = getLotState(row.earliestExpiry).category;
    const barcodeText = (row.product.barcode || '').toLowerCase();
    const categoryText = (row.product.categoryName || 'General').toLowerCase();
    const quantityMatch = !filters.quantity || String(row.totalQuantity ?? 0).includes(filters.quantity.trim());
    const priceMatch = !filters.price || String(row.product.unitCost ?? 0).includes(filters.price.trim());
    const productValueMatch = filters.productValues.length === 0 || filters.productValues.includes(row.product.name);
    const barcodeValueMatch = filters.barcodeValues.length === 0 || filters.barcodeValues.includes(row.product.barcode || 'No barcode');
    const categoryValueMatch = filters.categoryValues.length === 0 || filters.categoryValues.includes(row.product.categoryName || 'General');
    const rowLocations = lots.map((lot) => locationNames.get(lot.locationId) || '');
    const locationValueMatch = filters.locationValues.length === 0 || rowLocations.some((location) => filters.locationValues.includes(location));
    return productText.includes(filters.product.trim().toLowerCase())
      && barcodeText.includes(filters.barcode.trim().toLowerCase())
      && categoryText.includes(filters.category.trim().toLowerCase())
      && locationText.includes(filters.locations.trim().toLowerCase())
      && productValueMatch
      && barcodeValueMatch
      && categoryValueMatch
      && locationValueMatch
      && quantityMatch
      && priceMatch
      && (filters.expiry.length === 0 || filters.expiry.includes(expiryCategory))
      && (filters.audit.length === 0 || filters.audit.includes(lastAuditByProduct[row.product.id] ? 'audited' : 'never'));
  }), [filters, lastAuditByProduct, locationNames, rows]);

  const sortedRows = useMemo(() => [...filteredRows].sort((left, right) => {
    const leftLots = Array.isArray(left.lots) ? left.lots : [];
    const rightLots = Array.isArray(right.lots) ? right.lots : [];
    const leftLocations = leftLots.map((lot) => locationNames.get(lot.locationId) || '').join(', ');
    const rightLocations = rightLots.map((lot) => locationNames.get(lot.locationId) || '').join(', ');
    const leftExpiry = left.earliestExpiry?.expiryDate ? new Date(left.earliestExpiry.expiryDate).getTime() : Number.POSITIVE_INFINITY;
    const rightExpiry = right.earliestExpiry?.expiryDate ? new Date(right.earliestExpiry.expiryDate).getTime() : Number.POSITIVE_INFINITY;
    const leftAudit = lastAuditByProduct[left.product.id] ? new Date(lastAuditByProduct[left.product.id] as string).getTime() : 0;
    const rightAudit = lastAuditByProduct[right.product.id] ? new Date(lastAuditByProduct[right.product.id] as string).getTime() : 0;
    const values: Record<SortKey, string | number> = { product: left.product.name || '', barcode: left.product.barcode || '', category: left.product.categoryName || 'General', locations: leftLocations, quantity: left.totalQuantity ?? 0, price: left.product.unitCost ?? 0, expiry: leftExpiry, audit: leftAudit };
    const rightValues: Record<SortKey, string | number> = { product: right.product.name || '', barcode: right.product.barcode || '', category: right.product.categoryName || 'General', locations: rightLocations, quantity: right.totalQuantity ?? 0, price: right.product.unitCost ?? 0, expiry: rightExpiry, audit: rightAudit };
    const result = compareValues(values[sort.key], rightValues[sort.key]);
    return sort.direction === 'asc' ? result : -result;
  }), [filteredRows, lastAuditByProduct, locationNames, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const firstRowNumber = sortedRows.length === 0 ? 0 : currentPage * pageSize + 1;
  const lastRowNumber = Math.min((currentPage + 1) * pageSize, sortedRows.length);
  const visibleProductIds = filteredRows.map((row) => row.product.id);
  const allSelected = canSelect && visibleProductIds.length > 0 && visibleProductIds.every((productId) => selectedProductIds.includes(productId));
  const hasActiveFilters = Boolean(filters.product || filters.productValues.length || filters.barcode || filters.barcodeValues.length || filters.category || filters.categoryValues.length || filters.locations || filters.locationValues.length || filters.quantity || filters.price || filters.expiry.length || filters.audit.length);
  const activeFilterCount = [filters.product, filters.productValues.length, filters.barcode, filters.barcodeValues.length, filters.category, filters.categoryValues.length, filters.locations, filters.locationValues.length, filters.quantity, filters.price, filters.expiry.length, filters.audit.length].filter(Boolean).length;

  const sortBy = (key: SortKey) => {
    setPage(0);
    setSort((current) => current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
  };
  const sortIndicator = (key: SortKey) => sort.key !== key ? <ArrowUpDownIcon size={10} /> : sort.direction === 'asc' ? <ArrowUpIcon size={10} /> : <ArrowDownIcon size={10} />;
  const filterOptions = (key: SortKey) => {
    if (key === 'product') return Array.from(new Set(rows.map((row) => row.product?.name).filter((n): n is string => Boolean(n)))).sort();
    if (key === 'barcode') return Array.from(new Set(rows.map((row) => row.product?.barcode || 'No barcode'))).sort();
    if (key === 'category') return Array.from(new Set(rows.map((row) => row.product?.categoryName || 'General'))).sort();
    if (key === 'locations') return Array.from(new Set(rows.flatMap((row) => (row.lots || []).map((lot) => locationNames.get(lot.locationId) || 'Location')))).sort();
    return [];
  };
  const filterOptionLabels: Record<string, string> = { expired: 'Expired', soon: 'Expiring soon', missing: 'Missing expiry', healthy: 'Healthy', never: 'Never audited', audited: 'Audited' };
  const openColumnFilter = (key: SortKey, event: React.MouseEvent<HTMLButtonElement>) => {
    const triggerBounds = event.currentTarget.getBoundingClientRect();
    const menuWidth = 224;
    const menuHeight = 320;
    const sidebarBounds = document.querySelector<HTMLElement>('.stocky-workspace-sidebar')?.getBoundingClientRect();
    const sidebarInset = sidebarBounds && sidebarBounds.width > 0 ? sidebarBounds.right + 8 : 8;
    const maxLeft = Math.max(sidebarInset, window.innerWidth - menuWidth - 8);
    const left = Math.min(Math.max(sidebarInset, triggerBounds.right - menuWidth), maxLeft);
    const belowTop = triggerBounds.bottom + 6;
    const top = belowTop + menuHeight <= window.innerHeight ? belowTop : Math.max(8, triggerBounds.top - menuHeight - 6);
    setFilterMenuPosition({ top, left });
    setOpenFilter((current) => current === key ? null : key);
    setFilterSearch(key === 'product' ? filters.product : key === 'barcode' ? filters.barcode : key === 'category' ? filters.category : key === 'locations' ? filters.locations : '');
  };
  const toggleValueFilter = (key: 'productValues' | 'barcodeValues' | 'categoryValues' | 'locationValues', value: string) => {
    setPage(0);
    setFilters((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  };
  const toggleStatusFilter = (key: 'expiry' | 'audit', value: ExpiryFilter | 'never' | 'audited') => {
    setPage(0);
    setFilters((current) => {
      const values = current[key] as string[];
      return { ...current, [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] };
    });
  };
  const renderFilterMenu = (key: SortKey) => {
    const isTextFilter = key === 'product' || key === 'barcode' || key === 'category' || key === 'locations';
    const isStatusFilter = key === 'expiry' || key === 'audit';
    const options = filterOptions(key).filter((value) => value.toLowerCase().includes(filterSearch.trim().toLowerCase()));
    const selectedValues = key === 'product' ? filters.productValues : key === 'barcode' ? filters.barcodeValues : key === 'category' ? filters.categoryValues : filters.locationValues;
    const statusValues = key === 'expiry' ? filters.expiry : filters.audit;
    return (
      <div className="stocky-column-filter-menu" data-stock-column-filter role="dialog" aria-label={`Filter ${key}`} style={{ top: filterMenuPosition.top, left: filterMenuPosition.left }}>
        {isTextFilter && <div className="stocky-column-filter-menu__search"><SearchIcon size="xs" /><input autoFocus value={filterSearch} onChange={(event) => { setFilterSearch(event.target.value); updateFilter(key === 'product' ? 'product' : key === 'barcode' ? 'barcode' : key === 'category' ? 'category' : 'locations', event.target.value); }} placeholder={`Search ${key}`} /></div>}
        {isTextFilter && <button type="button" onClick={() => { setFilters((current) => ({ ...current, [key === 'product' ? 'productValues' : key === 'barcode' ? 'barcodeValues' : key === 'category' ? 'categoryValues' : 'locationValues']: options })); setPage(0); }} className="stocky-column-filter-menu__select-all"><span className="stocky-column-filter-menu__checkbox">{options.length > 0 && options.every((value) => selectedValues.includes(value)) && <CheckIcon size="xs" />}</span>Select all visible</button>}
        {isTextFilter && <div className="stocky-column-filter-menu__options">{options.length === 0 ? <p className="stocky-column-filter-menu__empty">No matching values</p> : options.map((value) => <button type="button" key={value} onClick={() => toggleValueFilter(key === 'product' ? 'productValues' : key === 'barcode' ? 'barcodeValues' : key === 'category' ? 'categoryValues' : 'locationValues', value)} className="stocky-column-filter-menu__option"><span className="stocky-column-filter-menu__checkbox">{selectedValues.includes(value) && <CheckIcon size="xs" />}</span><span className="truncate">{value}</span></button>)}</div>}
        {key === 'quantity' && <div className="stocky-column-filter-menu__search"><SearchIcon size="xs" /><input autoFocus inputMode="numeric" value={filters.quantity} onChange={(event) => updateFilter('quantity', event.target.value)} placeholder="Search quantity" /></div>}
        {key === 'price' && <div className="stocky-column-filter-menu__search"><SearchIcon size="xs" /><input autoFocus inputMode="decimal" value={filters.price} onChange={(event) => updateFilter('price', event.target.value)} placeholder="Search price" /></div>}
        {isStatusFilter && <div className="stocky-column-filter-menu__options">{(key === 'expiry' ? ['expired', 'soon', 'missing', 'healthy'] : ['never', 'audited']).map((value) => <button type="button" key={value} onClick={() => toggleStatusFilter(key, value as ExpiryFilter | 'never' | 'audited')} className="stocky-column-filter-menu__option"><span className="stocky-column-filter-menu__checkbox">{statusValues.includes(value as never) && <CheckIcon size="xs" />}</span>{filterOptionLabels[value]}</button>)}</div>}
        <div className="stocky-column-filter-menu__footer"><button type="button" onClick={() => { setFilters((current) => ({ ...current, ...(key === 'product' ? { product: '', productValues: [] } : key === 'barcode' ? { barcode: '', barcodeValues: [] } : key === 'category' ? { category: '', categoryValues: [] } : key === 'locations' ? { locations: '', locationValues: [] } : key === 'quantity' ? { quantity: '' } : key === 'price' ? { price: '' } : key === 'expiry' ? { expiry: [] } : { audit: [] }) })); setFilterSearch(''); setPage(0); }} className="stocky-column-filter-menu__clear">Clear</button><button type="button" onClick={() => setOpenFilter(null)} className="stocky-column-filter-menu__done">Done</button></div>
      </div>
    );
  };
  const header = (label: string, key: SortKey, align = 'left') => <th className={`stocky-board-table__header-cell ${align === 'right' ? 'text-right' : 'text-left'}`}><div className="stocky-table-header-content" data-stock-column-filter><button type="button" onClick={() => sortBy(key)} className="stocky-table-sort-button" aria-label={`Sort by ${label}`}><span className="stocky-table-header-label">{label}</span><span className="stocky-table-sort-indicator" aria-hidden="true">{sortIndicator(key)}</span></button><button type="button" onClick={(event) => openColumnFilter(key, event)} className={`stocky-table-filter-trigger ${((key === 'product' && (filters.product || filters.productValues.length)) || (key === 'barcode' && (filters.barcode || filters.barcodeValues.length)) || (key === 'category' && (filters.category || filters.categoryValues.length)) || (key === 'locations' && (filters.locations || filters.locationValues.length)) || (key === 'quantity' && filters.quantity) || (key === 'price' && filters.price) || (key === 'expiry' && filters.expiry.length) || (key === 'audit' && filters.audit.length)) ? 'stocky-table-filter-trigger--active' : ''}`} aria-label={`Filter ${label}`} aria-expanded={openFilter === key}><FilterIcon size={11} /></button>{openFilter === key && renderFilterMenu(key)}</div></th>;
  const locationTags = (row: StockInventoryTableRow) => {
    const totals = locations.map((location) => ({ location, quantity: row.lots.filter((lot) => lot.locationId === location.id).reduce((sum, lot) => sum + lot.quantityOnHand, 0) })).filter(({ quantity }) => quantity > 0);
    return totals.length === 0 ? <span className="text-xs text-stocky-text-sub">No stock</span> : totals.map(({ location, quantity }) => <span key={location.id} className="stocky-board-location-tag"><span className="truncate">{location.name}</span><span>({quantity.toLocaleString()})</span></span>);
  };
  const rowActions = (row: StockInventoryTableRow) => (
    <td className="stocky-board-actions-cell">
      <div className="stocky-board-actions" data-stock-row-actions onClick={(event) => event.stopPropagation()}>
        <div className="relative">
          <button type="button" onClick={() => setOpenActionProductId((current) => current === row.product.id ? null : row.product.id)} className="stocky-board-more-button" aria-label={`More actions for ${row.product.name}`} aria-expanded={openActionProductId === row.product.id} aria-haspopup="menu">
            <MoreHorizontalIcon size="xs" />
          </button>
          {openActionProductId === row.product.id && <div className="stocky-row-actions-menu" role="menu">
            {onEdit && <button type="button" role="menuitem" onClick={() => { setOpenActionProductId(null); onEdit(row.product); }} className="stocky-row-actions-menu__item"><EditIcon size="xs" /><span>Edit product</span></button>}
            <button type="button" role="menuitem" onClick={() => { setOpenActionProductId(null); onReceive(row.product.id); }} className="stocky-row-actions-menu__item"><PlusIcon size="xs" /><span>Add stock / lot</span></button>
            {onDelete && <button type="button" role="menuitem" onClick={() => { setOpenActionProductId(null); onDelete(row.product); }} className="stocky-row-actions-menu__item stocky-row-actions-menu__item--danger"><TrashIcon size="xs" /><span>Delete product</span></button>}
          </div>}
        </div>
      </div>
    </td>
  );

  return (
    <div className="stocky-board-table-wrap">
      <div className="overflow-x-auto">
        <table className="stocky-board-table stocky-board-table--inventory w-full">
          <colgroup>
            {canSelect && <col className="stocky-table-col-selection" />}
            <col className="stocky-table-col-product" />
            <col className="stocky-table-col-barcode" />
            <col className="stocky-table-col-category" />
            <col className="stocky-table-col-locations" />
            <col className="stocky-table-col-quantity" />
            <col className="stocky-table-col-price" />
            <col className="stocky-table-col-expiry" />
            <col className="stocky-table-col-audit" />
            <col className="stocky-table-col-actions" />
          </colgroup>
          <thead>
            <tr className="stocky-board-table__column-row text-[10px] uppercase tracking-wide text-stocky-text-sub">
              {canSelect && <th className="stocky-board-table__selection-cell"><input type="checkbox" checked={allSelected} onClick={(event) => event.stopPropagation()} onChange={() => onToggleAll?.(allSelected ? [] : visibleProductIds)} aria-label="Select all filtered products" className="h-3.5 w-3.5 accent-stocky-primary" /></th>}
              {header('Product', 'product')}
              {header('Barcode', 'barcode')}
              {header('Category', 'category')}
              {header('Locations', 'locations')}
              {header('Total quantity', 'quantity', 'left')}
              {header('Price', 'price', 'left')}
              {header('Next expiry date', 'expiry')}
              {header('Last audit date', 'audit')}
              <th className="stocky-board-table__header-cell text-left" aria-label="Row actions"><span className="stocky-table-header-label font-medium text-[10px] uppercase tracking-wide text-stocky-text-sub">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stocky-border-subtle">
            {pageRows.map((row) => {
              const expiryState = getLotState(row.earliestExpiry);
              const auditDate = lastAuditByProduct[row.product.id];
              const totalValue = row.product.unitCost * row.totalQuantity;
              return <tr key={row.product.id} className={`stocky-board-row align-middle ${selectedProductId === row.product.id ? 'stocky-board-row--selected' : ''}`} onClick={() => selectProduct(row.product.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectProduct(row.product.id); } }} tabIndex={0}>
                  {canSelect && <td className="stocky-board-table__selection-cell"><input type="checkbox" checked={selectedProductIds.includes(row.product.id)} onClick={(event) => event.stopPropagation()} onChange={() => onToggleProduct?.(row.product.id)} aria-label={`Select ${row.product.name}`} className="h-3.5 w-3.5 accent-stocky-primary" /></td>}
                  <td className="px-2.5 py-3"><div className="stocky-board-product-cell"><span className="block truncate text-xs font-medium text-stocky-text-main">{row.product.name}</span></div></td>
                  <td className="px-2.5 py-3"><div className="stocky-board-barcode"><BarcodeIcon size="xs" className="stocky-board-barcode__icon" /><span className="truncate text-xs text-stocky-text-main">{row.product.barcode || 'No barcode'}</span></div></td>
                  <td className="px-2.5 py-3"><span className="block truncate text-xs text-stocky-text-sub">{row.product.categoryName || 'General'}</span></td>
                  <td className="px-2.5 py-3"><div className="stocky-board-location-tags">{locationTags(row)}</div></td>
                  <td className="px-2.5 py-3 text-left"><span className="stocky-board-total block text-xs font-medium text-stocky-text-main">{row.totalQuantity.toLocaleString()}</span><span className="mt-0.5 block text-[10px] text-stocky-text-sub">{row.product.unitName}{row.totalQuantity === 1 ? '' : 's'}</span></td>
                  <td className="px-2.5 py-3 text-left"><div className="stocky-board-value-stack"><span className="stocky-board-value-main">{formatCurrency(row.product.unitCost)}</span><span className="stocky-board-value-sub">{formatCurrency(totalValue)} total</span></div></td>
                  <td className="px-2.5 py-3"><div className="stocky-board-date-stack"><span className="stocky-board-date-main">{formatDate(row.earliestExpiry?.expiryDate)}</span><span className={`stocky-board-date-tag ${expiryState.tone === 'critical' ? 'stocky-status-critical' : expiryState.tone === 'warning' ? 'stocky-status-warning' : 'stocky-status-success'}`}>{expiryState.label}</span></div></td>
                  <td className="px-2.5 py-3"><div className="stocky-board-date-stack"><span className="stocky-board-date-main">{auditDate ? formatDate(auditDate) : 'No audit date'}</span><span className={`stocky-board-date-tag ${auditDate ? 'stocky-status-muted' : 'stocky-status-warning'}`}>{auditDate ? 'Audited' : 'Never audited'}</span></div></td>
                  {rowActions(row)}
                </tr>
            })}
            {pageRows.length === 0 && <tr><td colSpan={canSelect ? 10 : 9} className="px-4 py-12 text-center text-xs text-stocky-text-sub">No products match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="stocky-board-table__footer"><div className="flex flex-wrap items-center gap-3 text-[11px] text-stocky-text-sub"><span>Showing {firstRowNumber.toLocaleString()}–{lastRowNumber.toLocaleString()} of {sortedRows.length.toLocaleString()} products</span><span>Rows per page <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className="stocky-table-page-size"><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></span>{hasActiveFilters && <span className="flex items-center gap-1.5"><span>{activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} active</span><button type="button" onClick={() => { setPage(0); setFilters({ product: '', productValues: [], barcode: '', barcodeValues: [], category: '', categoryValues: [], locations: '', locationValues: [], quantity: '', price: '', expiry: [], audit: [] }); setFilterSearch(''); }} className="stocky-table-clear-button"><XIcon size="xs" /> Clear</button></span>}</div><div className="flex items-center gap-2"><span className="text-[11px] text-stocky-text-sub">Page {currentPage + 1} of {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={currentPage === 0} className="stocky-table-page-button" aria-label="Previous page">‹</button><button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={currentPage >= pageCount - 1} className="stocky-table-page-button" aria-label="Next page">›</button></div></footer>
    </div>
  );
}
