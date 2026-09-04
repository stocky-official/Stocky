'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  SearchIcon,
  BarcodeIcon,
  TagIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  PlusIcon,
  FilterIcon,
  BoxesIcon,
} from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import type { Item, CompanyUserRole } from '@stocky/types';
import { RecordEditDrawerWidget } from '../RecordEditDrawerWidget/RecordEditDrawerWidget';
import { ExcelImportModalWidget } from '../ExcelImportModalWidget/ExcelImportModalWidget';
import { exportInventoryToExcel } from '@/lib/excel/export';

export interface InventoryTableWidgetProps {
  selectedBranchId: string;
  selectedBranchName: string;
  allCategories?: string[];
  initialItems?: Item[];
  userRole?: CompanyUserRole;
}

/**
 * InventoryTableWidget (v0.1.0 Design System)
 * Displays item inventory overall or by branch with live server-side database querying:
 * - Multi-column filters: Stock Status, Valuation / Balance, Barcode, Expiry Date, Category
 * - Toolbar actions: + Add Item, Import Excel, Export Excel (.xlsx)
 * - Content-driven column widths & Excel-style clickable sort headers
 * - Logical column order: Item Name -> Category -> Quantity -> Balance -> Barcode -> Expiry Date -> Actions
 * - Spacious breathing room for Action buttons (Edit & Delete)
 * - Interactive Edit & Create Drawers (RecordEditDrawerWidget) saving directly to Supabase
 */
