import React from 'react';
import type { Location, StockActivityLog, CompanyUserRole } from '@stocky/types';
import { PlatformPageLayout } from './PlatformPageLayout';
import { StockActivityLogWidget } from '@/widgets';

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
  return (
    <PlatformPageLayout
      eyebrow="Audit trail"
      title="Activity logs"
      subtitle="A permanent record of stock work, tasks, movements, and operational decisions."
    >
      <StockActivityLogWidget {...props} />
    </PlatformPageLayout>
  );
}
