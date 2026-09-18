'use client';

import React, { useMemo, useState } from 'react';
import { ActivityIcon, ArrowUpDownIcon, CheckCircleIcon, ClockIcon, PlusIcon, TruckIcon } from '@stocky/icons';
import type { CompanyUserRole, Location, StockActivityLog } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';

type TeamMember = { id: string; email: string; full_name?: string | null; role: CompanyUserRole };

export interface StockActivityLogWidgetProps {
  logs: StockActivityLog[];
  locations: Location[];
  members: TeamMember[];
}

function filterMatches(log: StockActivityLog, filter: string) {
  if (filter === 'all') return true;
  if (filter === 'stock_task_count') return log.entityType === 'stock_task' && log.metadata?.task_type === 'count';
  if (filter === 'stock_task_expiry') return log.entityType === 'stock_task' && log.metadata?.task_type === 'expiry';
  return log.entityType === filter;
}

export function StockActivityLogWidget({ logs, locations, members }: StockActivityLogWidgetProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');

  const filters = useMemo(() => [
    { id: 'all', label: t('logs.allActivity'), icon: <ActivityIcon size="xs" /> },
    { id: 'stock_task_count', label: t('logs.countAudits'), icon: <CheckCircleIcon size="xs" /> },
    { id: 'stock_task_expiry', label: t('logs.expiryAudits'), icon: <ClockIcon size="xs" /> },
    { id: 'transfer', label: t('navigation.transfers'), icon: <ArrowUpDownIcon size="xs" /> },
    { id: 'stock_movement', label: t('logs.stockChanges'), icon: <PlusIcon size="xs" /> },
    { id: 'supplier_request', label: t('navigation.suppliers'), icon: <TruckIcon size="xs" /> },
  ], [t]);

  const locationMap = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);
  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const visibleLogs = logs.filter((log) => filterMatches(log, filter));

  return (
    <div className="stocky-logs-workspace flex flex-col gap-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium cursor-pointer transition-colors ${
              filter === item.id ? 'border-stocky-primary bg-stocky-primary text-white' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main hover:border-stocky-border-strong'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-stocky-border-subtle bg-white overflow-hidden shadow-xs">
        {visibleLogs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ActivityIcon size="md" className="mx-auto text-stocky-text-sub/50" />
            <h2 className="mt-3 text-base font-semibold text-stocky-text-main">{t('logs.noActivityInView')}</h2>
            <p className="mt-1 text-sm text-stocky-text-sub">{t('logs.noActivityDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-stocky-border-subtle">
            {visibleLogs.map((log) => {
              const actor = log.actorCompanyUserId ? memberMap.get(log.actorCompanyUserId) : null;
              return (
                <div key={log.id} className="flex items-start gap-4 p-4 sm:p-5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full stocky-status-muted border">
                    <ActivityIcon size="xs" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-stocky-text-main">{log.summary}</p>
                    <p className="mt-1 text-[11px] text-stocky-text-sub">
                      {actor?.full_name || actor?.email || 'Stocky'} · {log.locationId ? locationMap.get(log.locationId) || t('common.location') : t('logs.companyWide')} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full stocky-status-muted border px-2.5 py-1 text-[10px] capitalize text-stocky-text-sub shrink-0">{log.action.replace('_', ' ')}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
