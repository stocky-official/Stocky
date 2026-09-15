'use client';

import React from 'react';
import type { Location } from '@stocky/types';
import {
  RotateCcwIcon,
  FileSpreadsheetIcon,
  ChevronDownIcon,
} from '@stocky/icons';

export type TimeframeOption = '7D' | '14D' | '30D' | '90D' | 'YTD';
export type RiskFilterOption = 'all' | 'expiring' | 'low_stock' | 'stagnant';

export interface HomeGlobalSlicersWidgetProps {
  locations?: Location[];
  categories?: string[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  timeframe: TimeframeOption;
  onChangeTimeframe: (tf: TimeframeOption) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedRiskFilter: RiskFilterOption;
  onSelectRiskFilter: (risk: RiskFilterOption) => void;
  onResetFilters: () => void;
  onExportAll?: () => void;
  isExporting?: boolean;
}

/**
 * HomeGlobalSlicersWidget (Power BI Command Center Filter Ribbon)
 * Provides global dashboard-level slicers that filter all visual cards simultaneously:
 * 1. Location / Branch Slicer
 * 2. Timeframe Slicer (7D, 14D, 30D, 90D, YTD)
 * 3. Product Category Slicer
 * 4. Stock Risk / Health Slicer
 * 5. Reset Slicers Action
 * 6. "Export Full Dashboard (.xlsx)" Multi-Sheet Exporter
 */
export function HomeGlobalSlicersWidget({
  locations = [],
  categories = [],
  selectedLocationId,
  onSelectLocation,
  timeframe,
  onChangeTimeframe,
  selectedCategory,
  onSelectCategory,
  selectedRiskFilter,
  onSelectRiskFilter,
  onResetFilters,
  onExportAll,
  isExporting = false,
}: HomeGlobalSlicersWidgetProps) {
  const isFiltered =
    selectedLocationId !== 'all' ||
    timeframe !== '30D' ||
    selectedCategory !== 'all' ||
    selectedRiskFilter !== 'all';

  const timeframes: TimeframeOption[] = ['7D', '14D', '30D', '90D', 'YTD'];

  return (
    <div className="w-full bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col gap-3">
      {/* Top Ribbon Row: Slicers Branding, Active Filter Count, and Global Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-stocky-border-subtle">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-stocky-text-main tracking-tight flex items-center gap-2">
            Dashboard Slicers
            {isFiltered && (
              <span className="px-2 py-0.5 rounded-full bg-stocky-primary/10 text-stocky-primary text-[10px] font-bold">
                Active Filters Applied
              </span>
            )}
          </h3>
          <p className="text-[11px] text-stocky-text-sub">
            Cross-filter all visuals and underlying datasets simultaneously.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset Slicers Button */}
          <button
            type="button"
            data-testid="reset-slicers-btn"
            onClick={onResetFilters}
            disabled={!isFiltered}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isFiltered
                ? 'bg-stocky-bg-global hover:bg-stocky-border-subtle text-stocky-text-main border border-stocky-border-subtle shadow-xs'
                : 'text-stocky-text-muted opacity-40 cursor-not-allowed'
            }`}
            title="Reset all filters to default"
          >
            <RotateCcwIcon size="xs" />
            <span>Reset</span>
          </button>

          {/* Export Full Dashboard Workbook */}
          {onExportAll && (
            <button
              type="button"
              data-testid="export-all-workbook-btn"
              onClick={onExportAll}
              disabled={isExporting}
              className="h-8 px-3 rounded-lg bg-stocky-primary hover:bg-stocky-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Download full multi-sheet Excel report of all visual datasets"
            >
              <FileSpreadsheetIcon size="xs" />
              <span>{isExporting ? 'Generating...' : 'Export Dashboard (.xlsx)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Ribbon Row: Interactive Slicer Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-center">
        {/* 1. Location Slicer */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-stocky-text-sub block">
            Branch Location
          </label>
          <div className="relative">
            <select
              data-testid="location-slicer"
              value={selectedLocationId}
              onChange={(e) => onSelectLocation(e.target.value)}
              className="w-full h-9 pl-3 pr-8 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle hover:border-stocky-border-default text-xs font-medium text-stocky-text-main appearance-none focus:outline-none focus:ring-2 focus:ring-stocky-primary/20 transition-all cursor-pointer"
            >
              <option value="all">All Branches ({locations.length})</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.code ? `(${loc.code})` : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stocky-text-sub">
              <ChevronDownIcon size="xs" />
            </div>
          </div>
        </div>

        {/* 2. Timeframe Slicer (Segmented Buttons) */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-stocky-text-sub block">
            Date Range Window
          </label>
          <div className="h-9 p-0.5 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-between gap-0.5">
            {timeframes.map((tf) => {
              const active = timeframe === tf;
              return (
                <button
                  key={tf}
                  type="button"
                  data-testid={`timeframe-slicer-${tf}`}
                  onClick={() => onChangeTimeframe(tf)}
                  className={`flex-1 h-full rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs'
                      : 'text-stocky-text-sub hover:text-stocky-text-main'
                  }`}
                >
                  {tf}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Category Slicer */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-stocky-text-sub block">
            Product Category
          </label>
          <div className="relative">
            <select
              data-testid="category-slicer"
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="w-full h-9 pl-3 pr-8 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle hover:border-stocky-border-default text-xs font-medium text-stocky-text-main appearance-none focus:outline-none focus:ring-2 focus:ring-stocky-primary/20 transition-all cursor-pointer"
            >
              <option value="all">All Categories ({categories.length || 'Total'})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stocky-text-sub">
              <ChevronDownIcon size="xs" />
            </div>
          </div>
        </div>

        {/* 4. Risk / Stock Health Slicer */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-stocky-text-sub block">
            Inventory Risk & Health
          </label>
          <div className="relative">
            <select
              data-testid="risk-slicer"
              value={selectedRiskFilter}
              onChange={(e) => onSelectRiskFilter(e.target.value as RiskFilterOption)}
              className="w-full h-9 pl-3 pr-8 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle hover:border-stocky-border-default text-xs font-medium text-stocky-text-main appearance-none focus:outline-none focus:ring-2 focus:ring-stocky-primary/20 transition-all cursor-pointer"
            >
              <option value="all">All Stock Statuses</option>
              <option value="expiring">Expiring Soon (&lt;30 days)</option>
              <option value="low_stock">Low Stock / Below Reorder</option>
              <option value="stagnant">Lagging / Stagnant (&gt;30d)</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stocky-text-sub">
              <ChevronDownIcon size="xs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
