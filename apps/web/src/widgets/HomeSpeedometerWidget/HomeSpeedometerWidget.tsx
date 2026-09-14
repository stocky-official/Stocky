'use client';

import React from 'react';
import {
  BoxesIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  PlusIcon,
} from '@stocky/icons';

export interface HomeSpeedometerWidgetProps {
  healthPct?: number;
  activeProductsCount?: number;
  auditAccuracyPct?: number;
  topProductName?: string;
  topProductUnits?: string;
  onOpenCount?: () => void;
  onOpenStock?: () => void;
}

export function HomeSpeedometerWidget({
  healthPct = 88.5,
  activeProductsCount = 120,
  auditAccuracyPct = 98,
  topProductName = 'Al-Marai Fresh Milk 1L',
  topProductUnits = '2,102 Orders • $29,200',
  onOpenCount,
  onOpenStock,
}: HomeSpeedometerWidgetProps) {
  // Speedometer Geometry
  const size = 260;
  const strokeWidth = 14;
  const radius = 95;
  const center = size / 2;

  // 220 degree arc calculation
  // Start angle at 160 deg, end angle at 380 deg (or 20 deg)
  const totalAngle = 220;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;
  const activeLength = (healthPct / 100) * arcLength;

  return (
    <div className="stocky-home-speedometer p-5 sm:p-7 select-none">
      {/* Top Header Pill & Timeframe */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 text-xs font-medium text-white/90">
          <span className="text-emerald-400 font-semibold">↗</span>
          <span>Top Velocity SKU</span>
        </div>

        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-medium text-white/80">
          <span>Last 30 Days</span>
          <ChevronDownIcon size="xs" className="text-white/60" />
        </div>
      </div>

      {/* Display Headline */}
      <h3 className="text-xl sm:text-2xl text-white font-normal tracking-tight leading-snug mb-2">
        Operational Health &amp;
        <br />
        <span className="text-white/95 font-medium">Batch Freshness</span>
      </h3>

      {/* Metadata Badges */}
      <div className="flex items-center gap-3 text-xs text-white/70 mb-4">
        <div className="flex items-center gap-1.5">
          <BoxesIcon size="xs" className="text-white/60" />
          <span>{activeProductsCount} Active SKUs</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <CheckCircleIcon size="xs" className="text-emerald-400" />
          <span>{auditAccuracyPct}% Count Accuracy</span>
        </div>
      </div>

      {/* Top Product Spotlight Pill */}
      <button
        type="button"
        onClick={onOpenStock}
        className="w-full p-2.5 rounded-2xl bg-white/[0.08] border border-white/12 flex items-center justify-between gap-3 mb-5 hover:bg-white/[0.12] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 text-sm font-semibold shrink-0 border border-white/10">
            <BoxesIcon size="sm" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{topProductName}</p>
            <p className="text-[11px] text-white/60 truncate">{topProductUnits}</p>
          </div>
        </div>

        <span className="text-xs font-semibold text-emerald-400 shrink-0">
          Peak Flow ↗
        </span>
      </button>

      {/* Speedometer Radial Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <div className="relative w-[260px] h-[170px] overflow-hidden flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible absolute top-0 rotate-[160deg] origin-center"
          >
            <defs>
              <linearGradient id="neonSpeedo" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--stocky-accent)" />
                <stop offset="60%" stopColor="var(--stocky-primary)" />
                <stop offset="100%" stopColor="var(--stocky-primary)" />
              </linearGradient>

              {/* Arc filter glow */}
              <filter id="speedoGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="var(--stocky-primary)" floodOpacity="0.65" />
              </filter>
            </defs>

            {/* Background Track with Dotted Ticks */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />

            {/* Inner Tick Ring */}
            <circle
              cx={center}
              cy={center}
              r={radius - 16}
              fill="none"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="2"
              strokeDasharray="2 8"
            />

            {/* Active Glowing Neon Arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="url(#neonSpeedo)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${activeLength} ${circumference}`}
              strokeLinecap="round"
              filter="url(#speedoGlow)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Gauge Reading */}
          <div className="absolute top-14 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              {healthPct}%
            </span>
            <span className="text-xs font-semibold text-emerald-400 mt-0.5 tracking-wide uppercase">
              Overall Healthy
            </span>
          </div>
        </div>

        {/* Central Bottom Action Button (+) */}
        {onOpenCount && (
          <button
            type="button"
            onClick={onOpenCount}
            title="Start Physical Count Audit"
            className="mt-2 w-12 h-12 rounded-full bg-stocky-accent hover:bg-stocky-accent-hover text-stocky-text-main flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer border border-stocky-accent"
          >
            <PlusIcon size="sm" />
          </button>
        )}
      </div>
    </div>
  );
}
