'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type {
  AttendanceShift,
  CompanyUserRole,
  InventoryTransfer,
  Location,
  Product,
  StockActivityLog,
  StockLot,
  StockMovement,
  StockTask,
  StockTaskItem,
  Supplier,
  SupplierRequest,
} from '@stocky/types';
import {
  HomeHeroWidget,
  HomeHighlightsWidget,
  HomeQuickActionsWidget,
  HomeOperationalHealthWidget,
} from '@/widgets';
import { useTranslation } from '@/lib/i18n';

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
  onOpenSettings?: () => void;
  onOpenTeam?: () => void;
  onOpenLogs?: () => void;
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
  teamAssignments?: any[];
  movements?: StockMovement[];
  activityLogs?: StockActivityLog[];
  selectedLocationId?: string;
}

/**
 * HomePlatformView (PageView Orchestrator)
 * Owns page-level data coordination, header copy, responsive grids, and layout gaps for the Home platform tab.
 * Structured strictly into 4 consecutive sections:
 * 1. Hero Section (greeting, logo, search bar, branch switcher)
 * 2. Quick Navigation (4 action buttons to settings, team, locations, audits log)
 * 3. Operational Highlights (2x2 grid of key metric call cards)
 * 4. Operational Health & Analytics (side-swiping carousel on phone, 12-column grid on desktop)
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
  onOpenSettings,
  onOpenTeam,
  onOpenLogs,
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
  teamAssignments = [],
  movements = [],
  activityLogs = [],
  selectedLocationId,
}: HomePlatformViewProps) {
  const { t } = useTranslation();
  // Global Location Filter State
  const [locationFilter, setLocationFilter] = useState<string>(
    selectedLocationId && selectedLocationId !== 'all' ? selectedLocationId : locations.length === 1 ? locations[0].id : 'all'
  );
  useEffect(() => {
    if (locations.length === 1 && locationFilter === 'all') setLocationFilter(locations[0].id);
  }, [locations, locationFilter]);

  // Location filter mappings
  const locationMap = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);
  const activeLocationName = locationFilter === 'all' ? t('home.allBranches') : locationMap.get(locationFilter) || locationName;

  // Scoped datasets based on location filter
  const scopedLots = useMemo(() => {
    if (locationFilter === 'all') return lots;
    return lots.filter((l) => l.locationId === locationFilter);
  }, [lots, locationFilter]);

  const scopedTasks = useMemo(() => {
    if (locationFilter === 'all') return tasks;
    return tasks.filter((t) => t.locationId === locationFilter);
  }, [tasks, locationFilter]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. Highlight: Distinct Expiring SKUs Count (within 30-day window)
  const expiringSkuCount = useMemo(() => {
    const next30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const uniqueProductIds = new Set(
      scopedLots
        .filter((l) => l.expiryDate && l.expiryDate >= todayStr && l.expiryDate <= next30)
        .map((l) => l.productId)
    );
    return uniqueProductIds.size;
  }, [scopedLots, todayStr, products.length]);

  // 2. Highlight: Pending Supplier Requests Count
  const pendingSupplierRequestsCount = useMemo(() => {
    const pending = requests.filter((r) => ['open', 'contacted', 'ordered'].includes(r.status)).length;
    return pending;
  }, [requests, metrics.supplierRequests]);

  // 3. Highlight: Assigned Tasks Count
  const assignedTasksCount = useMemo(() => {
    const active = scopedTasks.filter((t) =>
      ['assigned', 'in_progress', 'submitted'].includes(t.status)
    ).length;
    return active;
  }, [scopedTasks]);

  // 4. Highlight: Staff on Duty Today (Percentage + counts)
  const { attendancePct, activeStaffPresent, totalStaff } = useMemo(() => {
    const total = teamMembers.length;
    const presentToday = new Set(
      attendanceShifts
        .filter((s) => s.shiftDate === todayStr || s.clockInAt?.startsWith(todayStr))
        .filter((s) => ['present', 'late'].includes(s.status))
        .map((s) => s.companyUserId)
    ).size;
    const onDuty = Math.min(total, presentToday);
    const pct = total > 0 ? Math.round((onDuty / total) * 100) : 0;
    return {
      attendancePct: pct,
      activeStaffPresent: onDuty,
      totalStaff: total,
    };
  }, [teamMembers, attendanceShifts, todayStr]);

  return (
    <div className="stocky-home-dashboard flex flex-col w-full min-h-full">
      <a href="#home-content" className="stocky-skip-link">{t('common.skipToContent')}</a>
      {/* SECTION 1: HERO SECTION */}
      <section id="home-hero" aria-label="Hero Overview">
        <h1 className="sr-only">Stocky dashboard</h1>
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
      </section>

      {/* Centered Page Content Container with Generous Section Breathing Room */}
      <div id="home-content" tabIndex={-1} className="w-full max-w-[var(--stocky-page-max-width)] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 sm:gap-10">
        
        {/* SECTION 2: 4 QUICK ACCESS BUTTONS */}
        <section id="home-quick-nav" aria-labelledby="quick-nav-heading" className="flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 id="quick-nav-heading" className="text-base sm:text-lg font-bold text-stocky-text-main tracking-tight">
              {t('home.quickNavTitle')}
            </h2>
            <p className="text-xs text-stocky-text-sub mt-0.5">
              {t('home.quickNavSubtitle')}
            </p>
          </div>

          <HomeQuickActionsWidget
            onOpenSettings={userRole === 'staff' ? undefined : onOpenSettings}
            onOpenTeam={userRole === 'owner' || userRole === 'admin' ? onOpenTeam : undefined}
            onOpenLocations={onOpenLocations}
            onOpenLogs={onOpenLogs}
          />
        </section>

        {/* SECTION 3: 2x2 OPERATIONAL HIGHLIGHT CALL CARDS (KEY METRICS) */}
        <section id="home-operational-highlights" aria-labelledby="highlights-heading" className="flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 id="highlights-heading" className="text-base sm:text-lg font-bold text-stocky-text-main tracking-tight">
              {t('home.highlightsTitle')}
            </h2>
            <p className="text-xs text-stocky-text-sub mt-0.5">
              {t('home.highlightsSubtitle')}
            </p>
          </div>

          <HomeHighlightsWidget
            expiringSkuCount={expiringSkuCount}
            pendingSupplierRequestsCount={pendingSupplierRequestsCount}
            assignedTasksCount={assignedTasksCount}
            attendancePct={attendancePct}
            activeStaffPresent={activeStaffPresent}
            totalStaff={totalStaff}
            onOpenExpiry={onOpenExpiry}
            onOpenSuppliers={onOpenSuppliers}
            onOpenTasks={onOpenTasks || onOpenCount}
            onOpenAttendance={onOpenAttendance}
          />
        </section>

        {/* SECTION 4: OPERATIONAL HEALTH & ANALYTICS SECTION */}
        <section id="home-operational-health" aria-labelledby="operational-health-heading" className="flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 id="operational-health-heading" className="text-base sm:text-lg font-bold text-stocky-text-main tracking-tight">
              {t('home.healthTitle')}
            </h2>
            <p className="text-xs text-stocky-text-sub mt-0.5">
              {t('home.healthSubtitle')}
            </p>
          </div>

          <HomeOperationalHealthWidget
            locations={locations}
            products={products}
            lots={scopedLots}
            movements={movements}
            tasks={scopedTasks}
            taskItems={taskItems}
            shifts={attendanceShifts}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            onOpenStock={(locId) => {
              if (locId) setLocationFilter(locId);
              onOpenStock();
            }}
            onOpenProduct={() => onOpenStock()}
            onOpenAttendance={onOpenAttendance}
            onOpenExpiry={onOpenExpiry}
            canExport={userRole !== 'staff'}
            canViewCommercials={userRole !== 'staff'}
            selectedLocationId={locationFilter}
            onLocationChange={setLocationFilter}
          />
        </section>

      </div>
    </div>
  );
}
