'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import type { CompanyUserRole } from '@stocky/types';
import { ActivityIcon, CheckCircleIcon } from '@stocky/icons';
import { getActivePlatformGroup, getPlatformNavigation } from '../platformNavigation';

export interface MobileSubNavWidgetProps {
  activeTab: string;
  userRole: CompanyUserRole;
  permissions?: { pages?: string[] } | null;
  hidden?: boolean;
  onTabChange: (tabId: string) => void;
  className?: string;
  supplierTab?: 'suppliers' | 'requests';
  onSupplierTabChange?: (tab: 'suppliers' | 'requests') => void;
  taskTab?: 'ongoing' | 'completed';
  onTaskTabChange?: (tab: 'ongoing' | 'completed') => void;
  attendanceTab?: 'timesheets' | 'calendar' | 'leaves' | 'kiosk';
  onAttendanceTabChange?: (tab: 'timesheets' | 'calendar' | 'leaves' | 'kiosk') => void;
  tasksCount?: number;
  presentCount?: number;
}

const GROUP_TITLES: Record<string, string> = {
  dashboard: 'Home',
  'supply-chain': 'Inventory',
  suppliers: 'Suppliers',
  tasks: 'Tasks',
  attendance: 'Attendance',
  organization: 'Organization',
};

export function MobileSubNavWidget({
  activeTab,
  userRole,
  permissions,
  hidden = false,
  onTabChange,
  className = '',
  supplierTab = 'suppliers',
  onSupplierTabChange,
  taskTab = 'ongoing',
  onTaskTabChange,
  attendanceTab = 'timesheets',
  onAttendanceTabChange,
  tasksCount,
  presentCount,
}: MobileSubNavWidgetProps) {
  const groups = useMemo(() => getPlatformNavigation(userRole, '/platform', permissions), [userRole, permissions]);
  const activePillRef = useRef<HTMLButtonElement | null>(null);

  const resolvedActiveId = useMemo(() => {
    if (activeTab === 'suppliers' || activeTab === 'supplier-requests') {
      return supplierTab === 'requests' ? 'supplier-requests' : 'suppliers';
    }
    if (activeTab === 'tasks' || activeTab === 'tasks-completed') {
      return taskTab === 'completed' ? 'tasks-completed' : 'tasks';
    }
    if (activeTab === 'attendance' || activeTab === 'timesheets') {
      if (attendanceTab === 'calendar') return 'attendance-calendar';
      return 'attendance';
    }
    if (activeTab === 'inventory' || activeTab === 'stock' || activeTab === 'transfers') {
      return activeTab === 'transfers' ? 'transfers' : 'stock';
    }
    return activeTab;
  }, [activeTab, supplierTab, taskTab, attendanceTab]);

  const activeGroup = useMemo(() => {
    return (
      getActivePlatformGroup(groups, resolvedActiveId) ||
      getActivePlatformGroup(groups, activeTab || 'stock') ||
      getActivePlatformGroup(groups, 'stock')
    );
  }, [groups, resolvedActiveId, activeTab]);

  useEffect(() => {
    if (activePillRef.current && typeof window !== 'undefined') {
      activePillRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [resolvedActiveId]);

  if (!activeGroup || activeGroup.items.length <= 1) return null;

  const handlePillClick = (itemId: string) => {
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
    onTabChange(itemId);
  };

  const groupTitle = GROUP_TITLES[activeGroup.id] || activeGroup.label;
  const isTasksGroup = activeGroup.id === 'tasks';
  const isAttendanceGroup = activeGroup.id === 'attendance';

  return (
    <nav
      aria-label={`${activeGroup.label} navigation`}
      className={`stocky-mobile-subnav md:hidden w-full h-11 flex items-center max-w-full overflow-x-clip shrink-0 select-none z-30 transition-all duration-300 ease-out ${
        hidden ? 'stocky-mobile-subnav--hidden' : ''
      } ${className}`.trim()}
    >
      <div className="stocky-mobile-pill-rail flex items-center gap-1.5 overflow-x-auto w-full h-full px-3 py-0">
        <div className="flex items-center gap-2 shrink-0 pr-1">
          <span className="text-xs font-bold text-stocky-text-main">{groupTitle}</span>
          {activeGroup.items.length > 0 && (
            <span className="h-3.5 w-px bg-stocky-border-subtle" />
          )}
        </div>
        {activeGroup.items.map((item) => {
          const isActive = item.id === resolvedActiveId;
          return (
            <button
              key={item.id}
              ref={isActive ? activePillRef : null}
              type="button"
              onClick={() => handlePillClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`stocky-mobile-pill shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stocky-primary/40 ${
                isActive
                  ? 'stocky-mobile-pill--active'
                  : 'stocky-mobile-pill--inactive'
              }`}
            >
              {item.icon && (
                <span className={`shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-65'}`}>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
        {isTasksGroup && typeof tasksCount === 'number' && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full stocky-status-info border px-2 py-0.5 text-[10px] font-medium ml-auto">
            <ActivityIcon size="xs" />
            <span>{tasksCount} ongoing</span>
          </span>
        )}
        {isAttendanceGroup && typeof presentCount === 'number' && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full stocky-status-info border px-2 py-0.5 text-[10px] font-medium ml-auto">
            <CheckCircleIcon size="xs" />
            <span>{presentCount} present</span>
          </span>
        )}
      </div>
    </nav>
  );
}
