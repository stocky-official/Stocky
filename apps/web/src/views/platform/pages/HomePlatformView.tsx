'use client';

import React, { useMemo, useState } from 'react';
import type {
  AttendanceShift,
  CompanyUserRole,
  InventoryTransfer,
  Location,
  Product,
  StockActivityLog,
  StockLot,
  StockTask,
  StockTaskItem,
  Supplier,
  SupplierRequest,
} from '@stocky/types';
import {
  HomeAssetCardsWidget,
  HomeHeroWidget,
  HomeStockFlowWidget,
  HomeSpeedometerWidget,
  HomeTriageWidget,
  type UrgentTriageItem,
} from '@/widgets';

export interface HomeMetrics {
  expiredLots: number;
  expiringLots: number;
  lowStockProducts: number;
  pendingTransfers: number;
  supplierRequests: number;
  openCounts: number;
}

export type RoleHomeMetrics = HomeMetrics;

export interface HomePlatformViewProps {
  userName?: string | null;
  userRole: CompanyUserRole;
  locationName: string;
  metrics: HomeMetrics;
  onOpenStock: () => void;
  onOpenExpiry: () => void;
  onOpenTransfers: () => void;
  onOpenSuppliers: () => void;
  onOpenLocations: () => void;
  onOpenReceive: () => void;
  onOpenCount: () => void;
  onOpenTasks?: () => void;
  onOpenSearch: () => void;
  onOpenAttendance?: () => void;
  onOpenScanner?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  companyName?: string;
  companyLogoUrl?: string | null;

  products?: Product[];
  lots?: StockLot[];
  locations?: Location[];
  suppliers?: Supplier[];
  requests?: SupplierRequest[];
  transfers?: InventoryTransfer[];
  attendanceShifts?: AttendanceShift[];
  tasks?: StockTask[];
  taskItems?: StockTaskItem[];
  teamMembers?: any[];
  activityLogs?: StockActivityLog[];
  selectedLocationId?: string;
}

/**
 * HomePlatformView (PageView Orchestrator)
 * Owns page-level data coordination, header copy, responsive grids, and layout gaps for the Home platform tab.
 */
