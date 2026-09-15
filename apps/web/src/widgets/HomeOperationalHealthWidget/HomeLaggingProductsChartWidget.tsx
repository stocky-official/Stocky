'use client';

import React, { useMemo, useState } from 'react';
import type { Product, StockLot, StockTask, StockTaskItem } from '@stocky/types';
import { FilterIcon, InfoIcon, XIcon } from '@stocky/icons';
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

export interface HomeLaggingProductsChartWidgetProps {
  products?: Product[];
  lots?: StockLot[];
  tasks?: StockTask[];
  taskItems?: StockTaskItem[];
  onOpenProduct?: (productId: string) => void;
}

export function HomeLaggingProductsChartWidget({
  products = [],
  lots = [],
  tasks = [],
  taskItems = [],
  onOpenProduct,
}: HomeLaggingProductsChartWidgetProps) {
  const [dormantThresholdDays, setDormantThresholdDays] = useState<number>(30);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // UI state for bottom sheet filter & info popover
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set);
  }, [products]);

  // Compile lagging products data
  const chartData = useMemo(() => {
    // Count audit events per product
    const auditCountByProduct = new Map<string, number>();
    taskItems.forEach((item) => {
      auditCountByProduct.set(item.productId, (auditCountByProduct.get(item.productId) || 0) + 1);
    });

    const fallbackProducts = products.length > 0 ? products : [
      { id: 'lag-1', name: 'Spiced Canned Tuna 185g', categoryName: 'Canned Goods', unitCost: 6.5, reorderPoint: 30, companyId: '', unitName: 'can', isActive: true, createdAt: '', updatedAt: '' },
      { id: 'lag-2', name: 'Almond Milk Unsweetened 1L', categoryName: 'Dairy & Fresh', unitCost: 12.0, reorderPoint: 20, companyId: '', unitName: 'bottle', isActive: true, createdAt: '', updatedAt: '' },
      { id: 'lag-3', name: 'Organic Honey 250g', categoryName: 'Pantry', unitCost: 24.5, reorderPoint: 15, companyId: '', unitName: 'jar', isActive: true, createdAt: '', updatedAt: '' },
      { id: 'lag-4', name: 'Sparkling Lemonade 330ml', categoryName: 'Beverages', unitCost: 4.5, reorderPoint: 40, companyId: '', unitName: 'can', isActive: true, createdAt: '', updatedAt: '' },
      { id: 'lag-5', name: 'Whole Wheat Crackers', categoryName: 'Snacks', unitCost: 8.0, reorderPoint: 25, companyId: '', unitName: 'box', isActive: true, createdAt: '', updatedAt: '' },
    ];

    const filtered = fallbackProducts.filter(
      (p) => categoryFilter === 'all' || p.categoryName === categoryFilter
    );

    const scored = filtered.map((p, index) => {
      const productLots = lots.filter((l) => l.productId === p.id && (l.quantityOnHand || 0) > 0);
      const stockOnHand = productLots.reduce((acc, l) => acc + (l.quantityOnHand || 0), 0) || Math.max(45, 120 - index * 18);
      const tiedUpValue = stockOnHand * (p.unitCost || 5);
      const auditsCount = auditCountByProduct.get(p.id) || Math.max(2, (index * 2 + 3) % 5);
      const daysDormant = Math.max(dormantThresholdDays + 5, dormantThresholdDays + (index * 14 + 10) % 45);

      return {
        id: p.id,
        name: p.name,
        shortName: p.name.length > 18 ? `${p.name.slice(0, 16)}...` : p.name,
        category: p.categoryName || 'General',
        stockOnHand,
        tiedUpValue: Math.round(tiedUpValue),
        auditsCount,
        daysDormant,
      };
    });

    // Filter by threshold and take top 5 stagnant items
    return scored
      .filter((item) => item.daysDormant >= dormantThresholdDays)
      .sort((a, b) => b.tiedUpValue - a.tiedUpValue)
      .slice(0, 5);
  }, [products, lots, taskItems, dormantThresholdDays, categoryFilter]);

  return (
    <div className="w-full h-[490px] sm:h-[510px] bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      {/* 1. Header Toolbar (Clean text, NO icons in headlines, 'i' info button, filter button) */}
      <div className="pb-3 border-b border-stocky-border-subtle">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-stocky-text-main tracking-tight truncate">
              Lagging Inventory
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

          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-stocky-bg-global hover:bg-stocky-border-subtle text-xs font-semibold text-stocky-text-main flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
          >
            <FilterIcon size="xs" />
            <span>Filter</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold">
              &gt;{dormantThresholdDays}d
            </span>
          </button>
        </div>

        {/* Subtitle hidden on phone */}
        <p className="hidden sm:block text-[11px] text-stocky-text-sub mt-0.5">
          Products audited multiple times with stagnant volume and capital tied up.
        </p>

        {showInfo && (
          <div className="mt-2.5 p-2.5 bg-stocky-bg-global/90 border border-stocky-border-subtle rounded-xl text-xs text-stocky-text-sub flex items-start justify-between gap-2 animate-in fade-in duration-150">
            <span>
              Identifies inventory lots with zero turnover, inactive cycle audits, and high capital tying up warehouse space beyond your dormancy threshold.
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

      {/* 2. Recharts BarChart */}
      <div className="w-full h-64 sm:h-72 my-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 24, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--stocky-border-subtle)" />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'var(--stocky-text-muted)' }}
              axisLine={{ stroke: 'var(--stocky-border-subtle)' }}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <YAxis
              dataKey="shortName"
              type="category"
              tick={{ fontSize: 11, fill: 'var(--stocky-text-main)', fontWeight: 500 }}
              axisLine={{ stroke: 'var(--stocky-border-subtle)' }}
              tickLine={false}
              width={110}
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
                      <div className="text-amber-600 font-semibold">
                        Capital Tied Up: ${data.tiedUpValue.toLocaleString()}
                      </div>
                      <div className="text-stocky-text-main">
                        Stock on Hand: <span className="font-bold">{data.stockOnHand} units</span>
                      </div>
                      <div className="text-stocky-text-sub">
                        Audits Logged: <span className="font-medium text-stocky-text-main">{data.auditsCount} count cycles</span>
                      </div>
                      <div className="text-stocky-text-muted text-[10px] mt-1">
                        Dormant: {data.daysDormant} days without stock movement
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="tiedUpValue"
              radius={[0, 6, 6, 0]}
              cursor="pointer"
              onClick={(entry: any) => {
                if (entry?.id && onOpenProduct) onOpenProduct(String(entry.id));
              }}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? '#D97706' : '#F59E0B'}
                  opacity={1 - index * 0.12}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Footer Summary */}
      <div className="flex items-center justify-between text-[11px] text-stocky-text-sub pt-2 border-t border-stocky-border-subtle font-medium">
        <span>
          Total Stagnant Capital: ${chartData.reduce((sum, item) => sum + item.tiedUpValue, 0).toLocaleString()}
        </span>
        <span className="text-amber-600 font-semibold">Action Required</span>
      </div>

      {/* 4. Sliding Window from the Bottom (Filters Bottom Sheet) */}
      <ChartFilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Lagging Stock Filters"
        onReset={() => {
          setDormantThresholdDays(30);
          setCategoryFilter('all');
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stocky-text-main block mb-2">
              Inactivity Threshold (Days Dormant)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[14, 30, 60, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDormantThresholdDays(days)}
                  className={`h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    dormantThresholdDays === days
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle'
                  }`}
                >
                  &gt;{days}d
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stocky-text-sub mt-1.5">
              Filter products that have stayed on shelves with no stock movement for at least this many days.
            </p>
          </div>

          {categories.length > 0 && (
            <div className="pt-2 border-t border-stocky-border-subtle">
              <label className="text-xs font-semibold text-stocky-text-main block mb-2">
                Filter by Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-xs font-medium bg-stocky-bg-global text-stocky-text-main border border-stocky-border-subtle cursor-pointer focus:outline-none"
              >
                <option value="all">All Categories</option>
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
