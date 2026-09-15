'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CompanyUserRole } from '@stocky/types';
import {
  ActivityIcon,
  BellIcon,
  BoxesIcon,
  CheckCircleIcon,
} from '@stocky/icons';
import { PlatformAccountMenuWidget } from '../PlatformAccountMenuWidget/PlatformAccountMenuWidget';
import { getActivePlatformGroup, getPlatformNavigation } from '../platformNavigation';

export interface PlatformTopBarWidgetProps {
  userEmail?: string | null;
  userName?: string | null;
  userTitle?: string | null;
  userRole?: CompanyUserRole | string | null;
  userAvatarUrl?: string | null;
  companyName?: string;
  companyLogoUrl?: string | null;
  searchValue?: string;
  onSearch?: (query: string) => void;
  onSettingsClick?: () => void;
  onNavigateToTab?: (tab: string) => void;
  hidden?: boolean;
  onNotificationsClick?: () => void;
  notificationCount?: number;
  activeTab?: string;
  isNotificationsOpen?: boolean;

  // Integrated Subnav props
  permissions?: { pages?: string[] } | null;
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

/**
 * PlatformTopBarWidget (Integrated Mobile Header)
 * Combines brand identity, utility actions, and contextual subnav pill rail
 * into a single unified sticky mobile header with exact vertical alignment.
 */
export function PlatformTopBarWidget({
  userEmail,
  userName,
  userTitle,
  userRole = 'owner',
  userAvatarUrl,
  companyName,
  companyLogoUrl,
  onSettingsClick,
  onNavigateToTab,
  hidden = false,
  onNotificationsClick,
  notificationCount = 0,
  activeTab,
  isNotificationsOpen = false,
  permissions,
  supplierTab = 'suppliers',
  onSupplierTabChange,
  taskTab = 'ongoing',
  onTaskTabChange,
  attendanceTab = 'timesheets',
  onAttendanceTabChange,
  tasksCount,
  presentCount,
}: PlatformTopBarWidgetProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const activePillRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setLogoFailed(false);
  }, [companyLogoUrl]);

  const role = (userRole || 'owner') as CompanyUserRole;
  const groups = useMemo(() => getPlatformNavigation(role, '/platform', permissions), [role, permissions]);

  const resolvedActiveId = useMemo(() => {
    if (!activeTab) return '';
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

  if (activeTab === 'home') {
    return null;
  }

  const handlePillClick = (itemId: string) => {
    if (itemId === 'supplier-requests') {
      onSupplierTabChange?.('requests');
      if (activeTab !== 'suppliers') onNavigateToTab?.('suppliers');
      return;
    }
    if (itemId === 'suppliers') {
      onSupplierTabChange?.('suppliers');
      if (activeTab !== 'suppliers') onNavigateToTab?.('suppliers');
      return;
    }
    if (itemId === 'tasks-completed') {
      onTaskTabChange?.('completed');
      if (activeTab !== 'tasks') onNavigateToTab?.('tasks');
      return;
    }
    if (itemId === 'tasks') {
      onTaskTabChange?.('ongoing');
      if (activeTab !== 'tasks') onNavigateToTab?.('tasks');
      return;
    }
    if (itemId === 'attendance' || itemId === 'attendance-timesheets' || itemId === 'timesheets') {
      onAttendanceTabChange?.('timesheets');
      onNavigateToTab?.('attendance-timesheets');
      return;
    }
    if (itemId === 'attendance-calendar' || itemId === 'calendar') {
      onAttendanceTabChange?.('calendar');
      onNavigateToTab?.('attendance-calendar');
      return;
    }
    onNavigateToTab?.(itemId);
  };

  const hasSubNav = Boolean(activeGroup && activeGroup.items && activeGroup.items.length > 1);
  const groupTitle = activeGroup ? (GROUP_TITLES[activeGroup.id] || activeGroup.label) : '';
  const isTasksGroup = activeGroup?.id === 'tasks';
  const isAttendanceGroup = activeGroup?.id === 'attendance';

  return (
    <header
      className={`stocky-topbar relative w-full shrink-0 bg-white/95 backdrop-blur-md border-b border-stocky-border-subtle z-40 select-none transition-transform duration-300 ease-out pt-[env(safe-area-inset-top,0px)] md:hidden ${
        hidden ? 'stocky-topbar--hidden' : 'translate-y-0'
      }`}
    >
      {/* 1. Row 1: Brand & User Utility Bar (h-12 / 48px) */}
      <div className="w-full h-12 flex items-center justify-between px-3.5">
        {/* Left: Account Menu & Notifications Bell */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <PlatformAccountMenuWidget
            userEmail={userEmail}
            userName={userName}
            userTitle={userTitle}
            userRole={userRole}
            userAvatarUrl={userAvatarUrl}
            companyName={companyName}
            companyLogoUrl={companyLogoUrl}
            onSettingsClick={onSettingsClick}
            onNavigateToTab={onNavigateToTab}
            className="stocky-topbar-account max-w-[180px]"
          />
          {onNotificationsClick && (
            <button
              type="button"
              onClick={onNotificationsClick}
              aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
              title="Notifications"
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isNotificationsOpen || activeTab === 'notifications'
                  ? 'bg-stocky-primary text-stocky-text-main'
                  : 'text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global active:scale-95'
              }`}
            >
              <BellIcon size="xs" />
              {notificationCount > 0 && (
                <span
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    isNotificationsOpen || activeTab === 'notifications'
                      ? 'bg-stocky-text-main ring-1 ring-stocky-primary'
                      : 'bg-stocky-primary ring-2 ring-white'
                  }`}
                />
              )}
            </button>
          )}
        </div>

        {/* Right: Company Name & Brand logo */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <span className="text-sm font-semibold text-stocky-text-main truncate tracking-tight text-right max-w-[130px] sm:max-w-[200px]">
            {companyName || 'Stocky'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center shrink-0 overflow-hidden">
            {companyLogoUrl && !logoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyLogoUrl}
                alt={companyName || 'Stocky'}
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="w-5 h-5 object-contain"
              />
            ) : (
              <div
                className="w-full h-full bg-stocky-primary text-stocky-text-main flex items-center justify-center font-bold"
                title={companyName || 'Stocky'}
              >
                <BoxesIcon size="xs" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Row 2: Integrated Contextual Subnav Pill Rail (h-11 / 44px, centered with exact 6px top/bottom space) */}
      {activeGroup && activeGroup.items.length > 1 && (
        <div className="w-full h-11 border-t border-stocky-border-subtle/70 flex items-center px-3.5 bg-white">
          <div className="stocky-mobile-pill-rail flex items-center gap-1.5 overflow-x-auto w-full h-full py-0">
            <div className="flex items-center gap-2 shrink-0 pr-1">
              <span className="text-xs font-bold text-stocky-text-main">{groupTitle}</span>
              <span className="h-3.5 w-px bg-stocky-border-subtle" />
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
        </div>
      )}
    </header>
  );
}
