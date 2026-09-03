'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { BellIcon, ShieldAlertIcon } from '@stocky/icons';

/**
 * AlertsPlaceholderWidget (v0.1.0 Design System)
 * Dedicated placeholder for the Alerts Tab (TBD).
 */
export function AlertsPlaceholderWidget() {
  return (
    <Card className="min-h-[460px] flex flex-col items-center justify-center text-center p-12 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget space-y-4">
      <div className="w-12 h-12 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-accent">
        <BellIcon size="lg" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h2 className="text-base font-medium text-stocky-text-main">
          Stock Alerts System (TBD)
        </h2>
        <p className="text-xs font-normal text-stocky-text-sub leading-relaxed">
          The alert engine will automatically notify branch managers when items reach minimum threshold balances, detect inventory anomalies, and trigger supplier purchase orders.
        </p>
      </div>

      <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="px-3 py-1 rounded-widget text-xs font-normal bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-sub">
          Low Stock Warnings
        </span>
        <span className="px-3 py-1 rounded-widget text-xs font-normal bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-sub">
          Balance Discrepancies
        </span>
        <span className="px-3 py-1 rounded-widget text-xs font-normal bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-sub">
          Reorder Notifications
        </span>
      </div>
    </Card>
  );
}
