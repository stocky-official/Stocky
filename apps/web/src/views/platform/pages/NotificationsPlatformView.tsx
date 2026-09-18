'use client';

import React from 'react';
import { PlatformPageLayout } from './PlatformPageLayout';
import { NotificationCenterWidget, type NotificationQueueItem } from '@/widgets';
import { useTranslation } from '@/lib/i18n';

export interface NotificationsPlatformViewProps {
  items: NotificationQueueItem[];
}

/**
 * NotificationsPlatformView (PageView)
 * Orchestrates layout, header, and the operational decision feed.
 */
export function NotificationsPlatformView({ items }: NotificationsPlatformViewProps) {
  const { t } = useTranslation();
  return (
    <PlatformPageLayout
      title={t('notifications.title')}
      subtitle={t('notifications.subtitle')}
      actions={
        items.length > 0 ? (
          <span className="text-xs text-stocky-text-sub">
            {items.length === 1
              ? t('notifications.needingReview', { count: 1 })
              : t('notifications.needingReviewPlural', { count: items.length })}
          </span>
        ) : undefined
      }
    >
      <NotificationCenterWidget items={items} />
    </PlatformPageLayout>
  );
}
