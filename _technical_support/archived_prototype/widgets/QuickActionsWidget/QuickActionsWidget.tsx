'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  PlusIcon,
  BarcodeIcon,
  ArrowUpDownIcon,
  ArchiveIcon,
  RefreshIcon,
} from '@stocky/icons';

export function QuickActionsWidget() {
  const actions = [
    {
      title: 'New Stock In',
      description: 'Receive incoming shipment',
      icon: <PlusIcon size="md" className="text-emerald-400" />,
      onClick: () => alert('New Stock In modal opened'),
    },
    {
      title: 'Barcode Scanner',
      description: 'Scan item for lookup or check-out',
      icon: <BarcodeIcon size="md" className="text-stocky-brand-light" />,
      onClick: () => alert('Scanner ready'),
    },
    {
      title: 'Transfer Stock',
      description: 'Move inventory between warehouses',
      icon: <ArrowUpDownIcon size="md" className="text-cyan-400" />,
      onClick: () => alert('Transfer workflow triggered'),
    },
    {
      title: 'Audit & Count',
      description: 'Run cycle count or discrepancy check',
      icon: <ArchiveIcon size="md" className="text-amber-400" />,
      onClick: () => alert('Audit mode activated'),
    },
  ];

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-stocky-border-subtle">
        <div>
          <h3 className="text-sm font-semibold text-stocky-text-primary">
            Quick Actions
          </h3>
          <p className="text-xs text-stocky-text-muted">
            Frequent warehouse operations
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-stocky-text-muted">
          <RefreshIcon size="xs" /> Sync
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 flex-1">
        {actions.map((act) => (
          <button
            key={act.title}
            onClick={act.onClick}
            className="flex items-start gap-3 p-3 text-left rounded-lg bg-stocky-bg-subtle/40 border border-stocky-border-subtle hover:border-stocky-brand-primary/50 hover:bg-stocky-bg-hover/80 transition-all duration-150 group cursor-pointer"
          >
            <div className="p-2 rounded-md bg-stocky-bg-surface border border-stocky-border-subtle group-hover:border-stocky-brand-primary/30 transition-colors">
              {act.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-stocky-text-primary group-hover:text-stocky-brand-light transition-colors">
                {act.title}
              </div>
              <div className="text-xs text-stocky-text-muted mt-0.5 line-clamp-1">
                {act.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
};
