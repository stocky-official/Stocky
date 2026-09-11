import React from 'react';
import { PlatformPageLayout } from './PlatformPageLayout';
import {
  RedesignedStockWorkspaceWidget,
  type RedesignedStockWorkspaceWidgetProps,
} from '@/widgets';

export interface StockPlatformViewProps extends RedesignedStockWorkspaceWidgetProps {
  locationName?: string;
}

/**
 * StockPlatformView (PageView)
 * Orchestrates stock workspace header and data table view.
 */
export function StockPlatformView({
  locationName,
  ...props
}: StockPlatformViewProps) {
  return (
    <PlatformPageLayout
      eyebrow={locationName || 'Inventory'}
      title="Stock inventory"
      subtitle="Track active batches, expiry status, and stock levels across your locations."
    >
      <RedesignedStockWorkspaceWidget {...props} />
    </PlatformPageLayout>
  );
}
