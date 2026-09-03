'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import {
  BoxesIcon,
  DollarSignIcon,
  AlertTriangleIcon,
  WarehouseIcon,
  TrendingUpIcon,
} from '@stocky/icons';

interface StatMetric {
  title: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  trend?: string;
  alert?: boolean;
}

export function StatsOverviewWidget() {
  const metrics: StatMetric[] = [
    {
      title: 'Total Stock Items',
      value: '24,850',
      subtext: '+12% from last month',
      icon: <BoxesIcon size="md" className="text-stocky-brand-light" />,
      trend: '+12%',
    },
    {
      title: 'Inventory Valuation',
      value: '$482,900',
      subtext: 'Asset value across all hubs',
      icon: <DollarSignIcon size="md" className="text-emerald-400" />,
      trend: '+4.5%',
    },
    {
      title: 'Low Stock Alerts',
      value: '18',
      subtext: 'Requires immediate reorder',
      icon: <AlertTriangleIcon size="md" className="text-stocky-status-lowStock-fg" />,
      alert: true,
    },
    {
      title: 'Active Warehouses',
      value: '6 Locations',
      subtext: 'Cairo, Alex, Giza hubs',
      icon: <WarehouseIcon size="md" className="text-cyan-400" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.08 }}
        >
          <Card className="flex flex-col justify-between h-full hover:border-stocky-border-strong transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stocky-text-muted uppercase tracking-wider">
                {metric.title}
              </span>
              <div className="p-2 rounded-lg bg-stocky-bg-subtle/80 border border-stocky-border-subtle">
                {metric.icon}
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-stocky-text-primary">
                {metric.value}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {metric.trend && (
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-400 gap-0.5">
                    <TrendingUpIcon size="xs" />
                    {metric.trend}
                  </span>
                )}
                <span className="text-xs text-stocky-text-muted">
                  {metric.subtext}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
