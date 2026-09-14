import React from 'react';
import type { CompanyUserRole, Location } from '@stocky/types';
import { PlatformPageLayout } from './PlatformPageLayout';
import { TeamWorkspaceWidget, type TeamMemberData } from '@/widgets/TeamWorkspaceWidget';

export interface TeamPlatformViewProps {
  members: TeamMemberData[];
  locations: Location[];
  assignments: Array<{ id: string; user_id: string; location_id: string }>;
  canManage: boolean;
  onInvite: (input: { email: string; fullName?: string; jobTitle?: string; role: CompanyUserRole; locationId?: string; reportsTo?: string }) => Promise<void>;
  onUpdateMember?: (memberId: string, input: { fullName?: string; jobTitle?: string; role?: CompanyUserRole; reportsTo?: string | null; permissions?: Record<string, any> }) => Promise<void>;
  onRoleChange: (memberId: string, role: CompanyUserRole) => Promise<void>;
  onAssign: (memberId: string, locationId: string) => Promise<void>;
  onUnassign: (assignmentId: string) => Promise<void>;
}

/**
 * TeamPlatformView (PageView)
 * Orchestrates layout, clean 2-tier header, and team management workspace.
 */
export function TeamPlatformView(props: TeamPlatformViewProps) {
  return (
    <PlatformPageLayout
      title="Team & Organization"
      subtitle="Manage team roles, job titles, authorizations, and organizational structure."
    >
      <TeamWorkspaceWidget {...props} />
    </PlatformPageLayout>
  );
}

