'use client';

import type { CompanyUserRole } from '@stocky/types';
import { getActivePlatformGroup, getPlatformNavigation } from '../platformNavigation';

export interface PlatformContextTabsWidgetProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userRole: CompanyUserRole;
  className?: string;
  supplierTab?: 'suppliers' | 'requests';
  onSupplierTabChange?: (tab: 'suppliers' | 'requests') => void;
  taskTab?: 'ongoing' | 'completed';
  onTaskTabChange?: (tab: 'ongoing' | 'completed') => void;
}

/**
 * A compact, spreadsheet-style second level of navigation. It deliberately
 * appears only when a root workspace has related operational views.
 */
export function PlatformContextTabsWidget({
  activeTab,
  onTabChange,
  userRole,
  className = '',
  supplierTab = 'suppliers',
  onSupplierTabChange,
  taskTab = 'ongoing',
  onTaskTabChange,
}: PlatformContextTabsWidgetProps) {
  const group = getActivePlatformGroup(getPlatformNavigation(userRole), activeTab);

  if (!group || group.items.length < 2) return null;

  const resolvedActiveId =
    activeTab === 'suppliers' || activeTab === 'supplier-requests'
      ? supplierTab === 'requests'
        ? 'supplier-requests'
        : 'suppliers'
      : activeTab === 'tasks' || activeTab === 'tasks-completed'
      ? taskTab === 'completed'
        ? 'tasks-completed'
        : 'tasks'
      : activeTab;

  const handleItemClick = (itemId: string) => {
    if (itemId === 'supplier-requests') {
      onSupplierTabChange?.('requests');
      if (activeTab !== 'suppliers') onTabChange('suppliers');
      return;
    }
    if (itemId === 'suppliers') {
      onSupplierTabChange?.('suppliers');
      if (activeTab !== 'suppliers') onTabChange('suppliers');
      return;
    }
    if (itemId === 'tasks-completed') {
      onTaskTabChange?.('completed');
      if (activeTab !== 'tasks') onTabChange('tasks');
      return;
    }
    if (itemId === 'tasks') {
      onTaskTabChange?.('ongoing');
      if (activeTab !== 'tasks') onTabChange('tasks');
      return;
    }
    onTabChange(itemId);
  };

  return (
    <nav className={`stocky-context-tabs ${className}`.trim()} aria-label={`${group.label} views`}>
      <div className="stocky-context-tabs__list">
        {group.items.map((item) => {
          const isActive = item.id === resolvedActiveId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`stocky-context-tabs__item ${isActive ? 'stocky-context-tabs__item--active' : ''}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
