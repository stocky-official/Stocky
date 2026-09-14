'use client';

import React from 'react';
import { BoxesIcon, DollarSignIcon } from '@stocky/icons';

export interface HomeAssetCardsWidgetProps {
  totalUnits?: number;
  totalValuation?: number;
  growthPct?: number;
  onOpenStock?: () => void;
}

export function HomeAssetCardsWidget({
  totalUnits = 14250,
  totalValuation = 142500,
  growthPct = 7.4,
  onOpenStock,
}: HomeAssetCardsWidgetProps) {
  const formattedValuation =
    totalValuation >= 1_000_000
      ? `$${(totalValuation / 1_000_000).toFixed(2)}M`
      : totalValuation >= 1_000
      ? `$${(totalValuation / 1_000).toFixed(1)}K`
      : `$${totalValuation.toLocaleString()}`;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 2 Call Cards in a 2-Column Responsive Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
        {/* Call Card 1: Total Tracked Units */}
        <div
          onClick={onOpenStock}
          role={onOpenStock ? 'button' : undefined}
          tabIndex={onOpenStock ? 0 : undefined}
          className={`bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all ${
            onOpenStock ? 'hover:border-stocky-border-default hover:shadow-sm cursor-pointer' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <BoxesIcon size="xs" />
            </span>
            <span className="text-xl sm:text-2xl font-bold text-stocky-text-main tracking-tight truncate">
              {totalUnits.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-xs font-semibold text-stocky-text-main">
              Total Tracked Units
            </span>
            <span className="text-[11px] text-stocky-text-sub mt-0.5">
              Across active inventory lots
            </span>
          </div>
        </div>

        {/* Call Card 2: Total Asset Holding */}
        <div
          onClick={onOpenStock}
          role={onOpenStock ? 'button' : undefined}
          tabIndex={onOpenStock ? 0 : undefined}
          className={`bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all ${
            onOpenStock ? 'hover:border-stocky-border-default hover:shadow-sm cursor-pointer' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-stocky-accent/20 text-stocky-text-main border border-stocky-accent/40 flex items-center justify-center shrink-0">
              <DollarSignIcon size="xs" />
            </span>
            <span className="text-xl sm:text-2xl font-bold text-stocky-text-main tracking-tight truncate">
              {formattedValuation}
            </span>
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-xs font-semibold text-stocky-text-main">
              Total Asset Holding
            </span>
            <span className="text-[11px] text-stocky-text-sub mt-0.5">
              Valuation at recorded unit cost
            </span>
          </div>
        </div>
      </div>

      {/* Momentum Indicator Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 self-start rounded-full bg-stocky-bg-widget border border-stocky-border-subtle shadow-2xs text-xs text-stocky-text-sub font-medium">
        <span className="text-emerald-600 font-bold">↗</span>
        <span>Stock turnover efficiency up <strong className="text-stocky-text-main font-semibold">{growthPct}%</strong> vs last month</span>
      </div>
    </div>
  );
}
