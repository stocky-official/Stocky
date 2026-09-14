'use client';

import type { UIEvent } from 'react';
import type { AttendanceShift, CompanyUserRole, CreateStockTaskCommand, InventoryTransfer, Location, Product, StockActivityLog, StockLot, StockTask, StockTaskExpected, StockTaskItem, Supplier, SupplierContact, SupplierProduct, SupplierRequest } from '@stocky/types';
import { PlatformContextTabsWidget } from '../PlatformContextTabsWidget/PlatformContextTabsWidget';
import { PlatformWorkspaceSkeleton } from '../PlatformWorkspaceSkeleton/PlatformWorkspaceSkeleton';
import { HydrationFadeWrapper } from '@/components/ui/Skeleton';
import type { NotificationQueueItem } from '../NotificationCenterWidget/NotificationCenterWidget';
import type { SupplierContactInput } from '../SupplierContactsDrawerWidget/SupplierContactsDrawerWidget';
import type { StockLotUpdateInput } from '../StockLotEditDrawerWidget/StockLotEditDrawerWidget';
import {
  HomePlatformView,
  NotificationsPlatformView,
  TasksPlatformView,
  StockPlatformView,
  ExpiringPlatformView,
  LocationsPlatformView,
  SuppliersPlatformView,
  TransfersPlatformView,
  ActivityLogsPlatformView,
  TeamPlatformView,
  SettingsPlatformView,
} from '@/views/platform/pages';

export interface PlatformWorkspaceWidgetProps {
  activeTab: string;
  loading: boolean;
  userName?: string | null;
  companyId: string;
  userRole: CompanyUserRole;
  companyName?: string | null;
  locationName: string;
  metrics: {
    expiredLots: number;
    expiringLots: number;
    lowStockProducts: number;
    pendingTransfers: number;
    supplierRequests: number;
    openCounts: number;
  };
  notificationItems: NotificationQueueItem[];
  products: Product[];
  lots: StockLot[];
  locations: Location[];
  suppliers: Supplier[];
  supplierContacts: SupplierContact[];
  supplierProducts: SupplierProduct[];
  requests: SupplierRequest[];
  transfers: InventoryTransfer[];
  counts: any[];
  attendanceShifts?: AttendanceShift[];
  teamMembers: any[];
  teamAssignments: any[];
  activityLogs: StockActivityLog[];
  tasks: StockTask[];
  taskItems: StockTaskItem[];
  taskExpected: StockTaskExpected[];
  currentUserId?: string | null;
  selectedLocationId: string;
  searchQuery: string;
  taskScanQuery?: string;
  defaultTransferProductId?: string;
  defaultSupplierProductId?: string;
  canManage: boolean;
  canManageTasks: boolean;
  onTabChange: (tab: string) => void;
  onScroll: (event: UIEvent<HTMLElement>) => void;
  onOpenReceive: (productId?: string) => void;
  onOpenCount: (locationId?: string) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  onSaveLot?: (lot: StockLot, input: StockLotUpdateInput) => Promise<void>;
  onDeleteLot?: (lot: StockLot) => void | Promise<void>;
  onProductTransfer: (productId?: string) => void;
  onProductSupplierRequest: (productId?: string) => void;
  onLocationChange: (locationId: string) => void;
  onCreateLocation: (input: { name: string; type: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string; imageUrl?: string }) => void;
  onUpdateLocation?: (locationId: string, input: { name?: string; type?: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string | null; imageUrl?: string | null }) => void;
  onCreateSupplierRequest: (input: { productId: string; locationId: string; supplierId?: string; requestType: 'replenish' | 'return' | 'replace'; quantity?: number }) => void;
  onCreateSupplier: (input: { name: string; address?: string; contactName: string; contactPhone: string; contactEmail?: string }) => Promise<unknown>;
  onCreateSupplierContact: (input: SupplierContactInput) => Promise<void>;
  onUpdateSupplierContact: (contact: SupplierContact, input: SupplierContactInput) => Promise<void>;
  onDeleteSupplierContact: (contact: SupplierContact) => Promise<void>;
  onSetPrimarySupplierContact: (contact: SupplierContact) => Promise<void>;
  onUpdateSupplierRequest: (request: SupplierRequest, status: SupplierRequest['status']) => void;
  onLinkSupplierProduct: (input: { supplierId: string; productId: string; supplierSku?: string; unitCost?: number }) => Promise<void>;
  onUnlinkSupplierProduct: (supplierProductId: string) => Promise<void>;
  onResolveExpiry: (lot: StockLot, action: 'hold' | 'dispose' | 'return' | 'replace', reason?: string) => void;
  onSupplierExpiryRequest: (input: { productId: string; locationId: string; quantity: number; supplierId?: string; type: 'return' | 'replace' }) => void;
  onTransferExpiryRequest: (productId: string, locationId: string) => void;
  onUpdateLot: (lot: StockLot, input: { lotNumber?: string; expiryDate: string; notificationDays: number }) => void;
  onCreateTransfer: (input: { sourceLocationId: string; destinationLocationId: string; lines: Array<{ productId: string; quantity: number }>; note?: string }) => void;
  onApproveTransfer: (transfer: InventoryTransfer) => void;
  onReceiveTransfer: (transfer: InventoryTransfer, lines?: Array<{ lineId: string; quantityReceived: number }>, note?: string) => void;
  onCreateTask: (input: CreateStockTaskCommand) => Promise<void>;
  onStartTask: (taskId: string) => Promise<void>;
  onSubmitTask: (taskId: string, items: Array<{ taskItemId: string; countedQuantity?: number | null; observedExpiryDate?: string | null; note?: string | null }>) => Promise<void>;
  onReviewTask: (taskId: string, approve: boolean, note?: string) => Promise<void>;
  onInvite: (input: { email: string; fullName?: string; role: CompanyUserRole; locationId?: string }) => Promise<void>;
  onRoleChange: (memberId: string, role: CompanyUserRole) => Promise<void>;
  onAssignLocation: (memberId: string, locationId: string) => Promise<void>;
  onUnassignLocation: (assignmentId: string) => Promise<void>;
  onExport?: () => void;
  onImportSuccess?: () => void;
  supplierTab?: 'suppliers' | 'requests';
  onSupplierTabChange?: (tab: 'suppliers' | 'requests') => void;
  taskTab?: 'ongoing' | 'completed';
  onTaskTabChange?: (tab: 'ongoing' | 'completed') => void;
  onOpenScanner?: () => void;
  onOpenNotifications?: () => void;
}

