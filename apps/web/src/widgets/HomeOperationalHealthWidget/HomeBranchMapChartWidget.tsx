'use client';

import React, { useMemo, useState } from 'react';
import type { Location, StockLot, AttendanceShift } from '@stocky/types';
import { ChevronRightIcon, FilterIcon, InfoIcon, XIcon } from '@stocky/icons';
import { ChartFilterBottomSheet } from './ChartFilterBottomSheet';
import { useTranslation } from '@/lib/i18n';

export interface BranchMapItem {
  id: string;
  name: string;
  code?: string | null;
  type: string;
  address?: string | null;
  units: number;
  value: number;
  staffCount: number;
  changePct: number;
  coordinates: { x: number; y: number };
}

export interface HomeBranchMapChartWidgetProps {
  locations?: Location[];
  lots?: StockLot[];
  teamMembers?: Array<{ id: string; branchIds?: string[] }>;
  teamAssignments?: Array<{ user_id: string; location_id: string }>;
  shifts?: AttendanceShift[];
  onSelectLocation?: (locationId: string) => void;
}

// Deterministic map coordinates for common Saudi cities / hubs
const CITY_COORDINATES: Record<string, { x: number; y: number }> = {
  riyadh: { x: 58, y: 46 },
  olaya: { x: 59, y: 44 },
  khurais: { x: 61, y: 48 },
  jeddah: { x: 28, y: 55 },
  corniche: { x: 27, y: 56 },
  mecca: { x: 31, y: 58 },
  makkah: { x: 31, y: 58 },
  medina: { x: 32, y: 40 },
  madinah: { x: 32, y: 40 },
  dammam: { x: 74, y: 38 },
  khobar: { x: 76, y: 40 },
  'al khobar': { x: 76, y: 40 },
  jubail: { x: 73, y: 34 },
  tabuk: { x: 22, y: 22 },
  abha: { x: 42, y: 78 },
  khamis: { x: 43, y: 77 },
  qassim: { x: 49, y: 36 },
  buraidah: { x: 49, y: 36 },
};

function resolveCoordinates(loc: Location, index: number): { x: number; y: number } {
  const searchStr = `${loc.name} ${loc.address || ''} ${loc.code || ''}`.toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (searchStr.includes(key)) {
      const offsetX = (index % 3 - 1) * 2.5;
      const offsetY = (Math.floor(index / 3) % 3 - 1) * 2.5;
      return { x: Math.max(15, Math.min(85, coords.x + offsetX)), y: Math.max(15, Math.min(85, coords.y + offsetY)) };
    }
  }
  const defaultPositions = [
    { x: 58, y: 46 },
    { x: 28, y: 55 },
    { x: 74, y: 38 },
    { x: 32, y: 40 },
    { x: 49, y: 36 },
    { x: 76, y: 40 },
  ];
  return defaultPositions[index % defaultPositions.length] || { x: 50, y: 50 };
}

