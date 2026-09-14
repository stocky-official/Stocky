'use client';

import React from 'react';
import {
  BellIcon,
  XIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  ActivityIcon,
  ChevronRightIcon,
} from '@stocky/icons';
import { SideDrawer } from '@/components/ui/SideDrawer';
import type { NotificationQueueItem } from './NotificationCenterWidget';

export interface NotificationsDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  items: NotificationQueueItem[];
  onNavigateToLogs?: () => void;
}

const severityConfig = {
  critical: {
    icon: <AlertCircleIcon size="xs" />,
    badgeClass: 'stocky-status-critical border',
    label: 'Urgent',
  },
  warning: {
    icon: <ClockIcon size="xs" />,
    badgeClass: 'stocky-status-warning border',
    label: 'Warning',
  },
  info: {
    icon: <CheckCircleIcon size="xs" />,
    badgeClass: 'stocky-status-info border',
    label: 'Info',
  },
};

export function NotificationsDrawerWidget({
  isOpen,
  onClose,
  items,
  onNavigateToLogs,
}: NotificationsDrawerWidgetProps) {
  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Notifications"
      panelClassName="md:w-[460px]"
    >
      <div className="flex flex-col h-full bg-stocky-bg-widget select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stocky-border-subtle bg-stocky-bg-global/30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-stocky-primary/10 border border-stocky-primary/20 text-stocky-primary flex items-center justify-center shrink-0">
              <BellIcon size="xs" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-stocky-text-main">
                  Notifications
                </h2>
                {items.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stocky-primary text-white">
                    {items.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-stocky-text-sub truncate mt-0.5">
                {items.length > 0
                  ? `${items.length} item${items.length === 1 ? '' : 's'} requiring your decision`
                  : 'You are all caught up'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications drawer"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer shrink-0"
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl stocky-status-success border flex items-center justify-center mb-3">
                <CheckCircleIcon size="md" />
              </div>
              <h3 className="text-sm font-semibold text-stocky-text-main">
                You are all caught up
              </h3>
              <p className="text-xs text-stocky-text-sub max-w-xs mt-1.5 leading-relaxed">
                New expiry alerts, stock transfers, inventory counts, and supplier resupply requests will appear here.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const cfg = severityConfig[item.severity] || severityConfig.info;
              return (
                <article
                  key={item.id}
                  className="p-3.5 rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget hover:bg-stocky-bg-global/30 transition-colors flex flex-col gap-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${cfg.badgeClass}`}
                    >
                      {cfg.icon}
                      <span>{cfg.label}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-stocky-text-main">
                      {item.title}
                    </h4>
                    <p className="text-xs text-stocky-text-sub mt-1 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        item.onOpen();
                      }}
                      className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-7 px-3.5 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRightIcon size="xs" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Footer */}
        {onNavigateToLogs && (
          <div className="border-t border-stocky-border-subtle px-4 py-3 bg-stocky-bg-global/20 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToLogs();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stocky-text-sub hover:text-stocky-primary transition-colors cursor-pointer"
            >
              <ActivityIcon size="xs" />
              <span>View full activity logs</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-7 px-3 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget hover:bg-stocky-bg-global text-xs font-medium text-stocky-text-main transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
