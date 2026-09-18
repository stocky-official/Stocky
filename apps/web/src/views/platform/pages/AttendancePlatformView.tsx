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
import { AttendanceWorkspaceWidget, type AttendanceTab } from '@/widgets/AttendanceWorkspaceWidget';
import { CalendarIcon, CheckCircleIcon } from '@stocky/icons';

import { useOptionalPlatform } from '@/views/platform/PlatformContext';
import { PlatformContextTabsWidget } from '@/widgets/PlatformContextTabsWidget/PlatformContextTabsWidget';
import { useTranslation } from '@/lib/i18n';

export interface AttendancePlatformViewProps {
  shifts: AttendanceShift[];
  leaves: LeaveRequest[];
  balances: LeaveBalance[];
  locations: Location[];
  members: any[];
  userRole: string;
  currentUserId?: string | null;
  activeTab?: AttendanceTab;
  onTabChange?: (tab: AttendanceTab) => void;
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
  canManageAttendance?: boolean;
}

export function AttendancePlatformView(props: AttendancePlatformViewProps) {
  const { t } = useTranslation();
  const platform = useOptionalPlatform();
  const activeTab = props.activeTab ?? platform?.attendanceTab ?? 'timesheets';
  const onTabChange = props.onTabChange ?? platform?.setAttendanceTab;

  const todayStr = new Date().toISOString().slice(0, 10);
  const presentToday = props.shifts.filter(
    (s) => s.shiftDate === todayStr || s.clockInAt?.startsWith(todayStr)
  ).length;

  return (
    <PlatformPageLayout
      title={t('attendance.title')}
      subtitle={t('attendance.subtitle')}
      navigation={
        <PlatformContextTabsWidget
          activeTab={platform?.activeTab || 'attendance'}
          onTabChange={platform?.navigateToTab || (() => {})}
          userRole={(props.userRole as any) || platform?.userRole || 'staff'}
          permissions={platform?.userPermissions}
          attendanceTab={activeTab}
          onAttendanceTabChange={onTabChange}
        />
      }
      actions={
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full stocky-status-info border px-3 py-1 text-xs font-medium">
            <CheckCircleIcon size="xs" />
            <span>{presentToday} {t('dashboard.presentToday')}</span>
          </span>
        </div>
      }
    >
      <AttendanceWorkspaceWidget
        {...props}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </PlatformPageLayout>
  );
}
