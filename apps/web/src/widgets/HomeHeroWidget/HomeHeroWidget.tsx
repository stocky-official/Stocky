'use client';

import React from 'react';
import { BoxesIcon, DollarSignIcon } from '@stocky/icons';

export interface HomeHeroWidgetProps {
  userName?: string | null;
  locationName?: string;
  totalUnits?: number;
  totalValuation?: number;
  growthPct?: number;
}

export function HomeHeroWidget({
  userName,
  locationName = 'All Branches',
  totalUnits = 14250,
  totalValuation = 142500,
  growthPct = 7.4,
}: HomeHeroWidgetProps) {
  const firstName = userName?.trim().split(/\s+/)[0] || 'Abdelrahman';

  const formattedValuation =
    totalValuation >= 1_000_000
      ? `$${(totalValuation / 1_000_000).toFixed(2)}M`
      : totalValuation >= 1_000
      ? `$${(totalValuation / 1_000).toFixed(1)}K`
      : `$${totalValuation.toLocaleString()}`;

  return (
    <div className="stocky-home-hero p-5 sm:p-7 select-none">
      {/* Background Soft Glow Accents */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-stocky-accent/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-stocky-primary/25 rounded-full blur-3xl pointer-events-none" />

      {/* Main Editorial Personalized Headline */}
      <div className="relative z-10">
        <h2 className="text-2xl sm:text-3xl text-white font-normal tracking-tight leading-snug">
          Hello {firstName},
          <br />
          <span className="text-white/80 text-sm sm:text-base font-normal">
            Here is your live inventory status for <span className="text-white font-medium">{locationName}</span>.
          </span>
        </h2>
      </div>

      {/* Frosted Glass Stat Pills */}
      <div className="relative z-10 grid grid-cols-2 gap-3 mt-6">
        {/* Pill 1: Total Units */}
        <div className="stocky-home-hero__stat-pill p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <BoxesIcon size="xs" />
            </span>
            <span className="text-lg sm:text-xl font-semibold text-white tracking-tight truncate">
              {totalUnits.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-white/70 mt-2 font-medium">
            Total Tracked Units
          </span>
        </div>

        {/* Pill 2: Total Asset Value */}
        <div className="stocky-home-hero__stat-pill p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-stocky-accent/20 text-stocky-accent flex items-center justify-center shrink-0 border border-stocky-accent/30">
              <DollarSignIcon size="xs" />
            </span>
            <span className="text-lg sm:text-xl font-semibold text-white tracking-tight truncate">
              {formattedValuation}
            </span>
          </div>
          <span className="text-[11px] text-white/70 mt-2 font-medium">
            Total Asset Holding
          </span>
        </div>
      </div>

      {/* Bottom Momentum Pill */}
      <div className="relative z-10 mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/10 backdrop-blur-md text-xs text-white/90 font-medium">
        <span className="text-emerald-400 font-semibold">↗</span>
        <span>Stock turnover efficiency up {growthPct}% vs last month</span>
      </div>
    </div>
  );
}
