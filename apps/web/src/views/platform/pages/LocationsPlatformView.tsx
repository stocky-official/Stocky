import React, { useState } from 'react';
import type { Location, Product, StockLot, InventoryTransfer } from '@stocky/types';
import { PlatformPageLayout } from './PlatformPageLayout';
import { LocationsDirectoryWidget } from '@/widgets';

export interface LocationsPlatformViewProps {
  locations: Location[];
  products: Product[];
  lots: StockLot[];
  transfers?: InventoryTransfer[];
  counts?: any[];
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
      eyebrow="Company structure"
      title="Locations directory"
      subtitle="View operational health across branches and warehouses."
    >
      <LocationsDirectoryWidget
        {...props}
        isFormOpen={isFormOpen}
        onToggleForm={() => setIsFormOpen((prev) => !prev)}
      />
    </PlatformPageLayout>
  );
}