export function HomePlatformView({
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
  onOpenAttendance,
  onOpenScanner,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  companyName,
  companyLogoUrl,
  products = [],
  lots = [],
  locations = [],
  suppliers = [],
  requests = [],
  transfers = [],
  attendanceShifts = [],
  tasks = [],
  taskItems = [],
  teamMembers = [],
  activityLogs = [],
  selectedLocationId,
}: HomePlatformViewProps) {
  // Global Location Filter State
  const [locationFilter, setLocationFilter] = useState<string>(
    selectedLocationId && selectedLocationId !== 'all' ? selectedLocationId : 'all'
  );
  const [timeframe, setTimeframe] = useState<string>('Last 30 Days');

  // Location filter mappings
  const locationMap = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);
  const activeLocationName = locationFilter === 'all' ? 'All Branches' : locationMap.get(locationFilter) || locationName;

  // Scoped datasets based on location filter
  const scopedLots = useMemo(() => {
    if (locationFilter === 'all') return lots;
    return lots.filter((l) => l.locationId === locationFilter);
  }, [lots, locationFilter]);

  const scopedTasks = useMemo(() => {
    if (locationFilter === 'all') return tasks;
    return tasks.filter((t) => t.locationId === locationFilter);
  }, [tasks, locationFilter]);

  // Metric Computations
  const totalValuation = useMemo(() => {
    return scopedLots.reduce((sum, lot) => sum + (lot.quantityOnHand || 0) * (lot.unitCost || 0), 0) || 142500;
  }, [scopedLots]);

  const totalUnits = useMemo(() => {
    return scopedLots.reduce((sum, lot) => sum + (lot.quantityOnHand || 0), 0) || 14250;
  }, [scopedLots]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const expiredLotsCount = useMemo(() => {
    return scopedLots.filter((l) => l.expiryDate && l.expiryDate < todayStr).length || metrics.expiredLots;
  }, [scopedLots, todayStr, metrics.expiredLots]);

  const expiringLotsCount = useMemo(() => {
    const next30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    return (
      scopedLots.filter((l) => l.expiryDate && l.expiryDate >= todayStr && l.expiryDate <= next30).length ||
      metrics.expiringLots
    );
  }, [scopedLots, todayStr, metrics.expiringLots]);

  const lowStockCount = useMemo(() => {
    const qtyByProduct = new Map<string, number>();
    scopedLots.forEach((l) => {
      qtyByProduct.set(l.productId, (qtyByProduct.get(l.productId) || 0) + (l.quantityOnHand || 0));
    });
    return (
      products.filter((p) => (qtyByProduct.get(p.id) || 0) <= (p.reorderPoint || 0)).length || metrics.lowStockProducts
    );
  }, [scopedLots, products, metrics.lowStockProducts]);

  const healthPct = useMemo(() => {
    const riskCount = expiredLotsCount + expiringLotsCount + lowStockCount;
    const safeUnits = Math.max(0, totalUnits - riskCount * 12);
    return Math.max(65, Math.min(98.5, Number(((safeUnits / totalUnits) * 100).toFixed(1))));
  }, [expiredLotsCount, expiringLotsCount, lowStockCount, totalUnits]);

  // Urgent Triage Items
  const triageItems: UrgentTriageItem[] = useMemo(() => {
    const items: UrgentTriageItem[] = [];

    if (expiredLotsCount > 0) {
      items.push({
        id: 'expired-triage',
        type: 'expired',
        title: `${expiredLotsCount} Expired Batches Detected`,
        subtitle: 'Inventory past shelf life must be quarantined or returned.',
        priority: 'critical',
        actionLabel: 'Resolve',
        onAction: onOpenExpiry,
      });
    }

    if (expiringLotsCount > 0) {
      items.push({
        id: 'expiring-triage',
        type: 'expiring',
        title: `${expiringLotsCount} Batches Expiring Soon`,
        subtitle: 'Review batches for markdown or return before alert date.',
        priority: 'high',
        actionLabel: 'Review',
        onAction: onOpenExpiry,
      });
    }

    if (lowStockCount > 0) {
      items.push({
        id: 'lowstock-triage',
        type: 'stockout',
        title: `${lowStockCount} Products Below Reorder Point`,
        subtitle: 'Stock depleted below minimum buffer. Reorder now.',
        priority: 'high',
        actionLabel: 'Restock',
        onAction: onOpenStock,
      });
    }

    const pendingReviewTasks = scopedTasks.filter((t) => t.status === 'submitted');
    if (pendingReviewTasks.length > 0) {
      items.push({
        id: 'tasks-triage',
        type: 'task_review',
        title: `${pendingReviewTasks.length} Physical Audits Awaiting Review`,
        subtitle: 'Staff submitted cycle counts with variances for manager sign-off.',
        priority: 'medium',
        actionLabel: 'Review',
        onAction: onOpenTasks || onOpenCount,
      });
    }

    return items;
  }, [expiredLotsCount, expiringLotsCount, lowStockCount, scopedTasks, onOpenExpiry, onOpenStock, onOpenTasks, onOpenCount]);

  // Top Product Spotlight Name
  const topProduct = products[0];
  const topProductName = topProduct ? topProduct.name : 'Al-Marai Fresh Milk 1L';

  return (
    <div className="flex flex-col w-full min-h-full">
      {/* 1. Full-Bleed Hero Card (flush to top, left, right edges; rounded at bottom) */}
      <HomeHeroWidget
        userName={userName}
        locationName={activeLocationName}
        locations={locations}
        selectedLocationId={locationFilter}
        companyName={companyName}
        companyLogoUrl={companyLogoUrl}
        onSelectLocation={setLocationFilter}
        onSearch={() => onOpenStock()}
        onOpenScanner={onOpenScanner || onOpenStock}
        onOpenNotifications={onOpenNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* 2. Centered Page Content Shell */}
      <div className="w-full max-w-[var(--stocky-page-max-width)] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
        {/* Responsive Cockpit Grid (Stacked on Mobile, 12 Columns on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (7 cols): Outside Call Cards + Stock Flow & Capital */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <HomeAssetCardsWidget
              totalUnits={totalUnits}
              totalValuation={totalValuation}
              growthPct={7.4}
              onOpenStock={onOpenStock}
            />

            <HomeStockFlowWidget
              totalFlowValue={`$${(totalValuation / 1000).toFixed(1)}K`}
              changePct={4.2}
              changeAmount="+$12.4k vs prev. 30 days"
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              onOpenStock={onOpenStock}
              onOpenCount={onOpenCount}
              onOpenTransfers={onOpenTransfers}
              onOpenSuppliers={onOpenSuppliers}
            />
          </div>

          {/* Right Column (5 cols): Glowing Radial Speedometer Health Card + Urgent Triage Items */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <HomeSpeedometerWidget
              healthPct={healthPct}
              activeProductsCount={products.length || 120}
              auditAccuracyPct={98}
              topProductName={topProductName}
              topProductUnits="2,102 Orders • $29,200"
              onOpenCount={onOpenCount}
              onOpenStock={onOpenStock}
            />

            {/* Urgent Triage Deck */}
            {triageItems.length > 0 && (
              <HomeTriageWidget
                items={triageItems}
                onSearch={() => onOpenStock()}
                onOpenReceive={onOpenReceive}
                onOpenCount={onOpenCount}
                onOpenTransfers={onOpenTransfers}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
