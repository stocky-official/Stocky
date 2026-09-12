'use client';

import { usePlatform } from '@/views/platform/PlatformContext';
import { HomePlatformView } from '@/views/platform/pages/HomePlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function PlatformHomePage() {
  const platform = usePlatform();

  if (platform.loading) {
    return <PlatformWorkspaceSkeleton variant="dashboard" hasTabs={true} />;
  }

  return (
    <HomePlatformView
      userName={platform.userName}
      userRole={platform.userRole}
      locationName={platform.locationName}
      metrics={platform.metrics}
      onOpenStock={() => platform.navigateToTab('stock')}
      onOpenExpiry={() => platform.navigateToTab('expiry')}
      onOpenTransfers={() => platform.navigateToTab('transfers')}
      onOpenSuppliers={() => platform.navigateToTab('suppliers')}
      onOpenLocations={() => platform.navigateToTab('locations')}
      onOpenReceive={() => platform.openReceive()}
      onOpenCount={() => platform.navigateToTab('stock')}
      onOpenTasks={() => platform.navigateToTab('tasks')}
      onOpenSearch={() => platform.navigateToTab('stock')}
    />
  );
}
