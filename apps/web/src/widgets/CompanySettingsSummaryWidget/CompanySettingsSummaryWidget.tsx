'use client';

import type { CompanyUserRole } from '@stocky/types';

export interface CompanySettingsSummaryWidgetProps {
  companyName?: string | null;
  userName?: string | null;
  userTitle?: string | null;
  userRole?: CompanyUserRole;
}

export function CompanySettingsSummaryWidget({ companyName, userName, userTitle, userRole = 'owner' }: CompanySettingsSummaryWidgetProps) {
  const isStaff = userRole === 'staff';
  const isManager = userRole === 'manager';
  return (
    <div className="stocky-settings-workspace flex flex-col gap-6">
      <div className="stocky-surface p-6">
        <h2 className="text-base font-semibold text-stocky-text-main">
          {isStaff
            ? 'Your access is managed by your branch manager'
            : isManager
              ? 'Keep branch work simple'
              : 'Keep daily work simple'}
        </h2>
        <p className="text-sm text-stocky-text-sub mt-1.5">
          {isStaff
            ? 'Ask your manager if you need a different branch or permission.'
            : isManager
              ? 'Company-wide settings are managed by the owner or admin.'
              : 'Advanced company configuration will appear here as it becomes necessary.'}
        </p>
      </div>
    </div>
  );
}
