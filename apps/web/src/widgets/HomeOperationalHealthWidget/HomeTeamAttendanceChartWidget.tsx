'use client';

import React, { useMemo, useState } from 'react';
import type { AttendanceShift, Location } from '@stocky/types';
import { FilterIcon, InfoIcon, XIcon, FileSpreadsheetIcon } from '@stocky/icons';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ChartFilterBottomSheet } from './ChartFilterBottomSheet';
import { exportVisualDataToExcel } from '@/lib/excel/export';
import { useTranslation } from '@/lib/i18n';

export interface HomeTeamAttendanceChartWidgetProps {
  shifts?: AttendanceShift[];
  locations?: Location[];
  teamMembers?: Array<{ id: string; fullName?: string | null; name?: string; role?: string; avatarUrl?: string | null }>;
  teamAssignments?: Array<{ user_id: string; location_id: string }>;
  onOpenAttendance?: () => void;
  externalTimeframe?: '7D' | '14D' | '30D' | '90D' | 'YTD';
  externalLocationId?: string;
  canExport?: boolean;
}

export function HomeTeamAttendanceChartWidget({
  shifts = [],
  locations = [],
  teamMembers = [],
  teamAssignments = [],
  onOpenAttendance,
  externalTimeframe,
  externalLocationId,
  canExport = true,
}: HomeTeamAttendanceChartWidgetProps) {
  const { t, locale } = useTranslation();
  const [analysisMode, setAnalysisMode] = useState<'branch' | 'person'>('branch');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [internalTimeframeDays, setInternalTimeframeDays] = useState<number>(7);

  const effectiveDays = externalTimeframe === '7D'
    ? 7
    : externalTimeframe === '14D'
      ? 14
      : externalTimeframe === '30D'
        ? 30
        : externalTimeframe === '90D'
          ? 90
          : externalTimeframe === 'YTD'
            ? (() => {
                const now = new Date();
                return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
              })()
            : internalTimeframeDays;
  const effectiveBranchId = externalLocationId !== undefined && externalLocationId !== 'all' ? externalLocationId : selectedBranchId;

  // UI state for bottom sheet filter & info popover
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Normalize members list
  const memberList = useMemo(() => {
    return teamMembers.map((m) => ({
      id: m.id,
      name: m.fullName || m.name || 'Staff Member',
      role: m.role || 'Staff',
    }));
  }, [teamMembers]);

  // Generate date labels for the timeframe
  const datesList = useMemo(() => {
    const list: string[] = [];
    const today = new Date();
    for (let i = effectiveDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  }, [effectiveDays]);

  // Compute breakdown dataset
  const chartData = useMemo(() => {
    return datesList.map((dateStr) => {
      const d = new Date(dateStr);
      const label = d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

      // Filter shifts for this date
      let matchingShifts = shifts.filter(
        (s) => s.shiftDate === dateStr || s.clockInAt?.startsWith(dateStr)
      );

      if (analysisMode === 'branch' && effectiveBranchId !== 'all') {
        matchingShifts = matchingShifts.filter((s) => s.locationId === effectiveBranchId);
      } else if (analysisMode === 'person' && selectedPersonId !== 'all') {
        matchingShifts = matchingShifts.filter((s) => s.companyUserId === selectedPersonId);
      }

      let presentCount = matchingShifts.filter((s) => s.status === 'present').length;
      let lateCount = matchingShifts.filter((s) => s.status === 'late').length;
      let offCount = matchingShifts.filter((s) => ['early_departure', 'incomplete'].includes(s.status)).length;

      // Realistic baseline fallback if shifts data is sparse
      if (matchingShifts.length === 0) {
        presentCount = 0;
        lateCount = 0;
        offCount = 0;
      }

      const totalActive = presentCount + lateCount;
      const hoursLogged = matchingShifts.reduce(
        (acc, s) => acc + (s.totalMinutes ? s.totalMinutes / 60 : 8),
        0
      ) || (totalActive * 8);

      return {
        date: dateStr,
        label,
        Present: presentCount,
        Late: lateCount,
        'Off / Leave': offCount,
        hoursLogged: Number(hoursLogged.toFixed(1)),
      };
    });
  }, [datesList, shifts, analysisMode, effectiveBranchId, selectedPersonId, memberList.length, locale]);

  // Overall attendance rate KPI
  const totalPresent = chartData.reduce((acc, d) => acc + d.Present, 0);
  const totalLate = chartData.reduce((acc, d) => acc + d.Late, 0);
  const totalOff = chartData.reduce((acc, d) => acc + d['Off / Leave'], 0);
  const overallPct = Math.round(((totalPresent + totalLate) / Math.max(1, totalPresent + totalLate + totalOff)) * 100);

  const handleExportExcel = () => {
    exportVisualDataToExcel({
      reportTitle: 'Team Attendance & Punctuality Ledger',
      filenamePrefix: 'Stocky_Attendance_Ledger',
      sheetName: 'Attendance',
      appliedFilters: {
        timeframe: `${effectiveDays} Days`,
        branch: effectiveBranchId,
        mode: analysisMode,
      },
      rows: chartData.map((d) => ({
        'Date': d.date,
        'Day Label': d.label,
        'Present Count': d.Present,
        'Late Count': d.Late,
        'Off / Leave Count': d['Off / Leave'],
        'Hours Logged': d.hoursLogged,
      })),
    });
  };

  return (
    <div className="w-full h-[490px] sm:h-[510px] bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      {/* 1. Header Toolbar (Clean text, NO icons in headlines, 'i' info button, filter button) */}
      <div className="pb-3 border-b border-stocky-border-subtle">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-stocky-text-main tracking-tight truncate">
              {t('home.charts.teamAttendance.title')}
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

          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Visual / Data Table Toggle */}
            <div className="hidden sm:inline-flex items-center p-0.5 rounded-lg bg-stocky-bg-global border border-stocky-border-subtle">
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === 'chart'
                    ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs'
                    : 'text-stocky-text-sub hover:text-stocky-text-main'
                }`}
              >
                {t('home.charts.topMovers.chart')}
              </button>
              <button
                type="button"
                data-toggle-mode="table"
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs'
                    : 'text-stocky-text-sub hover:text-stocky-text-main'
                }`}
              >
                {t('home.charts.topMovers.table')}
              </button>
            </div>

            {/* Excel (.xlsx) Extract Button */}
            {canExport && <button
              type="button"
              data-testid="export-excel-attendance-btn"
              onClick={handleExportExcel}
              className="hidden sm:inline-flex h-8 px-2.5 rounded-lg border border-stocky-border-subtle bg-stocky-bg-global hover:bg-stocky-border-subtle text-xs font-semibold text-stocky-text-main items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Extract visual data as Excel (.xlsx)"
            >
              <FileSpreadsheetIcon size="xs" />
              <span>{t('home.charts.topMovers.excel')}</span>
            </button>}

            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-stocky-bg-global hover:bg-stocky-border-subtle text-xs font-semibold text-stocky-text-main flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <FilterIcon size="xs" />
              <span>{t('home.charts.topMovers.filter')}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-stocky-primary text-stocky-text-inverse text-[10px] font-bold">
                {analysisMode === 'branch' ? t('home.charts.teamAttendance.byBranch') : t('home.charts.teamAttendance.byPerson')} • {effectiveDays}D
              </span>
            </button>
          </div>
        </div>

        {/* Subtitle hidden on phone */}
        <p className="hidden sm:block text-[11px] text-stocky-text-sub mt-0.5">
          {t('home.charts.teamAttendance.subtitle')}
        </p>

        {showInfo && (
          <div className="mt-2.5 p-2.5 bg-stocky-bg-global/90 border border-stocky-border-subtle rounded-xl text-xs text-stocky-text-sub flex items-start justify-between gap-2 animate-in fade-in duration-150">
            <span>
              {t('home.charts.teamAttendance.info')}
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

      {/* 2. Sub-metric Status Bar */}
      <div className="flex items-center justify-between gap-2 pt-2 text-xs">
        <span className="text-[11px] text-stocky-text-sub font-medium">
          {t('home.charts.teamAttendance.overallAttendance', { pct: overallPct })}
        </span>

        {onOpenAttendance && (
          <button
            type="button"
            onClick={onOpenAttendance}
            className="text-[11px] font-semibold text-stocky-primary hover:underline cursor-pointer"
          >
            {t('home.charts.teamAttendance.manageAttendance')}
          </button>
        )}
      </div>

      {/* 3. Recharts Stacked BarChart OR Tabular Data Matrix */}
      {viewMode === 'chart' ? (
        <div className="w-full flex-1 my-3 min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--stocky-border-subtle)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--stocky-text-main)', fontWeight: 500 }}
                axisLine={{ stroke: 'var(--stocky-border-subtle)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--stocky-text-muted)' }}
                axisLine={{ stroke: 'var(--stocky-border-subtle)' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-stocky-bg-widget border border-stocky-border-default rounded-xl p-2.5 shadow-md text-xs">
                      <span className="font-bold text-stocky-text-main block">{label}</span>
                      <div className="space-y-1 mt-1 text-[11px]">
                        <div className="text-stocky-status-success-fg font-medium">
                          {t('home.charts.teamAttendance.presentOnDuty', { count: data.Present })}
                        </div>
                        <div className="text-stocky-status-warning-fg font-medium">
                          {t('home.charts.teamAttendance.lateArrival', { count: data.Late })}
                        </div>
                        <div className="text-stocky-text-muted font-medium">
                          {t('home.charts.teamAttendance.offLeave', { count: data['Off / Leave'] })}
                        </div>
                        <div className="text-stocky-text-main font-semibold pt-1 border-t border-stocky-border-subtle">
                          {t('home.charts.teamAttendance.totalHoursLogged', { hours: data.hoursLogged })}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                iconSize={8}
              />
              <Bar dataKey="Present" name={t('home.charts.teamAttendance.presentOnDuty', { count: '' }).replace(/[:：]\s*$/, '')} stackId="a" fill="var(--stocky-primary)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Late" name={t('home.charts.teamAttendance.lateArrival', { count: '' }).replace(/[:：]\s*$/, '')} stackId="a" fill="var(--stocky-accent)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Off / Leave" name={t('home.charts.teamAttendance.offLeave', { count: '' }).replace(/[:：]\s*$/, '')} stackId="a" fill="var(--stocky-text-muted)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="w-full flex-1 my-3 min-h-[260px] overflow-y-auto rounded-xl border border-stocky-border-subtle">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-stocky-bg-global sticky top-0 border-b border-stocky-border-subtle text-[11px] font-semibold text-stocky-text-sub">
              <tr>
                <th className="py-2.5 px-3 text-start">{t('home.charts.teamAttendance.dateDay')}</th>
                <th className="py-2.5 px-3 text-center">{t('attendance.statusWorking')}</th>
                <th className="py-2.5 px-3 text-center">{t('attendance.statusLate')}</th>
                <th className="py-2.5 px-3 text-center">{t('attendance.timeOff')}</th>
                <th className="py-2.5 px-3 text-end">{t('attendance.duration')}</th>
                <th className="py-2.5 px-3 text-end">{t('home.charts.teamAttendance.turnout')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stocky-border-subtle font-sans text-[11px]">
              {chartData.map((row) => {
                const total = row.Present + row.Late + row['Off / Leave'];
                const turnout = total > 0 ? Math.round(((row.Present + row.Late) / total) * 100) : 0;
                return (
                  <tr key={row.date} className="hover:bg-stocky-bg-global/50 transition-colors">
                    <td className="py-2 px-3 text-start font-sans font-medium text-stocky-text-main">
                      {row.label}
                      <span className="block text-[10px] text-stocky-text-sub font-sans">{row.date}</span>
                    </td>
                    <td className="py-2 px-3 text-center text-stocky-status-success-fg font-semibold">{row.Present}</td>
                    <td className="py-2 px-3 text-center text-stocky-status-warning-fg font-semibold">{row.Late}</td>
                    <td className="py-2 px-3 text-center text-stocky-text-muted">{row['Off / Leave']}</td>
                    <td className="py-2 px-3 text-end font-medium text-stocky-text-main">{row.hoursLogged}h</td>
                    <td className="py-2 px-3 text-end">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        turnout >= 80 ? 'bg-stocky-status-success-bg text-stocky-status-success-fg' : turnout >= 60 ? 'bg-stocky-status-warning-bg text-stocky-status-warning-fg' : 'bg-stocky-status-critical-bg text-stocky-status-critical-fg'
                      }`}>
                        {turnout}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Footer Summary */}
      <div className="flex items-center justify-between text-[11px] text-stocky-text-sub pt-2 border-t border-stocky-border-subtle font-medium">
        <span>{t('home.charts.teamAttendance.showingTrend', { days: effectiveDays })}</span>
        <span className="text-stocky-status-success-fg font-semibold">
          {t('home.charts.teamAttendance.totalPresentShifts', { count: totalPresent })}
        </span>
      </div>

      {/* 5. Sliding Window from the Bottom (Filters Bottom Sheet) */}
      <ChartFilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title={t('home.charts.teamAttendance.filterTitle')}
        onReset={() => {
          setAnalysisMode('branch');
          setSelectedBranchId('all');
          setSelectedPersonId('all');
          setInternalTimeframeDays(7);
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stocky-text-main block mb-2">
              {t('home.charts.teamAttendance.breakdownMode')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAnalysisMode('branch')}
                className={`h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  analysisMode === 'branch'
                    ? 'bg-stocky-primary text-stocky-text-inverse shadow-xs'
                    : 'bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle'
                }`}
              >
                {t('home.charts.teamAttendance.byBranch')}
              </button>
              <button
                type="button"
                onClick={() => setAnalysisMode('person')}
                className={`h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  analysisMode === 'person'
                    ? 'bg-stocky-primary text-stocky-text-inverse shadow-xs'
                    : 'bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle'
                }`}
              >
                {t('home.charts.teamAttendance.byPerson')}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-stocky-border-subtle">
            <label className="text-xs font-semibold text-stocky-text-main block mb-2">
              {analysisMode === 'branch' ? t('home.charts.teamAttendance.selectBranch') : t('home.charts.teamAttendance.selectMember')}
            </label>
            {analysisMode === 'branch' ? (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-xs font-medium bg-stocky-bg-global text-stocky-text-main border border-stocky-border-subtle cursor-pointer focus:outline-none"
              >
                <option value="all">{t('home.charts.teamAttendance.allBranches')}</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-xs font-medium bg-stocky-bg-global text-stocky-text-main border border-stocky-border-subtle cursor-pointer focus:outline-none"
              >
                <option value="all">{t('home.charts.teamAttendance.allMembers')}</option>
                {memberList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-2 border-t border-stocky-border-subtle">
            <label className="text-xs font-semibold text-stocky-text-main block mb-2">
              {t('home.charts.teamAttendance.timeframePresets')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setInternalTimeframeDays(days)}
                  className={`h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    internalTimeframeDays === days
                      ? 'bg-stocky-primary text-stocky-text-inverse shadow-xs'
                      : 'bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle'
                  }`}
                >
                  {t('home.charts.teamAttendance.daysPreset', { days })}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ChartFilterBottomSheet>
    </div>
  );
}
