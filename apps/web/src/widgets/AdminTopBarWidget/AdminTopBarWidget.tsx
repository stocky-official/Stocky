'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashboardIcon,
  LogOutIcon,
  SettingsIcon,
  StockyLogoIcon,
  WarehouseIcon,
} from '@stocky/icons';
import { LanguageSwitcher } from '@/components/ui';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useTranslation } from '@/lib/i18n';
import { useAdminAuth } from '@/views/admin/AdminAuthContext';

export interface AdminTopBarWidgetProps {
  pendingCount?: number;
}

export function AdminTopBarWidget({ pendingCount = 0 }: AdminTopBarWidgetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { adminEmail, signOut } = useAdminAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard') || 'Dashboard',
      href: '/admin/dashboard',
      icon: <DashboardIcon size="sm" />,
    },
    {
      id: 'companies',
      label: t('nav.companies') || 'Companies',
      href: '/admin/companies',
      icon: <WarehouseIcon size="sm" />,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: 'settings',
      label: t('nav.settings') || 'Settings',
      href: '/admin/settings',
      icon: <SettingsIcon size="sm" />,
    },
  ];

  return (
    <>
      {/* Mobile TopBar */}
      <header className="md:hidden sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-stocky-border-subtle bg-stocky-bg-widget/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stocky-accent text-stocky-text-main shadow-2xs">
            <StockyLogoIcon size="xs" />
          </div>
          <span className="text-sm font-bold text-stocky-text-main">
            Stocky <span className="text-stocky-primary font-normal text-xs">Admin</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:text-stocky-status-critical-fg hover:bg-stocky-status-critical-bg transition-colors"
          >
            <LogOutIcon size="xs" />
          </button>
          <UserAvatar
            name="Abdelrahman Mamdouh"
            email={adminEmail}
            size="xs"
            className="ring-1 ring-stocky-border-subtle"
          />
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-stocky-bg-widget/95 backdrop-blur-md border-t border-stocky-border-subtle flex items-center justify-around h-16 px-2 shadow-lg"
        aria-label="Mobile Admin Navigation"
      >
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${
                isActive
                  ? 'text-stocky-primary font-semibold'
                  : 'text-stocky-text-sub hover:text-stocky-text-main font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1 -end-2 flex h-4 w-4 items-center justify-center rounded-full bg-stocky-status-warning-fg text-[9px] font-bold text-stocky-text-inverse shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
