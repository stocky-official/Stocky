'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import type { CompanyUserRole } from '@stocky/types';
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
}

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
}: MobileSubNavWidgetProps) {
  const groups = useMemo(() => getPlatformNavigation(userRole, '/platform', permissions), [userRole, permissions]);
  const activeGroup = getActivePlatformGroup(groups, activeTab);
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
    return activeTab;
  }, [activeTab, supplierTab, taskTab, attendanceTab]);

  useEffect(() => {
    if (activePillRef.current && typeof window !== 'undefined') {
      activePillRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [resolvedActiveId]);

  // Only display subtabs if the workspace has 2 or more operational views
  if (!activeGroup || activeGroup.items.length < 2) return null;

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

  return (
    <nav
      aria-label={`${activeGroup.label} navigation`}
      className={`stocky-mobile-subnav md:hidden w-full max-w-full overflow-x-clip shrink-0 select-none z-30 transition-all duration-300 ease-out ${
        hidden ? 'stocky-mobile-subnav--hidden' : ''
      } ${className}`.trim()}
    >
      <div className="stocky-mobile-pill-rail flex items-center gap-1.5 overflow-x-auto max-w-full px-4 py-2">
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
      </div>
    </nav>
  );
}
