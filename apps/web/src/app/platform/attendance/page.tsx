'use client';

import React from 'react';
import { usePlatform } from '@/views/platform/PlatformContext';
import { AttendancePlatformView } from '@/views/platform/pages/AttendancePlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function AttendanceRoutePage() {
  const platform = usePlatform();

  if (platform.loading) {
    return <PlatformWorkspaceSkeleton variant="attendance" />;
  }

  return (
    <AttendancePlatformView
      shifts={platform.attendanceShifts}
      leaves={platform.leaveRequests}
      balances={platform.leaveBalances}
      locations={platform.visibleLocations}
      members={platform.teamMembers}
      userRole={platform.userRole}
      currentUserId={platform.companyUserId}
      canManageAttendance={platform.canManageAttendance}
      activeTab={platform.attendanceTab}
      onTabChange={platform.setAttendanceTab}
      onPunchAttendance={platform.punchAttendance}
      onSubmitLeave={platform.submitLeaveRequest}
      onReviewLeave={platform.reviewLeaveRequest}
      onRecordManualAttendance={platform.recordManualAttendance}
    />
  );
}
