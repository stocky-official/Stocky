'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, BarcodeIcon, CheckIcon, EditIcon, FilterIcon, MoreHorizontalIcon, PlusIcon, SearchIcon, TrashIcon, XIcon } from '@stocky/icons';
import type { Location, Product, StockLot, Supplier } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';
import { InventoryTableColumnFilterPopover } from './InventoryTableColumnFilterPopover';

export interface InventoryTableRow {
  product: Product;
  lots: StockLot[];
  totalQuantity: number;
  earliestExpiry: StockLot | null;
  hasAttention: boolean;
}

export type StockInventoryTableRow = InventoryTableRow;

export interface InventoryTableWidgetProps {
  rows: InventoryTableRow[];
  locations: Location[];
  suppliers?: Supplier[];
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

export type StockInventoryTableWidgetProps = InventoryTableWidgetProps;

export type SortKey = 'product' | 'barcode' | 'category' | 'locations' | 'quantity' | 'price' | 'expiry' | 'audit';
export type SortDirection = 'asc' | 'desc';
export type ExpiryFilter = 'all' | 'expired' | 'soon' | 'missing' | 'healthy';

export interface TableFilters {
  product: string;
  productValues: string[];
  barcode: string;
  barcodeValues: string[];
  category: string;
  categoryValues: string[];
  locations: string;
  locationValues: string[];
  quantity: string;
  quantityPreset?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  quantityMin?: string;
  quantityMax?: string;
  price: string;
  pricePreset?: 'all' | 'under_100' | '100_500' | 'over_500';
  priceMin?: string;
  priceMax?: string;
  expiry: ExpiryFilter[];
  audit: Array<'never' | 'audited'>;
}

const COLUMN_LABELS: Record<SortKey, string> = {
  product: 'Product',
  barcode: 'Barcode',
  category: 'Category',
  locations: 'Locations',
  quantity: 'Total Quantity',
  price: 'Price',
  expiry: 'Next Expiry Date',
  audit: 'Last Audit Date',
};

function getLotState(lot: StockLot | null, t?: (key: string) => string) {
  if (lot?.status === 'on_hold') return { label: t ? t('inventory.onHold') : 'On hold', tone: 'warning', category: 'healthy' as ExpiryFilter };
  if (lot?.status === 'returned') return { label: t ? t('inventory.returned') : 'Returned', tone: 'critical', category: 'healthy' as ExpiryFilter };
  if (lot?.status === 'disposed') return { label: t ? t('inventory.disposed') : 'Removed', tone: 'critical', category: 'healthy' as ExpiryFilter };
  if (lot?.quantityOnHand === 0 || lot?.status === 'depleted') return { label: t ? t('inventory.outOfStock') : 'Out of stock', tone: 'critical', category: 'healthy' as ExpiryFilter };
  if (!lot || !lot.expiryDate) return { label: t ? t('inventory.missingExpiry') : 'Missing expiry', tone: 'critical', category: 'missing' as ExpiryFilter };
  const days = Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: t ? t('inventory.expired') : 'Expired', tone: 'critical', category: 'expired' as ExpiryFilter };
  const daysText = t ? `${days} ${t('inventory.daysLeft')}` : `${days} day${days === 1 ? '' : 's'} left`;
  if (days <= (lot.expiryNotificationDays ?? 0)) return { label: daysText, tone: 'warning', category: 'soon' as ExpiryFilter };
  return { label: daysText, tone: 'success', category: 'healthy' as ExpiryFilter };
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

export function InventoryTableWidget({ rows = [], locations = [], suppliers = [], onReceive, onEdit, onDelete, selectedProductId: controlledSelectedProductId = null, onSelectProduct, canSelect = false, selectedProductIds = [], onToggleProduct, onToggleAll, lastAuditByProduct = {} }: InventoryTableWidgetProps) {
  const { t, isRtl } = useTranslation();
  const columnLabels: Record<SortKey, string> = {
    product: t('inventory.productName'),
    barcode: t('inventory.barcode'),
    category: t('inventory.category'),
    locations: t('inventory.location'),
    quantity: t('inventory.totalQuantity'),
    price: t('inventory.price'),
    expiry: t('inventory.expiryDate'),
    audit: t('inventory.lastAuditDate'),
  };
  const [internalSelectedProductId, setInternalSelectedProductId] = useState<string | null>(null);
  const [openFilter, setOpenFilter] = useState<SortKey | null>(null);
  const [filterMenuPosition, setFilterMenuPosition] = useState({ top: 0, left: 0 });
  const [openActionProductId, setOpenActionProductId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'product', direction: 'asc' });
  const [filters, setFilters] = useState<TableFilters>({
    product: '',
    productValues: [],
    barcode: '',
    barcodeValues: [],
    category: '',
    categoryValues: [],
    locations: '',
    locationValues: [],
    quantity: '',
    quantityPreset: 'all',
    quantityMin: '',
    quantityMax: '',
    price: '',
    pricePreset: 'all',
    priceMin: '',
    priceMax: '',
    expiry: [],
    audit: [],
  });
  const locationNames = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);
  const supplierNames = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])), [suppliers]);
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

    // Categorical multiselect values
    const productValueMatch = filters.productValues.length === 0 || filters.productValues.includes(row.product.name);
    const barcodeValueMatch = filters.barcodeValues.length === 0 || filters.barcodeValues.includes(row.product.barcode || 'No barcode');
    const categoryValueMatch = filters.categoryValues.length === 0 || filters.categoryValues.includes(row.product.categoryName || 'General');
    const rowLocations = lots.map((lot) => locationNames.get(lot.locationId) || '');
    const locationValueMatch = filters.locationValues.length === 0 || rowLocations.some((location) => filters.locationValues.includes(location));

    // Quantity range & presets
    const qty = row.totalQuantity ?? 0;
    let quantityMatch = true;
    if (filters.quantity && !String(qty).includes(filters.quantity.trim())) {
      quantityMatch = false;
    }
    if (filters.quantityPreset === 'in_stock' && qty <= 0) {
      quantityMatch = false;
    } else if (filters.quantityPreset === 'low_stock' && (qty <= 0 || qty > 10)) {
      quantityMatch = false;
    } else if (filters.quantityPreset === 'out_of_stock' && qty !== 0) {
      quantityMatch = false;
    }
    if (filters.quantityMin && filters.quantityMin.trim() !== '') {
      const min = Number(filters.quantityMin);
      if (!Number.isNaN(min) && qty < min) quantityMatch = false;
    }
    if (filters.quantityMax && filters.quantityMax.trim() !== '') {
      const max = Number(filters.quantityMax);
      if (!Number.isNaN(max) && qty > max) quantityMatch = false;
    }

    // Price range & presets
    const unitPrice = row.product.unitCost ?? 0;
    let priceMatch = true;
    if (filters.price && !String(unitPrice).includes(filters.price.trim())) {
      priceMatch = false;
    }
    if (filters.pricePreset === 'under_100' && unitPrice >= 100) {
      priceMatch = false;
    } else if (filters.pricePreset === '100_500' && (unitPrice < 100 || unitPrice > 500)) {
      priceMatch = false;
    } else if (filters.pricePreset === 'over_500' && unitPrice <= 500) {
      priceMatch = false;
    }
    if (filters.priceMin && filters.priceMin.trim() !== '') {
      const min = Number(filters.priceMin);
      if (!Number.isNaN(min) && unitPrice < min) priceMatch = false;
    }
    if (filters.priceMax && filters.priceMax.trim() !== '') {
      const max = Number(filters.priceMax);
      if (!Number.isNaN(max) && unitPrice > max) priceMatch = false;
    }

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

  const isColumnActive = (key: SortKey) => {
    switch (key) {
      case 'product':
        return Boolean(filters.product || filters.productValues.length);
      case 'barcode':
        return Boolean(filters.barcode || filters.barcodeValues.length);
      case 'category':
        return Boolean(filters.category || filters.categoryValues.length);
      case 'locations':
        return Boolean(filters.locations || filters.locationValues.length);
      case 'quantity':
        return Boolean((filters.quantityPreset && filters.quantityPreset !== 'all') || filters.quantityMin || filters.quantityMax || filters.quantity);
      case 'price':
        return Boolean((filters.pricePreset && filters.pricePreset !== 'all') || filters.priceMin || filters.priceMax || filters.price);
      case 'expiry':
        return filters.expiry.length > 0;
      case 'audit':
        return filters.audit.length > 0;
      default:
        return false;
    }
  };

  const hasActiveFilters = Boolean(
    isColumnActive('product') ||
    isColumnActive('barcode') ||
    isColumnActive('category') ||
    isColumnActive('locations') ||
    isColumnActive('quantity') ||
    isColumnActive('price') ||
    isColumnActive('expiry') ||
    isColumnActive('audit')
  );

  const activeFilterCount = [
    isColumnActive('product'),
    isColumnActive('barcode'),
    isColumnActive('category'),
    isColumnActive('locations'),
    isColumnActive('quantity'),
    isColumnActive('price'),
    isColumnActive('expiry'),
    isColumnActive('audit'),
  ].filter(Boolean).length;

  const resetColumnFilter = (key: SortKey) => {
    setPage(0);
    setFilters((current) => {
      switch (key) {
        case 'product':
          return { ...current, product: '', productValues: [] };
        case 'barcode':
          return { ...current, barcode: '', barcodeValues: [] };
        case 'category':
          return { ...current, category: '', categoryValues: [] };
        case 'locations':
          return { ...current, locations: '', locationValues: [] };
        case 'quantity':
          return { ...current, quantity: '', quantityPreset: 'all', quantityMin: '', quantityMax: '' };
        case 'price':
          return { ...current, price: '', pricePreset: 'all', priceMin: '', priceMax: '' };
        case 'expiry':
          return { ...current, expiry: [] };
        case 'audit':
          return { ...current, audit: [] };
        default:
          return current;
      }
    });
  };

  const clearAllFilters = () => {
    setPage(0);
    setFilters({
      product: '',
      productValues: [],
      barcode: '',
      barcodeValues: [],
      category: '',
      categoryValues: [],
      locations: '',
      locationValues: [],
      quantity: '',
      quantityPreset: 'all',
      quantityMin: '',
      quantityMax: '',
      price: '',
      pricePreset: 'all',
      priceMin: '',
      priceMax: '',
      expiry: [],
      audit: [],
    });
  };

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

  const optionCountsByColumn = useMemo(() => {
    const counts: Partial<Record<SortKey, Record<string, number>>> = {
      product: {},
      barcode: {},
      category: {},
      locations: {},
      expiry: {
        expired: 0,
        soon: 0,
        healthy: 0,
        missing: 0,
      },
      audit: {
        audited: 0,
        never: 0,
      },
    };

    for (const row of rows) {
      if (!row?.product) continue;
      const pName = row.product.name;
      if (pName) counts.product![pName] = (counts.product![pName] || 0) + 1;
      const bCode = row.product.barcode || 'No barcode';
      counts.barcode![bCode] = (counts.barcode![bCode] || 0) + 1;
      const cName = row.product.categoryName || 'General';
      counts.category![cName] = (counts.category![cName] || 0) + 1;
      const lots = Array.isArray(row.lots) ? row.lots : [];
      const seenLocs = new Set<string>();
      for (const lot of lots) {
        seenLocs.add(locationNames.get(lot.locationId) || 'Location');
      }
      for (const loc of seenLocs) {
        counts.locations![loc] = (counts.locations![loc] || 0) + 1;
      }
      const expiryCategory = getLotState(row.earliestExpiry).category;
      counts.expiry![expiryCategory] = (counts.expiry![expiryCategory] || 0) + 1;
      const auditStatus = lastAuditByProduct[row.product.id] ? 'audited' : 'never';
      counts.audit![auditStatus] = (counts.audit![auditStatus] || 0) + 1;
    }
    return counts;
  }, [lastAuditByProduct, locationNames, rows]);

  const openColumnFilter = (key: SortKey, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const triggerBounds = event.currentTarget.getBoundingClientRect();
    const menuWidth = Math.min(320, window.innerWidth - 32);
    const menuHeight = 420;
    const sidebar = document.querySelector<HTMLElement>('.stocky-workspace-sidebar');
    const sidebarBounds = sidebar?.getBoundingClientRect();

    let minLeft = 16;
    let maxLeft = window.innerWidth - menuWidth - 16;

    if (sidebarBounds && sidebarBounds.width > 0 && sidebarBounds.width < window.innerWidth) {
      const isSidebarOnRight = sidebarBounds.left > window.innerWidth / 2;
      if (isSidebarOnRight) {
        // Arabic / RTL: Sidebar is on the right side of the screen
        maxLeft = Math.min(maxLeft, Math.max(16, sidebarBounds.left - menuWidth - 16));
      } else {
        // English / LTR: Sidebar is on the left side of the screen
        minLeft = Math.max(minLeft, sidebarBounds.right + 16);
      }
    }

    if (minLeft > maxLeft) {
      minLeft = 16;
      maxLeft = window.innerWidth - menuWidth - 16;
    }

    let targetLeft: number;
    if (isRtl) {
      // In RTL, align right edge of popover with column header cell's right edge
      const thBounds = event.currentTarget.closest('th')?.getBoundingClientRect() ?? triggerBounds;
      const idealLeft = thBounds.right - menuWidth;
      targetLeft = Math.max(minLeft, Math.min(idealLeft, maxLeft));
    } else {
      // In LTR, align popover with the trigger
      const idealLeft = triggerBounds.right - menuWidth + 24;
      targetLeft = Math.max(minLeft, Math.min(idealLeft, maxLeft));
    }

    const left = Math.max(16, Math.min(targetLeft, Math.max(16, window.innerWidth - menuWidth - 16)));
    const belowTop = triggerBounds.bottom + 8;
    const top = belowTop + menuHeight <= window.innerHeight
      ? belowTop
      : Math.max(16, triggerBounds.top - menuHeight - 8);

    setFilterMenuPosition({ top, left });
    setOpenFilter((current) => (current === key ? null : key));
  };

  const header = (label: string, key: SortKey, align: 'start' | 'end' = 'start') => (
    <th className={`stocky-board-table__header-cell px-4 py-3 align-middle ${align === 'end' ? 'text-end' : 'text-start'}`}>
      <div className="stocky-table-header-content" data-stock-column-filter>
        <button type="button" onClick={() => sortBy(key)} className="stocky-table-sort-button" aria-label={`Sort by ${label}`}>
          <span className="stocky-table-header-label">{label}</span>
          <span className="stocky-table-sort-indicator" aria-hidden="true">{sortIndicator(key)}</span>
        </button>
        <button
          type="button"
          onClick={(event) => openColumnFilter(key, event)}
          className={`stocky-table-filter-trigger ${isColumnActive(key) ? 'stocky-table-filter-trigger--active' : ''}`}
          aria-label={`Filter ${label}`}
          aria-expanded={openFilter === key}
        >
          <FilterIcon size={11} />
        </button>
      </div>
    </th>
  );
  const locationTags = (row: StockInventoryTableRow) => {
    const totals = locations.map((location) => ({ location, quantity: row.lots.filter((lot) => lot.locationId === location.id).reduce((sum, lot) => sum + lot.quantityOnHand, 0) })).filter(({ quantity }) => quantity > 0);
    return totals.length === 0 ? <span className="text-xs text-stocky-text-sub">No stock</span> : totals.map(({ location, quantity }) => <span key={location.id} className="stocky-board-location-tag"><span className="truncate">{location.name}</span><span>({quantity.toLocaleString()})</span></span>);
  };
  const rowActions = (row: StockInventoryTableRow) => (
    <td className="stocky-board-actions-cell text-center">
      <div className="stocky-board-actions flex items-center justify-center" data-stock-row-actions onClick={(event) => event.stopPropagation()}>
        <div className="relative inline-flex items-center justify-center">
          <button type="button" onClick={() => setOpenActionProductId((current) => current === row.product.id ? null : row.product.id)} className="stocky-board-more-button" aria-label={`More actions for ${row.product.name}`} aria-expanded={openActionProductId === row.product.id} aria-haspopup="menu">
            <MoreHorizontalIcon size="xs" />
          </button>
          {openActionProductId === row.product.id && <div className="stocky-row-actions-menu" role="menu">
            {onEdit && <button type="button" role="menuitem" onClick={() => { setOpenActionProductId(null); onEdit(row.product); }} className="stocky-row-actions-menu__item whitespace-nowrap"><EditIcon size="xs" /><span className="whitespace-nowrap">Edit product</span></button>}
            <button type="button" role="menuitem" onClick={() => { setOpenActionProductId(null); onReceive(row.product.id); }} className="stocky-row-actions-menu__item whitespace-nowrap"><PlusIcon size="xs" /><span className="whitespace-nowrap">Add inventory / lot</span></button>
            {onDelete && <button type="button" role="menuitem" onClick={() => { setOpenActionProductId(null); onDelete(row.product); }} className="stocky-row-actions-menu__item stocky-row-actions-menu__item--danger whitespace-nowrap"><TrashIcon size="xs" /><span className="whitespace-nowrap">Delete product</span></button>}
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
            <tr className="stocky-board-table__column-row text-[10px] uppercase tracking-wide text-stocky-text-sub h-11">
              {canSelect && (
                <th className="stocky-board-table__selection-cell px-2 py-3 text-center align-middle">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => onToggleAll?.(allSelected ? [] : visibleProductIds)}
                    aria-label="Select all filtered products"
                    className="h-3.5 w-3.5 accent-stocky-primary block mx-auto"
                  />
                </th>
              )}
              {header(columnLabels.product, 'product')}
              {header(columnLabels.barcode, 'barcode')}
              {header(columnLabels.category, 'category')}
              {header(columnLabels.locations, 'locations')}
              {header(columnLabels.quantity, 'quantity')}
              {header(columnLabels.price, 'price')}
              {header(columnLabels.expiry, 'expiry')}
              {header(columnLabels.audit, 'audit')}
              <th className="stocky-board-table__header-cell px-4 py-3 text-center align-middle" aria-label="Row actions">
                <span className="stocky-table-header-label font-medium text-[10px] uppercase tracking-wide text-stocky-text-sub">{t('common.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stocky-border-subtle">
            {pageRows.map((row) => {
              const expiryState = getLotState(row.earliestExpiry, t);
              const auditDate = lastAuditByProduct[row.product.id];
              const totalValue = row.product.unitCost * row.totalQuantity;
              const supplierName = row.product.defaultSupplierId
                ? supplierNames.get(row.product.defaultSupplierId)
                : (row.lots.find((lot) => lot.supplierId && supplierNames.has(lot.supplierId))?.supplierId
                    ? supplierNames.get(row.lots.find((lot) => lot.supplierId && supplierNames.has(lot.supplierId))!.supplierId!)
                    : null);
              return <tr key={row.product.id} className={`stocky-board-row align-middle ${selectedProductId === row.product.id ? 'stocky-board-row--selected' : ''}`} onClick={() => selectProduct(row.product.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectProduct(row.product.id); } }} tabIndex={0}>
                  {canSelect && <td className="stocky-board-table__selection-cell"><input type="checkbox" checked={selectedProductIds.includes(row.product.id)} onClick={(event) => event.stopPropagation()} onChange={() => onToggleProduct?.(row.product.id)} aria-label={`Select ${row.product.name}`} className="h-3.5 w-3.5 accent-stocky-primary" /></td>}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stocky-border-subtle bg-stocky-bg-global text-stocky-text-sub select-none">
                        {row.product.imageUrl ? (
                          <img
                            src={row.product.imageUrl}
                            alt={row.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[11px] font-medium text-stocky-text-sub uppercase tracking-wider">
                            {row.product.name.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-stocky-text-main" title={row.product.name}>
                          {row.product.name}
                        </span>
                        <span className="block truncate text-[10px] text-stocky-text-sub">
                          {supplierName || (t('common.unassigned') || 'No supplier')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="stocky-board-barcode"><BarcodeIcon size="xs" className="stocky-board-barcode__icon" /><span className="truncate text-xs text-stocky-text-main">{row.product.barcode || t('inventory.noBarcode')}</span></div></td>
                  <td className="px-4 py-3"><span className="block truncate text-xs text-stocky-text-sub">{row.product.categoryName || 'General'}</span></td>
                  <td className="px-4 py-3"><div className="stocky-board-location-tags">{locationTags(row)}</div></td>
                  <td className="px-4 py-3 text-start"><span className="stocky-board-total block text-xs font-medium text-stocky-text-main">{row.totalQuantity.toLocaleString()}</span><span className="mt-0.5 block text-[10px] text-stocky-text-sub">{row.product.unitName}{row.totalQuantity === 1 ? '' : 's'}</span></td>
                  <td className="px-4 py-3 text-start"><div className="stocky-board-value-stack"><span className="stocky-board-value-main">{formatCurrency(row.product.unitCost)}</span><span className="stocky-board-value-sub">{formatCurrency(totalValue)} {t('inventory.total')}</span></div></td>
                  <td className="px-4 py-3"><div className="stocky-board-date-stack"><span className="stocky-board-date-main">{formatDate(row.earliestExpiry?.expiryDate)}</span><span className={`stocky-board-date-tag ${expiryState.tone === 'critical' ? 'stocky-status-critical' : expiryState.tone === 'warning' ? 'stocky-status-warning' : 'stocky-status-success'}`}>{expiryState.label}</span></div></td>
                  <td className="px-4 py-3"><div className="stocky-board-date-stack"><span className="stocky-board-date-main">{auditDate ? formatDate(auditDate) : t('common.notRecorded')}</span><span className={`stocky-board-date-tag ${auditDate ? 'stocky-status-muted' : 'stocky-status-warning'}`}>{auditDate ? t('inventory.audited') : t('inventory.neverAudited')}</span></div></td>
                  {rowActions(row)}
                </tr>
            })}
            {pageRows.length === 0 && <tr><td colSpan={canSelect ? 10 : 9} className="px-4 py-12 text-center text-xs text-stocky-text-sub">{t('inventory.noProductsFound')}</td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="stocky-board-table__footer"><div className="flex flex-wrap items-center gap-3 text-[11px] text-stocky-text-sub"><span>{t('common.showing')} {firstRowNumber.toLocaleString()}–{lastRowNumber.toLocaleString()} {t('common.of')} {sortedRows.length.toLocaleString()} {t('inventory.productName').toLowerCase()}</span><span>{t('inventory.rowsPerPage')} <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className="stocky-table-page-size"><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></span>{hasActiveFilters && <span className="flex items-center gap-1.5"><span>{activeFilterCount} {t('inventory.filtersActive')}</span><button type="button" onClick={clearAllFilters} className="stocky-table-clear-button"><XIcon size="xs" /> {t('inventory.clear')}</button></span>}</div><div className="flex items-center gap-2"><span className="text-[11px] text-stocky-text-sub">{t('common.page')} {currentPage + 1} {t('common.of')} {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={currentPage === 0} className="stocky-table-page-button" aria-label="Previous page">‹</button><button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={currentPage >= pageCount - 1} className="stocky-table-page-button" aria-label="Next page">›</button></div></footer>
      {openFilter && (
        <InventoryTableColumnFilterPopover
          isOpen={Boolean(openFilter)}
          onClose={() => setOpenFilter(null)}
          position={filterMenuPosition}
          columnKey={openFilter}
          columnLabel={columnLabels[openFilter]}
          filters={filters}
          onUpdateFilter={updateFilter}
          onResetColumn={resetColumnFilter}
          options={filterOptions(openFilter)}
          optionCounts={optionCountsByColumn[openFilter]}
        />
      )}
    </div>
  );
}

export const StockInventoryTableWidget = InventoryTableWidget;

