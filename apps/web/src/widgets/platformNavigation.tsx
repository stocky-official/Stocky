import React from 'react';
import {
  ActivityIcon,
  ArrowUpDownIcon,
  BellIcon,
  BoxesIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DashboardIcon,
  QrCodeIcon,
  SettingsIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
} from '@stocky/icons';
import type { CompanyUserRole } from '@stocky/types';

export interface PlatformNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

export interface PlatformNavGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: PlatformNavItem[];
}

export const TAB_TO_PATH: Record<string, string> = {
  home: '/platform',
  logs: '/platform/activity',
  stock: '/platform/inventory',
  inventory: '/platform/inventory',
  transfers: '/platform/transfers',
  suppliers: '/platform/suppliers',
  'supplier-requests': '/platform/suppliers',
  tasks: '/platform/tasks',
  'tasks-completed': '/platform/tasks',
  attendance: '/platform/attendance',
  'attendance-timesheets': '/platform/attendance',
  'attendance-calendar': '/platform/attendance',
  'attendance-leaves': '/platform/attendance',
  'attendance-kiosk': '/platform/attendance',
  timesheets: '/platform/attendance',
  locations: '/platform/locations',
  team: '/platform/team',
  notifications: '/platform/notifications',
  settings: '/platform/settings',
  expiry: '/platform/inventory',
};

export function getTabFromPathname(pathname: string): string {
  if (!pathname || pathname === '/platform' || pathname === '/') return 'home';
  if (pathname.endsWith('/stock') || pathname.endsWith('/inventory')) return 'stock';
  if (pathname.endsWith('/activity') || pathname.endsWith('/logs')) return 'logs';
  if (pathname.endsWith('/transfers')) return 'transfers';
  if (pathname.endsWith('/suppliers')) return 'suppliers';
  if (pathname.endsWith('/tasks')) return 'tasks';
  if (pathname.endsWith('/attendance') || pathname.endsWith('/timesheets')) return 'attendance';
  if (pathname.endsWith('/locations')) return 'locations';
  if (pathname.endsWith('/team')) return 'team';
  if (pathname.endsWith('/notifications')) return 'notifications';
  if (pathname.endsWith('/settings')) return 'settings';
  if (pathname.endsWith('/expiring') || pathname.endsWith('/expiry')) return 'stock';
  return 'home';
}

export function getPlatformNavigation(userRole: CompanyUserRole, tenantPrefix = '/platform'): PlatformNavGroup[] {
  const canManageOrganization = userRole === 'owner' || userRole === 'admin';
  const isStaff = userRole === 'staff';

  const makeHref = (id: string) => {
    if (id === 'home') return tenantPrefix;
    const path = TAB_TO_PATH[id] || `/platform/${id}`;
    return tenantPrefix === '/platform' ? path : path.replace('/platform', tenantPrefix);
  };

  const dashboardItems: PlatformNavItem[] = [
    { id: 'home', label: 'Dashboard', icon: <DashboardIcon size="xs" />, href: makeHref('home') },
    { id: 'logs', label: 'Activity Logs', icon: <ActivityIcon size="xs" />, href: makeHref('logs') },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon size="xs" />, href: makeHref('notifications') },
  ];

  const supplyChainItems: PlatformNavItem[] = [
    { id: 'stock', label: 'Inventory', icon: <BoxesIcon size="xs" />, href: makeHref('stock') },
    ...(!isStaff ? [{ id: 'transfers', label: 'Transfers', icon: <ArrowUpDownIcon size="xs" />, href: makeHref('transfers') }] : []),
  ];

  const supplierItems: PlatformNavItem[] = [
    { id: 'suppliers', label: 'Suppliers', icon: <TruckIcon size="xs" />, href: makeHref('suppliers') },
    { id: 'supplier-requests', label: 'Requests', icon: <ClockIcon size="xs" />, href: makeHref('suppliers') },
  ];

  const taskItems: PlatformNavItem[] = [
    { id: 'tasks', label: 'Tasks', icon: <CheckCircleIcon size="xs" />, href: makeHref('tasks') },
  ];

  const attendanceItems: PlatformNavItem[] = [
    { id: 'attendance', label: 'Timesheets', icon: <ClockIcon size="xs" />, href: makeHref('attendance') },
    { id: 'attendance-calendar', label: 'Calendar', icon: <CalendarIcon size="xs" />, href: makeHref('attendance') },
    { id: 'attendance-leaves', label: 'Time Off', icon: <UsersIcon size="xs" />, href: makeHref('attendance') },
    { id: 'attendance-kiosk', label: 'Kiosk / QR', icon: <QrCodeIcon size="xs" />, href: makeHref('attendance') },
  ];

  const organizationItems: PlatformNavItem[] = [
    { id: 'locations', label: 'Locations', icon: <WarehouseIcon size="xs" />, href: makeHref('locations') },
    ...(canManageOrganization ? [{ id: 'team', label: 'Team', icon: <UsersIcon size="xs" />, href: makeHref('team') }] : []),
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size="xs" />, href: makeHref('settings') },
  ];

  return [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size="xs" />, items: dashboardItems },
    { id: 'supply-chain', label: 'Supply Chain', icon: <BoxesIcon size="xs" />, items: supplyChainItems },
    ...(!isStaff ? [{ id: 'suppliers', label: 'Suppliers', icon: <TruckIcon size="xs" />, items: supplierItems }] : []),
    { id: 'tasks', label: 'Tasks', icon: <CheckCircleIcon size="xs" />, items: taskItems },
    { id: 'attendance', label: 'Attendance', icon: <CalendarIcon size="xs" />, items: attendanceItems },
    { id: 'organization', label: 'Organization', icon: <WarehouseIcon size="xs" />, items: organizationItems },
  ].filter((group) => group.items.length > 0);
}

export function getActivePlatformGroup(groups: PlatformNavGroup[], activeTab: string) {
  return groups.find((group) => group.items.some((item) => item.id === activeTab));
}