export function InventoryTableWidget({
  selectedBranchId,
  selectedBranchName,
  allCategories = [],
  initialItems = [],
  userRole = 'owner',
}: InventoryTableWidgetProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  // Automatically select Cards mode on mobile phone screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('cards');
    }
  }, []);


  // Advanced Column Filter States
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'zero' | 'under_100' | 'high_value'>('all');
  const [barcodeFilter, setBarcodeFilter] = useState<'all' | 'has_barcode' | 'no_barcode'>('all');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'valid' | 'expiring_soon' | 'expired' | 'missing'>('all');
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

  // Modals & Drawers
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Multiple Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const isAllSelected = useMemo(() => {
    return items.length > 0 && items.every((item) => selectedItemIds.has(item.id));
  }, [items, selectedItemIds]);

  const isIndeterminate = useMemo(() => {
    const count = items.filter((item) => selectedItemIds.has(item.id)).length;
    return count > 0 && count < items.length;
  }, [items, selectedItemIds]);

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(items.map((i) => i.id)));
    }
  };

  const clearSelection = () => {
    setSelectedItemIds(new Set());
  };

  const handleBulkExport = () => {
    const selectedItems = items.filter((i) => selectedItemIds.has(i.id));
    if (selectedItems.length === 0) return;
    exportInventoryToExcel(
      selectedItems,
      `inventory-${selectedBranchName.toLowerCase().replace(/\s+/g, '-')}-selected-${selectedItems.length}`
    );
  };

  const handleBulkDelete = async () => {
    const count = selectedItemIds.size;
    if (count === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${count} selected item${
          count > 1 ? 's' : ''
        }? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      setLoading(true);
      const ids = Array.from(selectedItemIds);
      const { error } = await supabase.from('items').delete().in('id', ids);
      if (error) throw error;
      clearSelection();
      await fetchInventory();
    } catch (err: any) {
      alert(`Failed to delete selected items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic viewport-adaptive pagination
  useEffect(() => {
    const calculatePageRows = () => {
      const vh = window.innerHeight;
      const availableHeight = Math.max(240, vh - 360);
      const rows = Math.max(5, Math.floor(availableHeight / 48));
      setPageSize(rows);
    };

    calculatePageRows();
    window.addEventListener('resize', calculatePageRows);
    return () => window.removeEventListener('resize', calculatePageRows);
  }, []);

  // Reset page when pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Sorting state (Excel-style)
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Debounce search query input (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page when branch or any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranchId, selectedCategory, stockFilter, balanceFilter, barcodeFilter, expiryFilter]);

  // Excel-style sort handler
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Count active non-default filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (stockFilter !== 'all') count++;
    if (balanceFilter !== 'all') count++;
    if (barcodeFilter !== 'all') count++;
    if (expiryFilter !== 'all') count++;
    return count;
  }, [selectedCategory, stockFilter, balanceFilter, barcodeFilter, expiryFilter]);

  const handleClearAllFilters = () => {
    setSelectedCategory('all');
    setStockFilter('all');
    setBalanceFilter('all');
    setBarcodeFilter('all');
    setExpiryFilter('all');
    setSearchQuery('');
  };

  // Live Database Query
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('items').select('*', { count: 'exact' });

      // Branch filter
      if (selectedBranchId !== 'all') {
        query = query.eq('branch_id', selectedBranchId);
      }

      // Category filter
      if (selectedCategory !== 'all') {
        query = query.eq('category_name', selectedCategory);
      }

      // Stock status filter
      if (stockFilter === 'in_stock') {
        query = query.gt('quantity', 0);
      } else if (stockFilter === 'low_stock') {
        query = query.lte('quantity', 10).gt('quantity', 0);
      } else if (stockFilter === 'out_of_stock') {
        query = query.eq('quantity', 0);
      }

      // Balance / valuation filter
      if (balanceFilter === 'zero') {
        query = query.eq('balance', 0);
      } else if (balanceFilter === 'under_100') {
        query = query.lt('balance', 100).gt('balance', 0);
      } else if (balanceFilter === 'high_value') {
        query = query.gte('balance', 1000);
      }

      // Barcode filter
      if (barcodeFilter === 'has_barcode') {
        query = query.not('barcode', 'is', null).neq('barcode', '');
      } else if (barcodeFilter === 'no_barcode') {
        query = query.or('barcode.is.null,barcode.eq.');
      }

      // Expiry date filter
      if (expiryFilter !== 'all') {
        const nowStr = new Date().toISOString();
        const soonDate = new Date(Date.now() + 30 * 86400000).toISOString();
        if (expiryFilter === 'expired') {
          query = query.not('expiry_date', 'is', null).lt('expiry_date', nowStr);
        } else if (expiryFilter === 'expiring_soon') {
          query = query.not('expiry_date', 'is', null).gte('expiry_date', nowStr).lte('expiry_date', soonDate);
        } else if (expiryFilter === 'valid') {
          query = query.not('expiry_date', 'is', null).gt('expiry_date', soonDate);
        } else if (expiryFilter === 'missing') {
          query = query.is('expiry_date', null);
        }
      }

      // Search query filter (matches item name or barcode)
      if (debouncedSearch.trim()) {
        const cleanTerm = debouncedSearch.replace(/[,()":]/g, ' ').trim();
        if (cleanTerm) {
          query = query.or(`name.ilike.%${cleanTerm}%,barcode.ilike.%${cleanTerm}%`);
        }
      }

      // Pagination range
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query
        .order(sortColumn, { ascending: sortDirection === 'asc' })
        .range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      const mappedItems: Item[] = (data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        categoryName: row.category_name,
        quantity: row.quantity,
        balance: row.balance,
        barcode: row.barcode,
        expiryDate: row.expiry_date,
        branchId: row.branch_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setItems(mappedItems);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Failed to query inventory items:', err);
    } finally {
      setLoading(false);
    }
  }, [
    selectedBranchId,
    selectedCategory,
    stockFilter,
    balanceFilter,
    barcodeFilter,
    expiryFilter,
    debouncedSearch,
    currentPage,
    pageSize,
    sortColumn,
    sortDirection,
  ]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory, refreshTrigger]);

  // Export to Excel handler
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      let query = supabase.from('items').select('*');

      if (selectedBranchId !== 'all') {
        query = query.eq('branch_id', selectedBranchId);
      }
      if (selectedCategory !== 'all') {
        query = query.eq('category_name', selectedCategory);
      }
      if (stockFilter === 'in_stock') {
        query = query.gt('quantity', 0);
      } else if (stockFilter === 'low_stock') {
        query = query.lte('quantity', 10).gt('quantity', 0);
      } else if (stockFilter === 'out_of_stock') {
        query = query.eq('quantity', 0);
      }
      if (balanceFilter === 'zero') {
        query = query.eq('balance', 0);
      } else if (balanceFilter === 'under_100') {
        query = query.lt('balance', 100).gt('balance', 0);
      } else if (balanceFilter === 'high_value') {
        query = query.gte('balance', 1000);
      }
      if (barcodeFilter === 'has_barcode') {
        query = query.not('barcode', 'is', null).neq('barcode', '');
      } else if (barcodeFilter === 'no_barcode') {
        query = query.or('barcode.is.null,barcode.eq.');
      }
      if (expiryFilter !== 'all') {
        const nowStr = new Date().toISOString();
        const soonDate = new Date(Date.now() + 30 * 86400000).toISOString();
        if (expiryFilter === 'expired') {
          query = query.not('expiry_date', 'is', null).lt('expiry_date', nowStr);
        } else if (expiryFilter === 'expiring_soon') {
          query = query.not('expiry_date', 'is', null).gte('expiry_date', nowStr).lte('expiry_date', soonDate);
        } else if (expiryFilter === 'valid') {
          query = query.not('expiry_date', 'is', null).gt('expiry_date', soonDate);
        } else if (expiryFilter === 'missing') {
          query = query.is('expiry_date', null);
        }
      }
      if (debouncedSearch.trim()) {
        const cleanTerm = debouncedSearch.replace(/[,()":]/g, ' ').trim();
        if (cleanTerm) query = query.or(`name.ilike.%${cleanTerm}%,barcode.ilike.%${cleanTerm}%`);
      }

      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;

      const exportItems: Item[] = (data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        categoryName: row.category_name,
        quantity: row.quantity,
        balance: row.balance,
        barcode: row.barcode,
        expiryDate: row.expiry_date,
        branchId: row.branch_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      exportInventoryToExcel(exportItems, selectedBranchName);
    } catch (err: any) {
      alert('Failed to export Excel: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    return allCategories.slice().sort();
  }, [allCategories]);

  // Pagination bounds
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startRange = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, totalCount);

  // Edit / Delete handlers
  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
  };

  const handleSaveSuccess = (updatedItem: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? { ...i, ...updatedItem } : i))
    );
  };

  const handleDeleteClick = async (item: Item) => {
    if (confirm(`Are you sure you want to delete "${item.name}" from inventory?`)) {
      try {
        const { error } = await supabase.from('items').delete().eq('id', item.id);
        if (error) throw error;
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setTotalCount((prev) => Math.max(0, prev - 1));
      } catch (err: any) {
        alert('Failed to delete item: ' + err.message);
      }
    }
  };

  const renderSortIndicator = (columnKey: string) => {
    if (sortColumn === columnKey) {
      return sortDirection === 'asc' ? (
        <ArrowUpIcon size="xs" className="text-stocky-primary shrink-0" />
      ) : (
        <ArrowDownIcon size="xs" className="text-stocky-primary shrink-0" />
      );
    }
    return (
      <ArrowUpDownIcon
        size="xs"
        className="text-stocky-text-sub/40 group-hover:text-stocky-text-sub shrink-0"
      />
    );
  };

  return (
    <>
      <Card className="p-0 overflow-hidden bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget">
        {/* Table Header & Action Controls */}
        <div className="p-4 sm:p-5 border-b border-stocky-border-subtle flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-stocky-text-main">
                {selectedBranchName} Inventory
              </h2>
              {loading && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-stocky-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <p className="text-xs font-normal text-stocky-text-sub mt-0.5">
              Total items: {totalCount.toLocaleString()} • Page {currentPage} of {totalPages}
            </p>
          </div>

          {/* Action Toolbar: + Add Item, Import Excel, Export Excel, Filter Toggle */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* 1. Add Item Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateDrawerOpen(true)}
              className="h-8 px-3 text-xs flex items-center gap-1.5 shadow-sm"
            >
              <PlusIcon size="xs" />
              <span>Add Item</span>
            </Button>

            {/* 2. Import Excel Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="h-8 px-3 text-xs flex items-center gap-1.5 border-stocky-border-subtle hover:text-stocky-primary"
            >
              <BoxesIcon size="xs" />
              <span>Import Excel</span>
            </Button>

            {/* 3. Export Excel Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="h-8 px-3 text-xs flex items-center gap-1.5 border-stocky-border-subtle hover:text-stocky-primary"
            >
              {isExporting ? (
                <span className="w-3.5 h-3.5 border-2 border-stocky-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowDownIcon size="xs" />
              )}
              <span>Export Excel</span>
            </Button>

            {/* 4. Filters Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterPanel((prev) => !prev)}
              className={`h-8 px-3 text-xs flex items-center gap-1.5 border-stocky-border-subtle ${
                showFilterPanel || activeFiltersCount > 0
                  ? 'border-stocky-primary text-stocky-primary bg-stocky-primary/5'
                  : 'hover:text-stocky-primary'
              }`}
            >
              <FilterIcon size="xs" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-stocky-primary text-white text-[10px] font-medium flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {/* 5. View Mode Switcher (Table vs Cards) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table view"
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Cards view"
              >
                Cards
              </button>
            </div>
          </div>
        </div>


        {/* Search Bar & Primary Filter Controls */}
        <div className="px-4 sm:px-5 py-3 border-b border-stocky-border-subtle bg-stocky-bg-global/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stocky-text-sub pointer-events-none">
                <SearchIcon size="xs" />
              </span>
              <input
                type="text"
                placeholder="Search by name, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 bg-stocky-bg-global border border-stocky-border-subtle rounded-widget pl-8 pr-8 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:outline-none focus:border-stocky-primary transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main transition-colors p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <XIcon size="xs" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 bg-stocky-bg-global border border-stocky-border-subtle rounded-widget text-xs text-stocky-text-main px-3 focus:outline-none focus:border-stocky-primary cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Active Filter Count & Reset */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs text-stocky-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              Reset all filters ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Multi-Column Filter Drawer/Panel (Stock, Balance, Barcode, Expiry) */}
        {showFilterPanel && (
          <div className="px-4 sm:px-5 py-3.5 border-b border-stocky-border-subtle bg-stocky-bg-global/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Column 1: Stock / Quantity Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stocky-text-sub block">
                Stock Level (Quantity)
              </label>
              <select
                value={stockFilter}
                onChange={(e: any) => setStockFilter(e.target.value)}
                className="w-full h-8 px-2.5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary cursor-pointer"
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock (&gt; 0 units)</option>
                <option value="low_stock">Low Stock (≤ 10 units)</option>
                <option value="out_of_stock">Out of Stock (0 units)</option>
              </select>
            </div>

            {/* Column 2: Valuation / Balance Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stocky-text-sub block">
                Valuation / Balance
              </label>
              <select
                value={balanceFilter}
                onChange={(e: any) => setBalanceFilter(e.target.value)}
                className="w-full h-8 px-2.5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary cursor-pointer"
              >
                <option value="all">All Balances</option>
                <option value="zero">Zero Balance ($0.00)</option>
                <option value="under_100">Under $100</option>
                <option value="high_value">High Value (≥ $1,000)</option>
              </select>
            </div>

            {/* Column 3: Barcode Presence Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stocky-text-sub block">
                Barcode Status
              </label>
              <select
                value={barcodeFilter}
                onChange={(e: any) => setBarcodeFilter(e.target.value)}
                className="w-full h-8 px-2.5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary cursor-pointer"
              >
                <option value="all">All Items</option>
                <option value="has_barcode">Has Barcode</option>
                <option value="no_barcode">Missing Barcode</option>
              </select>
            </div>

            {/* Column 4: Expiry Date Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stocky-text-sub block">
                Expiry Date Status
              </label>
              <select
                value={expiryFilter}
                onChange={(e: any) => setExpiryFilter(e.target.value)}
                className="w-full h-8 px-2.5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary cursor-pointer"
              >
                <option value="all">All Expiry Dates</option>
                <option value="valid">Valid (&gt; 30 days)</option>
                <option value="expiring_soon">Expiring Soon (≤ 30 days)</option>
                <option value="expired">Expired</option>
                <option value="missing">No Expiry Date Set</option>
              </select>
            </div>
          </div>
        )}

        {/* Mobile / Responsive Cards Grid (Auto on mobile or when Cards mode is selected) */}
        <div
          className={
            viewMode === 'table'
              ? 'hidden'
              : viewMode === 'cards'
              ? 'block'
              : 'block md:hidden'
          }
        >
          {items.length === 0 ? (
            <div className="py-12 text-center text-xs text-stocky-text-sub">
              {loading
                ? 'Fetching inventory from database...'
                : 'No inventory items found matching your filter criteria.'}
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-3">
              {/* Select All header bar for mobile */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all visible items"
                    className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle"
                  />
                  <span className="font-medium text-slate-700">Select All Visible</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {items.length} items
                </span>
              </div>

              {/* Cards list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((item) => {
                  const isSelected = selectedItemIds.has(item.id);
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock = item.quantity > 0 && item.quantity <= 10;

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelectItem(item.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-blue-50/60 border-stocky-primary shadow-sm'
                          : 'bg-white border-slate-100 shadow-bevel hover:border-slate-200'
                      }`}
                    >
                      {/* Top row: Checkbox, Name, and Actions */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectItem(item.id)}
                              aria-label={`Select ${item.name}`}
                              className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-slate-900 leading-snug break-words">
                              {item.name}
                            </h4>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                                <TagIcon size="xs" className="text-slate-400" />
                                <span>{item.categoryName || 'General'}</span>
                              </span>
                              {item.barcode && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                  <BarcodeIcon size="xs" />
                                  <span>{item.barcode}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div
                          className="flex items-center gap-1.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="w-7 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-stocky-primary flex items-center justify-center transition-colors cursor-pointer"
                            title={`Edit ${item.name}`}
                          >
                            <EditIcon size="xs" />
                          </button>
                          {userRole !== 'staff' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(item)}
                              className="w-7 h-7 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 text-slate-600 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                              title={`Delete ${item.name}`}
                            >
                              <TrashIcon size="xs" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Metric Chips Row */}
                      <div className="mt-3 pt-3 border-t border-slate-100/80 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50/70 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Stock Qty</span>
                          <span
                            className={`text-xs font-semibold block mt-0.5 ${
                              isOutOfStock
                                ? 'text-rose-600'
                                : isLowStock
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {item.quantity.toLocaleString()} units
                          </span>
                        </div>

                        <div className="bg-slate-50/70 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Valuation</span>
                          <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                            ${Number(item.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="bg-slate-50/70 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Expiry Date</span>
                          <span className="text-[11px] font-medium text-slate-600 block mt-0.5 truncate">
                            {item.expiryDate ? item.expiryDate.split('T')[0] : 'No expiry'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Multi-Column Table View (Shown on md+ screens or when viewMode === 'table') */}
        <div
          className={
            viewMode === 'cards'
              ? 'hidden'
              : viewMode === 'table'
              ? 'block overflow-x-auto'
              : 'hidden md:block overflow-x-auto'
          }
        >
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stocky-bg-global text-stocky-text-sub border-b border-stocky-border-subtle select-none">
                {/* 0. Select Box Column */}
                <th className="py-3 px-3 w-10 min-w-[40px] text-center">
                  <input
                    type="checkbox"
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all visible items"
                    className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle"
                  />
                </th>

                {/* 1. Item Name (Logical 1st column) */}
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 font-medium min-w-[280px] cursor-pointer hover:text-stocky-primary transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Item Name</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>

                {/* 2. Category (Logical 2nd column) */}
                <th
                  onClick={() => handleSort('category_name')}
                  className="py-3 px-4 font-medium w-44 min-w-[150px] cursor-pointer hover:text-stocky-primary transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    {renderSortIndicator('category_name')}
                  </div>
                </th>

                {/* 3. Quantity (Logical 3rd column) */}
                <th
                  onClick={() => handleSort('quantity')}
                  className="py-3 px-4 font-medium text-right w-28 cursor-pointer hover:text-stocky-primary transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Quantity</span>
                    {renderSortIndicator('quantity')}
                  </div>
                </th>

                {/* 4. Balance (Logical 4th column) */}
                <th
                  onClick={() => handleSort('balance')}
                  className="py-3 px-4 font-medium text-right w-32 cursor-pointer hover:text-stocky-primary transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Balance</span>
                    {renderSortIndicator('balance')}
                  </div>
                </th>

                {/* 5. Barcode (Logical 5th column) */}
                <th
                  onClick={() => handleSort('barcode')}
                  className="py-3 px-4 font-medium w-36 min-w-[130px] cursor-pointer hover:text-stocky-primary transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Barcode</span>
                    {renderSortIndicator('barcode')}
                  </div>
                </th>

                {/* 6. Expiry Date (Logical 6th column) */}
                <th
                  onClick={() => handleSort('expiry_date')}
                  className="py-3 px-4 font-medium w-36 min-w-[130px] cursor-pointer hover:text-stocky-primary transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Expiry Date</span>
                    {renderSortIndicator('expiry_date')}
                  </div>
                </th>

                {/* 7. Actions Column */}
                <th className="py-3 px-4 font-medium text-right w-28 min-w-[110px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stocky-border-subtle">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-xs font-normal text-stocky-text-sub"
                  >
                    {loading
                      ? 'Fetching inventory from database...'
                      : 'No inventory items found matching your filter criteria.'}
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isSelected = selectedItemIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-stocky-primary/10 hover:bg-stocky-primary/15'
                          : 'hover:bg-stocky-bg-global/50'
                      }`}
                    >
                      {/* 0. Select Box Column */}
                      <td
                        className="py-3.5 px-3 w-10 min-w-[40px] text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.id)}
                          aria-label={`Select item ${item.name}`}
                          className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle"
                        />
                      </td>

                      {/* 1. Item Name */}
                      <td className="py-3.5 px-4 font-medium text-stocky-text-main min-w-[280px]">
                        {item.name}
                      </td>

                    {/* 2. Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap w-44 min-w-[150px]">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-widget text-[11px] font-normal bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle">
                        <TagIcon size="xs" className="text-stocky-accent" />
                        {item.categoryName}
                      </span>
                    </td>

                    {/* 3. Quantity */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap w-28">
                      <span
                        className={`inline-block font-medium ${
                          item.quantity > 0
                            ? 'text-stocky-text-main'
                            : 'text-stocky-text-sub/50'
                        }`}
                      >
                        {item.quantity.toLocaleString()} units
                      </span>
                    </td>

                    {/* 4. Balance */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-stocky-text-main w-32">
                      ${Number(item.balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* 5. Barcode */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-stocky-text-sub w-36 min-w-[130px]">
                      <span className="inline-flex items-center gap-1">
                        <BarcodeIcon size="xs" className="text-stocky-text-sub/70" />
                        {item.barcode || '—'}
                      </span>
                    </td>

                    {/* 6. Expiry Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] w-36 min-w-[130px]">
                      {item.expiryDate ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-widget font-normal ${
                            new Date(item.expiryDate) < new Date()
                              ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                              : new Date(item.expiryDate).getTime() - new Date().getTime() <
                                30 * 24 * 60 * 60 * 1000
                              ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                              : 'bg-stocky-bg-global text-stocky-text-main border border-stocky-border-subtle'
                          }`}
                        >
                          <ClockIcon size="xs" className="opacity-60" />
                          {new Date(item.expiryDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-stocky-text-sub/40">—</span>
                      )}
                    </td>

                    {/* 7. Actions (Generous Breathing Space) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap w-28 min-w-[110px]">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleEditClick(item)}
                          className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-primary hover:border-stocky-primary/40 flex items-center justify-center transition-all cursor-pointer"
                          title={`Edit ${item.name}`}
                        >
                          <EditIcon size="xs" />
                        </button>
                        {userRole !== 'staff' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(item)}
                            className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-red-50 border border-stocky-border-subtle hover:border-red-200 text-stocky-text-sub hover:text-red-600 flex items-center justify-center transition-all cursor-pointer"
                            title={`Delete ${item.name}`}
                          >
                            <TrashIcon size="xs" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 sm:p-4 border-t border-stocky-border-subtle bg-stocky-bg-widget flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stocky-text-sub">
          <div>
            Showing <span className="font-medium text-stocky-text-main">{startRange.toLocaleString()}</span> to{' '}
            <span className="font-medium text-stocky-text-main">{endRange.toLocaleString()}</span> of{' '}
            <span className="font-medium text-stocky-text-main">{totalCount.toLocaleString()}</span> items
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="px-3 py-1 text-xs"
            >
              Previous
            </Button>

            <span className="text-xs font-medium text-stocky-text-main px-2">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="px-3 py-1 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Interactive Edit Drawer */}
      <RecordEditDrawerWidget
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        recordType="item"
        recordData={editingItem}
        mode="edit"
        defaultBranchId={selectedBranchId}
        allCategories={categories}
        userRole={userRole}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Interactive Create Drawer */}
      <RecordEditDrawerWidget
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        recordType="item"
        recordData={null}
        mode="create"
        defaultBranchId={selectedBranchId}
        allCategories={categories}
        userRole={userRole}
        onSaveSuccess={(newItem) => {
          setItems((prev) => [newItem, ...prev]);
          setTotalCount((prev) => prev + 1);
        }}
      />

      {/* Excel Import & Column Mapping Modal */}
      <ExcelImportModalWidget
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        selectedBranchId={selectedBranchId}
        selectedBranchName={selectedBranchName}
        onImportSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedItemIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stocky-bg-widget/95 backdrop-blur-md border border-stocky-border-subtle shadow-2xl rounded-widget px-4 py-2.5 flex items-center gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-stocky-primary animate-pulse" />
              <span className="text-xs font-medium text-stocky-text-main">
                <span className="font-semibold">{selectedItemIds.size}</span> item
                {selectedItemIds.size > 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="h-4 w-px bg-stocky-border-subtle" />

            <button
              type="button"
              onClick={handleBulkExport}
              className="text-xs text-stocky-text-main hover:text-stocky-primary flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1 px-2 rounded-widget hover:bg-stocky-bg-global"
              title="Download selected items as Excel spreadsheet"
            >
              <ArrowDownIcon size="xs" />
              <span>Export Selected</span>
            </button>

            {userRole !== 'staff' && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1 px-2 rounded-widget hover:bg-red-50"
                title="Delete selected items from database"
              >
                <TrashIcon size="xs" />
                <span>Delete Selected</span>
              </button>
            )}

            <div className="h-4 w-px bg-stocky-border-subtle" />

            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-stocky-text-sub hover:text-stocky-text-main flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-widget hover:bg-stocky-bg-global"
              title="Deselect all"
            >
              <XIcon size="xs" />
              <span>Deselect</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
