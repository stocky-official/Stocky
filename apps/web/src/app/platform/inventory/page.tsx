'use client';

import { usePlatform } from '@/views/platform/PlatformContext';
import { InventoryPlatformView } from '@/views/platform/pages/InventoryPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function InventoryRoutePage() {
  const platform = usePlatform();

  if (platform.loading) {
    return <PlatformWorkspaceSkeleton variant="stock" />;
  }

  return (
    <InventoryPlatformView
      companyId={platform.companyId}
      products={platform.products}
      lots={platform.lots}
      locations={platform.visibleLocations}
      suppliers={platform.suppliers}
      selectedLocationId={platform.locationScope}
      locationName={platform.locationName}
      userRole={platform.userRole}
      searchQuery={platform.globalSearchQuery}
      onReceive={platform.openReceive}
      onEditProduct={platform.canEditStock ? platform.openProductEdit : undefined}
      onDeleteProduct={platform.canEditStock ? platform.deleteProduct : undefined}
      onSaveLot={platform.canEditStock ? platform.updateLotRecord : undefined}
      onDeleteLot={platform.canEditStock ? platform.deleteLot : undefined}
      onExpiry={() => platform.navigateToTab('expiry')}
      onTransfer={(productId) => {
        platform.setTransferProductId(productId);
        platform.navigateToTab('transfers');
      }}
      onSupplierRequest={(productId) => {
        platform.setSupplierProductId(productId);
        platform.navigateToTab('suppliers');
      }}
      onExport={platform.canManage ? platform.exportStock : undefined}
      onImportSuccess={platform.refresh}
      members={platform.teamMembers}
      assignments={platform.teamAssignments}
      tasks={platform.tasks}
      taskItems={platform.taskItems}
      canManageTasks={platform.canManageTasks}
      onCreateTask={platform.createStockTask}
    />
  );
}
