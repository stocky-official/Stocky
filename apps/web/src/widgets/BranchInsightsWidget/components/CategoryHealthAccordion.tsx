'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CheckCircleIcon, AlertTriangleIcon, BoxesIcon } from '@stocky/icons';

export interface CategoryStockMetric {
  id: string;
  categoryName: string;
  healthScore: number; // 0 to 100
  skuCount: number;
  totalUnits: number;
  valuation: number;
  coverageDays: number; // e.g. 18 days
  optimalMinDays: number; // e.g. 14 days
  optimalMaxDays: number; // e.g. 28 days
  turnoverRate: number; // e.g. 5.2x
  riskLevel: 'healthy' | 'warning' | 'critical';
}

export interface CategoryHealthAccordionProps {
  categories: CategoryStockMetric[];
  onInspectCategory?: (categoryName: string) => void;
  onAuditCategory?: (categoryName: string) => void;
}

export function CategoryHealthAccordion({
  categories,
  onInspectCategory,
  onAuditCategory,
}: CategoryHealthAccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100/90 shadow-bevel p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100/90 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">
            Category Stock Health & Coverage
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time buffer analysis, segmented range bars, and turnover velocity per segment
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Optimal Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Under/Overstocked</span>
          </div>
        </div>
      </div>

      {/* Accordion Rows */}
      <div className="divide-y divide-slate-100/80">
        {categories.map((cat) => {
          const isExpanded = expandedId === cat.id;

          // Circular progress ring calculation
          const ringRadius = 16;
          const circumference = 2 * Math.PI * ringRadius;
          const strokeDashoffset =
            circumference - (Math.min(cat.healthScore, 100) / 100) * circumference;

          const ringColor =
            cat.healthScore >= 85
              ? '#10B981'
              : cat.healthScore >= 70
              ? '#F59E0B'
              : '#F43F5E';

          // Segmented dotted range bar (28 segments)
          const totalSegments = 28;
          // Scale coverageDays between 0 and 50
          const currentSegmentIndex = Math.min(
            Math.max(Math.round((cat.coverageDays / 50) * totalSegments), 0),
            totalSegments - 1
          );
          const optimalMinIndex = Math.round((cat.optimalMinDays / 50) * totalSegments);
          const optimalMaxIndex = Math.round((cat.optimalMaxDays / 50) * totalSegments);

          return (
            <div key={cat.id} className="py-3.5 first:pt-0 last:pb-0">
              {/* Row Main Clickable Bar */}
              <div
                onClick={() => toggleExpand(cat.id)}
                className="flex items-center justify-between gap-3 cursor-pointer group select-none hover:bg-slate-50/60 p-2 rounded-2xl transition-colors"
              >
                {/* Left: Progress Ring + Category info */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Circular SVG Progress Ring */}
                  <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                      <circle
                        cx="20"
                        cy="20"
                        r={ringRadius}
                        fill="transparent"
                        stroke="#F1F5F9"
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r={ringRadius}
                        fill="transparent"
                        stroke={ringColor}
                        strokeWidth="3.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-semibold text-slate-800">
                      {Math.round(cat.healthScore)}%
                    </span>
                  </div>

                  {/* Title & SKU info */}
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-800 truncate block group-hover:text-stocky-primary transition-colors">
                      {cat.categoryName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {cat.skuCount} SKUs • {cat.totalUnits.toLocaleString()} units
                    </span>
                  </div>
                </div>

                {/* Middle: Segmented Range Bar (Visible on md+ screens) */}
                <div className="hidden lg:flex flex-col items-center gap-1 w-56">
                  <div className="flex items-center justify-between w-full text-[10px] text-slate-400">
                    <span>5d</span>
                    <span className="text-emerald-600 font-medium">
                      Optimal ({cat.optimalMinDays}-{cat.optimalMaxDays}d)
                    </span>
                    <span>45d+</span>
                  </div>
                  {/* Segmented ticks */}
                  <div className="flex items-center justify-between w-full gap-[3px]">
                    {Array.from({ length: totalSegments }).map((_, i) => {
                      const isOptimalZone = i >= optimalMinIndex && i <= optimalMaxIndex;
                      const isCurrentMarker = i === currentSegmentIndex;

                      let tickBg = 'bg-slate-200';
                      if (isCurrentMarker) {
                        tickBg = 'bg-slate-900 ring-2 ring-slate-900/30 scale-125';
                      } else if (isOptimalZone) {
                        tickBg = 'bg-emerald-300';
                      }

                      return (
                        <div
                          key={i}
                          className={`w-1 h-3 rounded-full transition-all duration-300 ${tickBg}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Right: Coverage Days & Chevron */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-900 block">
                      {cat.coverageDays}d
                    </span>
                    <span className="text-[10px] text-slate-400 block">Coverage</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-7 h-7 rounded-full bg-slate-100/70 flex items-center justify-center text-slate-500 group-hover:bg-slate-200/70 transition-colors"
                  >
                    <ChevronDownIcon size="xs" />
                  </motion.div>
                </div>
              </div>

              {/* Expandable Accordion Body */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 px-4 py-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Metric pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                            Valuation
                          </span>
                          <span className="text-sm font-semibold text-slate-800">
                            ${cat.valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                            Turnover Velocity
                          </span>
                          <span className="text-sm font-semibold text-slate-800">
                            {cat.turnoverRate}x / yr
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                            Stockout Risk
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              cat.riskLevel === 'healthy'
                                ? 'text-emerald-600'
                                : cat.riskLevel === 'warning'
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {cat.riskLevel === 'healthy'
                              ? 'Low (0.3%)'
                              : cat.riskLevel === 'warning'
                              ? 'Moderate (3.2%)'
                              : 'High (8.7%)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                            Reorder Status
                          </span>
                          <span className="text-sm font-semibold text-slate-800">
                            {cat.coverageDays < cat.optimalMinDays
                              ? 'Reorder Recommended'
                              : 'Adequate Buffer'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {onAuditCategory && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAuditCategory(cat.categoryName);
                            }}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <BoxesIcon size="xs" />
                            <span>Fast Audit</span>
                          </button>
                        )}
                        {onInspectCategory && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectCategory(cat.categoryName);
                            }}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                          >
                            <span>Deep Analytics</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
