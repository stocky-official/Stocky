'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  WarehouseIcon,
  SearchIcon,
  BoxesIcon,
  DollarSignIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  PlusIcon,
  ArrowDownIcon,
  FilterIcon,
  LayersIcon,
  DashboardIcon,
} from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import type { Branch, Item } from '@stocky/types';
import { RecordEditDrawerWidget } from '../RecordEditDrawerWidget/RecordEditDrawerWidget';
import { exportBranchesToExcel } from '@/lib/excel/export';

export interface BranchesManagementWidgetProps {
  branches: Branch[];
  items: Item[];
  totalDatabaseItems?: number;
}

/**
 * BranchesManagementWidget (v0.1.0 Design System)
 * Displays all stores/branches with operating status, addresses, and stock metrics:
 * - Table View & Card Grid View toggle
 * - Select Box & Multiple Selection with Select All and indeterminate support
 * - Floating Bulk Action Bar (Export Selected, Delete Selected, Deselect)
 * - Toolbar actions: + Add Branch, Export Excel (.xlsx)
 * - Filtering: Search location/code and stock presence filter
 * - Interactive Edit & Create Drawers (RecordEditDrawerWidget)
 */
export function BranchesManagementWidget({
  branches: initialBranches,
  items,
  totalDatabaseItems,
}: BranchesManagementWidgetProps) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'has_stock' | 'zero_stock'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  // Multiple Selection State
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setBranches(initialBranches);
  }, [initialBranches]);

  // Default to Grid / Cards mode on mobile viewport
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('grid');
    }
  }, []);

  const branchMetrics = useMemo(() => {
    return branches.map((branch) => {
      const branchItems = items.filter((i) => i.branchId === branch.id);
      const totalUnits = branchItems.reduce((acc, curr) => acc + curr.quantity, 0);
      const totalBalance = branchItems.reduce(
        (acc, curr) => acc + Number(curr.balance),
        0
      );
      return {
        ...branch,
        itemCount:
          totalDatabaseItems && branches.length === 1
            ? totalDatabaseItems
            : branchItems.length,
        totalUnits,
        totalBalance,
      };
    });
  }, [branches, items, totalDatabaseItems]);

  const filteredBranches = useMemo(() => {
    return branchMetrics.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.code && b.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.address && b.address.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (stockFilter === 'has_stock') return b.totalUnits > 0;
      if (stockFilter === 'zero_stock') return b.totalUnits === 0;

      return true;
    });
  }, [branchMetrics, searchQuery, stockFilter]);

  const isAllSelected = useMemo(() => {
    return (
      filteredBranches.length > 0 &&
      filteredBranches.every((b) => selectedBranchIds.has(b.id))
    );
  }, [filteredBranches, selectedBranchIds]);

  const isIndeterminate = useMemo(() => {
    const count = filteredBranches.filter((b) => selectedBranchIds.has(b.id)).length;
    return count > 0 && count < filteredBranches.length;
  }, [filteredBranches, selectedBranchIds]);

  const toggleSelectBranch = (id: string) => {
    setSelectedBranchIds((prev) => {
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
      setSelectedBranchIds(new Set());
    } else {
      setSelectedBranchIds(new Set(filteredBranches.map((b) => b.id)));
    }
  };

  const clearSelection = () => {
    setSelectedBranchIds(new Set());
  };

  const handleBulkExport = () => {
    const selected = filteredBranches.filter((b) => selectedBranchIds.has(b.id));
    if (selected.length === 0) return;
    exportBranchesToExcel(selected, `branches-selected-${selected.length}`);
  };

  const handleBulkDelete = async () => {
    const count = selectedBranchIds.size;
    if (count === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${count} selected branch${
          count > 1 ? 'es' : ''
        }? Associated inventory will need reassignment.`
      )
    ) {
      return;
    }
    try {
      const ids = Array.from(selectedBranchIds);
      const { error } = await supabase.from('branches').delete().in('id', ids);
      if (error) throw error;
      setBranches((prev) => prev.filter((b) => !selectedBranchIds.has(b.id)));
      clearSelection();
    } catch (err: any) {
      alert(`Failed to delete selected branches: ${err.message}`);
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (!confirm(`Are you sure you want to delete branch "${branch.name}"?`)) return;
    try {
      const { error } = await supabase.from('branches').delete().eq('id', branch.id);
      if (error) throw error;
      setBranches((prev) => prev.filter((b) => b.id !== branch.id));
      setSelectedBranchIds((prev) => {
        const next = new Set(prev);
        next.delete(branch.id);
        return next;
      });
    } catch (err: any) {
      alert(`Failed to delete branch: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <Card className="p-4 sm:p-5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-stocky-text-main">
            Stores & Branches ({filteredBranches.length})
          </h2>
          <p className="text-xs font-normal text-stocky-text-sub mt-0.5">
            Manage company branches, distribution hubs, and retail outlets
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-stocky-bg-global border border-stocky-border-subtle rounded-widget p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs rounded-[5px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-stocky-bg-widget text-stocky-text-main font-medium shadow-xs'
                  : 'text-stocky-text-sub hover:text-stocky-text-main'
              }`}
              title="Table view"
            >
              <LayersIcon size="xs" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 text-xs rounded-[5px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-stocky-bg-widget text-stocky-text-main font-medium shadow-xs'
                  : 'text-stocky-text-sub hover:text-stocky-text-main'
              }`}
              title="Cards view"
            >
              <DashboardIcon size="xs" />
              <span>Cards</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateDrawerOpen(true)}
            className="h-8 px-3 text-xs flex items-center gap-1.5 shadow-sm"
          >
            <PlusIcon size="xs" />
            <span>Add Branch</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportBranchesToExcel(filteredBranches)}
            className="h-8 px-3 text-xs flex items-center gap-1.5 border-stocky-border-subtle hover:text-stocky-primary"
          >
            <ArrowDownIcon size="xs" />
            <span>Export Excel</span>
          </Button>

          <div className="relative w-full sm:w-60">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stocky-text-sub pointer-events-none">
              <SearchIcon size="xs" />
            </span>
            <input
              type="text"
              placeholder="Search branches, code..."
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

          <select
            value={stockFilter}
            onChange={(e: any) => setStockFilter(e.target.value)}
            className="h-8 bg-stocky-bg-global border border-stocky-border-subtle rounded-widget text-xs text-stocky-text-main px-2.5 focus:outline-none focus:border-stocky-primary cursor-pointer"
          >
            <option value="all">All Branches</option>
            <option value="has_stock">Has Active Stock</option>
            <option value="zero_stock">Zero Stock</option>
          </select>
        </div>
      </Card>

      {/* Main Content: Table View vs Grid View */}
      {viewMode === 'table' ? (
        <Card className="p-0 overflow-hidden bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stocky-bg-global text-stocky-text-sub border-b border-stocky-border-subtle select-none">
                  {/* 0. Select Box */}
                  <th className="py-3 px-3 w-10 min-w-[40px] text-center">
                    <input
                      type="checkbox"
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all visible branches"
                      className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle"
                    />
                  </th>
                  <th className="py-3 px-4 font-medium min-w-[200px]">Branch / Store</th>
                  <th className="py-3 px-4 font-medium w-28">Code</th>
                  <th className="py-3 px-4 font-medium min-w-[220px]">Location / Address</th>
                  <th className="py-3 px-4 font-medium w-36">Phone</th>
                  <th className="py-3 px-4 font-medium text-right w-32">Cataloged SKUs</th>
                  <th className="py-3 px-4 font-medium text-right w-36">Stock Valuation</th>
                  <th className="py-3 px-4 font-medium w-28">Status</th>
                  <th className="py-3 px-4 font-medium text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle">
                {filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-stocky-text-sub font-normal">
                      No branches found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map((branch) => {
                    const isSelected = selectedBranchIds.has(branch.id);
                    return (
                      <tr
                        key={branch.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-stocky-primary/10 hover:bg-stocky-primary/15'
                            : 'hover:bg-stocky-bg-global/50'
                        }`}
                      >
                        {/* 0. Select Box */}
                        <td
                          className="py-3.5 px-3 w-10 min-w-[40px] text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectBranch(branch.id)}
                            aria-label={`Select branch ${branch.name}`}
                            className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle"
                          />
                        </td>

                        {/* Branch Name */}
                        <td className="py-3.5 px-4 font-medium text-stocky-text-main">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-primary shrink-0">
                              <WarehouseIcon size="xs" />
                            </div>
                            <span>{branch.name}</span>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="py-3.5 px-4 text-stocky-text-sub font-mono">
                          {branch.code || 'BR'}
                        </td>

                        {/* Location / Address */}
                        <td className="py-3.5 px-4 text-stocky-text-sub truncate max-w-xs">
                          {branch.address || 'Address not registered'}
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-4 text-stocky-text-sub whitespace-nowrap">
                          {branch.phone || '—'}
                        </td>

                        {/* SKUs */}
                        <td className="py-3.5 px-4 text-right font-medium text-stocky-text-main whitespace-nowrap">
                          {branch.itemCount.toLocaleString()} items
                        </td>

                        {/* Stock Valuation */}
                        <td className="py-3.5 px-4 text-right font-medium text-stocky-text-main whitespace-nowrap">
                          ${branch.totalBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBranch(branch);
                                setIsDrawerOpen(true);
                              }}
                              className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-primary flex items-center justify-center transition-all cursor-pointer"
                              title={`Edit ${branch.name}`}
                            >
                              <EditIcon size="xs" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBranch(branch)}
                              className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-red-50 border border-stocky-border-subtle hover:border-red-200 text-stocky-text-sub hover:text-red-600 flex items-center justify-center transition-all cursor-pointer"
                              title={`Delete ${branch.name}`}
                            >
                              <TrashIcon size="xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Branches Card Grid (16px Gutter) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {filteredBranches.map((branch) => {
            const isSelected = selectedBranchIds.has(branch.id);
            return (
              <Card
                key={branch.id}
                className={`p-5 bg-stocky-bg-widget border rounded-widget flex flex-col justify-between space-y-5 transition-colors ${
                  isSelected
                    ? 'border-stocky-primary bg-stocky-primary/5 shadow-sm'
                    : 'border-stocky-border-subtle'
                }`}
              >
                {/* Header: Name, Code, Status & Actions */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectBranch(branch.id)}
                        aria-label={`Select branch ${branch.name}`}
                        className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle mr-1"
                      />
                      <div className="w-8 h-8 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-primary shrink-0">
                        <WarehouseIcon size="xs" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-stocky-text-main">
                          {branch.name}
                        </h3>
                        <span className="text-[11px] text-stocky-text-sub">
                          Code: {branch.code || 'BR'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBranch(branch);
                          setIsDrawerOpen(true);
                        }}
                        className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-primary hover:border-stocky-primary/40 flex items-center justify-center transition-all cursor-pointer"
                        title={`Edit ${branch.name}`}
                      >
                        <EditIcon size="xs" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBranch(branch)}
                        className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-red-50 border border-stocky-border-subtle hover:border-red-200 text-stocky-text-sub hover:text-red-600 flex items-center justify-center transition-all cursor-pointer"
                        title={`Delete ${branch.name}`}
                      >
                        <TrashIcon size="xs" />
                      </button>
                    </div>
                  </div>

                  {/* Location and Contact */}
                  <div className="pt-2 text-xs space-y-1 text-stocky-text-sub">
                    <p className="line-clamp-1">
                      <span className="font-medium text-stocky-text-main">Address: </span>
                      {branch.address || 'Address not registered'}
                    </p>
                    <p>
                      <span className="font-medium text-stocky-text-main">Phone: </span>
                      <span>{branch.phone || '—'}</span>
                    </p>
                  </div>
                </div>

                {/* Footer Stock Summary Pills */}
                <div className="pt-4 border-t border-stocky-border-subtle grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle">
                    <span className="text-[10px] font-normal text-stocky-text-sub block">
                      Cataloged SKUs
                    </span>
                    <span className="text-sm font-medium text-stocky-text-main">
                      {branch.itemCount} Items
                    </span>
                  </div>

                  <div className="p-2.5 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle">
                    <span className="text-[10px] font-normal text-stocky-text-sub block">
                      Stock Valuation
                    </span>
                    <span className="text-sm font-medium text-stocky-text-main">
                      ${branch.totalBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedBranchIds.size > 0 && (
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
                <span className="font-semibold">{selectedBranchIds.size}</span> branch
                {selectedBranchIds.size > 1 ? 'es' : ''} selected
              </span>
            </div>

            <div className="h-4 w-px bg-stocky-border-subtle" />

            <button
              type="button"
              onClick={handleBulkExport}
              className="text-xs text-stocky-text-main hover:text-stocky-primary flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1 px-2 rounded-widget hover:bg-stocky-bg-global"
              title="Download selected branches as Excel spreadsheet"
            >
              <ArrowDownIcon size="xs" />
              <span>Export Selected</span>
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1 px-2 rounded-widget hover:bg-red-50"
              title="Delete selected branches from database"
            >
              <TrashIcon size="xs" />
              <span>Delete Selected</span>
            </button>

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

      {/* Interactive Edit Drawer for Branch */}
      <RecordEditDrawerWidget
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        recordType="branch"
        recordData={editingBranch}
        mode="edit"
        onSaveSuccess={(updatedBranch) => {
          if (editingBranch) {
            Object.assign(editingBranch, updatedBranch);
          }
        }}
      />

      {/* Interactive Create Drawer for Branch */}
      <RecordEditDrawerWidget
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        recordType="branch"
        recordData={null}
        mode="create"
        onSaveSuccess={(newBranch) => {
          setBranches((prev) => [newBranch, ...prev]);
        }}
      />
    </div>
  );
}
