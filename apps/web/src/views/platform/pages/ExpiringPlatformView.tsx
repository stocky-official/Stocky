import React from 'react';
import type { CompanyUserRole, Location, Product, StockLot } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';
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
  const { t } = useTranslation();
  const canFilterLocation = userRole === 'owner' || userRole === 'admin';

  return (
    <PlatformPageLayout
      title={t('expiring.title')}
      subtitle={t('expiring.subtitle')}
      actions={
        canFilterLocation ? (
          <select
            value={selectedLocationId}
            onChange={(event) => onLocationChange(event.target.value)}
            className="h-8 rounded-full bg-white border border-stocky-border-subtle px-3 text-xs focus:outline-none focus:border-stocky-primary"
            aria-label={t('expiring.filterLocationAria')}
          >
            <option value="all">{t('inventory.allLocations')}</option>
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
