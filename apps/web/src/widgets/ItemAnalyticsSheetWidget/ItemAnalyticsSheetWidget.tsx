'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon, CheckIcon, TrendingUpIcon, CalendarIcon, BoxesIcon } from '@stocky/icons';
import { SideDrawer } from '@/components/ui/SideDrawer';

export interface ItemAnalyticsSheetWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  itemName?: string;
  categoryName?: string;
  currentStock?: number;
  unitPrice?: number;
}

export function ItemAnalyticsSheetWidget({
  isOpen,
  onClose,
  itemName = 'Whole Milk 1L Pasteurized',
  categoryName = 'Dairy & Fresh',
  currentStock = 340,
  unitPrice = 2.45,
}: ItemAnalyticsSheetWidgetProps) {
  const [timeframe, setTimeframe] = useState<'30D' | '3M' | '6M' | '1Y'>('30D');
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; value: number } | null>(null);

  // Timeframe datasets
  const datasets = {
    '30D': [
      { date: 'Day 1', value: 120 },
      { date: 'Day 5', value: 135 },
      { date: 'Day 10', value: 128 },
      { date: 'Day 15', value: 155 },
      { date: 'Day 20', value: 142 },
      { date: 'Day 25', value: 168 },
      { date: 'Day 30', value: 150 },
    ],
    '3M': [
      { date: 'Month 1 W1', value: 115 },
      { date: 'Month 1 W3', value: 130 },
      { date: 'Month 2 W1', value: 148 },
      { date: 'Month 2 W3', value: 160 },
      { date: 'Month 3 W1', value: 140 },
      { date: 'Month 3 W3', value: 172 },
    ],
    '6M': [
      { date: 'Jan', value: 110 },
      { date: 'Feb', value: 125 },
      { date: 'Mar', value: 145 },
      { date: 'Apr', value: 160 },
      { date: 'May', value: 152 },
      { date: 'Jun', value: 178 },
    ],
    '1Y': [
      { date: 'Q1', value: 112 },
      { date: 'Q2', value: 138 },
      { date: 'Q3', value: 155 },
      { date: 'Q4', value: 182 },
    ],
  };

  const activeData = datasets[timeframe];
  const values = activeData.map((d) => d.value);
  const minVal = Math.min(...values) * 0.85;
  const maxVal = Math.max(...values) * 1.15;
  const range = maxVal - minVal || 1;
  const avgValue = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  // SVG Chart Geometry
  const width = 600;
  const height = 180;
  const paddingX = 24;
  const paddingY = 20;

  const points = activeData.map((d, i) => {
    const x = paddingX + (i / (activeData.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.value - minVal) / range) * (height - paddingY * 2);
    return { ...d, x, y };
  });

  const smoothLinePath = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX},${prev.y} ${cpX},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaPath = `${smoothLinePath} L ${points[points.length - 1].x},${height - 4} L ${points[0].x},${height - 4} Z`;
  const avgY = height - paddingY - ((avgValue - minVal) / range) * (height - paddingY * 2);

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={`${itemName} analytics`}
      panelClassName="space-y-6 overflow-y-auto p-6 pb-10"
    >

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
                  {categoryName} • Velocity Analytics
                </span>
                <h3 className="text-xl font-medium text-slate-900 tracking-tight mt-0.5">
                  {itemName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Current Stock: <span className="font-medium text-slate-700">{currentStock} units</span> (${(currentStock * unitPrice).toFixed(2)})
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <XIcon size="xs" />
              </button>
            </div>

            {/* Timeframe Switcher Tabs */}
            <div className="flex items-center justify-between bg-slate-100/80 p-1 rounded-2xl">
              {(['30D', '3M', '6M', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-white text-slate-900 shadow-sm font-medium'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Velocity Trend Chart */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-4 relative overflow-hidden">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-xs text-slate-400 block">Daily Consumption Velocity</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-medium text-slate-900">
                      {hoveredPoint ? `${hoveredPoint.value} units` : `${avgValue} units/day`}
                    </span>
                    <span className="text-xs text-slate-400">
                      {hoveredPoint ? hoveredPoint.date : `Avg. ${timeframe}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                  <TrendingUpIcon size="xs" />
                  <span>+8.4% demand</span>
                </div>
              </div>

              {/* Chart SVG */}
              <div className="w-full h-44 relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Average Dotted Reference Line */}
                  <line
                    x1={paddingX}
                    y1={avgY}
                    x2={width - paddingX}
                    y2={avgY}
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={width - paddingX - 4}
                    y={avgY - 6}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-medium select-none"
                  >
                    Avg. {avgValue} units/day
                  </text>

                  {/* Gradient Fill under curve */}
                  <path d={areaPath} fill="url(#chartGradient)" />

                  {/* Smooth Main Curve */}
                  <motion.path
                    key={timeframe}
                    d={smoothLinePath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />

                  {/* Data Points */}
                  {points.map((pt, idx) => (
                    <g
                      key={idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint({ date: pt.date, value: pt.value })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredPoint?.date === pt.date ? 6 : 4}
                        fill="#FFFFFF"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        className="transition-all"
                      />
                    </g>
                  ))}
                </svg>
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-3">
                <span>{activeData[0].date}</span>
                <span>{activeData[Math.floor(activeData.length / 2)].date}</span>
                <span>{activeData[activeData.length - 1].date}</span>
              </div>
            </div>

            {/* 3 Biomarker Health Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Reorder Trigger */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5">
                <span className="text-[11px] text-slate-400 block">Reorder Buffer Target</span>
                <span className="text-base font-medium text-slate-900 mt-0.5 block">
                  180 units
                </span>
                <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">
                  Adequate (340 in stock)
                </span>
              </div>

              {/* Card 2: Restock Confidence */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Restock Confidence</span>
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckIcon size="xs" />
                  </div>
                </div>
                <span className="text-base font-medium text-slate-900 mt-0.5 block">
                  98.4%
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  High vendor reliability
                </span>
              </div>

              {/* Card 3: Lead Time */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5">
                <span className="text-[11px] text-slate-400 block">Lead Time Window</span>
                <span className="text-base font-medium text-slate-900 mt-0.5 block">
                  2.4 Days
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Dairy Hub Direct Fleet
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl bg-stocky-primary hover:bg-stocky-primary-hover text-white font-medium text-xs shadow-md transition-colors cursor-pointer text-center"
              >
                Create Purchase Order for SKU
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
    </SideDrawer>
  );
}
