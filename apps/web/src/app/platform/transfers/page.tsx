'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { canOpenTab, usePlatform } from '@/views/platform/PlatformContext';
import { TransfersPlatformView } from '@/views/platform/pages/TransfersPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function TransfersRoutePage() {
  const platform = usePlatform();
  const router = useRouter();

  useEffect(() => {
    if (!platform.loading && !canOpenTab(platform.userRole, 'transfers', platform.userPermissions)) {
      router.replace(platform.tenantPrefix || '/platform');
    }
  }, [platform.loading, platform.tenantPrefix, platform.userPermissions, platform.userRole, router]);

  if (platform.loading || !canOpenTab(platform.userRole, 'transfers', platform.userPermissions)) {
    return <PlatformWorkspaceSkeleton variant="transfers" />;
  }

  return (
    <TransfersPlatformView
      transfers={platform.transfers}
      transferLines={platform.transferLines}
      products={platform.products}
      lots={platform.lots}
      locations={platform.userRole === 'manager' ? platform.locations : platform.visibleLocations}
      selectedLocationId={platform.locationScope}
      defaultProductId={platform.transferProductId}
      userRole={platform.userRole}
      receiveLocationId={platform.userRole === 'manager' ? platform.locationScope : undefined}
      canApprove={platform.canApproveTransfers}
      onCreate={platform.createTransfer}
      onApprove={platform.approveTransfer}
      onReceive={platform.receiveTransfer}
    />
  );
}
