'use client';

import React from 'react';
import {
  CheckCircleIcon,
  CloudDownloadIcon,
  CloudUploadIcon,
  MailIcon,
  PlusIcon,
} from '@stocky/icons';
import { StandardToolbarWidget } from '../StandardToolbarWidget/StandardToolbarWidget';
import type { ActionItem } from '@/components/ui/ActionsBottomSheet';
import { useTranslation } from '@/lib/i18n';

export interface InventoryToolbarWidgetProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterPanelOpen?: boolean;
  onToggleFilterPanel?: () => void;
  isFilterActive?: boolean;
  activeFilterCount?: number;
  filterContent?: React.ReactNode;
  canImport?: boolean;
  onImport?: () => void;
  onExport?: () => void;
  canManageTasks?: boolean;
  onAudit?: () => void;
  onResupply?: () => void;
  onReceive: () => void;
}

/**
 * Standardized toolbar component for Inventory workspace.
 * Uses StandardToolbarWidget for uniform 40px single-row geometry,
 * split search with filter icon, primary + action, and ••• actions drawer.
 */
export function InventoryToolbarWidget({
  searchQuery,
  onSearchChange,
  filterPanelOpen = false,
  onToggleFilterPanel,
  isFilterActive = false,
  activeFilterCount = 0,
  canImport = false,
  onImport,
  onExport,
  canManageTasks = false,
  onAudit,
  onResupply,
  onReceive,
}: InventoryToolbarWidgetProps) {
  const { t } = useTranslation();

  const moreActions: ActionItem[] = [
    ...(canImport && onImport
      ? [
          {
            id: 'import',
            label: t('inventory.import') || 'Import',
            description: 'Upload CSV or Excel file to batch update stock',
            icon: <CloudUploadIcon size="xs" />,
            onClick: onImport,
          },
        ]
      : []),
    ...(onExport
      ? [
          {
            id: 'export',
            label: t('inventory.export') || 'Export',
            description: 'Download current inventory as Excel spreadsheet',
            icon: <CloudDownloadIcon size="xs" />,
            onClick: onExport,
          },
        ]
      : []),
    ...(canManageTasks && onAudit
      ? [
          {
            id: 'audit',
            label: t('inventory.audit') || 'Audit',
            description: 'Create a physical count or expiry inspection task',
            icon: <CheckCircleIcon size="xs" />,
            onClick: onAudit,
          },
        ]
      : []),
    ...(onResupply
      ? [
          {
            id: 'resupply',
            label: t('inventory.resupply') || 'Resupply',
            description: 'Send purchase resupply orders to default suppliers',
            icon: <MailIcon size="xs" />,
            onClick: onResupply,
          },
        ]
      : []),
  ];

  return (
    <StandardToolbarWidget
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('inventory.searchPlaceholder') || 'Search product or barcode...'}
      isFilterOpen={filterPanelOpen}
      onToggleFilter={onToggleFilterPanel}
      activeFilterCount={activeFilterCount || (isFilterActive ? 1 : 0)}
      primaryAction={{
        label: t('inventory.addInventory') || 'Add inventory',
        icon: <PlusIcon size="xs" />,
        onClick: onReceive,
        title: t('inventory.addInventory') || 'Add inventory / Receive stock',
      }}
      moreActions={moreActions}
      moreActionsTitle={t('common.actions') || 'Inventory Actions'}
    />
  );
}
