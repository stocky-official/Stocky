'use client';

import React, { useMemo, useState } from 'react';
import type { Product, StockLot, StockMovement } from '@stocky/types';
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

export interface HomeTopMovingProductsChartWidgetProps {
  products?: Product[];
  lots?: StockLot[];
  movements?: StockMovement[];
  onOpenProduct?: (productId: string) => void;
  externalTimeframe?: '7D' | '14D' | '30D' | '90D' | 'YTD';
  externalCategory?: string;
  externalLocationId?: string;
  canExport?: boolean;
}

export function HomeTopMovingProductsChartWidget({
  products = [],
  lots = [],
  movements = [],
  onOpenProduct,
  externalTimeframe,
  externalCategory,
  externalLocationId,
  canExport = true,
}: HomeTopMovingProductsChartWidgetProps) {
  const { t, isRtl } = useTranslation();
  const [internalTimeframe, setInternalTimeframe] = useState<'7D' | '14D' | '30D' | '90D'>('30D');
  const [internalCategoryFilter, setInternalCategoryFilter] = useState<string>('all');
  const effectiveTimeframe = externalTimeframe || internalTimeframe;
  const effectiveCategory = externalCategory !== undefined && externalCategory !== 'all' ? externalCategory : internalCategoryFilter;

  // UI state for bottom sheet filter & info popover
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set);
  }, [products]);

  const chartData = useMemo(() => {
    const days = effectiveTimeframe === 'YTD'
      ? (() => {
          const now = new Date();
          return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
        })()
      : effectiveTimeframe === '7D' ? 7 : effectiveTimeframe === '14D' ? 14 : effectiveTimeframe === '30D' ? 30 : 90;
    const cutoffDate = new Date(Date.now() - days * 86400000).toISOString();

    const volumeByProduct = new Map<string, { totalMoved: number; movementCount: number }>();

    movements.forEach((m) => {
      if (externalLocationId && externalLocationId !== 'all' && m.locationId !== externalLocationId) return;
      if (!m.createdAt || m.createdAt >= cutoffDate) {
        const cur = volumeByProduct.get(m.productId) || { totalMoved: 0, movementCount: 0 };
        cur.totalMoved += Math.abs(m.quantityDelta || 0);
        cur.movementCount += 1;
        volumeByProduct.set(m.productId, cur);
      }
    });

    lots.forEach((lot) => {
      if (externalLocationId && externalLocationId !== 'all' && lot.locationId !== externalLocationId) return;
      if (lot.receivedAt && lot.receivedAt >= cutoffDate) {
        const cur = volumeByProduct.get(lot.productId) || { totalMoved: 0, movementCount: 0 };
        cur.totalMoved += lot.quantityOnHand || 0;
        cur.movementCount += 1;
        volumeByProduct.set(lot.productId, cur);
      }
    });

    const filtered = products.filter(
      (p) => effectiveCategory === 'all' || p.categoryName === effectiveCategory
    );

    const scored = filtered.map((p) => {
      const stats = volumeByProduct.get(p.id);
      const unitsMoved = stats?.totalMoved || 0;
      const batches = stats?.movementCount || 0;
      const velocityScore = Math.round(unitsMoved / Math.max(1, days / 7));

      return {
        id: p.id,
        name: p.name,
        shortName: p.name.length > 18 ? `${p.name.slice(0, 16)}...` : p.name,
        category: p.categoryName || 'General',
        unitsMoved,
        batches,
        velocityScore,
      };
    });

    return scored
      .filter((item) => item.unitsMoved > 0)
      .sort((a, b) => b.unitsMoved - a.unitsMoved)
      .slice(0, 6);
  }, [products, lots, movements, effectiveTimeframe, effectiveCategory, externalLocationId]);

  const handleExportExcel = () => {
    exportVisualDataToExcel({
      reportTitle: 'Top Moving Products Analysis',
      filenamePrefix: 'Stocky_Top_Moving_Products',
      sheetName: 'Top Movers',
      appliedFilters: {
        timeframe: effectiveTimeframe,
        category: effectiveCategory,
        location: externalLocationId || 'All',
      },
      rows: chartData.map((d, rank) => ({
        'Rank': rank + 1,
        'Product Name': d.name,
        'Category': d.category,
        'Units Moved': d.unitsMoved,
        'Active Batches': d.batches,
        'Velocity Score (Units/Wk)': d.velocityScore,
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
              {t('home.charts.topMovers.title')}
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
            {/* Desktop Visual / Data Table Toggle */}
            <div className="hidden sm:inline-flex items-center p-0.5 rounded-lg bg-stocky-bg-global border border-stocky-border-subtle">
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === 'chart'
                    ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs'
                    : 'text-stocky-text-sub hover:text-stocky-text-main'
                }`}
              >
                {t('home.charts.topMovers.chart')}
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
                {t('home.charts.topMovers.table')}
              </button>
            </div>

            {/* Excel (.xlsx) Extract Button */}
            {canExport && <button
              type="button"
              data-testid="export-excel-top-movers-btn"
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
              className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-stocky-bg-global hover:bg-stocky-border-subtle text-xs font-semibold text-stocky-text-main flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <FilterIcon size="xs" />
              <span>{t('home.charts.topMovers.filter')}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-stocky-primary text-stocky-text-inverse text-[10px] font-bold">
                {effectiveTimeframe}
              </span>
            </button>
          </div>
        </div>

        {/* Subtitle hidden on phone */}
        <p className="hidden sm:block text-[11px] text-stocky-text-sub mt-0.5">
          {t('home.charts.topMovers.subtitle')}
        </p>

        {showInfo && (
          <div className="mt-2.5 p-2.5 bg-stocky-bg-global/90 border border-stocky-border-subtle rounded-xl text-xs text-stocky-text-sub flex items-start justify-between gap-2 animate-in fade-in duration-150">
            <span>
              {t('home.charts.topMovers.info')}
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
              layout="vertical"
              margin={isRtl ? { top: 10, right: 10, left: 24, bottom: 5 } : { top: 10, right: 24, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--stocky-border-subtle)" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'var(--stocky-text-muted)' }}
                axisLine={{ stroke: 'var(--stocky-border-subtle)' }}
                tickLine={false}
                tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              />
              <YAxis
                dataKey="shortName"
                type="category"
                tick={{ fontSize: 11, fill: 'var(--stocky-text-main)', fontWeight: 500 }}
                axisLine={{ stroke: 'var(--stocky-border-subtle)' }}
                tickLine={false}
                width={110}
                orientation={isRtl ? 'right' : 'left'}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-stocky-bg-widget border border-stocky-border-default rounded-xl p-2.5 shadow-md text-xs">
                      <span className="font-bold text-stocky-text-main block">{data.name}</span>
                      <span className="text-[10px] text-stocky-text-sub block mb-1.5">{data.category}</span>
                      <div className="space-y-0.5 text-[11px]">
                        <div className="text-stocky-primary font-bold">
                          {t('home.charts.topMovers.unitsMoved', { count: data.unitsMoved.toLocaleString() })}
                        </div>
                        <div className="text-stocky-text-main font-medium">
                          {t('home.charts.topMovers.activeBatches', { count: data.batches })}
                        </div>
                        <div className="text-stocky-text-muted text-[10px] mt-1">
                          {t('home.charts.topMovers.runRate', { count: data.velocityScore })}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="unitsMoved"
                radius={isRtl ? [6, 0, 0, 6] : [0, 6, 6, 0]}
                cursor="pointer"
                onClick={(entry: any) => {
                  if (entry?.id && onOpenProduct) onOpenProduct(String(entry.id));
                }}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? 'var(--stocky-primary)' : 'var(--stocky-primary-hover)'}
                    opacity={1 - index * 0.1}
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
                <th className="py-2.5 px-3 text-start">{t('inventory.productName')}</th>
                <th className="py-2.5 px-3 text-start">{t('inventory.category')}</th>
                <th className="py-2.5 px-3 text-end">{t('home.charts.branchMap.inventoryUnits')}</th>
                <th className="py-2.5 px-3 text-end">{t('inventory.batches')}</th>
                <th className="py-2.5 px-3 text-end">{t('home.turnoverVelocity')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stocky-border-subtle/50 text-stocky-text-main">
              {chartData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onOpenProduct && onOpenProduct(item.id)}
                  className="hover:bg-stocky-bg-hover transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-medium text-stocky-text-main truncate max-w-[150px]">{item.name}</td>
                  <td className="py-2.5 px-3 text-stocky-text-sub text-[11px]">{item.category}</td>
                  <td className="py-2.5 px-3 text-end font-bold text-stocky-primary">{item.unitsMoved.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-end text-stocky-text-sub">{item.batches}</td>
                  <td className="py-2.5 px-3 text-end">
                    <span className="px-2 py-0.5 rounded-full bg-stocky-status-success-bg text-stocky-status-success-fg text-[10px] font-bold border border-stocky-status-success-border">
                      {item.velocityScore}/wk
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Footer Summary */}
      <div className="flex items-center justify-between text-[11px] text-stocky-text-sub pt-2 border-t border-stocky-border-subtle font-medium">
        <span>{t('home.charts.topMovers.showingTop', { count: chartData.length })}</span>
        <span className="text-stocky-primary font-semibold">
          {t('home.charts.topMovers.velocityThreshold')}
        </span>
      </div>

      {/* 4. Sliding Window from the Bottom (Filters Bottom Sheet) */}
      <ChartFilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title={t('home.charts.topMovers.filterTitle')}
        onReset={() => {
          setInternalTimeframe('30D');
          setInternalCategoryFilter('all');
        }}
      >
        <div className="space-y-4">
          <div>
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

          {categories.length > 0 && (
            <div className="pt-2 border-t border-stocky-border-subtle">
              <label className="text-xs font-semibold text-stocky-text-main block mb-2">
                {t('home.charts.topMovers.filterCategory')}
              </label>
              <select
                value={internalCategoryFilter}
                onChange={(e) => setInternalCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-xs font-medium bg-stocky-bg-global text-stocky-text-main border border-stocky-border-subtle cursor-pointer focus:outline-none"
              >
                <option value="all">{t('home.charts.topMovers.allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </ChartFilterBottomSheet>
    </div>
  );
}
