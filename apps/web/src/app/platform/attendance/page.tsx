'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { canOpenTab, usePlatform } from '@/views/platform/PlatformContext';
import { AttendancePlatformView } from '@/views/platform/pages/AttendancePlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function AttendanceRoutePage() {
  const platform = usePlatform();
  const router = useRouter();

  useEffect(() => {
    if (!platform.loading && !canOpenTab(platform.userRole, 'attendance', platform.userPermissions)) {
      router.replace(platform.tenantPrefix || '/platform');
    }
  }, [platform.loading, platform.tenantPrefix, platform.userPermissions, platform.userRole, router]);

  if (platform.loading || !canOpenTab(platform.userRole, 'attendance', platform.userPermissions)) {
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
