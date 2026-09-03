'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShieldAlertIcon, PlusIcon, ChevronRightIcon } from '@stocky/icons';
import type { StockAlert } from '@stocky/types';

export function LowStockAlertWidget() {
  const alerts: StockAlert[] = [
    {
      id: 'alt-1',
      itemId: 'it-101',
      itemName: 'Crispy Chicken Strips 1kg',
      sku: 'CK-STRP-1KG',
      currentStock: 12,
      threshold: 50,
      severity: 'critical',
      category: 'Crispy Chicken',
      createdAt: '10m ago',
    },
    {
      id: 'alt-2',
      itemId: 'it-102',
      itemName: 'Chocolate Cake Cup 120g',
      sku: 'CK-CUP-120G',
      currentStock: 25,
      threshold: 80,
      severity: 'warning',
      category: 'Cake Cup',
      createdAt: '1h ago',
    },
    {
      id: 'alt-3',
      itemId: 'it-103',
      itemName: 'Belgian Waffle Cookies',
      sku: 'CK-WAFL-BE',
      currentStock: 4,
      threshold: 40,
      severity: 'critical',
      category: 'Cookies',
      createdAt: '2h ago',
    },
    {
      id: 'alt-4',
      itemId: 'it-104',
      itemName: 'Golden French Fries 2.5kg',
      sku: 'FF-GLD-25',
      currentStock: 18,
      threshold: 60,
      severity: 'warning',
      category: 'French Fries',
      createdAt: '3h ago',
    },
  ];

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-stocky-border-subtle">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-stocky-status-lowStock-bg text-stocky-status-lowStock-fg">
            <ShieldAlertIcon size="sm" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stocky-text-primary">
              Low Stock Alerts
            </h3>
            <p className="text-xs text-stocky-text-muted">
              4 critical items require purchase orders
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-stocky-brand-light">
          View All <ChevronRightIcon size="xs" />
        </Button>
      </div>

      <div className="divide-y divide-stocky-border-subtle mt-2 flex-1">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="py-3 flex items-center justify-between gap-3 group"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-stocky-text-primary truncate">
                  {alert.itemName}
                </span>
                <Badge
                  variant={alert.severity === 'critical' ? 'out_of_stock' : 'low_stock'}
                  dot
                >
                  {alert.severity === 'critical' ? 'Critical' : 'Low'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-stocky-text-muted">
                <span>SKU: {alert.sku}</span>
                <span>•</span>
                <span>Category: {alert.category}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-semibold text-stocky-status-lowStock-fg">
                {alert.currentStock} / {alert.threshold} left
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-1.5 py-0.5 px-2 text-xs opacity-90 hover:opacity-100"
                icon={<PlusIcon size="xs" />}
              >
                Reorder
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
