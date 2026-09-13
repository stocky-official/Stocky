import React from 'react';
import { InventoryPlatformView, type InventoryPlatformViewProps } from './InventoryPlatformView';

export type StockPlatformViewProps = InventoryPlatformViewProps;

/**
 * StockPlatformView (PageView alias)
 * Forwarding alias to InventoryPlatformView.
 */
export function StockPlatformView(props: StockPlatformViewProps) {
  return <InventoryPlatformView {...props} />;
}
