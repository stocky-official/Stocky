'use client';

import React, { useEffect, useState } from 'react';
import { BellIcon, SearchIcon, StockyLogoIcon, XIcon } from '@stocky/icons';
import type { CompanyUserRole } from '@stocky/types';
import { getActivePlatformGroup, getPlatformNavigation } from '../platformNavigation';
import { PlatformAccountMenuWidget } from '../PlatformAccountMenuWidget/PlatformAccountMenuWidget';
import { LanguageSwitcher } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

export interface SidebarNavWidgetProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userRole?: CompanyUserRole;
  permissions?: { pages?: string[] } | null;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  userEmail?: string | null;
  userName?: string | null;
  userTitle?: string | null;
  userAvatarUrl?: string | null;
  onSettingsClick?: () => void;
}

/**
 * Desktop workspace navigation. Root destinations stay visible at all times;
 * related destinations are shown by context tabs in the content pane.
 */
export function SidebarNavWidget({
  activeTab,
  onTabChange,
  userRole = 'owner',
  permissions,
  notificationCount = 0,
  onNotificationsClick,
  companyName,
  companyLogoUrl,
  searchQuery = '',
  onSearch,
  userEmail,
  userName,
  userTitle,
  userAvatarUrl,
  onSettingsClick,
}: SidebarNavWidgetProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [companyLogoUrl]);

  const { t } = useTranslation();
  const groups = getPlatformNavigation(userRole, '/platform', permissions, t);
  const activeGroupId = getActivePlatformGroup(groups, activeTab)?.id;
  const workspaceGroups = groups.filter((group) => group.id !== 'organization');
  const organizationGroups = groups.filter((group) => group.id === 'organization');

  const renderGroup = (group: (typeof groups)[number]) => {
    const isActive = activeGroupId === group.id;
    return (
      <button
        key={group.id}
        type="button"
        onClick={() => onTabChange(group.items[0].id)}
        aria-current={isActive ? 'page' : undefined}
        className={`stocky-workspace-nav-item ${isActive ? 'stocky-workspace-nav-item--active' : ''}`}
      >
        <span className="stocky-workspace-nav-item__icon" aria-hidden="true">{group.icon}</span>
        <span>{group.label}</span>
      </button>
    );
  };

  return (
    <aside className="stocky-workspace-sidebar hidden md:flex" aria-label={`Primary navigation for ${companyName || 'Stocky'}`}>
      <div className="stocky-workspace-sidebar__surface">
        <div className="stocky-workspace-sidebar__brand">
          {companyLogoUrl && !logoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={companyLogoUrl}
              alt={companyName || 'Stocky'}
              referrerPolicy="no-referrer"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="stocky-workspace-sidebar__brand-mark"><StockyLogoIcon size="xs" /></span>
          )}
          <span className="stocky-workspace-sidebar__brand-copy">
            <strong>Stocky</strong>
            <small>{companyName || t('nav.operations')}</small>
          </span>
        </div>
        <div className="stocky-workspace-sidebar__search">
          <SearchIcon size="xs" aria-hidden="true" />
          <input type="search" value={searchQuery} onChange={(event) => onSearch?.(event.target.value)} placeholder={t('common.search')} aria-label={t('common.search')} />
          {searchQuery && <button type="button" onClick={() => onSearch?.('')} aria-label={t('common.close')}><XIcon size="xs" /></button>}
        </div>
        <nav className="stocky-workspace-sidebar__nav" aria-label="Workspace">
          <p className="stocky-workspace-sidebar__label">{t('nav.workspace')}</p>
          {workspaceGroups.map(renderGroup)}
          {organizationGroups.length > 0 && <p className="stocky-workspace-sidebar__label stocky-workspace-sidebar__label--spaced">{t('nav.organization')}</p>}
          {organizationGroups.map(renderGroup)}
        </nav>

        <div className="stocky-workspace-sidebar__footer">
          {/* Language Switcher Control (Shrinks when collapsed, expands on hover) */}
          <LanguageSwitcher variant="sidebar" />

          <button
            type="button"
            onClick={onNotificationsClick}
            className="stocky-workspace-nav-item stocky-workspace-nav-item--utility"
            aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} to review` : ''}`}
          >
            <span className="stocky-workspace-nav-item__icon relative" aria-hidden="true">
              <BellIcon size="xs" />
              {notificationCount > 0 && <span className="stocky-workspace-notification-count">{notificationCount > 9 ? '9+' : notificationCount}</span>}
            </span>
            <span>{t('nav.notifications')}</span>
          </button>
          <PlatformAccountMenuWidget
            className="stocky-sidebar-account"
            menuPlacement="top"
            userEmail={userEmail}
            userName={userName}
            userTitle={userTitle}
            userRole={userRole}
            userAvatarUrl={userAvatarUrl}
            companyName={companyName}
            companyLogoUrl={companyLogoUrl}
            onSettingsClick={onSettingsClick}
            onNavigateToTab={onTabChange}
          />
        </div>
      </div>
    </aside>
  );
}
