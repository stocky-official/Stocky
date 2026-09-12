'use client';

import { usePlatform } from '@/views/platform/PlatformContext';
import { ActivityLogsPlatformView } from '@/views/platform/pages/ActivityLogsPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function ActivityRoutePage() {
  const platform = usePlatform();

  if (platform.loading) {
    return <PlatformWorkspaceSkeleton variant="activity" />;
  }

  return (
    <ActivityLogsPlatformView
      logs={platform.activityLogs}
      locations={platform.visibleLocations}
      members={platform.teamMembers}
    />
  );
}
