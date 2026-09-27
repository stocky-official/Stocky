'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashboardIcon,
  LogOutIcon,
  SearchIcon,
  SettingsIcon,
  StockyLogoIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import { LanguageSwitcher } from '@/components/ui';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useTranslation } from '@/lib/i18n';
import { useAdminAuth } from '@/views/admin/AdminAuthContext';

export interface AdminSidebarNavWidgetProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  pendingCount?: number;
}

export function AdminSidebarNavWidget({
  searchQuery = '',
  onSearchChange,
  pendingCount = 0,
}: AdminSidebarNavWidgetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, adminEmail, signOut } = useAdminAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard') || 'Dashboard',
      href: '/admin/dashboard',
      icon: <DashboardIcon size="xs" />,
      badge: null,
    },
    {
      id: 'companies',
      label: t('nav.companies') || 'Companies',
      href: '/admin/companies',
      icon: <WarehouseIcon size="xs" />,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: 'settings',
      label: t('nav.settings') || 'Settings',
      href: '/admin/settings',
      icon: <SettingsIcon size="xs" />,
      badge: null,
    },
  ];

  return (
    <aside className="stocky-workspace-sidebar hidden md:flex" aria-label="Stocky Admin Navigation">
      <div className="stocky-workspace-sidebar__surface">
        {/* Brand Header */}
        <div className="stocky-workspace-sidebar__brand">
          <span className="stocky-workspace-sidebar__brand-mark">
            <StockyLogoIcon size="xs" />
          </span>
          <span className="stocky-workspace-sidebar__brand-copy">
            <strong>Stocky</strong>
            <small className="text-stocky-primary font-semibold">Admin Console</small>
          </span>
        </div>

        {/* Quick Search */}
        <div className="stocky-workspace-sidebar__search">
          <SearchIcon size="xs" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={t('common.search') || 'Search companies...'}
            aria-label="Search companies"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              aria-label={t('common.close') || 'Clear search'}
            >
              <XIcon size="xs" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="stocky-workspace-sidebar__nav" aria-label="Admin Sections">
          <p className="stocky-workspace-sidebar__label">Platform Management</p>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(item.href)}
                aria-current={isActive ? 'page' : undefined}
                className={`stocky-workspace-nav-item ${
                  isActive ? 'stocky-workspace-nav-item--active' : ''
                }`}
              >
                <span className="stocky-workspace-nav-item__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="flex-1 text-start">{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stocky-status-warning-bg text-stocky-status-warning-fg border border-stocky-status-warning-border">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="stocky-workspace-sidebar__footer">
          {/* Language Switcher */}
          <LanguageSwitcher variant="sidebar" />

          {/* Admin User Profile Cardlet */}
          <div className="p-3 rounded-2xl bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <UserAvatar
                name="Abdelrahman Mamdouh"
                email={adminEmail}
                size="sm"
                className="shrink-0 ring-1 ring-stocky-border-subtle"
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-stocky-text-main block truncate leading-tight">
                  Abdelrahman Mamdouh
                </span>
                <span className="text-[10px] text-stocky-primary font-medium block truncate">
                  Super Admin
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              title="Sign out of Admin Portal"
              className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:text-stocky-status-critical-fg hover:bg-stocky-status-critical-bg transition-colors cursor-pointer shrink-0"
            >
              <LogOutIcon size="xs" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
