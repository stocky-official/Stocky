'use client';

import React from 'react';

export interface HomeExecutiveKpiStripWidgetProps {
  totalValuation: number;
  totalUnits: number;
  totalBranches: number;
  totalUnitsMoved: number;
  movementCount: number;
  dormantCapital: number;
  dormantSkuCount: number;
  expiringSkuCount: number;
  lowStockCount: number;
  attendancePct: number;
  activeStaffOnDuty: number;
  totalStaffCount: number;
  onOpenStock?: () => void;
  onOpenExpiry?: () => void;
  onOpenAttendance?: () => void;
}

/**
 * HomeExecutiveKpiStripWidget
 * 5 high-density Power BI scorecards presenting real-time operational capital,
 * inventory turnover, risk exposure, and workforce presence at a glance.
 */
export function HomeExecutiveKpiStripWidget({
  totalValuation,
  totalUnits,
  totalBranches,
  totalUnitsMoved,
  movementCount,
  dormantCapital,
  dormantSkuCount,
  expiringSkuCount,
  lowStockCount,
  attendancePct,
  activeStaffOnDuty,
  totalStaffCount,
  onOpenStock,
  onOpenExpiry,
  onOpenAttendance,
}: HomeExecutiveKpiStripWidgetProps) {
  const kpis = [
    {
      id: 'valuation',
      label: 'Inventory Valuation',
      value: `$${(totalValuation / 1000).toFixed(1)}k`,
      detail: `${totalUnits.toLocaleString()} units • ${totalBranches} branches`,
      valueColor: 'text-stocky-text-main',
      indicatorBg: 'bg-emerald-500',
      action: onOpenStock,
    },
    {
      id: 'velocity',
      label: 'Turnover Velocity',
      value: `${totalUnitsMoved.toLocaleString()} units`,
      detail: `${movementCount} movements recorded`,
      valueColor: 'text-stocky-primary',
      indicatorBg: 'bg-stocky-primary',
      action: onOpenStock,
    },
    {
      id: 'stagnant',
      label: 'Dormant Capital',
      value: `$${dormantCapital.toLocaleString()}`,
      detail: `${dormantSkuCount} slow-moving SKUs`,
      valueColor: dormantCapital > 0 ? 'text-amber-600' : 'text-stocky-text-main',
      indicatorBg: 'bg-amber-500',
      action: onOpenStock,
    },
    {
      id: 'risks',
      label: 'Inventory Risks',
      value: `${expiringSkuCount + lowStockCount} SKUs`,
      detail: `${expiringSkuCount} expiring • ${lowStockCount} low stock`,
      valueColor: expiringSkuCount > 0 ? 'text-rose-600' : 'text-stocky-text-main',
      indicatorBg: expiringSkuCount > 0 ? 'bg-rose-500' : 'bg-emerald-500',
      action: onOpenExpiry || onOpenStock,
    },
    {
      id: 'attendance',
      label: 'Staff Presence',
      value: `${attendancePct}%`,
      detail: `${activeStaffOnDuty} of ${totalStaffCount} on duty today`,
      valueColor: attendancePct >= 75 ? 'text-emerald-600' : 'text-amber-600',
      indicatorBg: attendancePct >= 75 ? 'bg-emerald-500' : 'bg-amber-500',
      action: onOpenAttendance,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          data-testid={`kpi-card-${kpi.id}`}
          onClick={kpi.action}
          className={`group bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-3.5 shadow-xs transition-all flex flex-col justify-between ${
            kpi.action ? 'hover:border-stocky-border-default hover:shadow-sm cursor-pointer' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-stocky-border-subtle/50">
            <span className="text-[11px] font-semibold text-stocky-text-sub truncate">
              {kpi.label}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${kpi.indicatorBg} shrink-0`} />
          </div>

          <div className="pt-2">
            <div className={`text-lg sm:text-xl font-bold tracking-tight ${kpi.valueColor}`}>
              {kpi.value}
            </div>
            <div className="text-[10px] sm:text-[11px] text-stocky-text-sub truncate font-medium mt-0.5">
              {kpi.detail}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
