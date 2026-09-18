'use client';

import React from 'react';
import {
  BellIcon,
  XIcon,
} from '@stocky/icons';
import { SideDrawer } from '@/components/ui/SideDrawer';
import {
  FacebookNotificationFeed,
  type NotificationQueueItem,
} from './NotificationCenterWidget';
import { useTranslation } from '@/lib/i18n';

export interface NotificationsDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  items: NotificationQueueItem[];
  onNavigateToLogs?: () => void;
}

export function NotificationsDrawerWidget({
  isOpen,
  onClose,
  items,
  onNavigateToLogs,
}: NotificationsDrawerWidgetProps) {
  const { t } = useTranslation();
  const unreadCount = items.filter((it) => !it.isRead).length;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('notifications.title')}
      panelClassName="md:w-[460px]"
    >
      <div className="flex flex-col h-full bg-stocky-bg-widget select-none">
        {/* Facebook-style Drawer Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stocky-border-subtle bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-stocky-primary/10 border border-stocky-primary/20 text-stocky-primary flex items-center justify-center shrink-0">
              <BellIcon size="xs" className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stocky-text-main">
                {t('notifications.title')}
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer shrink-0"
          >
            <XIcon size="xs" className="w-4 h-4" />
          </button>
        </div>

        {/* Facebook-style Feed Body */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <FacebookNotificationFeed
            items={items}
            onNavigateToLogs={onNavigateToLogs}
            onCloseDrawer={onClose}
            isDrawer={true}
          />
        </div>
      </div>
    </SideDrawer>
  );
}