export function PlatformWorkspaceWidget({
  activeTab,
  loading,
  userName,
  companyId,
  userRole,
  supplierTab,
  onSupplierTabChange,
  taskTab,
  onTaskTabChange,
  companyName,
  locationName,
  metrics,
  notificationItems,
  products,
  lots,
  locations,
  suppliers,
  supplierContacts,
  supplierProducts,
  requests,
  transfers,
  counts,
  attendanceShifts = [],
  teamMembers,
  teamAssignments,
  activityLogs,
  tasks,
  taskItems,
  taskExpected,
  currentUserId,
  selectedLocationId,
  searchQuery,
  taskScanQuery,
  defaultTransferProductId,
  defaultSupplierProductId,
  canManage,
  canManageTasks,
  onTabChange,
  onScroll,
  onOpenReceive,
  onOpenCount,
  onEditProduct,
  onDeleteProduct,
  onSaveLot,
  onDeleteLot,
  onProductTransfer,
  onProductSupplierRequest,
  onLocationChange,
  onCreateLocation,
  onUpdateLocation,
  onCreateSupplierRequest,
  onCreateSupplier,
  onCreateSupplierContact,
  onUpdateSupplierContact,
  onDeleteSupplierContact,
  onSetPrimarySupplierContact,
  onUpdateSupplierRequest,
  onLinkSupplierProduct,
  onUnlinkSupplierProduct,
  onResolveExpiry,
  onSupplierExpiryRequest,
  onTransferExpiryRequest,
  onUpdateLot,
  onCreateTransfer,
  onApproveTransfer,
  onReceiveTransfer,
  onCreateTask,
  onStartTask,
  onSubmitTask,
  onReviewTask,
  onInvite,
  onRoleChange,
  onAssignLocation,
  onUnassignLocation,
  onExport,
  onImportSuccess,
  onOpenScanner,
  onOpenNotifications,
}: PlatformWorkspaceWidgetProps) {
  const locationScope = selectedLocationId;

  return (
    <main className="flex-1 min-h-0 min-w-0 overflow-y-auto" onScroll={onScroll}>
      <div className="stocky-platform-content flex flex-col gap-4">
        {!loading && (
          <div className="hidden md:block">
            <PlatformContextTabsWidget
              activeTab={activeTab}
              onTabChange={onTabChange}
              userRole={userRole}
              supplierTab={supplierTab}
              onSupplierTabChange={onSupplierTabChange}
              taskTab={taskTab}
              onTaskTabChange={onTaskTabChange}
            />
          </div>
        )}
        <HydrationFadeWrapper
          isLoading={loading}
          skeleton={
            <PlatformWorkspaceSkeleton
              variant={
                activeTab === 'home'
                  ? 'dashboard'
                  : activeTab === 'locations' || activeTab === 'team' || activeTab === 'settings'
                  ? 'cards'
                  : 'table'
              }
            />
          }
        >
          <>
            {activeTab === 'home' && (
              <HomePlatformView
                userName={userName}
                userRole={userRole}
                locationName={locationName}
                metrics={metrics}
                onOpenStock={() => onTabChange('stock')}
                onOpenExpiry={() => onTabChange('expiry')}
                onOpenTransfers={() => onTabChange('transfers')}
                onOpenSuppliers={() => onTabChange('suppliers')}
                onOpenLocations={() => onTabChange('locations')}
                onOpenReceive={onOpenReceive}
                onOpenCount={() => onTabChange('stock')}
                onOpenTasks={() => onTabChange('tasks')}
                onOpenSearch={() => onTabChange('stock')}
                onOpenAttendance={() => onTabChange('attendance')}
                onOpenScanner={onOpenScanner}
                onOpenNotifications={onOpenNotifications}
                unreadNotificationsCount={notificationItems?.length || 0}
                products={products}
                lots={lots}
                locations={locations}
                suppliers={suppliers}
                requests={requests}
                transfers={transfers}
                attendanceShifts={attendanceShifts}
                tasks={tasks}
                taskItems={taskItems}
                teamMembers={teamMembers}
                activityLogs={activityLogs}
                selectedLocationId={selectedLocationId}
              />
            )}
            {activeTab === 'notifications' && <NotificationsPlatformView items={notificationItems} />}
            {activeTab === 'tasks' && (
              <TasksPlatformView
                tasks={tasks}
                taskItems={taskItems}
                taskExpected={taskExpected}
                products={products}
                locations={locations}
                members={teamMembers}
                assignments={teamAssignments}
                userRole={userRole}
                currentUserId={currentUserId}
                scanQuery={taskScanQuery}
                activeTaskTab={taskTab}
                onTaskTabChange={onTaskTabChange}
                onStartTask={onStartTask}
                onSubmitTask={onSubmitTask}
                onReviewTask={onReviewTask}
                onCreateTask={onCreateTask}
              />
            )}
            {activeTab === 'stock' && (
              <StockPlatformView
                companyId={companyId}
                products={products}
                lots={lots}
                locations={locations}
                suppliers={suppliers}
                selectedLocationId={locationScope}
                locationName={locationName}
                userRole={userRole}
                searchQuery={searchQuery}
                onReceive={onOpenReceive}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
                onSaveLot={onSaveLot}
                onDeleteLot={onDeleteLot}
                onExpiry={() => onTabChange('expiry')}
                onTransfer={onProductTransfer}
                onSupplierRequest={onProductSupplierRequest}
                onExport={onExport}
                onImportSuccess={onImportSuccess}
                members={teamMembers}
                assignments={teamAssignments}
                tasks={tasks}
                taskItems={taskItems}
                canManageTasks={canManageTasks}
                onCreateTask={onCreateTask}
              />
            )}
            {activeTab === 'expiry' && (
              <ExpiringPlatformView
                products={products}
                lots={lots}
                locations={locations}
                selectedLocationId={locationScope}
                userRole={userRole}
                onLocationChange={onLocationChange}
                onAction={onResolveExpiry}
                onSupplierRequest={onSupplierExpiryRequest}
                onTransferRequest={onTransferExpiryRequest}
                onUpdateLot={onUpdateLot}
              />
            )}
            {activeTab === 'locations' && (
              <LocationsPlatformView
                locations={locations}
                products={products}
                lots={lots}
                transfers={transfers}
                counts={counts}
                members={teamMembers}
                assignments={teamAssignments}
                canManage={canManage}
                onCreate={onCreateLocation}
                onUpdate={onUpdateLocation}
                onOpenStock={(locationId) => { onLocationChange(locationId); onTabChange('stock'); }}
              />
            )}
            {activeTab === 'suppliers' && (
              <SuppliersPlatformView
                requests={requests}
                products={products}
                locations={locations}
                suppliers={suppliers}
                supplierContacts={supplierContacts}
                supplierProducts={supplierProducts}
                userRole={userRole}
                selectedLocationId={locationScope}
                defaultProductId={defaultSupplierProductId}
                activeSupplierTab={supplierTab}
                onSupplierTabChange={onSupplierTabChange}
                onCreate={onCreateSupplierRequest}
                onCreateSupplier={onCreateSupplier}
                onCreateSupplierContact={onCreateSupplierContact}
                onUpdateSupplierContact={onUpdateSupplierContact}
                onDeleteSupplierContact={onDeleteSupplierContact}
                onSetPrimarySupplierContact={onSetPrimarySupplierContact}
                onStatusChange={onUpdateSupplierRequest}
                onLinkProduct={onLinkSupplierProduct}
                onUnlinkProduct={onUnlinkSupplierProduct}
              />
            )}
            {activeTab === 'transfers' && (
              <TransfersPlatformView
                transfers={transfers}
                products={products}
                lots={lots}
                locations={locations}
                selectedLocationId={locationScope}
                defaultProductId={defaultTransferProductId}
                userRole={userRole}
                onCreate={onCreateTransfer}
                onApprove={onApproveTransfer}
                onReceive={onReceiveTransfer}
              />
            )}
            {activeTab === 'logs' && <ActivityLogsPlatformView logs={activityLogs} locations={locations} members={teamMembers} />}
            {activeTab === 'team' && canManage && (
              <TeamPlatformView
                members={teamMembers}
                locations={locations}
                assignments={teamAssignments}
                canManage={canManage}
                onInvite={onInvite}
                onRoleChange={onRoleChange}
                onAssign={onAssignLocation}
                onUnassign={onUnassignLocation}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsPlatformView
                companyName={companyName}
                userName={userName}
                userTitle={userRole === 'manager' ? 'Branch manager' : userRole === 'staff' ? 'Staff member' : userRole === 'admin' ? 'Administrator' : 'Owner'}
                userRole={userRole}
              />
            )}
          </>
        </HydrationFadeWrapper>
      </div>
    </main>
  );
}
