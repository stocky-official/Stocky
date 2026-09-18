'use client';

import React, { useState } from 'react';
import type { AttendanceShift, Location, PunchMethod } from '@stocky/types';
import {
  ClockIcon,
  QrCodeIcon,
  WarehouseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

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
}: TimesheetsTableWidgetProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  const locationMap = new Map(locations.map((loc) => [loc.id, loc.name]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

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
    if (totalMinutes == null || totalMinutes <= 0) return t('attendance.statusOngoing');
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
          {t('attendance.statusOngoing')}
        </span>
      );
    }
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-success border">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {t('attendance.statusOnTime')}
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-warning border">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {t('attendance.statusLate')}
          </span>
        );
      case 'early_departure':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-critical border">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {t('attendance.statusEarlyDeparture')}
          </span>
        );
      case 'overtime':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-hold border">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {t('attendance.statusOvertime')}
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
          <span>{t('attendance.methodBranchQr')}</span>
        </span>
      );
    }
    if (method === 'kiosk') {
      return (
        <span className="inline-flex items-center gap-1 text-stocky-text-sub text-xs">
          <WarehouseIcon size="xs" />
          <span>{t('attendance.methodKiosk')}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-stocky-text-sub text-xs">
        <ClockIcon size="xs" />
        <span>{t('attendance.methodManual')}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col w-full">
      {/* Shifts Table & Mobile Cards */}
      {paginatedShifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-12 h-12 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-text-sub mb-3">
            <ClockIcon size="sm" />
          </div>
          <h3 className="text-sm font-semibold text-stocky-text-main">{t('attendance.noRecordsFound')}</h3>
          <p className="text-xs text-stocky-text-sub max-w-xs mt-1">
            {t('attendance.noRecordsDesc')}
          </p>
          <button
            type="button"
            onClick={onRequestLeave}
            className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
          >
            <PlusIcon size="xs" />
            <span>{t('attendance.requestLeave')}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block w-full overflow-x-auto">
            <table className="stocky-board-table min-w-[850px] w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/30 h-11">
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('attendance.employee')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('common.location')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('attendance.shiftDate')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('attendance.clockIn')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('attendance.clockOut')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('attendance.duration')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('common.status')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('attendance.punchMethod')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-end text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('common.action')}
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
                          <span className="text-stocky-primary font-medium">{t('attendance.statusOngoing')}</span>
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
                      <td className="px-4 py-3 whitespace-nowrap text-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectShift(shift);
                          }}
                          className="px-3 py-1 rounded-full text-xs font-medium border border-stocky-border-subtle hover:border-stocky-primary hover:text-stocky-primary bg-stocky-bg-widget transition-colors cursor-pointer"
                        >
                          {t('attendance.inspect')}
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

              const timeDisplay = isOngoing
                ? `${formatTime(shift.clockInAt)} – Active`
                : `${formatTime(shift.clockInAt)} – ${formatTime(shift.clockOutAt)}`;

              return (
                <article
                  key={shift.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectShift(shift)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectShift(shift);
                    }
                  }}
                  className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-stocky-bg-global/30 active:bg-stocky-bg-global/60 transition-colors cursor-pointer text-start"
                >
                  {/* Left Anchor + Center Info Stack */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-stocky-primary/10 border border-stocky-primary/20 text-stocky-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {memberInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-stocky-text-main leading-tight truncate">
                        {memberName}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-stocky-text-sub flex items-center gap-1.5 truncate">
                        <span className="truncate max-w-[110px]">{locationName}</span>
                        <span>·</span>
                        <span className="capitalize">{shift.punchInMethod || 'kiosk'}</span>
                        <span>·</span>
                        <span>{shift.shiftDate}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Status & Time Stack */}
                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                    {getStatusBadge(shift.status, isOngoing)}
                    <span className="text-[10px] text-stocky-text-sub font-normal mt-0.5 whitespace-nowrap">
                      {timeDisplay} {(shift.totalMinutes ?? 0) > 0 ? `· ${formatDuration(shift.totalMinutes!)}` : ''}
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
          <div className="text-xs text-stocky-text-sub text-center sm:text-start">
            {t('common.showing')} <span className="font-semibold text-stocky-text-main">{startIndex + 1}</span> {t('common.to')}{' '}
            <span className="font-semibold text-stocky-text-main">
              {Math.min(startIndex + ITEMS_PER_PAGE, shifts.length)}
            </span>{' '}
            {t('common.of')} <span className="font-semibold text-stocky-text-main">{shifts.length}</span> {t('attendance.shiftsCount')}
          </div>
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-stocky-border-subtle text-stocky-text-main hover:bg-stocky-bg-global disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer rtl:rotate-180"
            >
              <ChevronLeftIcon size="xs" />
            </button>
            <span className="text-xs text-stocky-text-main px-2">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-stocky-border-subtle text-stocky-text-main hover:bg-stocky-bg-global disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer rtl:rotate-180"
            >
              <ChevronRightIcon size="xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
