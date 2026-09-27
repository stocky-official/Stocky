'use client';

import React, { useMemo, useState } from 'react';
import type { Location, StockLot, StockMovement, StockTask } from '@stocky/types';
import { FilterIcon, InfoIcon, XIcon, FileSpreadsheetIcon } from '@stocky/icons';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { ChartFilterBottomSheet } from './ChartFilterBottomSheet';
import { exportVisualDataToExcel } from '@/lib/excel/export';
import { useTranslation } from '@/lib/i18n';

export type BranchAnalysisMetric = 'units' | 'value' | 'moving' | 'lagging' | 'staff';

export interface HomeBranchesAnalysisChartWidgetProps {
  locations?: Location[];
  lots?: StockLot[];
  movements?: StockMovement[];
  tasks?: StockTask[];
  teamMembers?: Array<{ id: string; branchIds?: string[] }>;
  teamAssignments?: Array<{ user_id: string; location_id: string }>;
  onSelectLocation?: (locationId: string) => void;
  externalTimeframe?: '7D' | '14D' | '30D' | '90D' | 'YTD';
  externalLocationId?: string;
  canViewCommercials?: boolean;
  canExport?: boolean;
}

export function HomeBranchesAnalysisChartWidget({
  locations = [],
  lots = [],
  movements = [],
  tasks = [],
  teamMembers = [],
  teamAssignments = [],
  onSelectLocation,
  externalTimeframe,
  externalLocationId,
  canViewCommercials = true,
  canExport = true,
}: HomeBranchesAnalysisChartWidgetProps) {
  const { t } = useTranslation();
  const [metric, setMetric] = useState<BranchAnalysisMetric>('units');
  const [internalTimeframe, setInternalTimeframe] = useState<'7D' | '14D' | '30D' | '90D'>('30D');
  const effectiveTimeframe = (externalTimeframe && externalTimeframe !== 'YTD' ? externalTimeframe : internalTimeframe) as '7D' | '14D' | '30D' | '90D';

  // UI state for bottom sheet filter & info popover
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const metricConfig: Record<
    BranchAnalysisMetric,
    { label: string; unitLabel: string; formatter: (v: number) => string; color: string }
  > = {
    units: {
      label: t('home.charts.branchComparison.unitsLabel'),
      unitLabel: t('home.charts.branchComparison.unitsUnit'),
      formatter: (v) => `${v.toLocaleString()} ${t('home.charts.branchComparison.unitsUnit')}`,
      color: 'var(--stocky-primary)',
    },
    value: {
      label: t('home.charts.branchComparison.valueLabel'),
      unitLabel: t('home.charts.branchComparison.valueUnit'),
      formatter: (v) => `$${(v / 1000).toFixed(1)}k`,
      color: 'var(--stocky-primary)',
    },
    moving: {
      label: t('home.charts.branchComparison.movingLabel'),
      unitLabel: t('home.charts.branchComparison.movingUnit'),
      formatter: (v) => `${v.toLocaleString()} ${t('home.charts.branchComparison.movingUnit')}`,
      color: 'var(--stocky-status-info-fg)',
    },
    lagging: {
      label: t('home.charts.branchComparison.laggingLabel'),
      unitLabel: t('home.charts.branchComparison.laggingUnit'),
      formatter: (v) => `${v.toLocaleString()} ${t('home.charts.branchComparison.laggingUnit')}`,
      color: 'var(--stocky-status-warning-fg)',
    },
    staff: {
      label: t('home.charts.branchComparison.staffLabel'),
      unitLabel: t('home.charts.branchComparison.staffUnit'),
      formatter: (v) => `${v} ${t('home.charts.branchComparison.staffUnit')}`,
      color: 'var(--stocky-status-hold-fg)',
    },
  };

  const activeMetric: BranchAnalysisMetric = canViewCommercials || metric !== 'value' ? metric : 'units';
  const activeConfig = metricConfig[activeMetric];

  // Compile comparison data per branch
  const chartData = useMemo(() => {
    let baseLocations: Array<{ id: string; name: string; type: string; address?: string | null }> = locations;

    if (externalLocationId && externalLocationId !== 'all') {
      const match = baseLocations.filter((l) => l.id === externalLocationId);
      if (match.length > 0) baseLocations = match;
    }

    const days = externalTimeframe === 'YTD'
      ? (() => {
          const now = new Date();
          return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
        })()
      : effectiveTimeframe === '7D' ? 7 : effectiveTimeframe === '14D' ? 14 : effectiveTimeframe === '30D' ? 30 : 90;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const dormantCutoff = new Date(Date.now() - 90 * 86400000).toISOString();

    return baseLocations.map((loc, idx) => {
      const branchLots = lots.filter((l) => l.locationId === loc.id && (l.quantityOnHand || 0) > 0);
      const units = branchLots.reduce((acc, l) => acc + (l.quantityOnHand || 0), 0);
      const value = canViewCommercials
        ? branchLots.reduce((acc, l) => acc + (l.quantityOnHand || 0) * (l.unitCost || 0), 0)
        : 0;

      // Movement volume
      const branchMovements = movements.filter((m) => m.locationId === loc.id && (!m.createdAt || m.createdAt >= cutoff));
      const moving = branchMovements.reduce((acc, m) => acc + Math.abs(m.quantityDelta || 0), 0);

      // Lagging stock volume
      const recentMovementKeys = new Set(
        movements
          .filter((movement) => movement.locationId === loc.id && movement.createdAt && movement.createdAt >= dormantCutoff)
          .map((movement) => movement.productId)
      );
      const lagging = branchLots
        .filter((lot) => !recentMovementKeys.has(lot.productId))
        .reduce((acc, lot) => acc + (lot.quantityOnHand || 0), 0);

      // Assigned staff
      const assignedIds = teamAssignments.filter((a) => a.location_id === loc.id).map((a) => a.user_id);
      const staff = teamMembers.filter((m) => assignedIds.includes(m.id) || (m.branchIds && m.branchIds.includes(loc.id)));
      const staffCount = staff.length;

      let metricValue = units;
      if (activeMetric === 'value') metricValue = Math.round(value);
      else if (activeMetric === 'moving') metricValue = moving;
      else if (activeMetric === 'lagging') metricValue = lagging;
      else if (activeMetric === 'staff') metricValue = staffCount;

      return {
        id: loc.id,
        name: loc.name,
        shortName: loc.name.length > 13 ? `${loc.name.slice(0, 11)}...` : loc.name,
        type: loc.type || 'branch',
        units,
        value,
        moving,
        lagging,
        staffCount,
        metricValue,
      };
    });
  }, [locations, lots, movements, teamMembers, teamAssignments, effectiveTimeframe, activeMetric, externalLocationId, canViewCommercials]);

  const handleExportExcel = () => {
    exportVisualDataToExcel({
      reportTitle: 'Branch Comparative Benchmark',
      filenamePrefix: 'Stocky_Branch_Benchmark',
      sheetName: 'Branch Benchmark',
      appliedFilters: {
        timeframe: effectiveTimeframe,
        location: externalLocationId || 'All',
        metric: activeConfig.label,
      },
      rows: chartData.map((d) => ({
        'Location Name': d.name,
        'Branch Type': d.type.toUpperCase(),
        'Inventory Units': d.units,
        'Valuation ($)': Number(d.value.toFixed(2)),
        'Units Moved': d.moving,
        'Lagging Units': d.lagging,
        'Active Staff': d.staffCount,
        'Active Benchmark Metric': activeConfig.label,
        'Benchmark Score': activeConfig.formatter(d.metricValue),
      })),
    });
  };

  return (
    <div className="w-full h-[490px] sm:h-[510px] bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      {/* 1. Header Toolbar (Clean text, NO icons in headlines, 'i' info button, filter button) */}
      <div className="pb-3 border-b border-stocky-border-subtle">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-stocky-text-main tracking-tight truncate">
              {t('home.charts.branchComparison.title')}
            </h3>
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              className="w-5 h-5 rounded-full bg-stocky-bg-global hover:bg-stocky-border-subtle text-stocky-text-sub hover:text-stocky-text-main flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Information details"
              title="Click to view details"
            >
              <InfoIcon size="xs" />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Visual / Table Toggle */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-stocky-bg-global border border-stocky-border-subtle">
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === 'chart'
                    ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs'
                    : 'text-stocky-text-sub hover:text-stocky-text-main'
                }`}
              >
                {t('home.charts.branchComparison.chart')}
              </button>
              <button
                type="button"
                data-toggle-mode="table"
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs'
                    : 'text-stocky-text-sub hover:text-stocky-text-main'
                }`}
              >
                {t('home.charts.branchComparison.table')}
              </button>
            </div>

            {/* Excel (.xlsx) Extract Button */}
            {canExport && <button
              type="button"
              data-testid="export-excel-branch-btn"
              onClick={handleExportExcel}
              className="hidden sm:inline-flex h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global hover:bg-stocky-border-subtle text-xs font-semibold text-stocky-text-main items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Extract visual data as Excel (.xlsx)"
            >
              <FileSpreadsheetIcon size="xs" />
              <span>{t('home.charts.topMovers.excel')}</span>
            </button>}

            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="h-8 px-2.5 rounded-full border border-stocky-border-subtle bg-stocky-bg-global hover:bg-stocky-border-subtle text-xs font-semibold text-stocky-text-main flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Filter by metric"
            >
              <FilterIcon size="xs" />
              <span className="px-1.5 py-0.5 rounded-full bg-stocky-primary text-stocky-text-inverse text-[10px] font-bold">
                {activeConfig.label.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>

        {/* Subtitle hidden on phone */}
        <p className="hidden sm:block text-[11px] text-stocky-text-sub mt-0.5">
          {t('home.charts.branchComparison.subtitle')}
        </p>

        {showInfo && (
          <div className="mt-2.5 p-2.5 bg-stocky-bg-global/90 border border-stocky-border-subtle rounded-xl text-xs text-stocky-text-sub flex items-start justify-between gap-2 animate-in fade-in duration-150">
            <span>
              {t('home.charts.branchComparison.info')}
            </span>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="text-stocky-text-muted hover:text-stocky-text-main p-0.5"
            >
              <XIcon size="xs" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Visual Chart OR Data Table View */}
      {viewMode === 'chart' ? (
        <div className="w-full flex-1 my-3 min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 15, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--stocky-border-subtle)" />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: 'var(--stocky-text-main)', fontWeight: 500 }}
                axisLine={{ stroke: 'var(--stocky-border-subtle)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--stocky-text-muted)' }}
                axisLine={{ stroke: 'var(--stocky-border-subtle)' }}
                tickLine={false}
                tickFormatter={(v) =>
                  activeMetric === 'value'
                    ? `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                    : v >= 1000
                    ? `${(v / 1000).toFixed(1)}k`
                    : `${v}`
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-stocky-bg-widget border border-stocky-border-default rounded-xl p-2.5 shadow-md text-xs">
                      <span className="font-bold text-stocky-text-main block">{data.name}</span>
                      <span className="text-[10px] text-stocky-text-sub block mb-1.5 uppercase font-medium">
                        {data.type}
                      </span>
                      <div className="space-y-1 text-[11px]">
                        <div className="text-stocky-primary font-bold">
                          {activeConfig.label}: {activeConfig.formatter(data.metricValue)}
                        </div>
                        <div className="text-stocky-text-sub">
                          {t('home.charts.branchMap.inventoryUnits')}: <span className="font-medium text-stocky-text-main">{data.units.toLocaleString()}</span>
                        </div>
                        {canViewCommercials && (
                          <div className="text-stocky-text-sub">
                            {t('home.charts.branchMap.valuation')}: <span className="font-medium text-stocky-text-main">${(data.value / 1000).toFixed(1)}k</span>
                          </div>
                        )}
                        <div className="text-stocky-text-sub">
                          {t('home.charts.branchMap.assignedStaff')}: <span className="font-medium text-stocky-text-main">{data.staffCount}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="metricValue"
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={(entry: any) => {
                  if (entry?.id && onSelectLocation) onSelectLocation(String(entry.id));
                }}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-bar-${index}`}
                    fill={activeConfig.color}
                    opacity={0.88 + index * 0.03}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="w-full flex-1 my-3 min-h-[260px] overflow-y-auto rounded-xl border border-stocky-border-subtle">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-stocky-bg-global sticky top-0 border-b border-stocky-border-subtle text-[11px] font-semibold text-stocky-text-sub">
              <tr>
                <th className="py-2.5 px-3 text-start">{t('common.location')}</th>
                <th className="py-2.5 px-3 text-start">{t('common.type')}</th>
                <th className="py-2.5 px-3 text-end">{t('home.charts.branchMap.inventoryUnits')}</th>
                {canViewCommercials && <th className="py-2.5 px-3 text-end">{t('home.charts.branchMap.valuation')}</th>}
                <th className="py-2.5 px-3 text-end">{t('team.title')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stocky-border-subtle/50 text-stocky-text-main">
              {chartData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectLocation && onSelectLocation(item.id)}
                  className="hover:bg-stocky-bg-hover transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-medium text-stocky-text-main">{item.name}</td>
                  <td className="py-2.5 px-3 text-stocky-text-sub text-[11px] uppercase">{item.type}</td>
                  <td className="py-2.5 px-3 text-end font-medium">{item.units.toLocaleString()}</td>
                  {canViewCommercials && <td className="py-2.5 px-3 text-end font-bold text-stocky-primary">${(item.value / 1000).toFixed(1)}k</td>}
                  <td className="py-2.5 px-3 text-end text-stocky-text-sub">{item.staffCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Footer Summary */}
      <div className="flex items-center justify-between text-[11px] text-stocky-text-sub pt-2 border-t border-stocky-border-subtle font-medium">
        <span>{t('home.charts.branchComparison.comparingLocations', { count: chartData.length })}</span>
        <span className="text-stocky-text-main font-semibold">
          {t('home.charts.branchComparison.metricLabel', { metric: activeConfig.label })}
        </span>
      </div>

      {/* 5. Sliding Window from the Bottom (Filters Bottom Sheet) */}
      <ChartFilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title={t('home.charts.branchComparison.filterTitle')}
        onReset={() => {
          setMetric('units');
          setInternalTimeframe('30D');
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stocky-text-main block mb-2">
              {t('home.charts.branchComparison.comparisonMetric')}
            </label>
            <div className="space-y-1.5">
              {(Object.keys(metricConfig) as BranchAnalysisMetric[]).filter((key) => canViewCommercials || key !== 'value').map((key) => {
                const cfg = metricConfig[key];
                const isSelected = metric === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMetric(key)}
                    className={`w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary'
                        : 'border-stocky-border-subtle bg-stocky-bg-global text-stocky-text-main hover:border-stocky-border-default'
                    }`}
                  >
                    <span>{cfg.label}</span>
                    <span className="text-[11px] font-normal text-stocky-text-sub">
                      ({cfg.unitLabel})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-stocky-border-subtle">
            <label className="text-xs font-semibold text-stocky-text-main block mb-2">
              {t('home.charts.branchMap.timeframePresets')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['7D', '14D', '30D', '90D'] as const).map((tVal) => (
                <button
                  key={tVal}
                  type="button"
                  onClick={() => setInternalTimeframe(tVal)}
                  className={`h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    internalTimeframe === tVal
                      ? 'bg-stocky-primary text-stocky-text-inverse shadow-xs'
                      : 'bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle'
                  }`}
                >
                  {tVal}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ChartFilterBottomSheet>
    </div>
  );
}
