'use client';

import type { CompanyUserRole } from '@stocky/types';
import { getActivePlatformGroup, getPlatformNavigation } from '../platformNavigation';

export interface PlatformContextTabsWidgetProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userRole: CompanyUserRole;
  className?: string;
}

/**
 * A compact, spreadsheet-style second level of navigation. It deliberately
 * appears only when a root workspace has related operational views.
 */
export function PlatformContextTabsWidget({ activeTab, onTabChange, userRole, className = '' }: PlatformContextTabsWidgetProps) {
  const group = getActivePlatformGroup(getPlatformNavigation(userRole), activeTab);

  if (!group || group.items.length < 2) return null;

  return (
    <nav className={`stocky-context-tabs ${className}`.trim()} aria-label={`${group.label} views`}>
      <div className="stocky-context-tabs__list">
        {group.items.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`stocky-context-tabs__item ${isActive ? 'stocky-context-tabs__item--active' : ''}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
