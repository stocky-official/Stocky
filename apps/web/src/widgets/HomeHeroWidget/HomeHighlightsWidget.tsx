'use client';

import React from 'react';
import {
  AlertTriangleIcon,
  TruckIcon,
  ActivityIcon,
  UsersIcon,
} from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

export interface HomeHighlightsWidgetProps {
  expiringSkuCount?: number;
  pendingSupplierRequestsCount?: number;
  assignedTasksCount?: number;
  attendancePct?: number;
  activeStaffPresent?: number;
  totalStaff?: number;
  onOpenExpiry?: () => void;
  onOpenSuppliers?: () => void;
  onOpenTasks?: () => void;
  onOpenAttendance?: () => void;
}

/**
 * HomeHighlightsWidget
 * 4 high-priority operational call cards directly below the Home hero:
 * - 2x2 grid on mobile (Phone)
 * - 4-column strip across desktop
 * Covers:
 * 1. Expiring items soon (distinct SKU count)
 * 2. Pending supplier requests
 * 3. Assigned tasks (cycle counts and physical audits)
 * 4. Staff on duty today (% with active staff counts)
 */
export function HomeHighlightsWidget({
  expiringSkuCount = 0,
  pendingSupplierRequestsCount = 0,
  assignedTasksCount = 0,
  attendancePct = 0,
  activeStaffPresent = 0,
  totalStaff = 0,
  onOpenExpiry,
  onOpenSuppliers,
  onOpenTasks,
  onOpenAttendance,
}: HomeHighlightsWidgetProps) {
  const { t } = useTranslation();

  const cards = [
    {
      id: 'expiring-skus',
      title: t('home.expiringSkus'),
      value: expiringSkuCount.toString(),
      subtitle: t('home.expiringDesc'),
      icon: <AlertTriangleIcon size="xs" />,
      badgeBg: 'bg-stocky-status-warning-bg text-stocky-status-warning-fg border border-stocky-status-warning-border',
      action: onOpenExpiry,
    },
    {
      id: 'supplier-requests',
      title: t('home.supplierRequests'),
      value: pendingSupplierRequestsCount.toString(),
      subtitle: t('home.supplierRequestsDesc'),
      icon: <TruckIcon size="xs" />,
      badgeBg: 'bg-stocky-status-info-bg text-stocky-status-info-fg border border-stocky-status-info-border',
      action: onOpenSuppliers,
    },
    {
      id: 'assigned-tasks',
      title: t('home.assignedTasks'),
      value: assignedTasksCount.toString(),
      subtitle: t('home.assignedTasksDesc'),
      icon: <ActivityIcon size="xs" />,
      badgeBg: 'bg-stocky-status-hold-bg text-stocky-status-hold-fg border border-stocky-status-hold-border',
      action: onOpenTasks,
    },
    {
      id: 'attendance-today',
      title: t('home.staffOnDuty'),
      value: `${attendancePct}%`,
      subtitle: t('home.activeStaff', { active: activeStaffPresent, total: totalStaff }),
      icon: <UsersIcon size="xs" />,
      badgeBg: 'bg-stocky-status-success-bg text-stocky-status-success-fg border border-stocky-status-success-border',
      action: onOpenAttendance,
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={card.action}
            onKeyDown={(event) => {
              if (card.action && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                card.action();
              }
            }}
            role={card.action ? 'button' : undefined}
            tabIndex={card.action ? 0 : undefined}
            className={`bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between transition-all ${
              card.action ? 'hover:border-stocky-border-default hover:shadow-sm cursor-pointer active:scale-[0.99]' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.badgeBg}`}>
                {card.icon}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-stocky-text-main tracking-tight truncate">
                {card.value}
              </span>
            </div>
            <div className="mt-2.5 flex flex-col min-w-0">
              <span className="text-xs font-semibold text-stocky-text-main truncate">
                {card.title}
              </span>
              <span className="text-[11px] text-stocky-text-sub mt-0.5 truncate">
                {card.subtitle}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
