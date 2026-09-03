'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import {
  BoxesIcon,
  WarehouseIcon,
  TrendingUpIcon,
  DollarSignIcon,
  CheckCircleIcon,
  EditIcon,
  TrashIcon,
} from '@stocky/icons';
import type { Branch, Item } from '@stocky/types';

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
                <tr className="bg-stocky-bg-global text-stocky-text-sub border-b border-stocky-border-subtle">
                  <th className="py-2.5 px-4 font-medium">Branch / Store</th>
                  <th className="py-2.5 px-4 font-medium">Location</th>
                  <th className="py-2.5 px-4 font-medium text-right">SKUs</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total Units</th>
                  <th className="py-2.5 px-4 font-medium text-right">Stock Valuation</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle">
                {branchBreakdown.map((b) => (
                  <tr key={b.id} className="hover:bg-stocky-bg-global/50 transition-colors">
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
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
