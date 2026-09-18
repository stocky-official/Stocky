'use client';

import React from 'react';
import type { Location, StockActivityLog, CompanyUserRole } from '@stocky/types';
import { PlatformPageLayout } from './PlatformPageLayout';
import { StockActivityLogWidget } from '@/widgets';
import { useTranslation } from '@/lib/i18n';

type TeamMember = { id: string; email: string; full_name?: string | null; role: CompanyUserRole };

export interface ActivityLogsPlatformViewProps {
  logs: StockActivityLog[];
  locations: Location[];
  members: TeamMember[];
}

/**
 * ActivityLogsPlatformView (PageView)
 * Orchestrates layout, header, and the permanent audit trail.
 */
export function ActivityLogsPlatformView(props: ActivityLogsPlatformViewProps) {
  const { t } = useTranslation();
  return (
    <PlatformPageLayout
      title={t('logs.title')}
      subtitle={t('logs.subtitle')}
    >
      <StockActivityLogWidget {...props} />
    </PlatformPageLayout>
  );
}
