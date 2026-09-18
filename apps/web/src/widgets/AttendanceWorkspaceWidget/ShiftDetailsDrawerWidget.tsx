'use client';

import React from 'react';
import type { AttendanceShift, Location } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { ClockIcon, WarehouseIcon, QrCodeIcon, CheckCircleIcon, XIcon } from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

export interface ShiftDetailsDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  shift: AttendanceShift | null;
  locations: Location[];
  members: any[];
}

export function ShiftDetailsDrawerWidget({
  isOpen,
  onClose,
  shift,
  locations,
  members,
}: ShiftDetailsDrawerWidgetProps) {
  const { t, language } = useTranslation();
  if (!shift) return null;

  const member = members.find((m) => m.id === shift.companyUserId);
  const location = locations.find((l) => l.id === shift.locationId);
  const memberName = member?.full_name || member?.email?.split('@')[0] || t('team.roles.staff');
  const isOngoing = !shift.clockOutAt;

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('drawers.shiftDetails.title')}
    >
      <div className="flex items-start justify-between gap-4 border-b border-stocky-border-subtle px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border stocky-status-info">
            <ClockIcon size="xs" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-medium text-stocky-text-main">{t('drawers.shiftDetails.title')}</h2>
            <p className="mt-1 text-xs text-stocky-text-sub">
              {t('drawers.shiftDetails.subtitle', { date: shift.shiftDate })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-stocky-text-sub hover:bg-stocky-bg-global"
          aria-label={t('common.close')}
        >
          <XIcon size="xs" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Employee Info */}
        <div className="flex items-center gap-3.5 p-4 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle">
          <div className="w-12 h-12 rounded-full bg-stocky-primary/10 text-stocky-primary flex items-center justify-center font-semibold text-base">
            {memberName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-stocky-text-main">{memberName}</div>
            <div className="text-xs text-stocky-text-sub">{member?.email}</div>
            <div className="text-[11px] text-stocky-primary font-semibold capitalize mt-0.5">
              {member?.role || t('team.roles.staff')}
            </div>
          </div>
        </div>

        {/* Timestamps Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget shadow-sm">
            <div className="text-[11px] text-stocky-text-sub font-medium mb-1">{t('drawers.shiftDetails.clockIn')}</div>
            <div className="text-sm font-semibold text-stocky-text-main">
              {formatTime(shift.clockInAt)}
            </div>
            <div className="text-[10px] text-stocky-text-sub capitalize mt-0.5">
              {t('drawers.shiftDetails.via', { method: shift.punchInMethod })}
            </div>
          </div>

          <div className="p-3.5 rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget shadow-sm">
            <div className="text-[11px] text-stocky-text-sub font-medium mb-1">{t('drawers.shiftDetails.clockOut')}</div>
            <div className="text-sm font-semibold text-stocky-text-main">
              {isOngoing ? (
                <span className="text-stocky-primary">{t('drawers.shiftDetails.active')}</span>
              ) : (
                formatTime(shift.clockOutAt)
              )}
            </div>
            <div className="text-[10px] text-stocky-text-sub capitalize mt-0.5">
              {isOngoing ? t('drawers.shiftDetails.currentlyWorking') : t('drawers.shiftDetails.via', { method: shift.punchOutMethod || 'system' })}
            </div>
          </div>
        </div>

        {/* Branch & Status Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-widget bg-stocky-bg-widget border border-stocky-border-subtle text-xs shadow-sm">
            <span className="text-stocky-text-sub flex items-center gap-1.5">
              <WarehouseIcon size="xs" /> {t('drawers.shiftDetails.branch')}
            </span>
            <span className="font-semibold text-stocky-text-main">{location?.name || t('drawers.shiftDetails.mainBranch')}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-widget bg-stocky-bg-widget border border-stocky-border-subtle text-xs shadow-sm">
            <span className="text-stocky-text-sub flex items-center gap-1.5">
              <ClockIcon size="xs" /> {t('drawers.shiftDetails.duration')}
            </span>
            <span className="font-semibold text-stocky-text-main">
              {shift.totalMinutes ? t('drawers.shiftDetails.durationHoursMins', { hours: Math.floor(shift.totalMinutes / 60), mins: shift.totalMinutes % 60 }) : t('drawers.shiftDetails.inProgress')}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-widget bg-stocky-bg-widget border border-stocky-border-subtle text-xs shadow-sm">
            <span className="text-stocky-text-sub flex items-center gap-1.5">
              <CheckCircleIcon size="xs" /> {t('drawers.shiftDetails.status')}
            </span>
            <span className="font-semibold text-stocky-text-main uppercase tracking-wider text-[11px]">
              {shift.status}
            </span>
          </div>
        </div>

        {shift.notes && (
          <div className="p-3.5 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle">
            <div className="text-[11px] font-semibold text-stocky-text-sub mb-1">{t('drawers.shiftDetails.notes')}</div>
            <p className="text-xs text-stocky-text-main leading-relaxed">{shift.notes}</p>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
