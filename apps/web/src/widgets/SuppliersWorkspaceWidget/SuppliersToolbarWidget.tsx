'use client';

import React from 'react';
import { ArrowDownIcon, CloudUploadIcon, PlusIcon } from '@stocky/icons';
import { StandardToolbarWidget } from '../StandardToolbarWidget/StandardToolbarWidget';
import type { ActionItem } from '@/components/ui/ActionsBottomSheet';

export interface SuppliersToolbarWidgetProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterPanelOpen: boolean;
  onToggleFilterPanel: () => void;
  activeFilterCount: number;
  canManageSuppliers: boolean;
  canImport?: boolean;
  onImport?: () => void;
  onExport: () => void;
  onAddSupplier: () => void;
}

/**
 * Standardized toolbar component for Suppliers workspace.
 * Uses StandardToolbarWidget for uniform 40px single-row geometry,
 * split search with filter icon, primary + action, and ••• actions drawer.
 */
export function SuppliersToolbarWidget({
  searchQuery,
  onSearchChange,
  filterPanelOpen,
  onToggleFilterPanel,
  activeFilterCount,
  canManageSuppliers,
  canImport = false,
  onImport,
  onExport,
  onAddSupplier,
}: SuppliersToolbarWidgetProps) {
  const moreActions: ActionItem[] = [
    ...(canImport && onImport
      ? [
          {
            id: 'import',
            label: 'Import',
            description: 'Upload CSV file with supplier contacts and details',
            icon: <CloudUploadIcon size="xs" />,
            onClick: onImport,
          },
        ]
      : []),
    {
      id: 'export',
      label: 'Export',
      description: 'Download supplier directory to Excel spreadsheet',
      icon: <ArrowDownIcon size="xs" />,
      onClick: onExport,
    },
  ];

  return (
    <StandardToolbarWidget
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search suppliers, addresses, products..."
      isFilterOpen={filterPanelOpen}
      onToggleFilter={onToggleFilterPanel}
      activeFilterCount={activeFilterCount}
      primaryAction={
        canManageSuppliers
          ? {
              label: 'Add supplier',
              icon: <PlusIcon size="xs" />,
              onClick: onAddSupplier,
              title: 'Add new supplier',
            }
          : undefined
      }
      moreActions={moreActions}
      moreActionsTitle="Supplier Actions"
    />
  );
}
