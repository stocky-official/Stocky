import React from 'react';
import type { InventoryTransfer, Location, Product, StockLot, CompanyUserRole } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';
import { PlatformPageLayout } from './PlatformPageLayout';
import { TransfersWorkspaceWidget } from '@/widgets';

export interface TransfersPlatformViewProps {
  transfers: InventoryTransfer[];
  products: Product[];
  lots: StockLot[];
  locations: Location[];
  selectedLocationId: string;
  defaultProductId?: string;
  userRole: CompanyUserRole;
  canApprove?: boolean;
  onCreate: (input: { sourceLocationId: string; destinationLocationId: string; lines: Array<{ productId: string; quantity: number }>; note?: string }) => void;
  onApprove: (transfer: InventoryTransfer) => void;
  onReceive: (transfer: InventoryTransfer, lines?: Array<{ lineId: string; quantityReceived: number }>, note?: string) => void;
}

/**
 * TransfersPlatformView (PageView)
 * Orchestrates layout, header, and transfer request/dispatch workflows.
 */
export function TransfersPlatformView(props: TransfersPlatformViewProps) {
  const { t } = useTranslation();
  return (
    <PlatformPageLayout
      title={t('transfers.title')}
      subtitle={t('transfers.subtitle')}
    >
      <TransfersWorkspaceWidget {...props} />
    </PlatformPageLayout>
  );
}
