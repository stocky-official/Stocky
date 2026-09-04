'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import {
  BoxesIcon,
  WarehouseIcon,
  TrendingUpIcon,
  DollarSignIcon,
  CheckCircleIcon,
  EditIcon,
  TrashIcon,
  ArrowDownIcon,
  XIcon,
} from '@stocky/icons';
import type { Branch, Item } from '@stocky/types';
import { exportBranchesToExcel } from '@/lib/excel/export';

export interface BranchInsightsWidgetProps {
  branches: Branch[];
  items: Item[];
  selectedBranchId: string;
  selectedBranchName: string;
  totalDatabaseItems?: number;
}

/**
 * BranchInsightsWidget (v0.1.0 Design System)
 * Dashboard insights across all branches or for a single selected branch.
 */
export function BranchInsightsWidget({
  branches,
  items,
  selectedBranchId,
  selectedBranchName,
  totalDatabaseItems,
}: BranchInsightsWidgetProps) {
  // Aggregate KPIs
  const totalBalance = useMemo(() => {
    return items.reduce((acc, curr) => acc + Number(curr.balance), 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [items]);

  const totalSKUs =
    selectedBranchId === 'all' && totalDatabaseItems
      ? totalDatabaseItems
      : items.length;

  // Breakdown per branch
  const branchBreakdown = useMemo(() => {
    return branches.map((b) => {
      const branchItems = items.filter((i) => i.branchId === b.id);
      const bBalance = branchItems.reduce((acc, curr) => acc + Number(curr.balance), 0);
      const bQty = branchItems.reduce((acc, curr) => acc + curr.quantity, 0);
      return {
        ...b,
        itemCount:
          totalDatabaseItems && branches.length === 1
            ? totalDatabaseItems
            : branchItems.length,
        totalQuantity: bQty,
        totalBalance: bBalance,
      };
    });
  }, [branches, items, totalDatabaseItems]);

  // Multiple Selection State
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set());

  const isAllSelected = useMemo(() => {
    return (
      branchBreakdown.length > 0 &&
      branchBreakdown.every((b) => selectedBranchIds.has(b.id))
    );
  }, [branchBreakdown, selectedBranchIds]);

  const isIndeterminate = useMemo(() => {
    const count = branchBreakdown.filter((b) => selectedBranchIds.has(b.id)).length;
    return count > 0 && count < branchBreakdown.length;
  }, [branchBreakdown, selectedBranchIds]);

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
      setSelectedBranchIds(new Set(branchBreakdown.map((b) => b.id)));
    }
  };

  const clearSelection = () => {
    setSelectedBranchIds(new Set());
  };

  const handleBulkExport = () => {
    const selected = branchBreakdown.filter((b) => selectedBranchIds.has(b.id));
    if (selected.length === 0) return;
    exportBranchesToExcel(selected, `branch-performance-selected-${selected.length}`);
  };

  return (
    <div className="space-y-6">
      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Metric 1: Total Valuation */}
        <Card className="p-5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-stocky-text-sub">
              Total Stock Balance
            </span>
            <div className="w-8 h-8 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-primary">
              <DollarSignIcon size="xs" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-medium text-stocky-text-main tracking-tight block">
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] font-normal text-stocky-text-sub mt-0.5 block">
              {selectedBranchName} valuation
            </span>
          </div>
        </Card>

        {/* Metric 2: Total Units */}
        <Card className="p-5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-stocky-text-sub">
              Total Quantity (Units)
            </span>
            <div className="w-8 h-8 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-primary">
              <BoxesIcon size="xs" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-medium text-stocky-text-main tracking-tight block">
              {totalQuantity.toLocaleString()}
            </span>
            <span className="text-[11px] font-normal text-stocky-text-sub mt-0.5 block">
              Units across inventory
            </span>
          </div>
        </Card>

        {/* Metric 3: Active SKUs */}
        <Card className="p-5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-stocky-text-sub">
              Catalog Items (SKUs)
            </span>
            <div className="w-8 h-8 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-primary">
              <TrendingUpIcon size="xs" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-medium text-stocky-text-main tracking-tight block">
              {totalSKUs}
            </span>
            <span className="text-[11px] font-normal text-stocky-text-sub mt-0.5 block">
              Tracked stock lines
            </span>
          </div>
        </Card>

        {/* Metric 4: Branches / Stores */}
        <Card className="p-5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-stocky-text-sub">
              Active Branches
            </span>
            <div className="w-8 h-8 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-primary">
              <WarehouseIcon size="xs" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-medium text-stocky-text-main tracking-tight block">
              {branches.length}
            </span>
            <span className="text-[11px] font-normal text-stocky-text-sub mt-0.5 block">
              Operating distribution hubs
            </span>
          </div>
        </Card>
      </div>

      {/* Multi-Branch Performance Breakdown (Shown on Consolidated View) */}
      {selectedBranchId === 'all' && (
        <Card className="p-5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget space-y-4">
          <div className="border-b border-stocky-border-subtle pb-3">
            <h2 className="text-base font-medium text-stocky-text-main">
              Branch Performance Comparison
            </h2>
            <p className="text-xs font-normal text-stocky-text-sub mt-0.5">
              Consolidated view of stock valuation and quantity distribution across all stores
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stocky-bg-global text-stocky-text-sub border-b border-stocky-border-subtle select-none">
                  {/* 0. Select Box */}
                  <th className="py-2.5 px-3 w-10 min-w-[40px] text-center">
                    <input
                      type="checkbox"
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all branches"
                      className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle"
                    />
                  </th>
                  <th className="py-2.5 px-4 font-medium">Branch / Store</th>
                  <th className="py-2.5 px-4 font-medium">Location</th>
                  <th className="py-2.5 px-4 font-medium text-right">SKUs</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total Units</th>
                  <th className="py-2.5 px-4 font-medium text-right">Stock Valuation</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle">
                {branchBreakdown.map((b) => {
                  const isSelected = selectedBranchIds.has(b.id);
                  return (
                    <tr
                      key={b.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-stocky-primary/10 hover:bg-stocky-primary/15'
                          : 'hover:bg-stocky-bg-global/50'
                      }`}
                    >
                      {/* 0. Select Box */}
                      <td
                        className="py-3 px-3 w-10 min-w-[40px] text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectBranch(b.id)}
                          aria-label={`Select branch ${b.name}`}
                          className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-stocky-text-main">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-stocky-accent shrink-0" />
                          <span>{b.name}</span>
                          <span className="text-[10px] font-normal text-stocky-text-sub bg-stocky-bg-global px-1.5 py-0.5 rounded-widget border border-stocky-border-subtle">
                            {b.code || 'BR'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stocky-text-sub truncate max-w-xs">
                        {b.address || 'Cairo, Egypt'}
                      </td>
                      <td className="py-3 px-4 text-right text-stocky-text-main font-medium">
                        {b.itemCount}
                      </td>
                      <td className="py-3 px-4 text-right text-stocky-text-main font-medium">
                        {b.totalQuantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-stocky-text-main font-medium">
                        ${b.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap w-28 min-w-[110px]">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => alert(`Edit Branch: ${b.name}`)}
                            className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-primary hover:border-stocky-primary/40 flex items-center justify-center transition-all cursor-pointer"
                            title={`Edit ${b.name}`}
                          >
                            <EditIcon size="xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete branch "${b.name}"?`)) {
                                alert(`Branch delete requested for: ${b.name}`);
                              }
                            }}
                            className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-red-50 border border-stocky-border-subtle hover:border-red-200 text-stocky-text-sub hover:text-red-600 flex items-center justify-center transition-all cursor-pointer"
                            title={`Delete ${b.name}`}
                          >
                            <TrashIcon size="xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
                  title="Export selected branch metrics to Excel"
                >
                  <ArrowDownIcon size="xs" />
                  <span>Export Selected</span>
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
        </Card>
      )}
    </div>
  );
}
