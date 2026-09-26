'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type {
  AttendanceShift,
  Location,
  Product,
  StockLot,
  StockMovement,
  StockTask,
  StockTaskItem,
} from '@stocky/types';
import { HomeGlobalSlicersWidget, type TimeframeOption, type RiskFilterOption } from './HomeGlobalSlicersWidget';
import { HomeExecutiveKpiStripWidget } from './HomeExecutiveKpiStripWidget';
import { HomeBranchMapChartWidget } from './HomeBranchMapChartWidget';
import { HomeBranchesAnalysisChartWidget } from './HomeBranchesAnalysisChartWidget';
import { HomeTopMovingProductsChartWidget } from './HomeTopMovingProductsChartWidget';
import { HomeLaggingProductsChartWidget } from './HomeLaggingProductsChartWidget';
import { HomeTeamAttendanceChartWidget } from './HomeTeamAttendanceChartWidget';
import { exportFullDashboardToExcel } from '@/lib/excel/export';

export interface HomeDesktopAnalyticsWidgetProps {
  locations?: Location[];
  products?: Product[];
  lots?: StockLot[];
  movements?: StockMovement[];
  tasks?: StockTask[];
  taskItems?: StockTaskItem[];
  shifts?: AttendanceShift[];
  teamMembers?: any[];
  teamAssignments?: any[];
  onOpenStock?: (locationId?: string) => void;
  onOpenProduct?: (productId: string) => void;
  onOpenAttendance?: () => void;
  onOpenExpiry?: () => void;
  canExport?: boolean;
  canViewCommercials?: boolean;
  initialLocationId?: string;
  onLocationChange?: (locationId: string) => void;
}

