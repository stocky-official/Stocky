import React from 'react';
import type { CompanyUserRole, Location, Product, StockLot } from '@stocky/types';
import { PlatformPageLayout } from './PlatformPageLayout';
import { ExpiringStockWidget } from '@/widgets';

import type { ExpiringStockWidgetProps } from '@/widgets';

export interface ExpiringPlatformViewProps extends ExpiringStockWidgetProps {}

/**
 * ExpiringPlatformView (PageView)
 * Orchestrates layout, header, location filter, and expiry batch queue.
 */
export function ExpiringPlatformView({
  locations,
  selectedLocationId,
  userRole,
  onLocationChange,
  ...widgetProps
}: ExpiringPlatformViewProps) {
  const canFilterLocation = userRole === 'owner' || userRole === 'admin';

  return (
    <PlatformPageLayout
      eyebrow="Action queue"
      title="Expiring stock"
      subtitle="Decide what happens to batches before they reach their expiry date."
      actions={
        canFilterLocation ? (
          <select
            value={selectedLocationId}
            onChange={(event) => onLocationChange(event.target.value)}
            className="h-9 rounded-full bg-white border border-stocky-border-subtle px-3 text-xs focus:outline-none focus:border-stocky-primary"
            aria-label="Filter expiring stock by location"
          >
            <option value="all">All locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        ) : undefined
      }
    >
      <ExpiringStockWidget
        {...widgetProps}
        locations={locations}
        selectedLocationId={selectedLocationId}
        userRole={userRole}
        onLocationChange={onLocationChange}
      />
    </PlatformPageLayout>
  );
}
