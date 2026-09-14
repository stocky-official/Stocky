'use client';

import React from 'react';
import { AlertCircleIcon, CheckCircleIcon, ClockIcon } from '@stocky/icons';

export type NotificationQueueItem = {
  id: string;
  title: string;
  message: string;
  actionLabel: string;
  severity: 'critical' | 'warning' | 'info';
  onOpen: () => void;
};

export interface NotificationCenterWidgetProps {
  items: NotificationQueueItem[];
}

const icons = {
  critical: <AlertCircleIcon size="sm" />,
  warning: <ClockIcon size="sm" />,
  info: <CheckCircleIcon size="sm" />,
};

export function NotificationCenterWidget({ items }: NotificationCenterWidgetProps) {
  return (
    <div className="stocky-notifications-workspace flex flex-col gap-6">
      <div className="rounded-2xl bg-white border border-stocky-border-subtle overflow-hidden shadow-xs">
        {items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CheckCircleIcon size="md" className="mx-auto text-emerald-600/60" />
            <h2 className="mt-3 text-base font-semibold text-stocky-text-main">You are all caught up</h2>
            <p className="mt-1 text-sm text-stocky-text-sub">
              New expiry, stock, transfer, count, and supplier work will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stocky-border-subtle">
            {items.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    item.severity === 'critical'
                      ? 'stocky-status-critical'
                      : item.severity === 'warning'
                        ? 'stocky-status-warning'
                        : 'stocky-status-info'
                  }`}
                >
                  {icons[item.severity]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stocky-text-main">{item.title}</p>
                  <p className="text-xs text-stocky-text-sub mt-1">{item.message}</p>
                </div>
                <button
                  type="button"
                  onClick={item.onOpen}
                  className="h-8 px-3 rounded-lg bg-stocky-primary hover:bg-stocky-primary-hover text-white text-xs font-medium shrink-0 cursor-pointer transition-colors"
                >
                  {item.actionLabel}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export * from './NotificationsDrawerWidget';