export function HomeDesktopAnalyticsWidget({
  locations = [],
  products = [],
  lots = [],
  movements = [],
  tasks = [],
  taskItems = [],
  shifts = [],
  teamMembers = [],
  teamAssignments = [],
  onOpenStock,
  onOpenProduct,
  onOpenAttendance,
  onOpenExpiry,
  canExport = true,
  canViewCommercials = true,
  initialLocationId = 'all',
  onLocationChange,
}: HomeDesktopAnalyticsWidgetProps) {
  // 1. Dashboard Global Slicers State (Power BI style cross-filtering)
  const [timeframe, setTimeframe] = useState<TimeframeOption>('30D');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLocationId);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<RiskFilterOption>('all');
  const [isExportingAll, setIsExportingAll] = useState(false);

  useEffect(() => {
    setSelectedLocationId(initialLocationId || 'all');
  }, [initialLocationId]);

  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId);
    onLocationChange?.(locationId);
  };

  // Available categories across active catalog
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set);
  }, [products]);

  // Handle global reset
  const handleResetFilters = () => {
    setTimeframe('30D');
    setSelectedLocationId('all');
    setSelectedCategory('all');
    setSelectedRiskFilter('all');
  };

  // Compute filtered baseline datasets for KPIs and Export
  const daysInTimeframe = useMemo(() => {
    switch (timeframe) {
      case '7D':
        return 7;
      case '14D':
        return 14;
      case '30D':
        return 30;
      case '90D':
        return 90;
      case 'YTD': {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return Math.floor((now.getTime() - startOfYear.getTime()) / 86400000) + 1;
      }
      default:
        return 30;
    }
  }, [timeframe]);

  // Dynamic KPI Scorecards Calculation
  const kpiData = useMemo(() => {
    // Lots filtered by location and category
    const filteredLots = lots.filter((lot) => {
      if (selectedLocationId !== 'all' && lot.locationId !== selectedLocationId) return false;
      if (selectedCategory !== 'all') {
        const prod = products.find((p) => p.id === lot.productId);
        if (prod?.categoryName !== selectedCategory) return false;
      }
      return (lot.quantityOnHand || 0) > 0;
    });

    const totalUnits = filteredLots.reduce((acc, l) => acc + (l.quantityOnHand || 0), 0);
    const totalValuation = canViewCommercials
      ? filteredLots.reduce((acc, l) => acc + (l.quantityOnHand || 0) * (l.unitCost || 0), 0)
      : 0;
    const totalBranches = selectedLocationId === 'all'
      ? locations.length
      : locations.some((location) => location.id === selectedLocationId) ? 1 : 0;

    // Movement volume
    const cutoffDate = new Date(Date.now() - daysInTimeframe * 86400000).toISOString();
    const filteredMovements = movements.filter((m) => {
      if (selectedLocationId !== 'all' && m.locationId !== selectedLocationId) return false;
      if (m.createdAt && m.createdAt < cutoffDate) return false;
      return true;
    });
    const scopedMovements = movements.filter(
      (movement) => selectedLocationId === 'all' || movement.locationId === selectedLocationId
    );

    const totalUnitsMoved = filteredMovements.reduce((acc, m) => acc + Math.abs(m.quantityDelta || 0), 0);
    const movementCount = filteredMovements.length;

    // Dormant / Stagnant Capital
    const dormantCutoff = new Date(Date.now() - 90 * 86400000).toISOString();
    const latestMovementByLot = new Map<string, string>();
    scopedMovements.forEach((movement) => {
      const key = `${movement.productId}:${movement.locationId}`;
      if (!movement.createdAt) return;
      const current = latestMovementByLot.get(key);
      if (!current || movement.createdAt > current) latestMovementByLot.set(key, movement.createdAt);
    });
    const dormantLots = filteredLots.filter((lot) => {
      const latestMovement = latestMovementByLot.get(`${lot.productId}:${lot.locationId}`);
      return !latestMovement || latestMovement < dormantCutoff;
    });
    const dormantCapital = canViewCommercials
      ? Math.round(dormantLots.reduce((acc, lot) => acc + (lot.quantityOnHand || 0) * (lot.unitCost || 0), 0))
      : 0;
    const dormantSkuCount = new Set(dormantLots.map((lot) => lot.productId)).size;

    // Risks
    const next30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const expiringSkuCount = new Set(
      filteredLots
        .filter((lot) => lot.expiryDate && lot.expiryDate >= today && lot.expiryDate <= next30)
        .map((lot) => lot.productId)
    ).size;
    const unitsByProduct = new Map<string, number>();
    filteredLots.forEach((lot) => unitsByProduct.set(lot.productId, (unitsByProduct.get(lot.productId) || 0) + (lot.quantityOnHand || 0)));
    const lowStockCount = products.filter((product) => {
      if (selectedCategory !== 'all' && product.categoryName !== selectedCategory) return false;
      const units = unitsByProduct.get(product.id) || 0;
      return product.reorderPoint != null && units <= product.reorderPoint;
    }).length;

    // Workforce
    const totalStaffCount = teamMembers.length;
    const activeStaffOnDuty = new Set(
      shifts.filter((shift) => {
        const shiftDate = shift.shiftDate || shift.clockInAt?.slice(0, 10);
        return Boolean(shiftDate && shiftDate >= cutoffDate.slice(0, 10));
      })
        .filter((shift) => ['present', 'late'].includes(shift.status))
        .map((shift) => shift.companyUserId)
    ).size;
    const attendancePct = totalStaffCount > 0
      ? Math.round((Math.min(totalStaffCount, activeStaffOnDuty) / totalStaffCount) * 100)
      : 0;

    return {
      totalValuation: Math.round(totalValuation),
      totalUnits,
      totalBranches,
      totalUnitsMoved,
      movementCount,
      dormantCapital,
      dormantSkuCount,
      expiringSkuCount,
      lowStockCount,
      attendancePct,
      activeStaffOnDuty,
      totalStaffCount,
    };
  }, [lots, products, locations, movements, shifts, teamMembers, daysInTimeframe, selectedLocationId, selectedCategory, canViewCommercials]);

  // Full Multi-Sheet Dashboard Export Handler
  const handleExportAllWorkbook = () => {
    if (!canExport) return;

    try {
      setIsExportingAll(true);

      // Sheet 1: Executive KPI Summary
      const summaryRows = [
        { Metric: 'Dashboard Slicers', Value: `Branch: ${selectedLocationId} | Timeframe: ${timeframe} | Category: ${selectedCategory} | Risk: ${selectedRiskFilter}` },
        { Metric: 'Total Inventory Valuation', Value: `$${kpiData.totalValuation.toLocaleString()}` },
        { Metric: 'Total Inventory Units', Value: `${kpiData.totalUnits.toLocaleString()} units` },
        { Metric: 'Active Branches in Scope', Value: kpiData.totalBranches },
        { Metric: 'Stock Units Moved', Value: `${kpiData.totalUnitsMoved.toLocaleString()} units` },
        { Metric: 'Movement Transactions', Value: kpiData.movementCount },
        { Metric: 'Dormant Capital at Risk', Value: `$${kpiData.dormantCapital.toLocaleString()}` },
        { Metric: 'Dormant SKUs', Value: kpiData.dormantSkuCount },
        { Metric: 'Expiring Lots (30d)', Value: kpiData.expiringSkuCount },
        { Metric: 'Low Stock SKU Count', Value: kpiData.lowStockCount },
        { Metric: 'Workforce Attendance Rate', Value: `${kpiData.attendancePct}%` },
        { Metric: 'Staff On Duty', Value: `${kpiData.activeStaffOnDuty} / ${kpiData.totalStaffCount}` },
      ];

      const scopedLocations = selectedLocationId === 'all'
        ? locations
        : locations.filter((location) => location.id === selectedLocationId);
      const exportCutoff = new Date(Date.now() - daysInTimeframe * 86400000).toISOString();
      const scopedMovements = movements.filter((movement) => {
        if (selectedLocationId !== 'all' && movement.locationId !== selectedLocationId) return false;
        return !movement.createdAt || movement.createdAt >= exportCutoff;
      });

      // Sheet 2: Branch Network (only real locations and measured values)
      const branchRows = scopedLocations.map((location) => {
        const branchLots = lots.filter((lot) => lot.locationId === location.id && (lot.quantityOnHand || 0) > 0);
        const assignedStaff = new Set([
          ...teamAssignments.filter((assignment) => assignment.location_id === location.id).map((assignment) => assignment.user_id),
          ...teamMembers.filter((member) => member.branchIds?.includes(location.id)).map((member) => member.id),
        ]);
        return {
          'Location Name': location.name,
          'Type': (location.type || 'branch').toUpperCase(),
          'Address': location.address || '',
          'Inventory Units': branchLots.reduce((sum, lot) => sum + (lot.quantityOnHand || 0), 0),
          'Inventory Value ($)': canViewCommercials
            ? branchLots.reduce((sum, lot) => sum + (lot.quantityOnHand || 0) * (lot.unitCost || 0), 0)
            : null,
          'Staff Assigned': assignedStaff.size,
        };
      });

      // Sheet 3: Top Movers (movement facts from the selected scope/timeframe)
      const movementByProduct = new Map<string, { unitsMoved: number; batches: number }>();
      scopedMovements.forEach((movement) => {
        const current = movementByProduct.get(movement.productId) || { unitsMoved: 0, batches: 0 };
        current.unitsMoved += Math.abs(movement.quantityDelta || 0);
        current.batches += 1;
        movementByProduct.set(movement.productId, current);
      });
      const topMoverRows = products
        .filter((product) => selectedCategory === 'all' || product.categoryName === selectedCategory)
        .map((product) => {
          const stats = movementByProduct.get(product.id) || { unitsMoved: 0, batches: 0 };
          return {
            'Product Name': product.name,
            'Category': product.categoryName || 'General',
            'Units Moved': stats.unitsMoved,
            'Active Batches': stats.batches,
            'Run-Rate Score': Math.round(stats.unitsMoved / Math.max(1, daysInTimeframe / 7)),
          };
        })
        .filter((row) => row['Units Moved'] > 0)
        .sort((a, b) => b['Units Moved'] - a['Units Moved'])
        .slice(0, 6);

      // Sheet 4: Lagging Inventory (derived from last received/movement timestamps)
      const laggingRows = products
        .filter((product) => selectedCategory === 'all' || product.categoryName === selectedCategory)
        .map((product) => {
          const productLots = lots.filter((lot) =>
            lot.productId === product.id &&
            (selectedLocationId === 'all' || lot.locationId === selectedLocationId) &&
            (lot.quantityOnHand || 0) > 0
          );
          const productDates = [
            ...productLots.map((lot) => lot.receivedAt).filter(Boolean),
            ...movements
              .filter((movement) => movement.productId === product.id && (selectedLocationId === 'all' || movement.locationId === selectedLocationId))
              .map((movement) => movement.createdAt)
              .filter(Boolean),
          ] as string[];
          const latestDate = productDates.sort().at(-1);
          const daysDormant = latestDate ? Math.max(0, Math.floor((Date.now() - new Date(latestDate).getTime()) / 86400000)) : 0;
          const stockUnits = productLots.reduce((sum, lot) => sum + (lot.quantityOnHand || 0), 0);
          return {
            'Product Name': product.name,
            Category: product.categoryName || 'General',
            'Stock Units': stockUnits,
            'Capital Tied ($)': canViewCommercials ? Math.round(stockUnits * (product.unitCost || 0)) : null,
            'Days Dormant': daysDormant,
          };
        })
        .filter((row) => row['Stock Units'] > 0 && row['Days Dormant'] > 0)
        .sort((a, b) => Number(b['Capital Tied ($)'] || 0) - Number(a['Capital Tied ($)'] || 0))
        .slice(0, 5);

      // Sheet 5: Team Attendance (only recorded shifts in the selected timeframe)
      const attendanceByDate = new Map<string, { present: number; late: number; offDuty: number; hours: number }>();
      shifts.forEach((shift) => {
        const date = shift.shiftDate || shift.clockInAt?.slice(0, 10);
        if (!date || date < exportCutoff.slice(0, 10)) return;
        if (selectedLocationId !== 'all' && shift.locationId !== selectedLocationId) return;
        const current = attendanceByDate.get(date) || { present: 0, late: 0, offDuty: 0, hours: 0 };
        if (shift.status === 'present') current.present += 1;
        else if (shift.status === 'late') current.late += 1;
        else current.offDuty += 1;
        current.hours += shift.totalMinutes ? shift.totalMinutes / 60 : 0;
        attendanceByDate.set(date, current);
      });
      const attendanceRows = Array.from(attendanceByDate.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, value]) => ({
          Date: date,
          'Present Staff': value.present,
          'Late Arrivals': value.late,
          'Off Duty': value.offDuty,
          'Hours Logged': Number(value.hours.toFixed(1)),
        }));

      exportFullDashboardToExcel({
        dashboardName: 'Stocky_Command_Center_Dashboard',
        sheets: [
          { sheetName: 'Executive Summary', rows: summaryRows },
          { sheetName: 'Branch Network', rows: branchRows },
          { sheetName: 'Top Moving SKUs', rows: topMoverRows },
          { sheetName: 'Lagging Stock', rows: laggingRows },
          { sheetName: 'Workforce Attendance', rows: attendanceRows },
        ],
      });
    } finally {
      setIsExportingAll(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6" data-testid="desktop-powerbi-dashboard">
      {/* 1. Global Slicers Ribbon (Power BI Top Filter Strip) */}
      <HomeGlobalSlicersWidget
        locations={locations}
        categories={categories}
        selectedLocationId={selectedLocationId}
        onSelectLocation={handleLocationChange}
        timeframe={timeframe}
        onChangeTimeframe={setTimeframe}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedRiskFilter={selectedRiskFilter}
        onSelectRiskFilter={setSelectedRiskFilter}
        onResetFilters={handleResetFilters}
        onExportAll={canExport ? handleExportAllWorkbook : undefined}
        isExporting={isExportingAll}
      />

      {/* 2. Executive KPI Scorecard Strip */}
      <HomeExecutiveKpiStripWidget
        totalValuation={kpiData.totalValuation}
        totalUnits={kpiData.totalUnits}
        totalBranches={kpiData.totalBranches}
        totalUnitsMoved={kpiData.totalUnitsMoved}
        movementCount={kpiData.movementCount}
        dormantCapital={kpiData.dormantCapital}
        dormantSkuCount={kpiData.dormantSkuCount}
        expiringSkuCount={kpiData.expiringSkuCount}
        lowStockCount={kpiData.lowStockCount}
        attendancePct={kpiData.attendancePct}
        activeStaffOnDuty={kpiData.activeStaffOnDuty}
        totalStaffCount={kpiData.totalStaffCount}
        canViewCommercials={canViewCommercials}
        onOpenStock={() => onOpenStock && onOpenStock(selectedLocationId !== 'all' ? selectedLocationId : undefined)}
        onOpenExpiry={onOpenExpiry}
        onOpenAttendance={onOpenAttendance}
      />

      {/* 3. Power BI Visual Grid: Row 1 - Geo Map & Branch Comparative Benchmark */}
      <div className="grid grid-cols-12 gap-6 w-full items-start">
        {/* Left: Interactive Geo Map (7 cols) */}
        <div className="col-span-12 xl:col-span-7 flex flex-col">
          <HomeBranchMapChartWidget
            locations={locations}
            lots={lots}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            shifts={shifts}
            canViewCommercials={canViewCommercials}
            onSelectLocation={onOpenStock}
          />
        </div>

        {/* Right: Comparative Analysis (5 cols) */}
        <div className="col-span-12 xl:col-span-5 flex flex-col">
          <HomeBranchesAnalysisChartWidget
            locations={locations}
            lots={lots}
            movements={movements}
            tasks={tasks}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            onSelectLocation={onOpenStock}
            externalTimeframe={timeframe}
            externalLocationId={selectedLocationId}
            canViewCommercials={canViewCommercials}
            canExport={canExport}
          />
        </div>
      </div>

      {/* 4. Power BI Visual Grid: Row 2 - Product Velocity & Stagnant Aging */}
      <div className="grid grid-cols-12 gap-6 w-full items-start">
        {/* Left: Top Moving Products (6 cols) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col">
          <HomeTopMovingProductsChartWidget
            products={products}
            lots={lots}
            movements={movements}
            onOpenProduct={onOpenProduct}
            externalTimeframe={timeframe}
            externalCategory={selectedCategory}
            externalLocationId={selectedLocationId}
            canExport={canExport}
          />
        </div>

        {/* Right: Lagging Stagnant Inventory (6 cols) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col">
          <HomeLaggingProductsChartWidget
            products={products}
            lots={lots}
            movements={movements}
            tasks={tasks}
            taskItems={taskItems}
            onOpenProduct={onOpenProduct}
            externalTimeframe={timeframe}
            externalCategory={selectedCategory}
            externalLocationId={selectedLocationId}
            canViewCommercials={canViewCommercials}
            canExport={canExport}
          />
        </div>
      </div>

      {/* 5. Power BI Visual Grid: Row 3 - Workforce Attendance Ledger */}
      <div className="grid grid-cols-12 gap-6 w-full items-start">
        <div className="col-span-12 flex flex-col">
          <HomeTeamAttendanceChartWidget
            shifts={shifts}
            locations={locations}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            onOpenAttendance={onOpenAttendance}
            externalTimeframe={timeframe}
            externalLocationId={selectedLocationId}
            canExport={canExport}
          />
        </div>
      </div>
    </div>
  );
}
