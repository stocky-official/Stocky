import React from 'react';
import type { CompanyUserRole } from '@stocky/types';
import { PlatformPageLayout } from './PlatformPageLayout';
import { CompanySettingsSummaryWidget } from '@/widgets';

export interface SettingsPlatformViewProps {
  companyName?: string | null;
  userName?: string | null;
  userTitle?: string | null;
  userRole?: CompanyUserRole;
}

/**
 * SettingsPlatformView (PageView)
 * Orchestrates layout, header, and settings workspace.
 */
export function SettingsPlatformView({
  companyName,
  userName,
  userTitle,
  userRole = 'owner',
}: SettingsPlatformViewProps) {
  const isStaff = userRole === 'staff';
  const isManager = userRole === 'manager';

  const eyebrow = isStaff ? 'Your account' : isManager ? 'Branch settings' : 'Company settings';
  const subtitle = isStaff
    ? `${userName || 'Your profile'} · ${userTitle || 'Staff member'}.`
    : `${companyName || 'Your company'} · Workspace preferences and organization setup.`;

  return (
    <PlatformPageLayout
      eyebrow={eyebrow}
      title="Settings"
      subtitle={subtitle}
    >
      <CompanySettingsSummaryWidget
        companyName={companyName}
        userName={userName}
        userTitle={userTitle}
        userRole={userRole}
      />
    </PlatformPageLayout>
  );
}
