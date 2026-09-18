'use client';

import React from 'react';
import type { CompanyUserRole } from '@stocky/types';
import { PlatformPageLayout } from './PlatformPageLayout';
import { CompanySettingsSummaryWidget } from '@/widgets';
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();
  const isStaff = userRole === 'staff';
  const subtitle = isStaff
    ? t('settings.staffSubtitle', { name: userName || 'Your profile', title: userTitle || 'Staff member' })
    : t('settings.subtitle', { company: companyName || 'Your company' });

  return (
    <PlatformPageLayout
      title={t('settings.title')}
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
