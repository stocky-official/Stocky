'use client';

import React, { useState } from 'react';
import type { AttendanceShift, Location } from '@stocky/types';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  QrCodeIcon,
  WarehouseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@stocky/icons';

export interface TimesheetsTableWidgetProps {
  shifts: AttendanceShift[];
  locations: Location[];
  members: any[];
  onSelectShift: (shift: AttendanceShift) => void;
  onRequestLeave: () => void;
}

const ITEMS_PER_PAGE = 15;

export function TimesheetsTableWidget({
  shifts,
  locations,
  members,
  onSelectShift,
  onRequestLeave,
}: TimesheetsTableWidgetProps) {
  const [currentPage, setCurrentPage] = useState(1);

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

  return (
    <div className="flex flex-col w-full">
      {/* Roll Call Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-stocky-bg-global/40 border-b border-stocky-border-subtle">
        <div className="flex items-center gap-3 bg-stocky-bg-widget p-2.5 sm:p-3 rounded-widget border border-stocky-border-subtle shadow-sm">
          <div className="w-8 h-8 rounded-lg stocky-status-success border flex items-center justify-center">
            <CheckCircleIcon size="xs" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-stocky-text-sub">Present Today</div>
            <div className="text-base font-semibold text-stocky-text-main">{totalPresentToday} staff</div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-stocky-bg-widget p-2.5 sm:p-3 rounded-widget border border-stocky-border-subtle shadow-sm">
          <div className="w-8 h-8 rounded-lg stocky-status-info border flex items-center justify-center">
            <ClockIcon size="xs" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-stocky-text-sub">On-Time Rate</div>
            <div className="text-base font-semibold text-stocky-text-main">
              {totalPresentToday > 0 ? `${Math.round((onTimeCount / totalPresentToday) * 100)}%` : '100%'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-stocky-bg-widget p-2.5 sm:p-3 rounded-widget border border-stocky-border-subtle shadow-sm">
          <div className="w-8 h-8 rounded-lg stocky-status-warning border flex items-center justify-center">
            <AlertTriangleIcon size="xs" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-stocky-text-sub">Late Arrivals</div>
            <div className="text-base font-semibold text-stocky-text-main">{lateCount} staff</div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-stocky-bg-widget p-2.5 sm:p-3 rounded-widget border border-stocky-border-subtle shadow-sm">
          <div className="w-8 h-8 rounded-lg stocky-status-hold border flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-stocky-text-sub">Active Now</div>
            <div className="text-base font-semibold text-stocky-text-main">{activeNowCount} working</div>
          </div>
        </div>
      </div>

      {/* Shifts Table */}
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
        <div className="w-full overflow-x-auto">
          <table className="stocky-board-table w-full text-left border-collapse">
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
      )}

      {/* Pagination Bar */}
      {shifts.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-stocky-border-subtle bg-stocky-bg-widget rounded-b-card">
          <div className="text-xs text-stocky-text-sub">
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
