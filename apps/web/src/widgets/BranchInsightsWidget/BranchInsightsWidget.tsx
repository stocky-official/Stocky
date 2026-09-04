'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import {
  BoxesIcon,
  WarehouseIcon,
  TrendingUpIcon,
  DollarSignIcon,
  CheckCircleIcon,
  CheckIcon,
  EditIcon,
  TrashIcon,
  ArrowDownIcon,
  XIcon,
  SparklesIcon,
  TimerIcon,
} from '@stocky/icons';
import type { Branch, Item } from '@stocky/types';
import { exportBranchesToExcel } from '@/lib/excel/export';
import { ArchGauge } from './components/ArchGauge';
import { TrendSparklineCard } from './components/TrendSparklineCard';
import { CategoryHealthAccordion, type CategoryStockMetric } from './components/CategoryHealthAccordion';

export interface BranchInsightsWidgetProps {
  branches: Branch[];
  items: Item[];
  selectedBranchId: string;
  selectedBranchName: string;
  totalDatabaseItems?: number;
  onOpenAudit?: (shelfName?: string) => void;
  onOpenAnalytics?: (itemName?: string, categoryName?: string) => void;
}

/**
 * BranchInsightsWidget (Bevel-Elevated Design System)
 * Dashboard insights across all branches or for a single selected branch.
 * Features:
 * 1. Hero Semi-Circular Arch Health Gauge & Target Threshold Scale
 * 2. Reconciled Audit Accuracy & Fast Cycle Count Action
 * 3. 4 Trend / Deviation Cards with animated SVG Sparklines
 * 4. Expandable Category Stock Health with Circular Progress Rings & Segmented Dotted Range Bars
 * 5. Multi-Branch Comparative Valuation Table with Bulk Actions
 */
