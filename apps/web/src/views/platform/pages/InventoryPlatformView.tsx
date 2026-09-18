import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { PlatformPageLayout } from './PlatformPageLayout';
import {
  InventoryWorkspaceWidget,
  type InventoryWorkspaceWidgetProps,
} from '@/widgets';

export interface InventoryPlatformViewProps extends InventoryWorkspaceWidgetProps {
  locationName?: string;
}

/**
 * InventoryPlatformView (PageView)
 * Single source of truth for the Inventory page composition and layout geometry.
 * Follows the 4px / 8px spatial grid system:
 * - Max Width: var(--stocky-page-max-width) (1600px)
 * - Page Gutter: var(--stocky-page-gutter) (24px)
 * - Page Vertical Rhythm: var(--stocky-page-gap) (24px)
 */
export function InventoryPlatformView(props: InventoryPlatformViewProps) {
  const { t } = useTranslation();
  return (
    <PlatformPageLayout
      title={t('inventory.title')}
      subtitle={t('inventory.subtitle')}
    >
      <InventoryWorkspaceWidget {...props} />
    </PlatformPageLayout>
  );
}
