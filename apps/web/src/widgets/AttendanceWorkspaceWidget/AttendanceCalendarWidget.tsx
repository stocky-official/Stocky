'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { AttendanceShift, LeaveBalance, LeaveRequest, Location } from '@stocky/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  WarehouseIcon,
  PlusIcon,
} from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

export type CalendarViewMode = 'month' | 'week' | 'day';

export interface AttendanceCalendarWidgetProps {
  shifts: AttendanceShift[];
  leaves: LeaveRequest[];
  balances?: LeaveBalance[];
  locations: Location[];
  members: any[];
  currentUserId?: string | null;
  userRole?: string;
  canManageAttendance?: boolean;
  onSelectShift: (shift: AttendanceShift) => void;
  onSelectLeave?: (leave: LeaveRequest) => void;
  onRequestLeave?: () => void;
  onReviewLeave?: (requestId: string, approve: boolean, note?: string) => Promise<void>;
}

export function AttendanceCalendarWidget({
  shifts,
  leaves,
  balances,
  locations,
  members,
  currentUserId,
  userRole,
  canManageAttendance,
  onSelectShift,
  onSelectLeave,
  onRequestLeave,
  onReviewLeave,
}: AttendanceCalendarWidgetProps) {
  const { t, locale, isRtl } = useTranslation();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');

  const filteredShifts = useMemo(() => {
    if (selectedLocationId === 'all') return shifts;
    return shifts.filter((s) => s.locationId === selectedLocationId);
  }, [shifts, selectedLocationId]);

  const userBalance = balances?.find((b) => b.companyUserId === currentUserId) || balances?.[0] || {
    ptoAllowance: 21,
    ptoUsed: 0,
    sickAllowance: 10,
    sickUsed: 0,
  };
  const ptoRemaining = Math.max(0, userBalance.ptoAllowance - userBalance.ptoUsed);

  const locationMap = new Map(locations.map((loc) => [loc.id, loc.name]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() - 7);
      setCurrentDate(next);
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() - 1);
      setCurrentDate(next);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      setCurrentDate(next);
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 1);
      setCurrentDate(next);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().slice(0, 10));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectMobileDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    const target = new Date(dateStr + 'T00:00:00');
    if (target.getMonth() !== month || target.getFullYear() !== year) {
      setCurrentDate(new Date(target.getFullYear(), target.getMonth(), 1));
    }
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(locale === 'ar' ? 'ar-EG' : undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDuration = (totalMinutes?: number | null) => {
    if (totalMinutes == null || totalMinutes <= 0) return t('calendar.inProgress');
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  // Date formatted title
  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : undefined, { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString(locale === 'ar' ? 'ar-EG' : undefined, { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString(locale === 'ar' ? 'ar-EG' : undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Month grid generation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysFromPrevMonth = firstDayIndex;
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const calendarDays: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  // Previous month padding
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, day);
    const dateStr = prevDate.toISOString().slice(0, 10);
    calendarDays.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: dateStr === new Date().toISOString().slice(0, 10),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const curDate = new Date(year, month, day);
    const dateStr = curDate.toISOString().slice(0, 10);
    calendarDays.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: true,
      isToday: dateStr === new Date().toISOString().slice(0, 10),
    });
  }

  // Next month padding to fill standard 35 or 42 grid
  const remaining = 35 - calendarDays.length > 0 ? 35 - calendarDays.length : (42 - calendarDays.length > 0 ? 42 - calendarDays.length : 0);
  for (let day = 1; day <= remaining; day++) {
    const nextDate = new Date(year, month + 1, day);
    const dateStr = nextDate.toISOString().slice(0, 10);
    calendarDays.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: dateStr === new Date().toISOString().slice(0, 10),
    });
  }

  // Index shifts by date
  const shiftsByDate = new Map<string, AttendanceShift[]>();
  filteredShifts.forEach((s) => {
    const d = s.shiftDate || s.clockInAt?.slice(0, 10);
    if (!d) return;
    const arr = shiftsByDate.get(d) || [];
    arr.push(s);
    shiftsByDate.set(d, arr);
  });

  // Index leaves by date range
  const isDateInLeave = (dateStr: string, startStr: string, endStr: string) => {
    return dateStr >= startStr && dateStr <= endStr;
  };

  // Selected date details for Samsung mobile view
  const selectedDayShifts = shiftsByDate.get(selectedDateStr) || [];
  const selectedDayLeaves = leaves.filter((l) => isDateInLeave(selectedDateStr, l.startDate, l.endDate));
  const selectedDateObj = new Date(selectedDateStr + 'T00:00:00');
  const isSelectedToday = selectedDateStr === new Date().toISOString().slice(0, 10);
  const selectedDateTitle = selectedDateObj.toLocaleDateString(locale === 'ar' ? 'ar-EG' : undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="flex flex-col w-full bg-stocky-bg-widget"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRtl ? 'Cairo, sans-serif' : undefined }}
    >
      {/* ─────────────────────────────────────────────────────────────
          MOBILE: SAMSUNG CALENDAR EXPERIENCE (< sm)
      ─────────────────────────────────────────────────────────────── */}
      <div className="sm:hidden flex flex-col w-full divide-y divide-stocky-border-subtle">
        {/* Upper: Samsung Calendar Header */}
        <div className="p-3.5 flex flex-col gap-3">
          {/* Row 1: Month Title & Chevrons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-base font-bold text-stocky-text-main tracking-tight truncate">
                {currentDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : undefined, { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleToday}
                className="h-7 px-2.5 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget text-[11px] font-semibold text-stocky-text-main hover:text-stocky-primary transition-colors cursor-pointer"
              >
                {t('calendar.today')}
              </button>
              <div className="inline-flex items-center rounded-full border border-stocky-border-subtle bg-stocky-bg-widget">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label={t('calendar.previousMonth')}
                  className="p-1 text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                >
                  <ChevronLeftIcon size="xs" className="rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label={t('calendar.nextMonth')}
                  className="p-1 text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                >
                  <ChevronRightIcon size="xs" className="rtl:rotate-180" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Location selector + PTO balance + Request Leave button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <WarehouseIcon
                size="xs"
                className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub"
              />
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full h-8 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget ps-7 pe-6 text-[11px] font-medium text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer truncate text-start"
              >
                <option value="all">{t('calendar.allLocations')}</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 h-8 rounded-full text-[11px] font-semibold bg-stocky-primary/5 text-stocky-primary border border-stocky-primary/20 shrink-0">
              <CalendarIcon size="xs" />
              <span>{t('calendar.ptoRemainingShort', { count: ptoRemaining })}</span>
            </div>

            {onRequestLeave && (
              <button
                type="button"
                onClick={onRequestLeave}
                className="h-8 px-3 rounded-full bg-stocky-primary text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer shadow-xs hover:bg-stocky-primary-hover transition-colors shrink-0"
              >
                <PlusIcon size="xs" />
                <span>{t('calendar.leave')}</span>
              </button>
            )}
          </div>

          {/* Weekday Row (Samsung One UI: S M T W T F S) */}
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-stocky-text-sub py-1">
            <span className="text-stocky-status-critical-fg/80">{t('calendar.weekdaysLetter.sun')}</span>
            <span>{t('calendar.weekdaysLetter.mon')}</span>
            <span>{t('calendar.weekdaysLetter.tue')}</span>
            <span>{t('calendar.weekdaysLetter.wed')}</span>
            <span>{t('calendar.weekdaysLetter.thu')}</span>
            <span>{t('calendar.weekdaysLetter.fri')}</span>
            <span>{t('calendar.weekdaysLetter.sat')}</span>
          </div>

          {/* Samsung Month Day Cells Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {calendarDays.map((cell, idx) => {
              const dayShifts = shiftsByDate.get(cell.dateStr) || [];
              const dayLeaves = leaves.filter((l) => isDateInLeave(cell.dateStr, l.startDate, l.endDate));
              const isSelected = cell.dateStr === selectedDateStr;

              // Dot indicators
              const hasPresent = dayShifts.some((s) => s.status === 'present');
              const hasActive = dayShifts.some((s) => !s.clockOutAt);
              const hasLate = dayShifts.some((s) => s.status === 'late' || s.status === 'early_departure');
              const hasLeave = dayLeaves.length > 0;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectMobileDate(cell.dateStr)}
                  className="flex flex-col items-center justify-center py-1 relative cursor-pointer group"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                      isSelected
                        ? 'bg-stocky-primary text-white font-bold shadow-sm'
                        : cell.isToday
                        ? 'ring-1.5 ring-stocky-primary text-stocky-primary font-bold'
                        : cell.isCurrentMonth
                        ? 'text-stocky-text-main font-medium group-hover:bg-stocky-bg-global/50'
                        : 'text-stocky-text-sub/40'
                    }`}
                  >
                    {cell.dayNum}
                  </div>

                  {/* Micro event indicator dots */}
                  <div className="h-1.5 flex items-center gap-0.5 mt-0.5">
                    {hasPresent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-stocky-status-success-fg" />
                    )}
                    {hasActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-stocky-status-info-fg animate-pulse" />
                    )}
                    {hasLate && (
                      <span className="w-1.5 h-1.5 rounded-full bg-stocky-status-warning-fg" />
                    )}
                    {hasLeave && (
                      <span className="w-1.5 h-1.5 rounded-full bg-stocky-status-hold-fg" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lower: Selected Day Schedule Agenda */}
        <div className="p-3.5 flex flex-col gap-2.5 bg-stocky-bg-global/20">
          {/* Selected Date Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stocky-text-main">
                {selectedDateTitle}
              </span>
              {isSelectedToday && (
                <span className="px-2 py-0.5 rounded-full bg-stocky-primary text-white text-[10px] font-semibold">
                  {t('calendar.today')}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-stocky-text-sub">
              {selectedDayShifts.length === 1
                ? t('calendar.shiftsCountSingular', { count: 1 })
                : t('calendar.shiftsCountPlural', { count: selectedDayShifts.length })}
              {selectedDayLeaves.length > 0
                ? ` · ${
                    selectedDayLeaves.length === 1
                      ? t('calendar.leavesCountSingular', { count: 1 })
                      : t('calendar.leavesCountPlural', { count: selectedDayLeaves.length })
                  }`
                : ''}
            </span>
          </div>

          {/* Agenda items list */}
          {selectedDayShifts.length === 0 && selectedDayLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget">
              <div className="w-9 h-9 rounded-full bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-text-sub mb-2">
                <CalendarIcon size="xs" />
              </div>
              <div className="text-xs font-semibold text-stocky-text-main">
                {t('calendar.noScheduledDay')}
              </div>
              <div className="text-[11px] text-stocky-text-sub mt-0.5">
                {t('calendar.noScheduledHint')}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Shift cards */}
              {selectedDayShifts.map((shift) => {
                const member = memberMap.get(shift.companyUserId);
                const locationName = locationMap.get(shift.locationId) || 'Main Branch';
                const isOngoing = !shift.clockOutAt;
                const memberName = member?.full_name || member?.email?.split('@')[0] || 'Staff Member';
                const memberTitle = member?.job_title || member?.role;
                const memberInitials = memberName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                const accentBorder = isOngoing
                  ? 'border-s-blue-500 bg-blue-50/10'
                  : shift.status === 'late'
                  ? 'border-s-amber-500 bg-amber-50/10'
                  : 'border-s-emerald-500 bg-emerald-50/10';

                return (
                  <article
                    key={shift.id}
                    onClick={() => onSelectShift(shift)}
                    className={`p-3 rounded-2xl border border-stocky-border-subtle bg-stocky-bg-widget hover:bg-stocky-bg-global/40 active:bg-stocky-bg-global/60 transition-colors cursor-pointer flex flex-col gap-2 border-s-4 shadow-2xs ${accentBorder}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-stocky-text-main font-semibold">
                        <ClockIcon size="xs" className="text-stocky-text-sub shrink-0" />
                        <span>{formatTime(shift.clockInAt)}</span>
                        <span className="text-stocky-text-sub rtl:rotate-180">→</span>
                        <span className={isOngoing ? 'text-stocky-primary font-bold' : 'text-stocky-text-main'}>
                          {isOngoing ? t('calendar.active') : formatTime(shift.clockOutAt)}
                        </span>
                        <span className="text-[11px] font-normal text-stocky-text-sub ms-1 bg-stocky-bg-global px-2 py-0.5 rounded-full border border-stocky-border-subtle/50">
                          {formatDuration(shift.totalMinutes)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isOngoing
                            ? 'stocky-status-info'
                            : shift.status === 'late'
                            ? 'stocky-status-warning'
                            : 'stocky-status-success'
                        }`}
                      >
                        {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                        {isOngoing ? t('calendar.activeNow') : shift.status === 'late' ? t('calendar.late') : t('calendar.onTime')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 border-t border-stocky-border-subtle/50">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-6 h-6 rounded-full bg-stocky-primary/10 border border-stocky-primary/20 text-stocky-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                          {memberInitials}
                        </div>
                        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-stocky-text-main truncate max-w-[130px]">
                            {memberName}
                          </span>
                          {memberTitle && (
                            <span className="inline-flex rounded-full bg-stocky-bg-global px-2 py-0.5 text-[9px] font-medium text-stocky-text-sub border border-stocky-border-subtle truncate max-w-[120px]">
                              {memberTitle}
                            </span>
                          )}
                          <div className="inline-flex items-center gap-1 text-[11px] text-stocky-text-sub truncate">
                            <WarehouseIcon size="xs" className="shrink-0" />
                            <span className="truncate max-w-[90px]">{locationName}</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRightIcon size="xs" className="text-stocky-text-sub shrink-0 ms-2 rtl:rotate-180" />
                    </div>
                  </article>
                );
              })}

              {/* Leave cards */}
              {selectedDayLeaves.map((leave) => {
                const member = memberMap.get(leave.companyUserId);
                const memberName = member?.full_name || member?.email?.split('@')[0] || 'Staff Member';
                const memberTitle = member?.job_title || member?.role;
                const memberInitials = memberName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <article
                    key={leave.id}
                    onClick={() => onSelectLeave?.(leave)}
                    className="p-3 rounded-2xl border border-stocky-border-subtle bg-stocky-bg-widget hover:bg-stocky-bg-global/40 transition-colors cursor-pointer flex flex-col gap-2 border-s-4 border-s-purple-500 bg-purple-50/10 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon size="xs" className="text-purple-600 shrink-0" />
                        <span className="font-semibold text-stocky-text-main">
                          {leave.startDate} <span className="rtl:rotate-180 inline-block">→</span> {leave.endDate}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                        {leave.leaveType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 border-t border-stocky-border-subtle/50">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {memberInitials}
                        </div>
                        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-stocky-text-main truncate">
                            {memberName}
                          </span>
                          {memberTitle && (
                            <span className="inline-flex rounded-full bg-stocky-bg-global px-2 py-0.5 text-[9px] font-medium text-stocky-text-sub border border-stocky-border-subtle">
                              {memberTitle}
                            </span>
                          )}
                          <span className="text-[11px] text-stocky-text-sub">
                            {leave.daysCount === 1
                              ? t('calendar.daysCountSingular', { count: 1 })
                              : t('calendar.daysCountPlural', { count: leave.daysCount })}
                          </span>
                        </div>
                      </div>

                      <ChevronRightIcon size="xs" className="text-stocky-text-sub shrink-0 ms-2 rtl:rotate-180" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DESKTOP: GOOGLE CALENDAR CONTROLS & VIEWS (sm:flex)
      ─────────────────────────────────────────────────────────────── */}
      <div className="hidden sm:flex flex-col w-full">
        {/* Controls Bar */}
        <div className="flex flex-row items-center justify-between gap-3 p-3.5 border-b border-stocky-border-subtle bg-stocky-bg-widget">
          {/* Left: Navigation, Today, Header Title */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToday}
              className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget text-xs font-semibold text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary transition-colors cursor-pointer"
            >
              {t('calendar.today')}
            </button>
            <div className="inline-flex items-center rounded-full border border-stocky-border-subtle bg-stocky-bg-widget p-0.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label={t('calendar.previous')}
                className="p-1 rounded-full text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
              >
                <ChevronLeftIcon size="xs" className="rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label={t('calendar.next')}
                className="p-1 rounded-full text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
              >
                <ChevronRightIcon size="xs" className="rtl:rotate-180" />
              </button>
            </div>
            <h2 className="text-base font-bold text-stocky-text-main ms-1 truncate">
              {getHeaderTitle()}
            </h2>
          </div>

          {/* Middle: Location Selector & PTO chip */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <WarehouseIcon
                size="xs"
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-stocky-text-sub"
              />
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="h-8 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget ps-8 pe-7 text-xs font-medium text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer"
              >
                <option value="all">{t('calendar.allLocations')}</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold bg-stocky-primary/5 text-stocky-primary border border-stocky-primary/20">
              <CalendarIcon size="xs" />
              <span>{t('calendar.ptoRemaining', { count: ptoRemaining })}</span>
            </div>
          </div>

          {/* Right: View Switcher (Day/Week/Month) + "+ Request Leave" Button */}
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center p-0.5 rounded-full bg-stocky-bg-global border border-stocky-border-subtle">
              {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
                    viewMode === mode
                      ? 'bg-stocky-bg-widget text-stocky-primary font-semibold shadow-xs'
                      : 'text-stocky-text-sub hover:text-stocky-text-main'
                  }`}
                >
                  {t(`calendar.${mode}`)}
                </button>
              ))}
            </div>

            {onRequestLeave && (
              <button
                type="button"
                onClick={onRequestLeave}
                className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
              >
                <PlusIcon size="xs" />
                <span>{t('calendar.requestLeave')}</span>
              </button>
            )}
          </div>
        </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-stocky-border-subtle bg-stocky-bg-global/40 text-center py-2 text-[11px] font-semibold text-stocky-text-sub uppercase tracking-wider">
              <div>{t('calendar.weekdaysShort.sun')}</div>
              <div>{t('calendar.weekdaysShort.mon')}</div>
              <div>{t('calendar.weekdaysShort.tue')}</div>
              <div>{t('calendar.weekdaysShort.wed')}</div>
              <div>{t('calendar.weekdaysShort.thu')}</div>
              <div>{t('calendar.weekdaysShort.fri')}</div>
              <div>{t('calendar.weekdaysShort.sat')}</div>
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-stocky-border-subtle border-b border-stocky-border-subtle rtl:divide-x-reverse">
              {calendarDays.map((cell, idx) => {
                const dayShifts = shiftsByDate.get(cell.dateStr) || [];
                const dayLeaves = leaves.filter((l) => isDateInLeave(cell.dateStr, l.startDate, l.endDate));

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] p-2 flex flex-col transition-colors ${
                      cell.isCurrentMonth ? 'bg-stocky-bg-widget' : 'bg-stocky-bg-global/20 opacity-60'
                    } ${cell.isToday ? 'bg-stocky-primary/5' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          cell.isToday
                            ? 'bg-stocky-primary text-white'
                            : cell.isCurrentMonth
                            ? 'text-stocky-text-main'
                            : 'text-stocky-text-sub'
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                      {dayShifts.length > 0 && (
                        <span className="text-[10px] font-medium text-stocky-text-sub">
                          {dayShifts.length === 1
                            ? t('calendar.shiftsCountSingular', { count: 1 })
                            : t('calendar.shiftsCountPlural', { count: dayShifts.length })}
                        </span>
                      )}
                    </div>

                    {/* Chips */}
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                      {dayShifts.slice(0, 3).map((shift) => {
                        const member = memberMap.get(shift.companyUserId);
                        const memberName = member?.full_name?.split(' ')[0] || (locale === 'ar' ? 'موظف' : 'Staff');
                        const isLate = shift.status === 'late';
                        const isOngoing = !shift.clockOutAt;

                        return (
                          <button
                            key={shift.id}
                            type="button"
                            onClick={() => onSelectShift(shift)}
                            className={`w-full text-start px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate flex items-center gap-1 transition-opacity hover:opacity-85 cursor-pointer border ${
                              isOngoing
                                ? 'stocky-status-info'
                                : isLate
                                ? 'stocky-status-warning'
                                : 'stocky-status-success'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isOngoing ? 'bg-current animate-pulse' : 'bg-current'
                              }`}
                            />
                            <span className="truncate">{memberName}</span>
                            <span className="opacity-70 text-[9px]">
                              {shift.clockInAt ? new Date(shift.clockInAt).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : [], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </button>
                        );
                      })}

                      {dayLeaves.map((leave) => {
                        const member = memberMap.get(leave.companyUserId);
                        const memberName = member?.full_name?.split(' ')[0] || (locale === 'ar' ? 'موظف' : 'Staff');
                        return (
                          <div
                            key={leave.id}
                            onClick={() => onSelectLeave?.(leave)}
                            className="w-full text-start px-1.5 py-0.5 rounded-md text-[10px] font-medium stocky-status-hold border truncate flex items-center gap-1 cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                            <span className="truncate">{memberName} ({leave.leaveType.toUpperCase()})</span>
                          </div>
                        );
                      })}

                      {dayShifts.length > 3 && (
                        <div className="text-[10px] text-stocky-text-sub font-medium ps-1">
                          {t('calendar.moreShifts', { count: dayShifts.length - 3 })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="w-full overflow-x-auto p-4">
          <div className="min-w-[800px] grid grid-cols-7 gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
              const startOfWeek = new Date(currentDate);
              startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + dayOffset);
              const dateStr = startOfWeek.toISOString().slice(0, 10);
              const dayShifts = shiftsByDate.get(dateStr) || [];
              const isToday = dateStr === new Date().toISOString().slice(0, 10);

              return (
                <div
                  key={dayOffset}
                  className={`rounded-widget border p-3 flex flex-col min-h-[360px] ${
                    isToday ? 'border-stocky-primary bg-stocky-primary/5' : 'border-stocky-border-subtle bg-stocky-bg-widget'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-stocky-border-subtle pb-2 mb-2.5">
                    <div>
                      <div className="text-[11px] font-semibold text-stocky-text-sub uppercase">
                        {startOfWeek.toLocaleDateString(locale === 'ar' ? 'ar-EG' : undefined, { weekday: 'short' })}
                      </div>
                      <div className="text-sm font-semibold text-stocky-text-main">
                        {startOfWeek.getDate()}
                      </div>
                    </div>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-stocky-primary text-white text-[10px] font-semibold">
                        {t('calendar.today')}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                    {dayShifts.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-[11px] text-stocky-text-sub italic">
                        {t('calendar.noShifts')}
                      </div>
                    ) : (
                      dayShifts.map((shift) => {
                        const member = memberMap.get(shift.companyUserId);
                        const memberName = member?.full_name || (locale === 'ar' ? 'عضو الفريق' : 'Staff Member');
                        const isLate = shift.status === 'late';
                        const isOngoing = !shift.clockOutAt;

                        return (
                          <div
                            key={shift.id}
                            onClick={() => onSelectShift(shift)}
                            className="p-2.5 rounded-widget border border-stocky-border-subtle bg-stocky-bg-global/30 hover:border-stocky-primary hover:bg-stocky-bg-widget transition-all cursor-pointer shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-stocky-text-main truncate">
                                {memberName}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isOngoing
                                    ? 'bg-current text-stocky-status-info-fg animate-pulse'
                                    : isLate
                                    ? 'bg-current text-stocky-status-warning-fg'
                                    : 'bg-current text-stocky-status-success-fg'
                                }`}
                              />
                            </div>
                            <div className="text-[11px] text-stocky-text-sub flex items-center gap-1">
                              <ClockIcon size="xs" />
                              <span>
                                {shift.clockInAt ? new Date(shift.clockInAt).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : [], { hour: '2-digit', minute: '2-digit' }) : ''}
                                {' - '}
                                {shift.clockOutAt ? new Date(shift.clockOutAt).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : [], { hour: '2-digit', minute: '2-digit' }) : t('calendar.active')}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="w-full p-4 sm:p-6">
          {(() => {
            const dateStr = currentDate.toISOString().slice(0, 10);
            const dayShifts = shiftsByDate.get(dateStr) || [];

            return (
              <div className="max-w-3xl mx-auto flex flex-col gap-3">
                <div className="flex items-center justify-between pb-3 border-b border-stocky-border-subtle">
                  <div className="text-sm font-semibold text-stocky-text-main">
                    {t('calendar.timelineFor', {
                      date: currentDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : undefined, { weekday: 'long', month: 'long', day: 'numeric' })
                    })}
                  </div>
                  <span className="text-xs text-stocky-text-sub">
                    {t('calendar.staffCount', { count: dayShifts.length })}
                  </span>
                </div>

                {dayShifts.length === 0 ? (
                  <div className="text-center py-12 text-stocky-text-sub text-xs">
                    {t('calendar.noRecordsDate')}
                  </div>
                ) : (
                  dayShifts.map((shift) => {
                    const member = memberMap.get(shift.companyUserId);
                    const memberName = member?.full_name || (locale === 'ar' ? 'عضو الفريق' : 'Staff Member');
                    const locationName = locationMap.get(shift.locationId) || (locale === 'ar' ? 'الفرع الرئيسي' : 'Main Branch');
                    const isOngoing = !shift.clockOutAt;

                    return (
                      <div
                        key={shift.id}
                        onClick={() => onSelectShift(shift)}
                        className="p-4 rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget hover:border-stocky-primary transition-all cursor-pointer shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-stocky-primary/10 text-stocky-primary flex items-center justify-center font-semibold text-sm">
                            {memberName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-stocky-text-main">
                              {memberName}
                            </div>
                            <div className="text-[11px] text-stocky-text-sub flex items-center gap-1.5 mt-0.5">
                              <WarehouseIcon size="xs" />
                              <span>{locationName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-end">
                            <div className="text-xs font-semibold text-stocky-text-main">
                              {shift.clockInAt ? new Date(shift.clockInAt).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : [], { hour: '2-digit', minute: '2-digit' }) : '—'}
                              <span className="inline-block mx-1 rtl:rotate-180">→</span>
                              {shift.clockOutAt ? new Date(shift.clockOutAt).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : [], { hour: '2-digit', minute: '2-digit' }) : t('calendar.active')}
                            </div>
                            <div className="text-[11px] text-stocky-text-sub">
                              {shift.totalMinutes ? `${Math.floor(shift.totalMinutes / 60)}h ${shift.totalMinutes % 60}m` : t('calendar.inProgress')}
                            </div>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              isOngoing
                                ? 'stocky-status-info'
                                : shift.status === 'late'
                                ? 'stocky-status-warning'
                                : 'stocky-status-success'
                            }`}
                          >
                            {isOngoing ? t('calendar.active') : shift.status === 'late' ? t('calendar.late') : t('calendar.onTime')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}
        </div>
      )}
      </div>
    </div>
  );
}
