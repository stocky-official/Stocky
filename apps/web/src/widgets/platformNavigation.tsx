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
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '');
  if (!cleanPath || cleanPath === '/platform') return 'home';
  if (cleanPath.endsWith('/stock') || cleanPath.endsWith('/inventory')) return 'stock';
  if (cleanPath.endsWith('/activity') || cleanPath.endsWith('/logs')) return 'logs';
  if (cleanPath.endsWith('/transfers')) return 'transfers';
  if (cleanPath.endsWith('/suppliers')) return 'suppliers';
  if (cleanPath.endsWith('/tasks')) return 'tasks';
  if (cleanPath.endsWith('/attendance') || cleanPath.endsWith('/timesheets')) return 'attendance';
  if (cleanPath.endsWith('/locations')) return 'locations';
  if (cleanPath.endsWith('/team')) return 'team';
  if (cleanPath.endsWith('/notifications')) return 'notifications';
  if (cleanPath.endsWith('/settings')) return 'settings';
  if (cleanPath.endsWith('/expiring') || cleanPath.endsWith('/expiry')) return 'stock';
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

