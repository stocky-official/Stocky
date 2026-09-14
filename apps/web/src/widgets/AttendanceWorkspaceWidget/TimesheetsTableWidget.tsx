'use client';

import React, { useState } from 'react';
import type { AttendanceShift, Location, PunchMethod } from '@stocky/types';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  QrCodeIcon,
  WarehouseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  LogOutIcon,
} from '@stocky/icons';

export interface TimesheetsTableWidgetProps {
  shifts: AttendanceShift[];
  locations: Location[];
  members: any[];
  onSelectShift: (shift: AttendanceShift) => void;
  onRequestLeave?: () => void;
  currentUserId?: string | null;
  onPunchAttendance?: (input: {
    locationId: string;
    method?: PunchMethod;
    qrToken?: string;
    notes?: string;
  }) => Promise<AttendanceShift>;
}

const ITEMS_PER_PAGE = 15;

export function TimesheetsTableWidget({
  shifts,
  locations,
  members,
  onSelectShift,
  onRequestLeave,
  currentUserId,
  onPunchAttendance,
}: TimesheetsTableWidgetProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [punching, setPunching] = useState(false);
  const [punchLocationId, setPunchLocationId] = useState<string>(locations[0]?.id || '');
  const [punchFeedback, setPunchFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const locationMap = new Map(locations.map((loc) => [loc.id, loc.name]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Calculate Roll Call Stats for Today
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayShifts = shifts.filter((s) => s.shiftDate === todayStr || s.clockInAt?.startsWith(todayStr));
  const totalPresentToday = todayShifts.length;
  const onTimeCount = todayShifts.filter((s) => s.status === 'present').length;
  const lateCount = todayShifts.filter((s) => s.status === 'late').length;
  const activeNowCount = todayShifts.filter((s) => !s.clockOutAt).length;

  const totalPages = Math.ceil(shifts.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedShifts = shifts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDuration = (totalMinutes?: number | null) => {
    if (totalMinutes == null || totalMinutes <= 0) return 'In progress';
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  const getStatusBadge = (status: AttendanceShift['status'], isOngoing: boolean) => {
    if (isOngoing) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-info border">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Active Shift
        </span>
      );
    }
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-success border">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            On Time
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-warning border">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Late
          </span>
        );
      case 'early_departure':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-critical border">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Early Out
          </span>
        );
      case 'overtime':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-hold border">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Overtime
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-muted border">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status}
          </span>
        );
    }
  };

  const getMethodBadge = (method: string) => {
    if (method === 'qr_scan') {
      return (
        <span className="inline-flex items-center gap-1 text-stocky-text-sub text-xs">
          <QrCodeIcon size="xs" />
          <span>Branch QR</span>
        </span>
      );
    }
    if (method === 'kiosk') {
      return (
        <span className="inline-flex items-center gap-1 text-stocky-text-sub text-xs">
          <WarehouseIcon size="xs" />
          <span>Station Kiosk</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-stocky-text-sub text-xs">
        <ClockIcon size="xs" />
        <span>Manual</span>
      </span>
    );
  };

  const userActiveShift = shifts.find(
    (s) => (s.companyUserId === currentUserId || !currentUserId) && !s.clockOutAt
  );

  const handlePunchToggle = async () => {
    if (!onPunchAttendance) return;
    setPunching(true);
    setPunchFeedback(null);
    try {
      const targetLocId = userActiveShift ? userActiveShift.locationId : (punchLocationId || locations[0]?.id || '');
      const res = await onPunchAttendance({
        locationId: targetLocId,
        method: 'kiosk',
        notes: userActiveShift ? 'Clocked out via Timesheets workspace' : 'Clocked in via Timesheets workspace',
      });
      setPunchFeedback({
        success: true,
        message: `Successfully clocked ${res.clockOutAt ? 'out' : 'in'}!`,
      });
    } catch (err: any) {
      setPunchFeedback({
        success: false,
        message: err.message || 'Failed to punch attendance.',
      });
    } finally {
      setPunching(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Roll Call Stats Banner (Compact 2x2 on mobile, 4-col on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-stocky-bg-global/40 border-b border-stocky-border-subtle">
        <div className="flex items-center gap-2.5 sm:gap-3 bg-stocky-bg-widget p-2.5 sm:p-3 rounded-2xl border border-stocky-border-subtle shadow-2xs">
          <div className="w-8 h-8 rounded-xl stocky-status-success border flex items-center justify-center shrink-0">
            <CheckCircleIcon size="xs" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-stocky-text-sub truncate">Present Today</div>
            <div className="text-sm sm:text-base font-bold text-stocky-text-main truncate">{totalPresentToday} staff</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 bg-stocky-bg-widget p-2.5 sm:p-3 rounded-2xl border border-stocky-border-subtle shadow-2xs">
          <div className="w-8 h-8 rounded-xl stocky-status-info border flex items-center justify-center shrink-0">
            <ClockIcon size="xs" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-stocky-text-sub truncate">On-Time Rate</div>
            <div className="text-sm sm:text-base font-bold text-stocky-text-main truncate">
              {totalPresentToday > 0 ? `${Math.round((onTimeCount / totalPresentToday) * 100)}%` : '100%'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 bg-stocky-bg-widget p-2.5 sm:p-3 rounded-2xl border border-stocky-border-subtle shadow-2xs">
          <div className="w-8 h-8 rounded-xl stocky-status-warning border flex items-center justify-center shrink-0">
            <AlertTriangleIcon size="xs" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-stocky-text-sub truncate">Late Arrivals</div>
            <div className="text-sm sm:text-base font-bold text-stocky-text-main truncate">{lateCount} staff</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 bg-stocky-bg-widget p-2.5 sm:p-3 rounded-2xl border border-stocky-border-subtle shadow-2xs">
          <div className="w-8 h-8 rounded-xl stocky-status-hold border flex items-center justify-center shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-stocky-text-sub truncate">Active Now</div>
            <div className="text-sm sm:text-base font-bold text-stocky-text-main truncate">{activeNowCount} working</div>
          </div>
        </div>
      </div>

      {/* Interactive Punch Clock Card */}
      {onPunchAttendance && (
        <div className="p-3 sm:p-4 bg-stocky-bg-widget border-b border-stocky-border-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-stocky-bg-global via-white to-stocky-bg-global border border-stocky-border-subtle shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  userActiveShift
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-2xs'
                    : 'bg-stocky-bg-global text-stocky-text-sub border-stocky-border-subtle'
                }`}
              >
                <ClockIcon size="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stocky-text-main">Punch Clock</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      userActiveShift ? 'stocky-status-success' : 'stocky-status-muted'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        userActiveShift ? 'bg-emerald-500 animate-pulse' : 'bg-current'
                      }`}
                    />
                    {userActiveShift ? 'Clocked In' : 'Clocked Out'}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-stocky-text-sub">
                    <QrCodeIcon size="xs" /> Geofenced
                  </span>
                </div>
                <p className="text-[11px] text-stocky-text-sub truncate mt-0.5">
                  {userActiveShift
                    ? `Shift started at ${new Date(userActiveShift.clockInAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} · ${locationMap.get(userActiveShift.locationId) || 'Branch'}`
                    : 'Select location and punch in to start your work shift.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {!userActiveShift && locations.length > 0 && (
                <select
                  value={punchLocationId}
                  onChange={(e) => setPunchLocationId(e.target.value)}
                  className="h-10 flex-1 sm:flex-initial rounded-full border border-stocky-border-subtle bg-white px-3 text-xs font-medium text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                disabled={punching}
                onClick={handlePunchToggle}
                className={`h-10 px-5 flex-1 sm:flex-initial rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  userActiveShift
                    ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300'
                    : 'stocky-table-toolbar-button stocky-table-toolbar-button--primary'
                }`}
              >
                {punching ? (
                  <span>Punching...</span>
                ) : userActiveShift ? (
                  <>
                    <LogOutIcon size="xs" />
                    <span>Clock Out</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon size="xs" />
                    <span>Clock In</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {punchFeedback && (
            <div
              className={`mt-2 p-2 rounded-xl text-xs flex items-center justify-between border ${
                punchFeedback.success
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              <span>{punchFeedback.message}</span>
              <button
                type="button"
                onClick={() => setPunchFeedback(null)}
                className="text-stocky-text-sub hover:text-stocky-text-main text-xs cursor-pointer ml-2"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* Shifts Table & Mobile Cards */}
      {paginatedShifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-12 h-12 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-text-sub mb-3">
            <ClockIcon size="sm" />
          </div>
          <h3 className="text-sm font-semibold text-stocky-text-main">No attendance records found</h3>
          <p className="text-xs text-stocky-text-sub max-w-xs mt-1">
            There are no recorded shifts matching your search. Staff can punch in via Branch QR codes or Kiosk.
          </p>
          <button
            type="button"
            onClick={onRequestLeave}
            className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
          >
            <PlusIcon size="xs" />
            <span>Request Leave</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block w-full overflow-x-auto">
            <table className="stocky-board-table min-w-[850px] w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/30 h-11">
                  <th className="stocky-board-table__header-cell px-4 text-left text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    Employee
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-left text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    Branch / Location
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-left text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    Shift Date
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-left text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    Clock In
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-left text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    Clock Out
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-left text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    Duration
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-left text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    Status
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-left text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    Method
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-right text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle">
                {paginatedShifts.map((shift) => {
                  const member = memberMap.get(shift.companyUserId);
                  const locationName = locationMap.get(shift.locationId) || 'Main Branch';
                  const isOngoing = !shift.clockOutAt;
                  const memberName = member?.full_name || member?.email?.split('@')[0] || 'Staff Member';
                  const memberInitials = memberName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={shift.id}
                      onClick={() => onSelectShift(shift)}
                      className="hover:bg-stocky-bg-global/40 cursor-pointer transition-colors group"
                    >
                      {/* Employee */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stocky-primary/10 border border-stocky-primary/20 text-stocky-primary flex items-center justify-center text-xs font-semibold shrink-0">
                            {memberInitials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-stocky-text-main truncate group-hover:text-stocky-primary transition-colors">
                              {memberName}
                            </div>
                            <div className="text-[11px] text-stocky-text-sub truncate">
                              {member?.email || 'Active teammate'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stocky-bg-global border border-stocky-border-subtle text-xs text-stocky-text-main font-medium">
                          <WarehouseIcon size="xs" className="text-stocky-text-sub" />
                          <span>{locationName}</span>
                        </div>
                      </td>

                      {/* Shift Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-stocky-text-main font-medium">
                        {shift.shiftDate}
                      </td>

                      {/* Clock In */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-stocky-text-main">
                        {formatTime(shift.clockInAt)}
                      </td>

                      {/* Clock Out */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-stocky-text-sub">
                        {isOngoing ? (
                          <span className="text-stocky-primary font-medium">In Progress</span>
                        ) : (
                          formatTime(shift.clockOutAt)
                        )}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-stocky-text-main">
                        {formatDuration(shift.totalMinutes)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(shift.status, isOngoing)}
                      </td>

                      {/* Method */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getMethodBadge(shift.punchInMethod)}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectShift(shift);
                          }}
                          className="px-3 py-1 rounded-full text-xs font-medium border border-stocky-border-subtle hover:border-stocky-primary hover:text-stocky-primary bg-stocky-bg-widget transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="divide-y divide-stocky-border-subtle sm:hidden">
            {paginatedShifts.map((shift) => {
              const member = memberMap.get(shift.companyUserId);
              const locationName = locationMap.get(shift.locationId) || 'Main Branch';
              const isOngoing = !shift.clockOutAt;
              const memberName = member?.full_name || member?.email?.split('@')[0] || 'Staff Member';
              const memberInitials = memberName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <article
                  key={shift.id}
                  onClick={() => onSelectShift(shift)}
                  className="p-3.5 flex flex-col gap-2.5 bg-stocky-bg-widget hover:bg-stocky-bg-global/40 active:bg-stocky-bg-global/60 transition-colors cursor-pointer"
                >
                  {/* Top row: Avatar + Name & Date + Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-stocky-primary/10 border border-stocky-primary/20 text-stocky-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {memberInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-stocky-text-main truncate">
                          {memberName}
                        </div>
                        <div className="text-[11px] text-stocky-text-sub truncate">
                          {shift.shiftDate}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(shift.status, isOngoing)}
                    </div>
                  </div>

                  {/* Times & Duration Box */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-stocky-bg-global/50 border border-stocky-border-subtle/60 text-xs">
                    <div className="flex items-center gap-1.5 text-stocky-text-main font-medium">
                      <ClockIcon size="xs" className="text-stocky-text-sub shrink-0" />
                      <span>{formatTime(shift.clockInAt)}</span>
                      <span className="text-stocky-text-sub">→</span>
                      <span className={isOngoing ? 'text-stocky-primary font-semibold' : 'text-stocky-text-main'}>
                        {isOngoing ? 'Active Now' : formatTime(shift.clockOutAt)}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-stocky-text-main">
                      {formatDuration(shift.totalMinutes)}
                    </div>
                  </div>

                  {/* Bottom row: Location + Method + Inspect Action */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stocky-bg-global border border-stocky-border-subtle text-[11px] text-stocky-text-main font-medium truncate">
                        <WarehouseIcon size="xs" className="text-stocky-text-sub shrink-0" />
                        <span className="truncate">{locationName}</span>
                      </div>
                      {getMethodBadge(shift.punchInMethod)}
                    </div>

                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-stocky-text-sub hover:text-stocky-primary">
                      <span>Inspect</span>
                      <ChevronRightIcon size="xs" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination Bar */}
      {shifts.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4 py-3 border-t border-stocky-border-subtle bg-stocky-bg-widget rounded-b-card">
          <div className="text-xs text-stocky-text-sub text-center sm:text-left">
            Showing <span className="font-semibold text-stocky-text-main">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-stocky-text-main">
              {Math.min(startIndex + ITEMS_PER_PAGE, shifts.length)}
            </span>{' '}
            of <span className="font-semibold text-stocky-text-main">{shifts.length}</span> shifts
          </div>
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-stocky-border-subtle text-stocky-text-main hover:bg-stocky-bg-global disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeftIcon size="xs" />
            </button>
            <span className="text-xs text-stocky-text-main px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-stocky-border-subtle text-stocky-text-main hover:bg-stocky-bg-global disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRightIcon size="xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