export function BranchInsightsWidget({
  branches,
  items,
  selectedBranchId,
  selectedBranchName,
  totalDatabaseItems,
  onOpenAudit,
  onOpenAnalytics,
}: BranchInsightsWidgetProps) {

  // Aggregate KPIs
  const totalBalance = useMemo(() => {
    return items.reduce((acc, curr) => acc + Number(curr.balance), 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [items]);

  const totalSKUs =
    selectedBranchId === 'all' && totalDatabaseItems
      ? totalDatabaseItems
      : items.length;

  // Breakdown per branch
  const branchBreakdown = useMemo(() => {
    return branches.map((b) => {
      const branchItems = items.filter((i) => i.branchId === b.id);
      const bBalance = branchItems.reduce((acc, curr) => acc + Number(curr.balance), 0);
      const bQty = branchItems.reduce((acc, curr) => acc + curr.quantity, 0);
      return {
        ...b,
        itemCount:
          totalDatabaseItems && branches.length === 1
            ? totalDatabaseItems
            : branchItems.length,
        totalQuantity: bQty,
        totalBalance: bBalance,
      };
    });
  }, [branches, items, totalDatabaseItems]);

  // Multiple Selection State
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set());

  const isAllSelected = useMemo(() => {
    return (
      branchBreakdown.length > 0 &&
      branchBreakdown.every((b) => selectedBranchIds.has(b.id))
    );
  }, [branchBreakdown, selectedBranchIds]);

  const isIndeterminate = useMemo(() => {
    const count = branchBreakdown.filter((b) => selectedBranchIds.has(b.id)).length;
    return count > 0 && count < branchBreakdown.length;
  }, [branchBreakdown, selectedBranchIds]);

  const toggleSelectBranch = (id: string) => {
    setSelectedBranchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedBranchIds(new Set());
    } else {
      setSelectedBranchIds(new Set(branchBreakdown.map((b) => b.id)));
    }
  };

  const clearSelection = () => {
    setSelectedBranchIds(new Set());
  };

  const handleBulkExport = () => {
    const selected = branchBreakdown.filter((b) => selectedBranchIds.has(b.id));
    if (selected.length === 0) return;
    exportBranchesToExcel(selected, `branch-performance-selected-${selected.length}`);
  };

  // Dynamic Category Stock Metrics for Bevel Category Health Accordion
  const categoryMetrics: CategoryStockMetric[] = useMemo(() => {
    if (items.length === 0) {
      return [
        {
          id: 'cat-1',
          categoryName: 'Dairy & Fresh',
          healthScore: 94.2,
          skuCount: 42,
          totalUnits: 1240,
          valuation: 4320.5,
          coverageDays: 19,
          optimalMinDays: 14,
          optimalMaxDays: 28,
          turnoverRate: 5.4,
          riskLevel: 'healthy',
        },
        {
          id: 'cat-2',
          categoryName: 'Beverages & Soft Drinks',
          healthScore: 91.0,
          skuCount: 65,
          totalUnits: 2890,
          valuation: 6180.0,
          coverageDays: 22,
          optimalMinDays: 14,
          optimalMaxDays: 28,
          turnoverRate: 4.8,
          riskLevel: 'healthy',
        },
        {
          id: 'cat-3',
          categoryName: 'Bakery & Pastry',
          healthScore: 86.5,
          skuCount: 28,
          totalUnits: 840,
          valuation: 1920.0,
          coverageDays: 12,
          optimalMinDays: 14,
          optimalMaxDays: 28,
          turnoverRate: 6.2,
          riskLevel: 'warning',
        },
        {
          id: 'cat-4',
          categoryName: 'Frozen Foods',
          healthScore: 95.8,
          skuCount: 54,
          totalUnits: 1680,
          valuation: 7850.25,
          coverageDays: 26,
          optimalMinDays: 14,
          optimalMaxDays: 28,
          turnoverRate: 4.1,
          riskLevel: 'healthy',
        },
      ];
    }

    const grouped: Record<string, { skus: number; units: number; balance: number }> = {};
    items.forEach((item) => {
      const cat = item.categoryName || 'General Goods';
      if (!grouped[cat]) {
        grouped[cat] = { skus: 0, units: 0, balance: 0 };
      }
      grouped[cat].skus += 1;
      grouped[cat].units += item.quantity;
      grouped[cat].balance += Number(item.balance);
    });

    const entries = Object.entries(grouped);
    return entries.slice(0, 8).map(([catName, stats], idx) => {
      const coverageDays = Math.max(8, Math.min(38, Math.round((stats.units / (stats.skus || 1)) * 1.5)));
      const optimalMinDays = 14;
      const optimalMaxDays = 28;
      const isOptimal = coverageDays >= optimalMinDays && coverageDays <= optimalMaxDays;
      const healthScore = isOptimal ? 92 + (idx % 6) : coverageDays < optimalMinDays ? 76 : 82;

      return {
        id: `cat-${idx}`,
        categoryName: catName,
        healthScore,
        skuCount: stats.skus,
        totalUnits: stats.units,
        valuation: stats.balance,
        coverageDays,
        optimalMinDays,
        optimalMaxDays,
        turnoverRate: Number((4.1 + (idx * 0.3) % 2.5).toFixed(1)),
        riskLevel: healthScore >= 85 ? 'healthy' : healthScore >= 70 ? 'warning' : 'critical',
      } as CategoryStockMetric;
    });
  }, [items]);

  return (
    <div className="space-y-6">
      {/* 1. Bevel Hero Section: Semi-Circular Arch Health Gauge & Reconciled Audit Confidence Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Arch Gauge (7 Cols) */}
        <div className="lg:col-span-7">
          <ArchGauge
            score={94.2}
            title="Inventory Health Score"
            subtitle={`Consolidated balance & optimal turnover for ${selectedBranchName}`}
          />
        </div>

        {/* Right Column: Reconciled Audit Accuracy & Fast Audit Action Card (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-3xl border border-slate-100/90 shadow-bevel p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-50 rounded-full blur-2xl pointer-events-none -z-0" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full uppercase tracking-wider">
                Audit Confidence
              </span>
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <CheckIcon size="sm" />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  99.4%
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  Audit Accuracy
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                All high-velocity SKUs reconciled. Zero variance detected over the last 7 operating days across active storage zones.
              </p>
            </div>

            {/* Recent Audit Pill */}
            <div className="mt-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-slate-700 truncate">
                  Cold Display Shelf B (42 SKUs)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">32m ago</span>
            </div>
          </div>

          {/* Rapid Cycle Count Trigger */}
          <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => onOpenAudit && onOpenAudit('Cold Display Shelf B')}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md shadow-emerald-600/15 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <BoxesIcon size="xs" />
              <span>Launch Rapid Cycle Count</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAnalytics && onOpenAnalytics('Whole Milk 1L', 'Dairy & Fresh')}
              className="py-3 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer text-center"
              title="Open Velocity Sheet"
            >
              Analytics Sheet
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bevel 4 Trend / Deviation Cards with Smooth SVG Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TrendSparklineCard
          label="Turnover Velocity"
          value="4.8x / yr"
          changeText="↑ +0.4"
          isPositive={true}
          dataPoints={[3.8, 4.0, 4.1, 4.3, 4.5, 4.7, 4.8]}
          color="emerald"
          subtitle="vs 30-day baseline"
          onClick={() => onOpenAnalytics && onOpenAnalytics('Turnover Trend', 'Operations')}
        />

        <TrendSparklineCard
          label="Stockout Risk Index"
          value="0.6%"
          changeText="↓ -0.8%"
          isPositive={true}
          dataPoints={[2.2, 1.9, 1.6, 1.3, 1.0, 0.8, 0.6]}
          color="emerald"
          subtitle="Low risk threshold (&lt;2%)"
          onClick={() => onOpenAnalytics && onOpenAnalytics('Stockout Metrics', 'Supply Chain')}
        />

        <TrendSparklineCard
          label="Near-Expiry SKUs"
          value="8 items"
          changeText="↓ -3 items"
          isPositive={true}
          dataPoints={[15, 14, 12, 11, 10, 9, 8]}
          color="amber"
          subtitle="Expiring within 14 days"
          onClick={() => onOpenAnalytics && onOpenAnalytics('Expiry Monitoring', 'Fresh Goods')}
        />

        <TrendSparklineCard
          label="Gross Inventory Margin"
          value="28.4%"
          changeText="↑ +1.2%"
          isPositive={true}
          dataPoints={[26.2, 26.5, 27.0, 27.4, 27.8, 28.1, 28.4]}
          color="blue"
          subtitle="Healthy margin spread"
          onClick={() => onOpenAnalytics && onOpenAnalytics('Margin Analytics', 'Financials')}
        />
      </div>

      {/* 3. Bevel Biomarker Translated: Category Stock Health Accordion with Progress Rings & Dotted Range Bars */}
      <CategoryHealthAccordion
        categories={categoryMetrics}
        onAuditCategory={(catName) => onOpenAudit && onOpenAudit(`${catName} Section`)}
        onInspectCategory={(catName) => onOpenAnalytics && onOpenAnalytics(catName, catName)}
      />


      {/* Multi-Branch Performance Breakdown (Shown on Consolidated View) */}
      {selectedBranchId === 'all' && (
        <Card className="p-6 bg-white border border-slate-100/90 rounded-3xl shadow-bevel space-y-4">
          <div className="border-b border-slate-100/90 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Branch Performance Comparison
            </h2>
            <p className="text-xs font-normal text-slate-400 mt-0.5">
              Consolidated view of stock valuation and quantity distribution across all stores
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stocky-bg-global text-stocky-text-sub border-b border-stocky-border-subtle select-none">
                  {/* 0. Select Box */}
                  <th className="py-2.5 px-3 w-10 min-w-[40px] text-center">
                    <input
                      type="checkbox"
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all branches"
                      className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle"
                    />
                  </th>
                  <th className="py-2.5 px-4 font-medium">Branch / Store</th>
                  <th className="py-2.5 px-4 font-medium">Location</th>
                  <th className="py-2.5 px-4 font-medium text-right">SKUs</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total Units</th>
                  <th className="py-2.5 px-4 font-medium text-right">Stock Valuation</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle">
                {branchBreakdown.map((b) => {
                  const isSelected = selectedBranchIds.has(b.id);
                  return (
                    <tr
                      key={b.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-stocky-primary/10 hover:bg-stocky-primary/15'
                          : 'hover:bg-stocky-bg-global/50'
                      }`}
                    >
                      {/* 0. Select Box */}
                      <td
                        className="py-3 px-3 w-10 min-w-[40px] text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectBranch(b.id)}
                          aria-label={`Select branch ${b.name}`}
                          className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-stocky-text-main">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-stocky-accent shrink-0" />
                          <span>{b.name}</span>
                          <span className="text-[10px] font-normal text-stocky-text-sub bg-stocky-bg-global px-1.5 py-0.5 rounded-widget border border-stocky-border-subtle">
                            {b.code || 'BR'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stocky-text-sub truncate max-w-xs">
                        {b.address || 'Cairo, Egypt'}
                      </td>
                      <td className="py-3 px-4 text-right text-stocky-text-main font-medium">
                        {b.itemCount}
                      </td>
                      <td className="py-3 px-4 text-right text-stocky-text-main font-medium">
                        {b.totalQuantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-stocky-text-main font-medium">
                        ${b.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap w-28 min-w-[110px]">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => alert(`Edit Branch: ${b.name}`)}
                            className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-primary hover:border-stocky-primary/40 flex items-center justify-center transition-all cursor-pointer"
                            title={`Edit ${b.name}`}
                          >
                            <EditIcon size="xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete branch "${b.name}"?`)) {
                                alert(`Branch delete requested for: ${b.name}`);
                              }
                            }}
                            className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-red-50 border border-stocky-border-subtle hover:border-red-200 text-stocky-text-sub hover:text-red-600 flex items-center justify-center transition-all cursor-pointer"
                            title={`Delete ${b.name}`}
                          >
                            <TrashIcon size="xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Floating Bulk Action Bar */}
          <AnimatePresence>
            {selectedBranchIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bevel-glass-dock rounded-full px-5 py-3 flex items-center gap-3.5 shadow-bevel-dock select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-stocky-primary animate-pulse" />
                  <span className="text-xs font-semibold text-slate-800">
                    <span>{selectedBranchIds.size}</span> branch
                    {selectedBranchIds.size > 1 ? 'es' : ''} selected
                  </span>
                </div>

                <div className="h-4 w-px bg-slate-200" />

                <button
                  type="button"
                  onClick={handleBulkExport}
                  className="text-xs text-slate-700 hover:text-stocky-primary flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1 px-2.5 rounded-full hover:bg-slate-100"
                  title="Export selected branch metrics to Excel"
                >
                  <ArrowDownIcon size="xs" />
                  <span>Export Selected</span>
                </button>

                <div className="h-4 w-px bg-slate-200" />

                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-full hover:bg-slate-100"
                  title="Deselect all"
                >
                  <XIcon size="xs" />
                  <span>Deselect</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}
    </div>
  );
}
