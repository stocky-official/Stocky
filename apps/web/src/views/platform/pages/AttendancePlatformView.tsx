'use client';

import React from 'react';
import type {
  AttendanceShift,
  LeaveRequest,
  LeaveBalance,
  Location,
  LeaveType,
  PunchMethod,
} from '@stocky/types';
import { PlatformPageLayout } from './PlatformPageLayout';
import { AttendanceWorkspaceWidget } from '@/widgets/AttendanceWorkspaceWidget';
import { CalendarIcon, CheckCircleIcon } from '@stocky/icons';

export interface AttendancePlatformViewProps {
  shifts: AttendanceShift[];
  leaves: LeaveRequest[];
  balances: LeaveBalance[];
  locations: Location[];
  members: any[];
  userRole: string;
  currentUserId?: string | null;
  onPunchAttendance: (input: {
    locationId: string;
    method?: PunchMethod;
    qrToken?: string;
    notes?: string;
  }) => Promise<AttendanceShift>;
  onSubmitLeave: (input: {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    daysCount: number;
    managerUserId: string;
    reason?: string;
  }) => Promise<void>;
  onReviewLeave: (requestId: string, approve: boolean, note?: string) => Promise<void>;
}

export function AttendancePlatformView(props: AttendancePlatformViewProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const presentToday = props.shifts.filter(
    (s) => s.shiftDate === todayStr || s.clockInAt?.startsWith(todayStr)
  ).length;

  return (
    <PlatformPageLayout
      title="Attendance & Timesheets"
      subtitle="Track employee shifts, punch-ins, Google-style calendar attendance, and PTO requests."
      actions={
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full stocky-status-info border px-3 py-1 text-xs font-medium">
            <CheckCircleIcon size="xs" />
            <span>{presentToday} staff present today</span>
          </span>
        </div>
      }
    >
      <AttendanceWorkspaceWidget {...props} />
    </PlatformPageLayout>
  );
}
