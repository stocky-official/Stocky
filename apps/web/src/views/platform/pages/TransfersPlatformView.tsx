import React from 'react';
import type { InventoryTransfer, Location, Product, StockLot, CompanyUserRole } from '@stocky/types';
import { PlatformPageLayout } from './PlatformPageLayout';
import { RedesignedTransfersWidget } from '@/widgets';

export interface TransfersPlatformViewProps {
  transfers: InventoryTransfer[];
  products: Product[];
  lots: StockLot[];
  locations: Location[];
  selectedLocationId: string;
  defaultProductId?: string;
  userRole: CompanyUserRole;
  onCreate: (input: { sourceLocationId: string; destinationLocationId: string; lines: Array<{ productId: string; quantity: number }>; note?: string }) => void;
  onApprove: (transfer: InventoryTransfer) => void;
  onReceive: (transfer: InventoryTransfer, lines?: Array<{ lineId: string; quantityReceived: number }>, note?: string) => void;
}

/**
 * TransfersPlatformView (PageView)
 * Orchestrates layout, header, and transfer request/dispatch workflows.
 */
export function TransfersPlatformView(props: TransfersPlatformViewProps) {
  return (
    <PlatformPageLayout
      eyebrow="Internal logistics"
      title="Stock transfers"
      subtitle="Request, approve, and receive stock movements between your branches and warehouses."
    >
      <RedesignedTransfersWidget {...props} />
    </PlatformPageLayout>
  );
}
