'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheetIcon,
  XIcon,
  CalendarIcon,
  WarehouseIcon,
  UsersIcon,
  CheckIcon,
  SearchIcon,
} from '@stocky/icons';
import type { AttendanceShift, Location } from '@stocky/types';
import { exportTimesheetsToExcel, type TimesheetExportRow } from '@/lib/excel/export';
import { useTranslation } from '@/lib/i18n';

export interface TimesheetsExportModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: AttendanceShift[];
  locations: Location[];
  members: any[];
}

type DatePreset = 'this_month' | 'last_month' | 'last_30_days' | 'this_week' | 'all_time' | 'custom';

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TimesheetsExportModalWidget({
  isOpen,
  onClose,
  shifts = [],
  locations = [],
  members = [],
}: TimesheetsExportModalWidgetProps) {
  const { t, isRtl } = useTranslation();
  // 1. Date Range State
  const [preset, setPreset] = useState<DatePreset>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 2. Branch Selection State
  const [branchScope, setBranchScope] = useState<'all' | 'specific'>('all');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

  // 3. Employee Selection State
  const [staffScope, setStaffScope] = useState<'all' | 'specific'>('all');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState<string>('');

  // Apply default date preset on modal open
  useEffect(() => {
    if (!isOpen) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Default: This month (1st of month to today)
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    setStartDate(formatLocalDate(firstDayOfMonth));
    setEndDate(formatLocalDate(today));
    setPreset('this_month');

    // Default branches & staff: All
    setBranchScope('all');
    setSelectedLocationIds(locations.map((l) => l.id));
    setStaffScope('all');
    setSelectedMemberIds(members.map((m) => m.id));
    setMemberSearch('');
  }, [isOpen, locations, members]);

  // Handle Preset selection
  const handlePresetSelect = (selectedPreset: DatePreset) => {
    setPreset(selectedPreset);
    const today = new Date();

    if (selectedPreset === 'this_month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatLocalDate(first));
      setEndDate(formatLocalDate(today));
    } else if (selectedPreset === 'last_month') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(formatLocalDate(first));
      setEndDate(formatLocalDate(last));
    } else if (selectedPreset === 'last_30_days') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      setStartDate(formatLocalDate(past30));
      setEndDate(formatLocalDate(today));
    } else if (selectedPreset === 'this_week') {
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startOfWeek.setDate(diff);
      setStartDate(formatLocalDate(startOfWeek));
      setEndDate(formatLocalDate(today));
    } else if (selectedPreset === 'all_time') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Maps for quick lookup
  const locationMap = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Filtered members by search query in the modal
  const searchedMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const query = memberSearch.toLowerCase();
    return members.filter((m) => {
      const name = m.full_name || m.email || '';
      return name.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query);
    });
  }, [members, memberSearch]);

  // Toggle individual location
  const handleToggleLocation = (locId: string) => {
    setSelectedLocationIds((prev) =>
      prev.includes(locId) ? prev.filter((id) => id !== locId) : [...prev, locId]
    );
  };

  // Toggle individual member
  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  // Select all / clear locations
  const handleSelectAllLocations = () => setSelectedLocationIds(locations.map((l) => l.id));
  const handleClearLocations = () => setSelectedLocationIds([]);

  // Select all / clear members
  const handleSelectAllMembers = () => setSelectedMemberIds(members.map((m) => m.id));
  const handleClearMembers = () => setSelectedMemberIds([]);

  // Compute matching shifts dynamically based on selected filters
  const matchingShifts = useMemo(() => {
    return shifts.filter((shift) => {
      // 1. Date Range
      const shiftDate = shift.shiftDate || shift.clockInAt?.slice(0, 10);
      if (startDate && shiftDate < startDate) return false;
      if (endDate && shiftDate > endDate) return false;

      // 2. Branch Location
      if (branchScope === 'specific') {
        if (!selectedLocationIds.includes(shift.locationId)) return false;
      }

      // 3. Employees / Staff
      if (staffScope === 'specific') {
        if (!selectedMemberIds.includes(shift.companyUserId)) return false;
      }

      return true;
    });
  }, [shifts, startDate, endDate, branchScope, selectedLocationIds, staffScope, selectedMemberIds]);

  // Summary calculations
  const totalHoursWorked = useMemo(() => {
    const totalMinutes = matchingShifts.reduce((acc, s) => acc + (s.totalMinutes || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return t('modals.exportTimesheets.hoursMinutes', { hours, minutes });
  }, [matchingShifts, t]);

  const uniqueEmployeesCount = useMemo(() => {
    const set = new Set(matchingShifts.map((s) => s.companyUserId));
    return set.size;
  }, [matchingShifts]);

  // Trigger export
  const handleExecuteExport = () => {
    if (matchingShifts.length === 0) return;

    const exportRows: TimesheetExportRow[] = matchingShifts.map((shift) => {
      const member = memberMap.get(shift.companyUserId);
      const locName = locationMap.get(shift.locationId) || 'Main Branch';
      return {
        employeeName: member?.full_name || member?.email?.split('@')[0] || 'Staff Member',
        employeeEmail: member?.email || 'N/A',
        locationName: locName,
        shiftDate: shift.shiftDate,
        clockInAt: shift.clockInAt,
        clockOutAt: shift.clockOutAt,
        totalMinutes: shift.totalMinutes,
        status: shift.status,
        punchInMethod: shift.punchInMethod,
        notes: shift.notes,
      };
    });

    let dateLabel = 'All_Time';
    if (startDate && endDate) {
      dateLabel = `${startDate}_to_${endDate}`;
    } else if (startDate) {
      dateLabel = `from_${startDate}`;
    } else if (endDate) {
      dateLabel = `until_${endDate}`;
    }

    let branchLabel = 'All_Branches';
    if (branchScope === 'specific') {
      if (selectedLocationIds.length === 1) {
        branchLabel = locationMap.get(selectedLocationIds[0]) || 'Branch';
      } else {
        branchLabel = `${selectedLocationIds.length}_Branches`;
      }
    }

    exportTimesheetsToExcel(exportRows, dateLabel, branchLabel);
    onClose();
  };

  const getPresetLabel = (presetKey: DatePreset) => {
    switch (presetKey) {
      case 'this_month':
        return t('modals.exportTimesheets.thisMonth');
      case 'last_month':
        return t('modals.exportTimesheets.lastMonth');
      case 'last_30_days':
        return t('modals.exportTimesheets.last30Days');
      case 'this_week':
        return t('modals.exportTimesheets.thisWeek');
      case 'all_time':
        return t('modals.exportTimesheets.allTime');
      case 'custom':
        return t('modals.exportTimesheets.custom');
      default:
        return presetKey;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stocky-text-main/40 backdrop-blur-sm animate-fade-in ${isRtl ? 'font-cairo' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-xl bg-stocky-bg-widget rounded-card border border-stocky-border-subtle shadow-bevel-float flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-stocky-border-subtle bg-stocky-bg-global/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-widget stocky-status-info border flex items-center justify-center shadow-sm">
              <FileSpreadsheetIcon size="xs" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-sm font-semibold text-stocky-text-main">
                {t('modals.exportTimesheets.title')}
              </h2>
              <p className="text-[11px] text-stocky-text-sub">
                {t('modals.exportTimesheets.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-hover transition-colors cursor-pointer"
            aria-label={t('modals.exportTimesheets.close')}
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Section 1: Date Range */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5">
                <CalendarIcon size="xs" className="text-stocky-primary" />
                <span>{t('modals.exportTimesheets.dateRange')}</span>
              </label>
              <span className="text-[10px] text-stocky-text-sub uppercase tracking-wider font-medium">
                {getPresetLabel(preset)}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'this_month', label: t('modals.exportTimesheets.thisMonth') },
                  { id: 'last_month', label: t('modals.exportTimesheets.lastMonth') },
                  { id: 'last_30_days', label: t('modals.exportTimesheets.last30Days') },
                  { id: 'this_week', label: t('modals.exportTimesheets.thisWeek') },
                  { id: 'all_time', label: t('modals.exportTimesheets.allTime') },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p.id)}
                  className={`h-7 px-3 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    preset === p.id
                      ? 'bg-stocky-primary text-stocky-text-inverse shadow-sm'
                      : 'border border-stocky-border-subtle bg-stocky-bg-widget text-stocky-text-main hover:border-stocky-primary/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] text-stocky-text-sub mb-1 font-medium">
                  {t('modals.exportTimesheets.startDate')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full h-10 rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stocky-text-sub mb-1 font-medium">
                  {t('modals.exportTimesheets.endDate')}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full h-10 rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <hr className="border-t border-stocky-border-subtle" />

          {/* Section 2: Branches / Locations */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5">
                <WarehouseIcon size="xs" className="text-stocky-primary" />
                <span>{t('modals.exportTimesheets.branchesLocations')}</span>
              </label>
              <div className="flex items-center gap-1 bg-stocky-bg-global p-1 rounded-full border border-stocky-border-subtle text-[11px]">
                <button
                  type="button"
                  onClick={() => setBranchScope('all')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                    branchScope === 'all'
                      ? 'bg-stocky-bg-widget text-stocky-text-main shadow-sm font-semibold'
                      : 'text-stocky-text-sub hover:text-stocky-text-main'
                  }`}
                >
                  {t('modals.exportTimesheets.allBranchesCount', { count: locations.length })}
                </button>
                <button
                  type="button"
                  onClick={() => setBranchScope('specific')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                    branchScope === 'specific'
                      ? 'bg-stocky-bg-widget text-stocky-text-main shadow-sm font-semibold'
                      : 'text-stocky-text-sub hover:text-stocky-text-main'
                  }`}
                >
                  {t('modals.exportTimesheets.selectedBranchesCount', { count: selectedLocationIds.length })}
                </button>
              </div>
            </div>

            {branchScope === 'specific' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] text-stocky-text-sub px-1">
                  <span>{t('modals.exportTimesheets.chooseBranches')}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllLocations}
                      className="text-stocky-primary hover:underline cursor-pointer"
                    >
                      {t('modals.exportTimesheets.selectAll')}
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={handleClearLocations}
                      className="text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                    >
                      {t('modals.exportTimesheets.clear')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 border border-stocky-border-subtle rounded-widget bg-stocky-bg-widget/40">
                  {locations.map((loc) => {
                    const isSelected = selectedLocationIds.includes(loc.id);
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleToggleLocation(loc.id)}
                        className={`flex items-center justify-between p-2 rounded-widget border text-start text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-stocky-primary bg-stocky-primary/5 text-stocky-text-main font-medium'
                            : 'border-stocky-border-subtle bg-stocky-bg-widget text-stocky-text-sub hover:border-stocky-primary/40'
                        }`}
                      >
                        <div className="min-w-0 pe-2">
                          <p className="truncate font-medium text-stocky-text-main">{loc.name}</p>
                          {loc.code && <p className="text-[10px] text-stocky-text-sub">{loc.code}</p>}
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-stocky-primary text-stocky-text-inverse' : 'border border-stocky-border-subtle'
                          }`}
                        >
                          {isSelected && <CheckIcon size="xs" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <hr className="border-t border-stocky-border-subtle" />

          {/* Section 3: Employees / Staff */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5">
                <UsersIcon size="xs" className="text-stocky-primary" />
                <span>{t('modals.exportTimesheets.employeesStaff')}</span>
              </label>
              <div className="flex items-center gap-1 bg-stocky-bg-global p-1 rounded-full border border-stocky-border-subtle text-[11px]">
                <button
                  type="button"
                  onClick={() => setStaffScope('all')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                    staffScope === 'all'
                      ? 'bg-stocky-bg-widget text-stocky-text-main shadow-sm font-semibold'
                      : 'text-stocky-text-sub hover:text-stocky-text-main'
                  }`}
                >
                  {t('modals.exportTimesheets.allStaffCount', { count: members.length })}
                </button>
                <button
                  type="button"
                  onClick={() => setStaffScope('specific')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                    staffScope === 'specific'
                      ? 'bg-stocky-bg-widget text-stocky-text-main shadow-sm font-semibold'
                      : 'text-stocky-text-sub hover:text-stocky-text-main'
                  }`}
                >
                  {t('modals.exportTimesheets.selectedStaffCount', { count: selectedMemberIds.length })}
                </button>
              </div>
            </div>

            {staffScope === 'specific' && (
              <div className="space-y-2 pt-1">
                {/* Search Input within staff list */}
                <div className="relative">
                  <SearchIcon
                    size="xs"
                    className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-stocky-text-sub"
                  />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder={t('modals.exportTimesheets.searchStaffPlaceholder')}
                    className="w-full h-10 rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget ps-8 pe-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stocky-text-sub px-1">
                  <span>{t('modals.exportTimesheets.selectEmployees')}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllMembers}
                      className="text-stocky-primary hover:underline cursor-pointer"
                    >
                      {t('modals.exportTimesheets.selectAll')}
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={handleClearMembers}
                      className="text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                    >
                      {t('modals.exportTimesheets.clear')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1 border border-stocky-border-subtle rounded-widget bg-stocky-bg-widget/40">
                  {searchedMembers.length === 0 ? (
                    <p className="col-span-2 text-center text-xs text-stocky-text-sub py-3">
                      {t('modals.exportTimesheets.noStaffFound', { query: memberSearch })}
                    </p>
                  ) : (
                    searchedMembers.map((member) => {
                      const isSelected = selectedMemberIds.includes(member.id);
                      const displayName = member.full_name || member.email?.split('@')[0] || 'Member';
                      const initial = displayName.charAt(0).toUpperCase();

                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleToggleMember(member.id)}
                          className={`flex items-center justify-between p-2 rounded-widget border text-start text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-stocky-primary bg-stocky-primary/5 text-stocky-text-main font-medium'
                              : 'border-stocky-border-subtle bg-stocky-bg-widget text-stocky-text-sub hover:border-stocky-primary/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pe-2">
                            <div className="w-6 h-6 rounded-full bg-stocky-primary/10 text-stocky-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                              {initial}
                            </div>
                            <div className="min-w-0 truncate">
                              <p className="truncate font-medium text-stocky-text-main">{displayName}</p>
                              {member.email && (
                                <p className="text-[10px] text-stocky-text-sub truncate">{member.email}</p>
                              )}
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-stocky-primary text-stocky-text-inverse' : 'border border-stocky-border-subtle'
                            }`}
                          >
                            {isSelected && <CheckIcon size="xs" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Live Extraction Summary Card */}
          <div className="p-3.5 rounded-widget border border-stocky-border-subtle bg-stocky-bg-global flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full stocky-status-info border flex items-center justify-center shrink-0">
                <FileSpreadsheetIcon size="xs" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stocky-text-main">
                  {matchingShifts.length === 1
                    ? t('modals.exportTimesheets.shiftsSelectedSingular', { count: 1 })
                    : t('modals.exportTimesheets.shiftsSelectedPlural', { count: matchingShifts.length })}
                </p>
                <p className="text-[11px] text-stocky-text-sub">
                  {uniqueEmployeesCount === 1
                    ? t('modals.exportTimesheets.summaryDetailsSingular', {
                        count: 1,
                        hours: totalHoursWorked,
                      })
                    : t('modals.exportTimesheets.summaryDetailsPlural', {
                        count: uniqueEmployeesCount,
                        hours: totalHoursWorked,
                      })}
                </p>
              </div>
            </div>

            {matchingShifts.length === 0 && (
              <span className="text-[11px] stocky-status-warning border px-2.5 py-0.5 rounded-full font-medium">
                {t('modals.exportTimesheets.noMatchingShifts')}
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-3.5 border-t border-stocky-border-subtle bg-stocky-bg-global/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget text-xs font-medium text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
          >
            {t('modals.exportTimesheets.cancel')}
          </button>

          <button
            type="button"
            disabled={matchingShifts.length === 0}
            onClick={handleExecuteExport}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-stocky-primary text-stocky-text-inverse text-xs font-medium hover:bg-stocky-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheetIcon size="xs" />
            <span>{t('modals.exportTimesheets.downloadBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
