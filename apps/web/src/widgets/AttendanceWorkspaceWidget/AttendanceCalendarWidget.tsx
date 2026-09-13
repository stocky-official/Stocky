'use client';

import React, { useState } from 'react';
import type { AttendanceShift, LeaveRequest, Location } from '@stocky/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  WarehouseIcon,
} from '@stocky/icons';

export type CalendarViewMode = 'month' | 'week' | 'day';

export interface AttendanceCalendarWidgetProps {
  shifts: AttendanceShift[];
  leaves: LeaveRequest[];
  locations: Location[];
  members: any[];
  onSelectShift: (shift: AttendanceShift) => void;
  onSelectLeave?: (leave: LeaveRequest) => void;
}

export function AttendanceCalendarWidget({
  shifts,
  leaves,
  locations,
  members,
  onSelectShift,
  onSelectLeave,
}: AttendanceCalendarWidgetProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

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

  const handleToday = () => setCurrentDate(new Date());

  // Date formatted title
  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
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
  shifts.forEach((s) => {
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

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Google Calendar Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-stocky-border-subtle bg-stocky-bg-global/20">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleToday}
            className="h-9 px-3 rounded-full border border-stocky-border-subtle bg-white text-xs font-semibold text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-full border border-stocky-border-subtle bg-white text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              <ChevronLeftIcon size="xs" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-full border border-stocky-border-subtle bg-white text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              <ChevronRightIcon size="xs" />
            </button>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-stocky-text-main ml-1">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* View Switcher: Day | Week | Month */}
        <div className="inline-flex items-center p-1 rounded-full bg-stocky-bg-global border border-stocky-border-subtle">
          {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
                viewMode === mode
                  ? 'bg-white text-stocky-primary font-semibold shadow-2xs'
                  : 'text-stocky-text-sub hover:text-stocky-text-main'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-stocky-border-subtle bg-stocky-bg-global/40 text-center py-2 text-[11px] font-semibold text-stocky-text-sub uppercase tracking-wider">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-stocky-border-subtle border-b border-stocky-border-subtle">
              {calendarDays.map((cell, idx) => {
                const dayShifts = shiftsByDate.get(cell.dateStr) || [];
                const dayLeaves = leaves.filter((l) => isDateInLeave(cell.dateStr, l.startDate, l.endDate));

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] p-2 flex flex-col transition-colors ${
                      cell.isCurrentMonth ? 'bg-white' : 'bg-stocky-bg-global/20 opacity-60'
                    } ${cell.isToday ? 'bg-emerald-50/20' : ''}`}
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
                          {dayShifts.length} shift{dayShifts.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Chips */}
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                      {dayShifts.slice(0, 3).map((shift) => {
                        const member = memberMap.get(shift.companyUserId);
                        const memberName = member?.full_name?.split(' ')[0] || 'Staff';
                        const isLate = shift.status === 'late';
                        const isOngoing = !shift.clockOutAt;

                        return (
                          <button
                            key={shift.id}
                            type="button"
                            onClick={() => onSelectShift(shift)}
                            className={`w-full text-left px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate flex items-center gap-1 transition-opacity hover:opacity-85 cursor-pointer ${
                              isOngoing
                                ? 'bg-blue-100 text-blue-800'
                                : isLate
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isOngoing ? 'bg-blue-500 animate-pulse' : isLate ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            />
                            <span className="truncate">{memberName}</span>
                            <span className="opacity-70 text-[9px]">
                              {shift.clockInAt ? new Date(shift.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </button>
                        );
                      })}

                      {dayLeaves.map((leave) => {
                        const member = memberMap.get(leave.companyUserId);
                        const memberName = member?.full_name?.split(' ')[0] || 'Staff';
                        return (
                          <div
                            key={leave.id}
                            onClick={() => onSelectLeave?.(leave)}
                            className="w-full text-left px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-purple-100 text-purple-800 truncate flex items-center gap-1 cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                            <span className="truncate">{memberName} ({leave.leaveType.toUpperCase()})</span>
                          </div>
                        );
                      })}

                      {dayShifts.length > 3 && (
                        <div className="text-[10px] text-stocky-text-sub font-medium pl-1">
                          +{dayShifts.length - 3} more
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
                  className={`rounded-2xl border p-3 flex flex-col min-h-[360px] ${
                    isToday ? 'border-stocky-primary bg-emerald-50/10' : 'border-stocky-border-subtle bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-stocky-border-subtle pb-2 mb-2.5">
                    <div>
                      <div className="text-[11px] font-semibold text-stocky-text-sub uppercase">
                        {startOfWeek.toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                      <div className="text-sm font-bold text-stocky-text-main">
                        {startOfWeek.getDate()}
                      </div>
                    </div>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-stocky-primary text-white text-[10px] font-semibold">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                    {dayShifts.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-[11px] text-stocky-text-sub italic">
                        No shifts
                      </div>
                    ) : (
                      dayShifts.map((shift) => {
                        const member = memberMap.get(shift.companyUserId);
                        const memberName = member?.full_name || 'Staff Member';
                        const isLate = shift.status === 'late';
                        const isOngoing = !shift.clockOutAt;

                        return (
                          <div
                            key={shift.id}
                            onClick={() => onSelectShift(shift)}
                            className="p-2.5 rounded-xl border border-stocky-border-subtle bg-stocky-bg-global/30 hover:border-stocky-primary hover:bg-white transition-all cursor-pointer shadow-2xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-stocky-text-main truncate">
                                {memberName}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isOngoing ? 'bg-blue-500 animate-pulse' : isLate ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                              />
                            </div>
                            <div className="text-[11px] text-stocky-text-sub flex items-center gap-1">
                              <ClockIcon size="xs" />
                              <span>
                                {shift.clockInAt ? new Date(shift.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                {' - '}
                                {shift.clockOutAt ? new Date(shift.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
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
                    Timeline for {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <span className="text-xs text-stocky-text-sub">
                    {dayShifts.length} staff scheduled/clocked in
                  </span>
                </div>

                {dayShifts.length === 0 ? (
                  <div className="text-center py-12 text-stocky-text-sub text-xs">
                    No attendance records for this date.
                  </div>
                ) : (
                  dayShifts.map((shift) => {
                    const member = memberMap.get(shift.companyUserId);
                    const memberName = member?.full_name || 'Staff Member';
                    const locationName = locationMap.get(shift.locationId) || 'Main Branch';
                    const isOngoing = !shift.clockOutAt;

                    return (
                      <div
                        key={shift.id}
                        onClick={() => onSelectShift(shift)}
                        className="p-4 rounded-2xl border border-stocky-border-subtle bg-white hover:border-stocky-primary transition-all cursor-pointer shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-stocky-primary/10 text-stocky-primary flex items-center justify-center font-bold text-sm">
                            {memberName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-stocky-text-main">
                              {memberName}
                            </div>
                            <div className="text-[11px] text-stocky-text-sub flex items-center gap-1.5 mt-0.5">
                              <WarehouseIcon size="xs" />
                              <span>{locationName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs font-semibold text-stocky-text-main">
                              {shift.clockInAt ? new Date(shift.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                              {' → '}
                              {shift.clockOutAt ? new Date(shift.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                            </div>
                            <div className="text-[11px] text-stocky-text-sub">
                              {shift.totalMinutes ? `${Math.floor(shift.totalMinutes / 60)}h ${shift.totalMinutes % 60}m` : 'In progress'}
                            </div>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isOngoing
                                ? 'bg-blue-100 text-blue-800'
                                : shift.status === 'late'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOngoing ? 'Active' : shift.status}
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
  );
}
