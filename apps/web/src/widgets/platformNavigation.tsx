import React from 'react';
import {
  ActivityIcon,
  ArrowUpDownIcon,
  BellIcon,
  BoxesIcon,
  CheckCircleIcon,
  ClockIcon,
  DashboardIcon,
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
  stock: '/platform/stock',
  transfers: '/platform/transfers',
  suppliers: '/platform/suppliers',
  'supplier-requests': '/platform/suppliers',
  tasks: '/platform/tasks',
  'tasks-completed': '/platform/tasks',
  locations: '/platform/locations',
  team: '/platform/team',
  notifications: '/platform/notifications',
  settings: '/platform/settings',
  expiry: '/platform/expiring',
};

export function getTabFromPathname(pathname: string): string {
  if (!pathname || pathname === '/platform' || pathname === '/') return 'home';
  if (pathname.endsWith('/stock')) return 'stock';
  if (pathname.endsWith('/activity') || pathname.endsWith('/logs')) return 'logs';
  if (pathname.endsWith('/transfers')) return 'transfers';
  if (pathname.endsWith('/suppliers')) return 'suppliers';
  if (pathname.endsWith('/tasks')) return 'tasks';
  if (pathname.endsWith('/locations')) return 'locations';
  if (pathname.endsWith('/team')) return 'team';
  if (pathname.endsWith('/notifications')) return 'notifications';
  if (pathname.endsWith('/settings')) return 'settings';
  if (pathname.endsWith('/expiring') || pathname.endsWith('/expiry')) return 'expiry';
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
    { id: 'stock', label: 'Stock', icon: <BoxesIcon size="xs" />, href: makeHref('stock') },
    ...(!isStaff ? [{ id: 'transfers', label: 'Transfers', icon: <ArrowUpDownIcon size="xs" />, href: makeHref('transfers') }] : []),
    { id: 'expiry', label: 'Expiring', icon: <ClockIcon size="xs" />, href: makeHref('expiry') },
  ];

  const supplierItems: PlatformNavItem[] = [
    { id: 'suppliers', label: 'Suppliers', icon: <TruckIcon size="xs" />, href: makeHref('suppliers') },
    { id: 'supplier-requests', label: 'Requests', icon: <ClockIcon size="xs" />, href: makeHref('suppliers') },
  ];

  const taskItems: PlatformNavItem[] = [
    { id: 'tasks', label: 'Ongoing', icon: <ActivityIcon size="xs" />, href: makeHref('tasks') },
    { id: 'tasks-completed', label: 'Completed', icon: <CheckCircleIcon size="xs" />, href: makeHref('tasks') },
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
    { id: 'organization', label: 'Organization', icon: <WarehouseIcon size="xs" />, items: organizationItems },
  ].filter((group) => group.items.length > 0);
}

export function getActivePlatformGroup(groups: PlatformNavGroup[], activeTab: string) {
  return groups.find((group) => group.items.some((item) => item.id === activeTab));
}

