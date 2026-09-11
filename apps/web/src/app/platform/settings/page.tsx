'use client';

import { usePlatform } from '@/views/platform/PlatformContext';
import { SettingsPlatformView } from '@/views/platform/pages/SettingsPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function SettingsRoutePage() {
  const platform = usePlatform();

  if (platform.loading) {
    return <PlatformWorkspaceSkeleton variant="cards" />;
  }

  return (
    <SettingsPlatformView
      companyName={platform.company?.name}
      userName={platform.userName}
      userTitle={
        platform.userRole === 'manager'
          ? 'Branch manager'
          : platform.userRole === 'staff'
          ? 'Staff member'
          : platform.userRole === 'admin'
          ? 'Administrator'
          : 'Owner'
      }
      userRole={platform.userRole}
    />
  );
}
