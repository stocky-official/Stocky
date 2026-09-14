'use client';

import { usePlatform } from '@/views/platform/PlatformContext';
import { SuppliersPlatformView } from '@/views/platform/pages/SuppliersPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function SuppliersRoutePage() {
  const platform = usePlatform();

  if (platform.loading) {
    return <PlatformWorkspaceSkeleton variant="suppliers" />;
  }

  return (
    <SuppliersPlatformView
      requests={platform.requests}
      products={platform.products}
      locations={platform.visibleLocations}
      suppliers={platform.suppliers}
      supplierContacts={platform.supplierContacts}
      supplierProducts={platform.supplierProducts}
      userRole={platform.userRole}
      selectedLocationId={platform.locationScope}
      defaultProductId={platform.supplierProductId}
      activeSupplierTab={platform.supplierTab}
      onSupplierTabChange={platform.setSupplierTab}
      onCreate={platform.createSupplierRequest}
      onCreateSupplier={platform.createSupplier}
      onCreateSupplierContact={platform.createSupplierContact}
      onUpdateSupplierContact={platform.updateSupplierContact}
      onDeleteSupplierContact={platform.deleteSupplierContact}
      onSetPrimarySupplierContact={platform.setPrimarySupplierContact}
      onStatusChange={platform.updateSupplierRequest}
      onLinkProduct={platform.linkSupplierProduct}
      onUnlinkProduct={platform.unlinkSupplierProduct}
    />
  );
}
