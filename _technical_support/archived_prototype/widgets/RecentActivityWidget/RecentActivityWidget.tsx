'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ArrowUpDownIcon,
  ClockIcon,
} from '@stocky/icons';
import type { StockMovement } from '@stocky/types';

export function RecentActivityWidget() {
  const activities: StockMovement[] = [
    {
      id: 'mov-1',
      itemId: 'it-1',
      itemName: 'Edible Grocery Bundle #A',
      itemSku: 'GROC-BNDL-01',
      type: 'IN',
      quantity: 250,
      toWarehouseId: 'Cairo Hub 1',
      reference: 'PO-88219',
      performedBy: 'Ahmed K.',
      createdAt: '8m ago',
    },
    {
      id: 'mov-2',
      itemId: 'it-2',
      itemName: 'Kahwetek Espresso Beans 1kg',
      itemSku: 'KHW-ESP-1KG',
      type: 'OUT',
      quantity: 45,
      fromWarehouseId: 'Giza Distribution',
      reference: 'SO-10943',
      performedBy: 'Mona S.',
      createdAt: '24m ago',
    },
    {
      id: 'mov-3',
      itemId: 'it-3',
      itemName: 'Fresh Juices - Orange 500ml',
      itemSku: 'JC-ORG-500',
      type: 'TRANSFER',
      quantity: 120,
      fromWarehouseId: 'Alexandria Port',
      toWarehouseId: 'Cairo Hub 1',
      reference: 'TR-4401',
      performedBy: 'Tarek Z.',
      createdAt: '1h ago',
    },
    {
      id: 'mov-4',
      itemId: 'it-4',
      itemName: 'Crispy Chicken Nuggets',
      itemSku: 'CK-NUG-500',
      type: 'ADJUST',
      quantity: -5,
      reference: 'AUD-902',
      note: 'Damaged packaging during unloading',
      performedBy: 'Quality Team',
      createdAt: '3h ago',
    },
  ];

  const getMovementBadge = (type: StockMovement['type']) => {
    switch (type) {
      case 'IN':
        return {
          icon: <ArrowDownLeftIcon size="xs" />,
          label: 'Received',
          bg: 'bg-stocky-status-inStock-bg text-stocky-status-inStock-fg border-stocky-status-inStock-border',
        };
      case 'OUT':
        return {
          icon: <ArrowUpRightIcon size="xs" />,
          label: 'Dispatched',
          bg: 'bg-stocky-brand-primary/15 text-stocky-brand-light border-stocky-brand-primary/30',
        };
      case 'TRANSFER':
        return {
          icon: <ArrowUpDownIcon size="xs" />,
          label: 'Transfer',
          bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        };
      case 'ADJUST':
        return {
          icon: <ClockIcon size="xs" />,
          label: 'Adjustment',
          bg: 'bg-stocky-status-lowStock-bg text-stocky-status-lowStock-fg border-stocky-status-lowStock-border',
        };
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-stocky-border-subtle">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-stocky-bg-subtle text-stocky-text-secondary border border-stocky-border-subtle">
            <ArrowUpDownIcon size="sm" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stocky-text-primary">
              Recent Movements
            </h3>
            <p className="text-xs text-stocky-text-muted">
              Live stock ins, outs, and transfers
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-stocky-border-subtle mt-2 flex-1">
        {activities.map((act, index) => {
          const badge = getMovementBadge(act.type);
          return (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className="py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border shrink-0 mt-0.5 ${badge.bg}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>

                <div className="min-w-0">
                  <div className="text-sm font-medium text-stocky-text-primary truncate">
                    {act.itemName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stocky-text-muted mt-0.5">
                    <span>Ref: {act.reference}</span>
                    <span>•</span>
                    <span>By: {act.performedBy}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={`text-sm font-bold ${
                    act.quantity > 0 ? 'text-emerald-400' : 'text-stocky-text-primary'
                  }`}
                >
                  {act.quantity > 0 ? `+${act.quantity}` : act.quantity} units
                </div>
                <div className="text-xs text-stocky-text-muted mt-0.5">
                  {act.createdAt}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};
