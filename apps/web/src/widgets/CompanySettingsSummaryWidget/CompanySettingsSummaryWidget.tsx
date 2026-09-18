'use client';

import React from 'react';
import type { CompanyUserRole } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';

export interface CompanySettingsSummaryWidgetProps {
  companyName?: string | null;
  userName?: string | null;
  userTitle?: string | null;
  userRole?: CompanyUserRole;
}

export function CompanySettingsSummaryWidget({ companyName, userName, userTitle, userRole = 'owner' }: CompanySettingsSummaryWidgetProps) {
  const { t } = useTranslation();
  const isStaff = userRole === 'staff';
  const isManager = userRole === 'manager';
  return (
    <div className="stocky-settings-workspace flex flex-col gap-6">
      <div className="stocky-surface p-6">
        <h2 className="text-base font-semibold text-stocky-text-main">
          {isStaff
            ? t('settings.staffNoticeTitle')
            : isManager
              ? t('settings.managerNoticeTitle')
              : t('settings.ownerNoticeTitle')}
        </h2>
        <p className="text-sm text-stocky-text-sub mt-1.5">
          {isStaff
            ? t('settings.staffNoticeDesc')
            : isManager
              ? t('settings.managerNoticeDesc')
              : t('settings.ownerNoticeDesc')}
        </p>
      </div>
    </div>
  );
}
