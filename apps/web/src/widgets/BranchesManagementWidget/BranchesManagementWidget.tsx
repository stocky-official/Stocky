'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  WarehouseIcon,
  SearchIcon,
  BoxesIcon,
  DollarSignIcon,
  EditIcon,
  TrashIcon,
  XIcon,
} from '@stocky/icons';
import type { Branch, Item } from '@stocky/types';
import { RecordEditDrawerWidget } from '../RecordEditDrawerWidget/RecordEditDrawerWidget';

export interface BranchesManagementWidgetProps {
  branches: Branch[];
  items: Item[];
  totalDatabaseItems?: number;
}

/**
 * BranchesManagementWidget (v0.1.0 Design System)
 * Displays all stores/branches with operating status, addresses, and stock metrics.
 */
export function BranchesManagementWidget({
  branches,
  items,
  totalDatabaseItems,
}: BranchesManagementWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
      return (
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.code && b.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.address && b.address.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [branchMetrics, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <Card className="p-4 sm:p-5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-stocky-text-main">
            Stores & Branches ({branches.length})
          </h2>
          <p className="text-xs font-normal text-stocky-text-sub mt-0.5">
            Manage company branches, distribution hubs, and retail outlets
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stocky-text-sub pointer-events-none">
            <SearchIcon size="xs" />
          </span>
          <input
            type="text"
            placeholder="Search branches, code, location..."
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
      </Card>

      {/* Branches Card Grid (16px Gutter) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {filteredBranches.map((branch) => (
          <Card
            key={branch.id}
            className="p-5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget flex flex-col justify-between space-y-5"
          >
            {/* Header: Name, Code, Status & Actions */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
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
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete branch "${branch.name}"?`)) {
                        alert(`Branch delete requested: ${branch.name}`);
                      }
                    }}
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
        ))}
      </div>

      {/* Interactive Edit Drawer for Branch */}
      <RecordEditDrawerWidget
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        recordType="branch"
        recordData={editingBranch}
        onSaveSuccess={(updatedBranch) => {
          // Update branch name/code locally if needed
          if (editingBranch) {
            Object.assign(editingBranch, updatedBranch);
          }
        }}
      />
    </div>
  );
}
