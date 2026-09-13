'use client';

import React from 'react';
import {
  AlertCircleIcon,
  ArrowUpDownIcon,
  BoxesIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
  TruckIcon,
  WarehouseIcon,
} from '@stocky/icons';
import type { CompanyUserRole } from '@stocky/types';

export interface RoleHomeMetrics {
  expiredLots: number;
  expiringLots: number;
  lowStockProducts: number;
  pendingTransfers: number;
  supplierRequests: number;
  openCounts: number;
}

export interface RoleHomeWidgetProps {
  userName?: string | null;
  userRole: CompanyUserRole;
  locationName: string;
  metrics: RoleHomeMetrics;
  onOpenStock: () => void;
  onOpenExpiry: () => void;
  onOpenTransfers: () => void;
  onOpenSuppliers: () => void;
  onOpenLocations: () => void;
  onOpenReceive: () => void;
  onOpenCount: () => void;
  onOpenTasks?: () => void;
  onOpenSearch: () => void;
}

const roleCopy: Record<CompanyUserRole, { heading: string; subtitle: string }> = {
  owner: { heading: 'Good morning', subtitle: 'Here is what needs your attention across the company.' },
  admin: { heading: 'Good morning', subtitle: 'Here is what needs attention across your locations.' },
  manager: { heading: 'Your branch today', subtitle: 'Keep stock accurate and act on the items that need attention.' },
  staff: { heading: 'Your tasks today', subtitle: 'Use the quick actions below to keep your branch stock accurate.' },
};

