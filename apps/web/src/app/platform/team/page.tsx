'use client';

import { usePlatform } from '@/views/platform/PlatformContext';
import { TeamPlatformView } from '@/views/platform/pages/TeamPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function TeamRoutePage() {
  const platform = usePlatform();

  if (platform.loading) {
    return <PlatformWorkspaceSkeleton variant="team" />;
  }

  return (
    <TeamPlatformView
      members={platform.teamMembers}
      locations={platform.visibleLocations}
      assignments={platform.teamAssignments}
      canManage={platform.canManage}
      onInvite={platform.inviteMember}
      onRoleChange={platform.updateMemberRole}
      onAssign={platform.assignLocation}
      onUnassign={platform.unassignLocation}
    />
  );
}
