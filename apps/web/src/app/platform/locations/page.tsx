'use client';

import { usePlatform } from '@/views/platform/PlatformContext';
import { LocationsPlatformView } from '@/views/platform/pages/LocationsPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function LocationsRoutePage() {
  const platform = usePlatform();

  if (platform.loading) {
    return <PlatformWorkspaceSkeleton variant="locations" />;
  }

  return (
    <LocationsPlatformView
      locations={platform.visibleLocations}
      products={platform.products}
      lots={platform.lots}
      transfers={platform.transfers}
      counts={platform.counts}
      shifts={platform.attendanceShifts}
      members={platform.teamMembers}
      assignments={platform.teamAssignments}
      canManage={platform.canManage}
      companyId={platform.companyId}
      onCreate={platform.createLocation}
      onUpdate={platform.updateLocation}
      onAssignLocation={platform.assignLocation}
      onUnassignLocation={platform.unassignLocation}
      onOpenStock={(locationId) => {
        platform.setSelectedLocationId(locationId);
        platform.navigateToTab('stock');
      }}
    />
  );
}