export function RoleHomeWidget({
  userName,
  userRole,
  locationName,
  metrics,
  onOpenStock,
  onOpenExpiry,
  onOpenTransfers,
  onOpenSuppliers,
  onOpenLocations,
  onOpenReceive,
  onOpenCount,
  onOpenTasks,
  onOpenSearch,
}: RoleHomeWidgetProps) {
  const copy = roleCopy[userRole];
  const firstName = userName?.trim().split(/\s+/)[0];
  const isStaff = userRole === 'staff';
  const isOwner = userRole === 'owner' || userRole === 'admin';
  const isManager = userRole === 'manager';

  const attentionCards = [
    {
      label: 'Expired stock',
      value: metrics.expiredLots,
      helper: 'Remove or return now',
      icon: <AlertCircleIcon size="sm" />,
      tone: 'red',
      onClick: onOpenExpiry,
    },
    {
      label: 'Expiring soon',
      value: metrics.expiringLots,
      helper: 'Review before the alert date',
      icon: <ClockIcon size="sm" />,
      tone: 'amber',
      onClick: onOpenExpiry,
    },
    {
      label: 'Low stock',
      value: metrics.lowStockProducts,
      helper: 'Products below reorder point',
      icon: <BoxesIcon size="sm" />,
      tone: 'blue',
      onClick: onOpenStock,
    },
    {
      label: isOwner ? 'Company stock' : 'Branch stock',
      value: 'Open',
      helper: 'Search, receive, count, or move stock',
      icon: <WarehouseIcon size="sm" />,
      tone: 'blue',
      onClick: onOpenStock,
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      {isStaff ? (
        <section className="grid grid-cols-2 gap-4">
          <button type="button" onClick={onOpenSearch} className="min-h-[112px] rounded-2xl bg-stocky-primary text-white p-4 text-left shadow-sm hover:bg-stocky-primary-hover transition-colors cursor-pointer">
            <SearchIcon size="sm" />
            <span className="block mt-5 text-sm font-medium">Scan or search</span>
            <span className="block mt-1 text-[11px] text-white/75">Find a product quickly</span>
          </button>
          <button type="button" onClick={onOpenReceive} className="min-h-[112px] rounded-2xl bg-white border border-stocky-border-subtle p-4 text-left hover:border-stocky-primary/40 transition-colors cursor-pointer">
            <PlusIcon size="sm" className="text-stocky-primary" />
            <span className="block mt-5 text-sm font-medium text-stocky-text-main">Receive stock</span>
            <span className="block mt-1 text-[11px] text-stocky-text-sub">Log a delivery</span>
          </button>
          <button type="button" onClick={onOpenCount} className="min-h-[112px] rounded-2xl bg-white border border-stocky-border-subtle p-4 text-left hover:border-stocky-primary/40 transition-colors cursor-pointer">
            <CheckCircleIcon size="sm" className="text-emerald-600" />
            <span className="block mt-5 text-sm font-medium text-stocky-text-main">Count stock</span>
            <span className="block mt-1 text-[11px] text-stocky-text-sub">Check what is on the shelf</span>
          </button>
          <button type="button" onClick={onOpenExpiry} className="min-h-[112px] rounded-2xl bg-white border border-stocky-border-subtle p-4 text-left hover:border-stocky-primary/40 transition-colors cursor-pointer">
            <ClockIcon size="sm" className="text-amber-600" />
            <span className="block mt-5 text-sm font-medium text-stocky-text-main">Expiring soon</span>
            <span className="block mt-1 text-[11px] text-stocky-text-sub">{metrics.expiringLots} items need review</span>
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {attentionCards.map((card) => (
            <button key={card.label} type="button" onClick={card.onClick} className="rounded-2xl bg-white border border-stocky-border-subtle p-4 text-left hover:border-stocky-primary/40 transition-colors cursor-pointer">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${card.tone === 'red' ? 'stocky-status-critical' : card.tone === 'amber' ? 'stocky-status-warning' : 'stocky-status-info'}`}>
                {card.icon}
              </div>
              <p className="mt-4 text-xs text-stocky-text-sub">{card.label}</p>
              <p className="mt-1 text-2xl font-medium text-stocky-text-main">{card.value}</p>
              <p className="mt-1 text-[11px] text-stocky-text-sub">{card.helper}</p>
            </button>
          ))}
        </section>
      )}

      {isManager && (
        <section className="rounded-2xl bg-white border border-stocky-border-subtle p-4 sm:p-6">
          <div>
            <h2 className="text-base font-medium text-stocky-text-main">Run your branch</h2>
            <p className="text-xs text-stocky-text-sub mt-1">Start the two routines your team uses most.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button type="button" onClick={onOpenReceive} className="min-h-20 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle p-3 text-left hover:border-stocky-primary/40 transition-colors cursor-pointer">
              <PlusIcon size="sm" className="text-stocky-primary" />
              <span className="block mt-2 text-xs font-medium text-stocky-text-main">Receive stock</span>
            </button>
            <button type="button" onClick={() => onOpenCount()} className="min-h-20 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle p-3 text-left hover:border-stocky-primary/40 transition-colors cursor-pointer">
              <CheckCircleIcon size="sm" className="text-emerald-600" />
              <span className="block mt-2 text-xs font-medium text-stocky-text-main">Count stock</span>
            </button>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4">
        <div className="rounded-2xl bg-white border border-stocky-border-subtle p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-medium text-stocky-text-main">{isStaff ? 'Things to check' : 'Next actions'}</h2>
              <p className="text-xs text-stocky-text-sub mt-1">{isStaff ? 'Flag anything that needs your manager.' : 'Open the work queue that needs a decision.'}</p>
            </div>
            <ArrowUpDownIcon size="sm" className="text-stocky-primary" />
          </div>
          <div className="mt-4 divide-y divide-stocky-border-subtle">
            {isStaff ? (
              <>
                <button type="button" onClick={onOpenExpiry} className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-stocky-bg-global rounded-lg px-2 cursor-pointer">
                  <span className="flex items-center gap-2 text-sm text-stocky-text-main"><ClockIcon size="xs" className="text-stocky-text-sub" /> Expiring items to check</span>
                  <span className="text-xs font-medium text-stocky-primary">{metrics.expiringLots + metrics.expiredLots}</span>
                </button>
                <button type="button" onClick={() => onOpenStock()} className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-stocky-bg-global rounded-lg px-2 cursor-pointer">
                  <span className="flex items-center gap-2 text-sm text-stocky-text-main"><BoxesIcon size="xs" className="text-stocky-text-sub" /> Low stock to report</span>
                  <span className="text-xs font-medium text-stocky-primary">{metrics.lowStockProducts}</span>
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={onOpenTransfers} className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-stocky-bg-global rounded-lg px-2 cursor-pointer">
                  <span className="flex items-center gap-2 text-sm text-stocky-text-main"><ArrowUpDownIcon size="xs" className="text-stocky-text-sub" /> Transfers waiting for action</span>
                  <span className="text-xs font-medium text-stocky-primary">{metrics.pendingTransfers}</span>
                </button>
                <button type="button" onClick={onOpenSuppliers} className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-stocky-bg-global rounded-lg px-2 cursor-pointer">
                  <span className="flex items-center gap-2 text-sm text-stocky-text-main"><TruckIcon size="xs" className="text-stocky-text-sub" /> Supplier requests</span>
                  <span className="text-xs font-medium text-stocky-primary">{metrics.supplierRequests}</span>
                </button>
              </>
            )}
            {!isStaff && (
              <button type="button" onClick={() => (onOpenTasks || onOpenCount)()} className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-stocky-bg-global rounded-lg px-2 cursor-pointer">
                <span className="flex items-center gap-2 text-sm text-stocky-text-main"><CheckCircleIcon size="xs" className="text-stocky-text-sub" /> Stock tasks waiting for action</span>
                <span className="text-xs font-medium text-stocky-primary">{metrics.openCounts}</span>
              </button>
            )}
          </div>
        </div>

      </section>
    </div>
  );
}
