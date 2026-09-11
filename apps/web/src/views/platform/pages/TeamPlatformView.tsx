import React, { useState } from 'react';
import type { CompanyUserRole, Location } from '@stocky/types';
import { PlusIcon } from '@stocky/icons';
import { PlatformPageLayout } from './PlatformPageLayout';
import { TeamAccessWidget } from '@/widgets';

type TeamMember = { id: string; email: string; full_name?: string | null; avatar_url?: string | null; role: CompanyUserRole; status?: string };
type Assignment = { id: string; user_id: string; location_id: string };

export interface TeamPlatformViewProps {
  members: TeamMember[];
  locations: Location[];
  assignments: Assignment[];
  canManage: boolean;
  onInvite: (input: { email: string; fullName?: string; role: CompanyUserRole; locationId?: string }) => Promise<void>;
  onRoleChange: (memberId: string, role: CompanyUserRole) => Promise<void>;
  onAssign: (memberId: string, locationId: string) => Promise<void>;
  onUnassign: (assignmentId: string) => Promise<void>;
}

/**
 * TeamPlatformView (PageView)
 * Orchestrates layout, header, and team invitation / location assignment workflows.
 */
export function TeamPlatformView(props: TeamPlatformViewProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <PlatformPageLayout
      eyebrow="People and access"
      title="Team management"
      subtitle="Invite members with simple roles and assign the locations they can work in."
      actions={
        props.canManage ? (
          <button
            type="button"
            onClick={() => setIsInviteOpen((prev) => !prev)}
            className="stocky-primary-action h-9 px-4 rounded-full bg-stocky-accent text-stocky-text-main text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#E3FF47] transition-colors cursor-pointer"
          >
            <PlusIcon size="xs" />
            <span>{isInviteOpen ? 'Close invite' : 'Invite member'}</span>
          </button>
        ) : undefined
      }
    >
      <TeamAccessWidget
        {...props}
        isInviteOpen={isInviteOpen}
        onToggleInvite={() => setIsInviteOpen((prev) => !prev)}
      />
    </PlatformPageLayout>
  );
}
