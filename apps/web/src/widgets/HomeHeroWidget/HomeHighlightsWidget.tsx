'use client';

import React from 'react';
import {
  AlertTriangleIcon,
  TruckIcon,
  ActivityIcon,
  UsersIcon,
} from '@stocky/icons';

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
  expiringSkuCount = 8,
  pendingSupplierRequestsCount = 3,
  assignedTasksCount = 5,
  attendancePct = 92,
  activeStaffPresent = 11,
  totalStaff = 12,
  onOpenExpiry,
  onOpenSuppliers,
  onOpenTasks,
  onOpenAttendance,
}: HomeHighlightsWidgetProps) {
  const cards = [
    {
      id: 'expiring-skus',
      title: 'Expiring SKUs',
      value: expiringSkuCount.toString(),
      subtitle: 'Within 30-day window',
      icon: <AlertTriangleIcon size="xs" />,
      badgeBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
      action: onOpenExpiry,
    },
    {
      id: 'supplier-requests',
      title: 'Supplier Requests',
      value: pendingSupplierRequestsCount.toString(),
      subtitle: 'Awaiting supplier action',
      icon: <TruckIcon size="xs" />,
      badgeBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
      action: onOpenSuppliers,
    },
    {
      id: 'assigned-tasks',
      title: 'Assigned Tasks',
      value: assignedTasksCount.toString(),
      subtitle: 'Audits & cycle counts',
      icon: <ActivityIcon size="xs" />,
      badgeBg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
      action: onOpenTasks,
    },
    {
      id: 'attendance-today',
      title: 'Staff on Duty',
      value: `${attendancePct}%`,
      subtitle: `${activeStaffPresent} of ${totalStaff} active staff`,
      icon: <UsersIcon size="xs" />,
      badgeBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
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
