import React from 'react';
import { PlatformPageLayout } from './PlatformPageLayout';
import { NotificationCenterWidget, type NotificationQueueItem } from '@/widgets';

export interface NotificationsPlatformViewProps {
  items: NotificationQueueItem[];
}

/**
 * NotificationsPlatformView (PageView)
 * Orchestrates layout, header, and the operational decision feed.
 */
export function NotificationsPlatformView({ items }: NotificationsPlatformViewProps) {
  return (
    <PlatformPageLayout
      eyebrow="Action center"
      title="Notifications"
      subtitle="Only urgent work and items requiring your decision appear here."
      actions={
        items.length > 0 ? (
          <span className="text-xs text-stocky-text-sub">
            {items.length} item{items.length === 1 ? '' : 's'} needing review
          </span>
        ) : undefined
      }
    >
      <NotificationCenterWidget items={items} />
    </PlatformPageLayout>
  );
}
