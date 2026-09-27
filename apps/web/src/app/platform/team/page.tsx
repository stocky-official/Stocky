'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { canOpenTab, usePlatform } from '@/views/platform/PlatformContext';
import { TeamPlatformView } from '@/views/platform/pages/TeamPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function TeamRoutePage() {
  const platform = usePlatform();
  const router = useRouter();

  useEffect(() => {
    if (!platform.loading && !canOpenTab(platform.userRole, 'team', platform.userPermissions)) {
      router.replace(platform.tenantPrefix || '/platform');
    }
  }, [platform.loading, platform.tenantPrefix, platform.userPermissions, platform.userRole, router]);

  if (platform.loading || !canOpenTab(platform.userRole, 'team', platform.userPermissions)) {
    return <PlatformWorkspaceSkeleton variant="team" />;
  }

  return (
    <TeamPlatformView
      members={platform.teamMembers}
      locations={platform.visibleLocations}
      assignments={platform.teamAssignments}
      canManage={platform.canManage}
      onInvite={platform.inviteMember}
      onUpdateMember={platform.updateMemberDetails}
      onRoleChange={platform.updateMemberRole}
      onAssign={platform.assignLocation}
      onUnassign={platform.unassignLocation}
    />
  );
}
