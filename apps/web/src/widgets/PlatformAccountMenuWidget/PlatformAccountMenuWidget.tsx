'use client';

import React, { useState } from 'react';
import { signInWithGoogle, signOutUser } from '@/lib/auth';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  LogOutIcon,
  SettingsIcon,
  UsersIcon,
  WarehouseIcon,
  ActivityIcon,
  BoxesIcon,
  XIcon,
} from '@stocky/icons';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';

export interface PlatformAccountMenuWidgetProps {
  userEmail?: string | null;
  userName?: string | null;
  userTitle?: string | null;
  userRole?: string | null;
  userAvatarUrl?: string | null;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  onSettingsClick?: () => void;
  onNavigateToTab?: (tab: string) => void;
  className?: string;
  menuPlacement?: 'bottom' | 'top';
  useDrawer?: boolean;
}

function formatFallbackName(email?: string | null) {
  const localPart = email?.split('@')[0];
  if (!localPart) return 'Guest';

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function PlatformAccountMenuWidget({
  userEmail,
  userName,
  userTitle,
  userRole,
  userAvatarUrl,
  companyName,
  companyLogoUrl,
  onSettingsClick,
  onNavigateToTab,
  className = '',
  menuPlacement = 'bottom',
  useDrawer = true,
}: PlatformAccountMenuWidgetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const displayName = userName || formatFallbackName(userEmail);
  const displayTitle = userTitle || (userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : (userEmail ? t('team.roleStaff') : t('auth.signIn')));

  const handleSignIn = async () => {
    await signInWithGoogle('/platform');
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOutUser();
  };

  const handleTriggerClick = async () => {
    if (!userEmail) {
      await handleSignIn();
      return;
    }
    setIsOpen(true);
  };

  const handleNavAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className={`relative min-w-0 ${className}`}>
      {/* Top Bar / Sidebar Trigger Button */}
      <button
        type="button"
        onClick={handleTriggerClick}
        className={`stocky-account-trigger ${isOpen ? 'stocky-account-trigger--open' : ''}`}
        title={userEmail ? t('accountMenu.accountUser', { email: userEmail }) : t('auth.signIn')}
        aria-label={userEmail ? t('accountMenu.openMenu') : t('auth.signIn')}
        aria-expanded={userEmail ? isOpen : undefined}
        aria-haspopup="dialog"
      >
        <span className="stocky-account-trigger__avatar">
          <UserAvatar
            src={userAvatarUrl}
            name={displayName}
            email={userEmail}
            size="sm"
            className="w-full h-full border-0 rounded-full"
          />
        </span>
        <span className="stocky-account-trigger__copy">
          <span className="stocky-account-trigger__name">{displayName}</span>
          <span className="stocky-account-trigger__title">{displayTitle}</span>
        </span>
        <ChevronDownIcon size="xs" className={`stocky-account-trigger__chevron ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Touch-Friendly Account & Organization Drawer */}
      <SideDrawer
        isOpen={isOpen && Boolean(userEmail)}
        onClose={() => setIsOpen(false)}
        ariaLabel={t('accountMenu.title')}
        zIndex={100}
        panelClassName="max-w-md w-full"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stocky-border-subtle bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stocky-primary/10 text-stocky-primary flex items-center justify-center">
              <BoxesIcon size="xs" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stocky-text-main">{t('accountMenu.title')}</h2>
              <p className="text-[11px] text-stocky-text-sub">{t('accountMenu.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label={t('common.close')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {/* User Profile Card */}
          <div className="bg-stocky-bg-global/60 border border-stocky-border-subtle rounded-2xl p-4 flex items-center gap-3.5">
            <UserAvatar
              src={userAvatarUrl}
              name={displayName}
              email={userEmail}
              size="md"
              className="w-12 h-12 rounded-full border border-stocky-border-subtle shrink-0 ring-2 ring-white shadow-2xs"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-stocky-text-main truncate">
                  {displayName}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stocky-primary/10 text-stocky-primary border border-stocky-primary/20">
                  {displayTitle}
                </span>
              </div>
              <span className="text-xs text-stocky-text-sub truncate font-mono mt-0.5">
                {userEmail}
              </span>
            </div>
          </div>

          {/* Company / Workspace Card */}
          {companyName && (
            <div className="bg-white border border-stocky-border-subtle rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                {companyLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={companyLogoUrl}
                    alt={companyName}
                    className="w-8 h-8 object-contain rounded-lg shrink-0 border border-stocky-border-subtle"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-stocky-primary text-white flex items-center justify-center shrink-0">
                    <BoxesIcon size="xs" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-stocky-text-main truncate">
                    {companyName}
                  </span>
                  <span className="text-[10px] text-stocky-text-sub">
                    {t('nav.organization')}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stocky-status-success-bg text-stocky-status-success-fg border border-stocky-status-success-border">
                Live
              </span>
            </div>
          )}

          {/* Language Switcher Setting Card */}
          <LanguageSwitcher variant="drawerItem" />

          {/* Management Navigation Group */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-stocky-text-sub uppercase tracking-wider px-1">
              {t('nav.workspace')}
            </span>

            {/* 1. Organization Settings */}
            <button
              type="button"
              onClick={() => handleNavAction(() => (onSettingsClick ? onSettingsClick() : onNavigateToTab?.('settings')))}
              className="w-full p-3 rounded-xl border border-stocky-border-subtle bg-white hover:bg-stocky-bg-global active:scale-[0.99] transition-all flex items-center justify-between gap-3 text-start cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-text-main group-hover:border-stocky-primary/40 group-hover:text-stocky-primary transition-colors shrink-0">
                  <SettingsIcon size="xs" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-stocky-text-main group-hover:text-stocky-primary transition-colors">
                    {t('nav.settings')}
                  </span>
                  <span className="text-[10px] text-stocky-text-sub">
                    {t('accountMenu.settingsDesc')}
                  </span>
                </div>
              </div>
              <ChevronRightIcon size="xs" className="text-stocky-text-sub group-hover:text-stocky-primary group-hover:translate-x-0.5 transition-all shrink-0 rtl:rotate-180" />
            </button>

            {/* 2. Team & Permissions */}
            <button
              type="button"
              onClick={() => handleNavAction(() => onNavigateToTab?.('team'))}
              className="w-full p-3 rounded-xl border border-stocky-border-subtle bg-white hover:bg-stocky-bg-global active:scale-[0.99] transition-all flex items-center justify-between gap-3 text-start cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-text-main group-hover:border-stocky-primary/40 group-hover:text-stocky-primary transition-colors shrink-0">
                  <UsersIcon size="xs" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-stocky-text-main group-hover:text-stocky-primary transition-colors">
                    {t('team.title')}
                  </span>
                  <span className="text-[10px] text-stocky-text-sub">
                    {t('accountMenu.teamDesc')}
                  </span>
                </div>
              </div>
              <ChevronRightIcon size="xs" className="text-stocky-text-sub group-hover:text-stocky-primary group-hover:translate-x-0.5 transition-all shrink-0 rtl:rotate-180" />
            </button>

            {/* 3. Locations & Attendance QR */}
            <button
              type="button"
              onClick={() => handleNavAction(() => onNavigateToTab?.('locations'))}
              className="w-full p-3 rounded-xl border border-stocky-border-subtle bg-white hover:bg-stocky-bg-global active:scale-[0.99] transition-all flex items-center justify-between gap-3 text-start cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-text-main group-hover:border-stocky-primary/40 group-hover:text-stocky-primary transition-colors shrink-0">
                  <WarehouseIcon size="xs" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-stocky-text-main group-hover:text-stocky-primary transition-colors">
                    {t('locations.title')}
                  </span>
                  <span className="text-[10px] text-stocky-text-sub">
                    {t('accountMenu.locationsDesc')}
                  </span>
                </div>
              </div>
              <ChevronRightIcon size="xs" className="text-stocky-text-sub group-hover:text-stocky-primary group-hover:translate-x-0.5 transition-all shrink-0 rtl:rotate-180" />
            </button>

            {/* 4. Activity Logs */}
            <button
              type="button"
              onClick={() => handleNavAction(() => onNavigateToTab?.('logs'))}
              className="w-full p-3 rounded-xl border border-stocky-border-subtle bg-white hover:bg-stocky-bg-global active:scale-[0.99] transition-all flex items-center justify-between gap-3 text-start cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-text-main group-hover:border-stocky-primary/40 group-hover:text-stocky-primary transition-colors shrink-0">
                  <ActivityIcon size="xs" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-stocky-text-main group-hover:text-stocky-primary transition-colors">
                    {t('nav.activity')}
                  </span>
                  <span className="text-[10px] text-stocky-text-sub">
                    {t('accountMenu.logsDesc')}
                  </span>
                </div>
              </div>
              <ChevronRightIcon size="xs" className="text-stocky-text-sub group-hover:text-stocky-primary group-hover:translate-x-0.5 transition-all shrink-0 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Drawer Footer with Big Log Out Button */}
        <div className="p-4 sm:p-5 border-t border-stocky-border-subtle bg-white flex flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-11 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <LogOutIcon size="xs" />
            <span>{t('nav.logout')}</span>
          </button>
          <p className="text-center text-[10px] text-stocky-text-sub">
            Stocky v0.1.0 · Powered by Overted Technologies
          </p>
        </div>
      </SideDrawer>
    </div>
  );
}

export default PlatformAccountMenuWidget;
