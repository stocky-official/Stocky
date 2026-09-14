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
  attendanceTab?: 'timesheets' | 'calendar' | 'leaves' | 'kiosk';
  onAttendanceTabChange?: (tab: 'timesheets' | 'calendar' | 'leaves' | 'kiosk') => void;
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
  attendanceTab = 'timesheets',
  onAttendanceTabChange,
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
      : activeTab === 'attendance' || activeTab === 'timesheets'
      ? attendanceTab === 'calendar'
        ? 'attendance-calendar'
        : attendanceTab === 'leaves'
        ? 'attendance-leaves'
        : attendanceTab === 'kiosk'
        ? 'attendance-kiosk'
        : 'attendance'
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
    if (itemId === 'attendance' || itemId === 'attendance-timesheets' || itemId === 'timesheets') {
      onAttendanceTabChange?.('timesheets');
      onTabChange('attendance-timesheets');
      return;
    }
    if (itemId === 'attendance-calendar' || itemId === 'calendar') {
      onAttendanceTabChange?.('calendar');
      onTabChange('attendance-calendar');
      return;
    }
    if (itemId === 'attendance-leaves' || itemId === 'leaves') {
      onAttendanceTabChange?.('leaves');
      onTabChange('attendance-leaves');
      return;
    }
    if (itemId === 'attendance-kiosk' || itemId === 'kiosk') {
      onAttendanceTabChange?.('kiosk');
      onTabChange('attendance-kiosk');
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
