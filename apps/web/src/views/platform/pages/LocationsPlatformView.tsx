import React, { useState } from 'react';
import type { Location, Product, StockLot, InventoryTransfer, AttendanceShift } from '@stocky/types';
import { PlatformPageLayout } from './PlatformPageLayout';
import { LocationsDirectoryWidget } from '@/widgets';

export interface LocationsPlatformViewProps {
  locations: Location[];
  products: Product[];
  lots: StockLot[];
  transfers?: InventoryTransfer[];
  counts?: any[];
  shifts?: AttendanceShift[];
  canManage?: boolean;
  companyId?: string;
  members?: Array<{ id: string; full_name?: string | null; email?: string | null; avatar_url?: string | null; role?: string; status?: string }>;
  assignments?: Array<{ id: string; user_id: string; location_id: string }>;
  onCreate?: (input: { name: string; type: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string; imageUrl?: string }) => void | Promise<void>;
  onUpdate?: (locationId: string, input: { name?: string; type?: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string | null; imageUrl?: string | null }) => void | Promise<void>;
  onAssignLocation?: (userId: string, locationId: string) => Promise<void>;
  onUnassignLocation?: (assignmentId: string) => Promise<void>;
  onOpenStock: (locationId: string) => void;
}

/**
 * LocationsPlatformView (PageView)
 * Controls page-level layout, header, subtabs, and directory widget.
 */
export function LocationsPlatformView(props: LocationsPlatformViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <PlatformPageLayout
      title="Locations"
      subtitle="Manage branches and warehouses, track active inventory health, and oversee site staffing."
    >
      <LocationsDirectoryWidget
        {...props}
        isFormOpen={isFormOpen}
        onToggleForm={() => setIsFormOpen((prev) => !prev)}
      />
    </PlatformPageLayout>
  );
}
