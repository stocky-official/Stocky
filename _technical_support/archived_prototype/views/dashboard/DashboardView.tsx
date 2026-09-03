'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BoxesIcon,
  SearchIcon,
  BellIcon,
  SettingsIcon,
  WarehouseIcon,
  LayersIcon,
} from '@stocky/icons';
import { Button } from '@/components/ui/Button';
import {
  StatsOverviewWidget,
  LowStockAlertWidget,
  RecentActivityWidget,
  QuickActionsWidget,
  AuthUserWidget,
} from '@/widgets';

/**
 * DashboardView (PageView)
 * Conforms to Critical Rule 5:
 * Controls the overall page structure, layout grid, headers, and imports modular widgets.
 */
export function DashboardView() {
  return (
    <div className="min-h-screen bg-stocky-bg-base text-stocky-text-primary flex flex-col">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-stocky-border-subtle bg-stocky-bg-surface/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-stocky-brand-primary flex items-center justify-center text-white shadow-glow">
            <BoxesIcon size="md" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-stocky-text-primary">
                Stocky
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stocky-brand-primary/20 text-stocky-brand-light border border-stocky-brand-primary/30">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-stocky-text-muted flex items-center gap-1">
              <WarehouseIcon size="xs" /> Central Hub • Cairo, EG
            </p>
          </div>
        </div>

        {/* Global Search & System Controls */}
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block w-72">
            <SearchIcon
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stocky-text-muted"
            />
            <input
              type="text"
              placeholder="Search SKUs, items, warehouses..."
              className="w-full bg-stocky-bg-card border border-stocky-border-subtle rounded-lg pl-9 pr-3 py-1.5 text-xs text-stocky-text-primary placeholder:text-stocky-text-muted focus:outline-none focus:border-stocky-brand-primary transition-colors"
            />
          </div>

          <Button variant="outline" size="sm" className="relative p-2" aria-label="Notifications">
            <BellIcon size="sm" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-stocky-status-lowStock-fg" />
          </Button>

          <Button variant="outline" size="sm" className="p-2" aria-label="Settings">
            <SettingsIcon size="sm" />
          </Button>

          <div className="h-5 w-px bg-stocky-border-subtle" />

          <AuthUserWidget />
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Title & Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stocky-border-subtle"
        >
          <div>
            <div className="flex items-center gap-2 text-xs text-stocky-text-muted">
              <LayersIcon size="xs" />
              <span>Inventory Management</span>
              <span>/</span>
              <span className="text-stocky-brand-light font-medium">Dashboard Overview</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stocky-text-primary mt-1">
              Stock Operations Center
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stocky-status-inStock-bg text-stocky-status-inStock-fg border border-stocky-status-inStock-border">
              <span className="w-1.5 h-1.5 rounded-full bg-stocky-status-inStock-fg animate-pulse" />
              Real-time Sync Active
            </span>
          </div>
        </motion.div>

        {/* Section 1: Overview Metrics (Widget) */}
        <section aria-label="Stats Overview">
          <StatsOverviewWidget />
        </section>

        {/* Section 2: Split Columns for Alerts, Recent Activity & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Low Stock Alerts & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <section aria-label="Low Stock Alerts">
              <LowStockAlertWidget />
            </section>

            <section aria-label="Quick Actions">
              <QuickActionsWidget />
            </section>
          </div>

          {/* Right 1 Column: Recent Stock Movements Stream */}
          <div className="lg:col-span-1">
            <section aria-label="Recent Activity Stream" className="h-full">
              <RecentActivityWidget />
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stocky-border-subtle py-4 px-6 text-center text-xs text-stocky-text-muted">
        Stocky Platform • Enterprise Stock Management System
      </footer>
    </div>
  );
};
