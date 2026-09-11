'use client';

import { usePlatform } from '@/views/platform/PlatformContext';
import { NotificationsPlatformView } from '@/views/platform/pages/NotificationsPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function NotificationsRoutePage() {
  const platform = usePlatform();

  if (platform.loading) {
    return <PlatformWorkspaceSkeleton variant="table" hasTabs={false} />;
  }

  return (
    <NotificationsPlatformView
      items={platform.notificationItems}
    />
  );
}
