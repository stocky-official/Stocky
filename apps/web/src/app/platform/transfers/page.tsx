'use client';

import { usePlatform } from '@/views/platform/PlatformContext';
import { TransfersPlatformView } from '@/views/platform/pages/TransfersPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function TransfersRoutePage() {
  const platform = usePlatform();

  if (platform.loading) {
    return <PlatformWorkspaceSkeleton variant="transfers" />;
  }

  return (
    <TransfersPlatformView
      transfers={platform.transfers}
      products={platform.products}
      lots={platform.lots}
      locations={platform.visibleLocations}
      selectedLocationId={platform.locationScope}
      defaultProductId={platform.transferProductId}
      userRole={platform.userRole}
      canApprove={platform.canApproveTransfers}
      onCreate={platform.createTransfer}
      onApprove={platform.approveTransfer}
      onReceive={platform.receiveTransfer}
    />
  );
}
