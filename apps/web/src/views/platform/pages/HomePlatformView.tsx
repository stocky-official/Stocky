import React from 'react';
import type { CompanyUserRole } from '@stocky/types';
import { PlusIcon } from '@stocky/icons';
import { PlatformPageLayout } from './PlatformPageLayout';
import { RoleHomeWidget, type RoleHomeMetrics } from '@/widgets';

export interface HomePlatformViewProps {
  userName?: string | null;
  userRole: CompanyUserRole;
  locationName: string;
  metrics: RoleHomeMetrics;
  onOpenStock: () => void;
  onOpenExpiry: () => void;
  onOpenTransfers: () => void;
  onOpenSuppliers: () => void;
  onOpenLocations: () => void;
  onOpenReceive: () => void;
  onOpenCount: () => void;
  onOpenTasks?: () => void;
  onOpenSearch: () => void;
}

const roleCopy: Record<CompanyUserRole, { heading: string; subtitle: string }> = {
  owner: { heading: 'Good morning', subtitle: 'Here is what needs your attention across the company.' },
  admin: { heading: 'Good morning', subtitle: 'Here is what needs attention across your locations.' },
  manager: { heading: 'Your branch today', subtitle: 'Keep stock accurate and act on the items that need attention.' },
  staff: { heading: 'Your tasks today', subtitle: 'Use the quick actions below to keep your branch stock accurate.' },
};

/**
 * HomePlatformView (PageView)
 * Controls page-level layout, header, and primary CTA for the platform Home tab.
 */
export function HomePlatformView({
  userName,
  userRole,
  locationName,
  metrics,
  onOpenStock,
  onOpenExpiry,
  onOpenTransfers,
  onOpenSuppliers,
  onOpenLocations,
  onOpenReceive,
  onOpenCount,
  onOpenTasks,
  onOpenSearch,
}: HomePlatformViewProps) {
  const firstName = userName?.trim().split(/\s+/)[0];
  const copy = roleCopy[userRole] || roleCopy.staff;
  const title = `${copy.heading}${firstName ? `, ${firstName}` : ''}`;

  return (
    <PlatformPageLayout
      title={title}
      subtitle={copy.subtitle}
      actions={
        <button
          type="button"
          onClick={onOpenReceive}
          className="stocky-primary-action h-8 px-3.5 rounded-full bg-stocky-accent text-stocky-text-main text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#E3FF47] transition-colors cursor-pointer"
        >
          <PlusIcon size="xs" />
          <span>Receive stock</span>
        </button>
      }
    >
      <RoleHomeWidget
        userName={userName}
        userRole={userRole}
        locationName={locationName}
        metrics={metrics}
        onOpenStock={onOpenStock}
        onOpenExpiry={onOpenExpiry}
        onOpenTransfers={onOpenTransfers}
        onOpenSuppliers={onOpenSuppliers}
        onOpenLocations={onOpenLocations}
        onOpenReceive={onOpenReceive}
        onOpenCount={onOpenCount}
        onOpenTasks={onOpenTasks}
        onOpenSearch={onOpenSearch}
      />
    </PlatformPageLayout>
  );
}
