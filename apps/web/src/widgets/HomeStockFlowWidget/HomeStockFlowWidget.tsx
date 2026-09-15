'use client';

import React from 'react';
import {
  ArrowUpDownIcon,
  BoxesIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  TrendingUpIcon,
  TruckIcon,
} from '@stocky/icons';

export interface HomeStockFlowWidgetProps {
  totalFlowValue?: string;
  totalUnits?: number;
  activeSkusCount?: number;
  changePct?: number;
  changeAmount?: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  onOpenStock: () => void;
  onOpenCount: () => void;
  onOpenTransfers: () => void;
  onOpenSuppliers: () => void;
}

export function HomeStockFlowWidget({
  totalFlowValue = '$142.5K',
  totalUnits = 14250,
  activeSkusCount = 120,
  changePct = 3.2,
  changeAmount = '+$12.4k vs prev. 30 days',
  timeframe = 'Last 30 Days',
  onOpenStock,
  onOpenCount,
  onOpenTransfers,
  onOpenSuppliers,
}: HomeStockFlowWidgetProps) {
  // Dual-line SVG Path coordinates representing stock flow & replenishment
  const width = 160;
  const height = 54;

  // Inbound receipts curve
  const line1 = 'M 4,40 C 30,38 50,44 70,30 C 90,16 110,18 130,22 C 145,25 155,12 156,8';
  // Outbound / consumption curve
  const line2 = 'M 4,24 C 25,26 50,14 75,22 C 100,30 120,44 140,36 C 150,32 154,26 156,22';

  return (
    <div className="w-full bg-stocky-bg-widget rounded-3xl border border-stocky-border-subtle p-5 sm:p-6 shadow-xs select-none">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-stocky-bg-global text-stocky-primary border border-stocky-border-subtle flex items-center justify-center shrink-0">
            <TrendingUpIcon size="xs" />
          </span>
          <span className="text-xs sm:text-sm font-semibold text-stocky-text-main">
            Total Inventory Valuation & Capital Flow
          </span>
        </div>

        {/* Dropdown Pill */}
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-stocky-bg-global border border-stocky-border-subtle text-xs font-medium text-stocky-text-main">
          <span>{timeframe}</span>
          <ChevronDownIcon size="xs" className="text-stocky-text-sub" />
        </div>
      </div>

      {/* KPI & Dual-line Chart Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stocky-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-stocky-text-main tracking-tight">
              {totalFlowValue}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-stocky-primary bg-stocky-status-success-bg border border-stocky-status-success-border px-2 py-0.5 rounded-full">
              <span>↗</span>
              <span>+{changePct}%</span>
            </span>
          </div>
          <span className="text-[11px] text-stocky-text-sub mt-1 block font-medium">
            {totalUnits.toLocaleString()} tracked units across {activeSkusCount} SKUs • {changeAmount}
          </span>
        </div>

        {/* Mini Dual-line Graph & Legend */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="w-36 sm:w-44 h-12 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
              {/* Outbound line */}
              <path
                d={line2}
                fill="none"
                stroke="var(--stocky-text-muted)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Inbound line */}
              <path
                d={line1}
                fill="none"
                stroke="var(--stocky-primary)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-stocky-text-sub font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-stocky-primary" />
              Inbound Receipts
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-stocky-text-muted" />
              Consumption
            </span>
          </div>
        </div>
      </div>

      {/* 4 Tactile Quick Utilities Grid */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3 mt-4">
        {/* Tile 1: Products */}
        <button
          type="button"
          onClick={onOpenStock}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-stocky-bg-global hover:bg-stocky-bg-hover border border-stocky-border-subtle transition-colors group cursor-pointer"
        >
          <span className="w-8 h-8 rounded-xl bg-stocky-bg-widget text-stocky-text-main border border-stocky-border-subtle flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <BoxesIcon size="xs" />
          </span>
          <span className="text-[11px] font-medium text-stocky-text-main">
            Products
          </span>
        </button>

        {/* Tile 2: Audits */}
        <button
          type="button"
          onClick={onOpenCount}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-stocky-bg-global hover:bg-stocky-bg-hover border border-stocky-border-subtle transition-colors group cursor-pointer"
        >
          <span className="w-8 h-8 rounded-xl bg-stocky-bg-widget text-stocky-text-main border border-stocky-border-subtle flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <CheckCircleIcon size="xs" />
          </span>
          <span className="text-[11px] font-medium text-stocky-text-main">
            Counts
          </span>
        </button>

        {/* Tile 3: Transfers */}
        <button
          type="button"
          onClick={onOpenTransfers}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-stocky-bg-global hover:bg-stocky-bg-hover border border-stocky-border-subtle transition-colors group cursor-pointer"
        >
          <span className="w-8 h-8 rounded-xl bg-stocky-bg-widget text-stocky-text-main border border-stocky-border-subtle flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <ArrowUpDownIcon size="xs" />
          </span>
          <span className="text-[11px] font-medium text-stocky-text-main">
            Transfers
          </span>
        </button>

        {/* Tile 4: Suppliers */}
        <button
          type="button"
          onClick={onOpenSuppliers}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-stocky-bg-global hover:bg-stocky-bg-hover border border-stocky-border-subtle transition-colors group cursor-pointer"
        >
          <span className="w-8 h-8 rounded-xl bg-stocky-bg-widget text-stocky-text-main border border-stocky-border-subtle flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <TruckIcon size="xs" />
          </span>
          <span className="text-[11px] font-medium text-stocky-text-main">
            Orders
          </span>
        </button>
      </div>
    </div>
  );
}
