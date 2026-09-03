'use client';

import React from 'react';
import { WarehouseIcon, ChevronDownIcon } from '@stocky/icons';
import type { Branch } from '@stocky/types';

export interface BranchSelectorWidgetProps {
  branches: Branch[];
  selectedBranchId: string; // 'all' or specific branch id
  onSelectBranch: (branchId: string) => void;
}

/**
 * BranchSelectorWidget (v0.1.0 Design System)
 * Allows filtering dashboard insights and inventory overall or by branch.
 */
export function BranchSelectorWidget({
  branches,
  selectedBranchId,
  onSelectBranch,
}: BranchSelectorWidgetProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex items-center">
        <div className="absolute left-3 pointer-events-none text-stocky-accent">
          <WarehouseIcon size="xs" />
        </div>
        <select
          value={selectedBranchId}
          onChange={(e) => onSelectBranch(e.target.value)}
          className="appearance-none bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget text-xs font-medium text-stocky-text-main pl-8 pr-8 py-2 focus:outline-none focus:border-stocky-primary transition-colors cursor-pointer"
          aria-label="Filter by Branch"
        >
          <option value="all">All Branches (Consolidated)</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code || 'Store'})
            </option>
          ))}
        </select>
        <div className="absolute right-2.5 pointer-events-none text-stocky-text-sub">
          <ChevronDownIcon size="xs" />
        </div>
      </div>
    </div>
  );
}
