'use client';

import React from 'react';
import {
  SettingsIcon,
  UsersIcon,
  WarehouseIcon,
  ActivityIcon,
} from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

export interface HomeQuickActionsWidgetProps {
  onOpenSettings?: () => void;
  onOpenTeam?: () => void;
  onOpenLocations?: () => void;
  onOpenLogs?: () => void;
}

/**
 * HomeQuickActionsWidget
 * 4 quick access action buttons:
 * - Org Settings
 * - Team & Roles
 * - Locations
 * - Audits Log
 *
 * Design guidelines:
 * - Clean and modern, zero emojis, zero icons in headlines.
 * - Responsive: 2x2 grid on mobile phones (h-14 touch targets), 4-column horizontal strip on desktop.
 * - Semantic design tokens: bg-stocky-bg-widget, border-stocky-border-subtle, text-stocky-text-main.
 */
export function HomeQuickActionsWidget({
  onOpenSettings,
  onOpenTeam,
  onOpenLocations,
  onOpenLogs,
}: HomeQuickActionsWidgetProps) {
  const { t } = useTranslation();

  const actions = [
    {
      id: 'settings',
      title: t('home.settings'),
      description: t('home.settingsDesc'),
      icon: <SettingsIcon size="xs" />,
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200/70',
      action: onOpenSettings,
    },
    {
      id: 'team',
      title: t('home.team'),
      description: t('home.teamDesc'),
      icon: <UsersIcon size="xs" />,
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/70',
      action: onOpenTeam,
    },
    {
      id: 'locations',
      title: t('home.locations'),
      description: t('home.locationsDesc'),
      icon: <WarehouseIcon size="xs" />,
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
      action: onOpenLocations,
    },
    {
      id: 'logs',
      title: t('home.logs'),
      description: t('home.logsDesc'),
      icon: <ActivityIcon size="xs" />,
      badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200/70',
      action: onOpenLogs,
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 w-full">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.action}
            className="group w-full h-14 sm:h-16 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl border border-stocky-border-subtle bg-stocky-bg-widget hover:border-stocky-border-default hover:bg-stocky-bg-global/50 active:scale-[0.98] transition-all flex items-center gap-3 text-start shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-stocky-primary/20"
          >
            <span
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${action.badgeClass}`}
            >
              {action.icon}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-xs sm:text-sm font-semibold text-stocky-text-main truncate group-hover:text-stocky-primary transition-colors">
                {action.title}
              </span>
              <span className="block text-[10px] sm:text-[11px] text-stocky-text-sub truncate mt-0.5">
                {action.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
