'use client';

import React from 'react';
import type { AttendanceShift, Location } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { ClockIcon, WarehouseIcon, QrCodeIcon, CheckCircleIcon, XIcon } from '@stocky/icons';

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
  if (!shift) return null;

  const member = members.find((m) => m.id === shift.companyUserId);
  const location = locations.find((l) => l.id === shift.locationId);
  const memberName = member?.full_name || member?.email?.split('@')[0] || 'Staff Member';
  const isOngoing = !shift.clockOutAt;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Shift Details"
    >
      <div className="flex items-start justify-between gap-4 border-b border-stocky-border-subtle px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border stocky-status-info">
            <ClockIcon size="xs" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-medium text-stocky-text-main">Shift Details</h2>
            <p className="mt-1 text-xs text-stocky-text-sub">
              Attendance record for {shift.shiftDate}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-stocky-text-sub hover:bg-stocky-bg-global"
          aria-label="Close"
        >
          <XIcon size="xs" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Employee Info */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-stocky-bg-global/40 border border-stocky-border-subtle">
          <div className="w-12 h-12 rounded-full bg-stocky-primary/10 text-stocky-primary flex items-center justify-center font-bold text-base">
            {memberName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-stocky-text-main">{memberName}</div>
            <div className="text-xs text-stocky-text-sub">{member?.email}</div>
            <div className="text-[11px] text-stocky-primary font-semibold capitalize mt-0.5">
              {member?.role || 'Staff'}
            </div>
          </div>
        </div>

        {/* Timestamps Card */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-stocky-border-subtle bg-white">
            <div className="text-[11px] text-stocky-text-sub font-medium mb-1">Clock In</div>
            <div className="text-sm font-bold text-stocky-text-main">
              {shift.clockInAt ? new Date(shift.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </div>
            <div className="text-[10px] text-stocky-text-sub capitalize mt-0.5">
              via {shift.punchInMethod}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-stocky-border-subtle bg-white">
            <div className="text-[11px] text-stocky-text-sub font-medium mb-1">Clock Out</div>
            <div className="text-sm font-bold text-stocky-text-main">
              {isOngoing ? (
                <span className="text-blue-600">Active</span>
              ) : (
                new Date(shift.clockOutAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              )}
            </div>
            <div className="text-[10px] text-stocky-text-sub capitalize mt-0.5">
              {isOngoing ? 'Currently working' : `via ${shift.punchOutMethod || 'system'}`}
            </div>
          </div>
        </div>

        {/* Branch & Status Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stocky-border-subtle text-xs">
            <span className="text-stocky-text-sub flex items-center gap-1.5">
              <WarehouseIcon size="xs" /> Branch
            </span>
            <span className="font-semibold text-stocky-text-main">{location?.name || 'Main Branch'}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stocky-border-subtle text-xs">
            <span className="text-stocky-text-sub flex items-center gap-1.5">
              <ClockIcon size="xs" /> Total Duration
            </span>
            <span className="font-semibold text-stocky-text-main">
              {shift.totalMinutes ? `${Math.floor(shift.totalMinutes / 60)} hrs ${shift.totalMinutes % 60} mins` : 'In progress'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stocky-border-subtle text-xs">
            <span className="text-stocky-text-sub flex items-center gap-1.5">
              <CheckCircleIcon size="xs" /> Shift Status
            </span>
            <span className="font-semibold text-stocky-text-main uppercase tracking-wider text-[11px]">
              {shift.status}
            </span>
          </div>
        </div>

        {shift.notes && (
          <div className="p-3.5 rounded-xl bg-stocky-bg-global/50 border border-stocky-border-subtle">
            <div className="text-[11px] font-semibold text-stocky-text-sub mb-1">Shift Notes</div>
            <p className="text-xs text-stocky-text-main leading-relaxed">{shift.notes}</p>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
