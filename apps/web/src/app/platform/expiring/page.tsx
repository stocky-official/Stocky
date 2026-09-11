'use client';

import { usePlatform } from '@/views/platform/PlatformContext';
import { ExpiringPlatformView } from '@/views/platform/pages/ExpiringPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function ExpiringRoutePage() {
  const platform = usePlatform();

  if (platform.loading) {
    return <PlatformWorkspaceSkeleton variant="table" />;
  }

  return (
    <ExpiringPlatformView
      products={platform.products}
      lots={platform.lots}
      locations={platform.visibleLocations}
      selectedLocationId={platform.locationScope}
      userRole={platform.userRole}
      onLocationChange={platform.setSelectedLocationId}
      onAction={platform.resolveExpiry}
      onSupplierRequest={(input) =>
        platform.createSupplierRequest({
          productId: input.productId,
          locationId: input.locationId,
          quantity: input.quantity,
          supplierId: input.supplierId,
          requestType: input.type,
        })
      }
      onTransferRequest={(productId, locationId) => {
        platform.setSelectedLocationId(locationId);
        platform.setTransferProductId(productId);
        platform.navigateToTab('transfers');
      }}
      onUpdateLot={platform.updateLotDetails}
    />
  );
}