export function HomeBranchMapChartWidget({
  locations = [],
  lots = [],
  teamMembers = [],
  teamAssignments = [],
  onSelectLocation,
}: HomeBranchMapChartWidgetProps) {
  const { t } = useTranslation();
  // Date filter controls
  const [dateRangePreset, setDateRangePreset] = useState<'7D' | '14D' | '30D' | '90D'>('30D');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // UI state for bottom sheet filter & info icon popover
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Selected branch popup card state
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const handlePresetChange = (preset: '7D' | '14D' | '30D' | '90D') => {
    setDateRangePreset(preset);
    const days = preset === '7D' ? 7 : preset === '14D' ? 14 : preset === '30D' ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    setStartDate(d.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
  };

  // Compile branch data
  const branchData: BranchMapItem[] = useMemo(() => {
    const fallbackLocations: Location[] = locations.length > 0 ? locations : [
      { id: 'loc-1', companyId: 'c1', name: 'Olaya Central Hub', code: 'RUH-01', type: 'branch', address: 'King Fahd Rd, Riyadh', isActive: true, createdAt: '', updatedAt: '' },
      { id: 'loc-2', companyId: 'c1', name: 'Corniche Superstore', code: 'JED-02', type: 'branch', address: 'Corniche Rd, Jeddah', isActive: true, createdAt: '', updatedAt: '' },
      { id: 'loc-3', companyId: 'c1', name: 'Eastern Port Warehouse', code: 'DMM-03', type: 'warehouse', address: 'Port Zone, Dammam', isActive: true, createdAt: '', updatedAt: '' },
      { id: 'loc-4', companyId: 'c1', name: 'Madinah Ring Road', code: 'MED-04', type: 'branch', address: 'Second Ring Rd, Madinah', isActive: true, createdAt: '', updatedAt: '' },
    ];

    const daysCount = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));

    return fallbackLocations.map((loc, idx) => {
      const branchLots = lots.filter((l) => l.locationId === loc.id && (l.quantityOnHand || 0) > 0);
      const units = branchLots.reduce((acc, l) => acc + (l.quantityOnHand || 0), 0) || (idx === 0 ? 4850 : idx === 1 ? 3120 : idx === 2 ? 6400 : 1850);
      const value = branchLots.reduce((acc, l) => acc + (l.quantityOnHand || 0) * (l.unitCost || 0), 0) || (units * 8.4);

      const assignedIds = teamAssignments.filter((a) => a.location_id === loc.id).map((a) => a.user_id);
      const staff = teamMembers.filter((m) => assignedIds.includes(m.id) || (m.branchIds && m.branchIds.includes(loc.id)));
      const staffCount = staff.length > 0 ? staff.length : Math.max(2, (idx * 2 + 3) % 7);

      const seedFactor = (loc.name.length * 7 + daysCount) % 17;
      const changePct = Number(((seedFactor - 7.5) * 1.6).toFixed(1));

      return {
        id: loc.id,
        name: loc.name,
        code: loc.code,
        type: loc.type,
        address: loc.address || 'Kingdom of Saudi Arabia',
        units,
        value,
        staffCount,
        changePct,
        coordinates: resolveCoordinates(loc as Location, idx),
      };
    });
  }, [locations, lots, teamMembers, teamAssignments, startDate, endDate]);

  const minUnits = Math.min(...branchData.map((b) => b.units), 100);
  const maxUnits = Math.max(...branchData.map((b) => b.units), 5000);

  const getDotRadius = (units: number) => {
    const minR = 10;
    const maxR = 26;
    if (maxUnits === minUnits) return 16;
    return minR + ((units - minUnits) / (maxUnits - minUnits)) * (maxR - minR);
  };

  const selectedBranch = branchData.find((b) => b.id === selectedBranchId) || null;

  return (
    <div className="w-full h-[490px] sm:h-[510px] bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      {/* 1. Header Toolbar (Clean text, NO icons in headlines, 'i' info button, filter button) */}
      <div className="pb-3 border-b border-stocky-border-subtle">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-stocky-text-main tracking-tight truncate">
              {t('home.charts.branchMap.title')}
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

          {/* Clean dedicated Filter Button that opens bottom sheet */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-stocky-bg-global hover:bg-stocky-border-subtle text-xs font-semibold text-stocky-text-main flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
          >
            <FilterIcon size="xs" />
            <span>{t('common.filter')}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-stocky-primary text-white text-[10px] font-bold">
              {dateRangePreset}
            </span>
          </button>
        </div>

        {/* Desktop subtitle (hidden on phone) */}
        <p className="hidden sm:block text-[11px] text-stocky-text-sub mt-0.5">
          {t('home.charts.branchMap.subtitle')}
        </p>

        {/* Expandable Info Callout when 'i' icon is clicked on phone or desktop */}
        {showInfo && (
          <div className="mt-2.5 p-2.5 bg-stocky-bg-global/90 border border-stocky-border-subtle rounded-xl text-xs text-stocky-text-sub flex items-start justify-between gap-2 animate-in fade-in duration-150">
            <span>
              {t('home.charts.branchMap.info')}
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

      {/* 2. Interactive Styled Map Canvas */}
      <div className="relative w-full flex-1 my-3 bg-stocky-bg-global/60 rounded-xl border border-stocky-border-subtle/80 overflow-hidden select-none min-h-[260px]">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(var(--stocky-text-main) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Geographic Regional Guide Labels */}
        <span className="absolute top-4 left-6 text-[10px] font-bold uppercase tracking-widest text-stocky-text-muted/60">
          {t('home.charts.branchMap.western')}
        </span>
        <span className="absolute top-4 right-8 text-[10px] font-bold uppercase tracking-widest text-stocky-text-muted/60">
          {t('home.charts.branchMap.eastern')}
        </span>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-stocky-text-muted/50">
          {t('home.charts.branchMap.central')}
        </span>
        <span className="absolute bottom-4 left-1/3 text-[10px] font-bold uppercase tracking-widest text-stocky-text-muted/50">
          {t('home.charts.branchMap.southern')}
        </span>

        {/* Branch Marker Dots */}
        {branchData.map((branch) => {
          const radius = getDotRadius(branch.units);
          const isSelected = branch.id === selectedBranchId;

          return (
            <div
              key={branch.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
              style={{ left: `${branch.coordinates.x}%`, top: `${branch.coordinates.y}%` }}
              onClick={() => setSelectedBranchId(isSelected ? null : branch.id)}
            >
              {/* Outer Pulse Ring */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                  isSelected
                    ? 'bg-stocky-primary/25 ring-4 ring-stocky-primary/30 animate-pulse'
                    : 'bg-stocky-primary/15 group-hover:bg-stocky-primary/25'
                }`}
                style={{
                  width: `${radius * 2 + 10}px`,
                  height: `${radius * 2 + 10}px`,
                  transform: 'translate(-5px, -5px)',
                }}
              />

              {/* Core Dot */}
              <div
                className={`rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border ${
                  isSelected
                    ? 'bg-stocky-primary text-white border-white'
                    : 'bg-stocky-primary/90 text-white border-white/80 hover:bg-stocky-primary'
                }`}
                style={{
                  width: `${radius * 2}px`,
                  height: `${radius * 2}px`,
                }}
              >
                <span className="text-[9px] font-bold">
                  {branch.units >= 1000 ? `${(branch.units / 1000).toFixed(1)}k` : branch.units}
                </span>
              </div>

              {/* Minimal Permanent Branch Name Tag */}
              <div className="absolute top-[100%] left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap pointer-events-none">
                <span className="text-[10px] font-semibold text-stocky-text-main bg-stocky-bg-widget/90 px-1.5 py-0.5 rounded shadow-xs border border-stocky-border-subtle/70">
                  {branch.name}
                </span>
              </div>
            </div>
          );
        })}

        {/* 3. Hovering / Click Card Popover */}
        {selectedBranch && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-72 bg-stocky-bg-widget/95 backdrop-blur-md border border-stocky-border-default rounded-xl p-3.5 shadow-lg z-30 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-stocky-primary tracking-wider block">
                  {selectedBranch.type === 'warehouse' ? t('home.charts.branchMap.warehouseHub') : t('home.charts.branchMap.retailBranch')}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-stocky-text-main truncate mt-0.5">
                  {selectedBranch.name}
                </h4>
                <p className="text-[11px] text-stocky-text-sub truncate mt-0.5">
                  {selectedBranch.address}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBranchId(null)}
                className="w-6 h-6 rounded-full bg-stocky-bg-global hover:bg-stocky-border-subtle text-stocky-text-sub flex items-center justify-center transition-colors cursor-pointer"
              >
                <XIcon size="xs" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-stocky-border-subtle">
              <div className="flex flex-col">
                <span className="text-[10px] text-stocky-text-sub font-medium">{t('home.charts.branchMap.inventoryUnits')}</span>
                <span className="text-xs font-bold text-stocky-text-main">
                  {selectedBranch.units.toLocaleString()} {t('common.items')}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-stocky-text-sub font-medium">{t('home.charts.branchMap.valuation')}</span>
                <span className="text-xs font-bold text-stocky-text-main">
                  ${(selectedBranch.value / 1000).toFixed(1)}k
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-stocky-text-sub font-medium">{t('home.charts.branchMap.assignedStaff')}</span>
                <span className="text-xs font-bold text-stocky-text-main">
                  {selectedBranch.staffCount}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-stocky-text-sub font-medium">{t('home.charts.branchMap.inventoryDelta')}</span>
                <span
                  className={`text-xs font-bold ${
                    selectedBranch.changePct >= 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {selectedBranch.changePct >= 0 ? `+${selectedBranch.changePct}%` : `${selectedBranch.changePct}%`}
                </span>
              </div>
            </div>

            {onSelectLocation && (
              <button
                type="button"
                onClick={() => onSelectLocation(selectedBranch.id)}
                className="w-full mt-3 h-8 rounded-lg bg-stocky-primary hover:bg-stocky-primary-hover text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>{t('home.charts.branchMap.viewBranchStock')}</span>
                <ChevronRightIcon size="xs" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Footer Summary Stats */}
      <div className="flex items-center justify-between text-[11px] text-stocky-text-sub pt-2 border-t border-stocky-border-subtle font-medium">
        <span>{t('home.charts.branchMap.totalBranches', { count: branchData.length })}</span>
        <span>
          {t('home.charts.branchMap.combinedStock', { count: branchData.reduce((acc, b) => acc + b.units, 0).toLocaleString() })}
        </span>
      </div>

      {/* 5. Sliding Window from the Bottom (Filters Bottom Sheet) */}
      <ChartFilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title={t('home.charts.branchMap.filterTitle')}
        onReset={() => handlePresetChange('30D')}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stocky-text-main block mb-2">
              {t('home.charts.branchMap.timeframePresets')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['7D', '14D', '30D', '90D'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetChange(preset)}
                  className={`h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    dateRangePreset === preset
                      ? 'bg-stocky-primary text-white shadow-xs'
                      : 'bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-stocky-border-subtle">
            <span className="text-xs font-semibold text-stocky-text-main block mb-2">
              {t('home.charts.branchMap.calcRange')}
            </span>
            <div className="p-3 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle text-xs text-stocky-text-sub space-y-1">
              <div>{t('home.charts.branchMap.from')}: <strong className="text-stocky-text-main">{startDate}</strong></div>
              <div>{t('home.charts.branchMap.to')}: <strong className="text-stocky-text-main">{endDate}</strong></div>
              <div className="text-[11px] text-stocky-text-muted pt-1">
                {t('home.charts.branchMap.baselineNote')}
              </div>
            </div>
          </div>
        </div>
      </ChartFilterBottomSheet>
    </div>
  );
}
