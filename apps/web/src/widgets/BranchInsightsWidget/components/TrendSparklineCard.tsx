'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface TrendSparklineCardProps {
  label: string;
  value: string;
  changeText: string;
  isPositive: boolean; // positive impact (e.g. turnover up is positive, stockout down is positive)
  dataPoints: number[];
  color?: 'emerald' | 'rose' | 'amber' | 'blue';
  subtitle?: string;
  onClick?: () => void;
}

export function TrendSparklineCard({
  label,
  value,
  changeText,
  isPositive,
  dataPoints,
  color = 'emerald',
  subtitle,
  onClick,
}: TrendSparklineCardProps) {
  // Generate smooth SVG curve path from dataPoints
  const minVal = Math.min(...dataPoints);
  const maxVal = Math.max(...dataPoints);
  const range = maxVal - minVal || 1;

  const width = 120;
  const height = 40;
  const padding = 4;

  const points = dataPoints.map((val, idx) => {
    const x = padding + (idx / (dataPoints.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    return [x, y];
  });

  // Catmull-Rom or cubic bezier smooth curve generator
  const smoothPath = points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point[0]},${point[1]}`;
    const prev = a[i - 1];
    const cpX = (prev[0] + point[0]) / 2;
    return `${acc} C ${cpX},${prev[1]} ${cpX},${point[1]} ${point[0]},${point[1]}`;
  }, '');

  const areaPath = `${smoothPath} L ${points[points.length - 1][0]},${height} L ${points[0][0]},${height} Z`;

  // Color mapping
  const strokeColor =
    color === 'emerald'
      ? '#10B981'
      : color === 'rose'
      ? '#F43F5E'
      : color === 'amber'
      ? '#F59E0B'
      : '#0057FF';

  const badgeBg =
    isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-rose-50 text-rose-700 border-rose-200/60';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl border border-slate-100/90 shadow-bevel p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-bevel-hover hover:border-slate-200/80 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-normal text-slate-500">{label}</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              {value}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badgeBg}`}
            >
              {changeText}
            </span>
          </div>
        </div>

        {/* Smooth SVG Sparkline */}
        <div className="w-[110px] h-[38px] shrink-0 overflow-visible">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient Fill under curve */}
            <path d={areaPath} fill={`url(#grad-${label.replace(/\s+/g, '')})`} />

            {/* Main Sparkline Stroke */}
            <motion.path
              d={smoothPath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* Endpoint Dot */}
            <circle
              cx={points[points.length - 1][0]}
              cy={points[points.length - 1][1]}
              r="3.5"
              fill="#FFFFFF"
              stroke={strokeColor}
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 pt-2.5 border-t border-slate-100/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">{subtitle}</span>
          {onClick && (
            <span className="text-[11px] font-medium text-stocky-primary hover:underline">
              Analyze →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
