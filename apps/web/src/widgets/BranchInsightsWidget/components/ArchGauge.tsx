'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface ArchGaugeProps {
  score?: number; // 0 to 100
  title?: string;
  subtitle?: string;
  reconciledAccuracy?: number;
}

export function ArchGauge({
  score = 94.2,
  title = 'Inventory Health Score',
  subtitle = 'Optimal stock coverage & balance',
}: ArchGaugeProps) {
  // Semi-circle gauge geometry
  // Arc angle from 150 deg to 390 deg (240 degree sweep)
  const radius = 95;
  const strokeWidth = 14;
  const cx = 135;
  const cy = 125;

  // Arc path generator
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const startAngle = -110;
  const endAngle = 110;
  const totalSweep = endAngle - startAngle; // 220 degrees
  const currentSweep = startAngle + (Math.min(Math.max(score, 0), 100) / 100) * totalSweep;

  const bgArcPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const activeArcPath = describeArc(cx, cy, radius, startAngle, currentSweep);

  // Generate tick marks around the perimeter
  const ticks = [];
  const tickCount = 23;
  for (let i = 0; i <= tickCount; i++) {
    const tickAngle = startAngle + (i / tickCount) * totalSweep;
    const innerP = polarToCartesian(cx, cy, radius + 14, tickAngle);
    const outerP = polarToCartesian(cx, cy, radius + 19, tickAngle);
    const isActiveTick = tickAngle <= currentSweep;
    ticks.push(
      <line
        key={i}
        x1={innerP.x}
        y1={innerP.y}
        x2={outerP.x}
        y2={outerP.y}
        stroke={isActiveTick ? 'rgba(16, 185, 129, 0.4)' : '#E2E8F0'}
        strokeWidth={i % 5 === 0 ? '2' : '1'}
        strokeLinecap="round"
      />
    );
  }

  // Health status determination
  const statusColor =
    score >= 85 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-rose-600';
  const statusBg =
    score >= 85 ? 'bg-emerald-50' : score >= 70 ? 'bg-amber-50' : 'bg-rose-50';
  const statusDot =
    score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500';
  const statusLabel =
    score >= 85 ? 'Optimal Health' : score >= 70 ? 'Moderate Alert' : 'Critical Depletion';

  return (
    <div className="bg-white rounded-3xl border border-slate-100/90 shadow-bevel p-6 flex flex-col justify-between relative overflow-hidden">
      {/* Background soft ambient glow */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Top Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">
            {title}
          </span>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-transparent ${statusBg} ${statusColor}`}
        >
          <span className={`w-2 h-2 rounded-full ${statusDot} animate-pulse`} />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Center Arch Gauge Graphic */}
      <div className="flex flex-col items-center justify-center my-2 relative z-10">
        <svg
          viewBox="0 0 270 175"
          className="w-full max-w-[280px] h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="bevelGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0057FF" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10B981" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Radiating Ticks */}
          <g>{ticks}</g>

          {/* Background Track */}
          <path
            d={bgArcPath}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Gradient Arc */}
          <motion.path
            d={activeArcPath}
            fill="none"
            stroke="url(#bevelGaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Endpoint Indicator Dot */}
          {(() => {
            const endPt = polarToCartesian(cx, cy, radius, currentSweep);
            return (
              <circle
                cx={endPt.x}
                cy={endPt.y}
                r={6}
                fill="#FFFFFF"
                stroke="#10B981"
                strokeWidth={3}
                className="drop-shadow-sm"
              />
            );
          })()}
        </svg>

        {/* Big Score Typography inside Arch */}
        <div className="absolute top-[72px] inset-x-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {score.toFixed(1)}
            </span>
            <span className="text-xl font-medium text-slate-400 ml-1">%</span>
          </div>
          <span className="text-xs font-medium text-slate-500 mt-1">
            Turnover & Fill Target
          </span>
        </div>
      </div>

      {/* Target Baseline Threshold Scale */}
      <div className="z-10 pt-2 border-t border-slate-100/90">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400/80" />
            <span>Critical &lt;70%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400/80" />
            <span>Warning 70-85%</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Healthy &gt;85%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
