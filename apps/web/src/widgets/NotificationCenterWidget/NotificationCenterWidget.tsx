'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoxIcon,
  TruckIcon,
  WarehouseIcon,
  MoreHorizontalIcon,
  CheckIcon,
  ActivityIcon,
  ChevronRightIcon,
  TrashIcon,
  BellIcon,
} from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

export type NotificationType =
  | 'expiry'
  | 'low_stock'
  | 'transfer'
  | 'task'
  | 'supplier'
  | 'attendance'
  | 'system';

export interface NotificationQueueItem {
  id: string;
  title: string;
  message: string;
  actionLabel: string;
  severity: 'critical' | 'warning' | 'info';
  type?: NotificationType;
  entityName?: string;
  imageUrl?: string | null;
  timestamp?: string;
  isRead?: boolean;
  createdAt?: string;
  onOpen: () => void;
  onMarkRead?: () => void;
  onDismiss?: () => void;
}

export interface NotificationCenterWidgetProps {
  items: NotificationQueueItem[];
  onMarkAllRead?: () => void;
  className?: string;
}

// ============================================================================
// 1. CATEGORY BADGE & AVATAR HELPERS (Facebook Style)
// ============================================================================

interface CategoryVisualConfig {
  cornerBadgeBg: string;
  cornerIcon: React.ReactNode;
  fallbackAvatarBg: string;
  fallbackAvatarIcon: React.ReactNode;
  defaultEntity: string;
}

function getCategoryConfig(type?: NotificationType, severity?: string): CategoryVisualConfig {
  switch (type) {
    case 'expiry':
      return {
        cornerBadgeBg: severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500',
        cornerIcon: <AlertTriangleIcon size="xs" className="w-2.5 h-2.5 text-white stroke-[2.5]" />,
        fallbackAvatarBg: 'bg-rose-50 text-rose-600 border border-rose-100',
        fallbackAvatarIcon: <AlertCircleIcon size="sm" />,
        defaultEntity: 'Stock Expiry',
      };
    case 'low_stock':
      return {
        cornerBadgeBg: 'bg-amber-500',
        cornerIcon: <BoxIcon size="xs" className="w-2.5 h-2.5 text-white stroke-[2.5]" />,
        fallbackAvatarBg: 'bg-amber-50 text-amber-600 border border-amber-100',
        fallbackAvatarIcon: <BoxIcon size="sm" />,
        defaultEntity: 'Inventory Alert',
      };
    case 'transfer':
      return {
        cornerBadgeBg: 'bg-blue-500',
        cornerIcon: <TruckIcon size="xs" className="w-2.5 h-2.5 text-white stroke-[2.5]" />,
        fallbackAvatarBg: 'bg-blue-50 text-blue-600 border border-blue-100',
        fallbackAvatarIcon: <TruckIcon size="sm" />,
        defaultEntity: 'Stock Transfer',
      };
    case 'task':
      return {
        cornerBadgeBg: 'bg-emerald-500',
        cornerIcon: <CheckCircleIcon size="xs" className="w-2.5 h-2.5 text-white stroke-[2.5]" />,
        fallbackAvatarBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        fallbackAvatarIcon: <CheckCircleIcon size="sm" />,
        defaultEntity: 'Audit Task',
      };
    case 'supplier':
      return {
        cornerBadgeBg: 'bg-purple-500',
        cornerIcon: <WarehouseIcon size="xs" className="w-2.5 h-2.5 text-white stroke-[2.5]" />,
        fallbackAvatarBg: 'bg-purple-50 text-purple-600 border border-purple-100',
        fallbackAvatarIcon: <WarehouseIcon size="sm" />,
        defaultEntity: 'Supplier Order',
      };
    default:
      return {
        cornerBadgeBg: 'bg-stone-500',
        cornerIcon: <BellIcon size="xs" className="w-2.5 h-2.5 text-white stroke-[2.5]" />,
        fallbackAvatarBg: 'bg-stone-100 text-stone-600 border border-stone-200',
        fallbackAvatarIcon: <BellIcon size="sm" />,
        defaultEntity: 'Stocky Notice',
      };
  }
}

// ============================================================================
// 2. FACEBOOK NOTIFICATION ITEM (Single Row)
// ============================================================================

export interface FacebookNotificationItemProps {
  item: NotificationQueueItem;
  isRead: boolean;
  onToggleRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onItemClick: (item: NotificationQueueItem) => void;
}

export function FacebookNotificationItem({
  item,
  isRead,
  onToggleRead,
  onDismiss,
  onItemClick,
}: FacebookNotificationItemProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const config = getCategoryConfig(item.type, item.severity);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const hasThumbnail = Boolean(item.imageUrl) && !imageError;
  const leadSubject = item.entityName || item.title;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        onItemClick(item);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onItemClick(item);
        }
      }}
      className={`group relative flex items-start gap-3.5 p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer select-none text-start w-full outline-none focus-visible:ring-2 focus-visible:ring-stocky-primary ${
        isRead
          ? 'bg-transparent hover:bg-black/[0.03]'
          : 'bg-stocky-primary/[0.04] hover:bg-stocky-primary/[0.08]'
      }`}
    >
      {/* 1. Left Avatar with Floating Action Badge */}
      <div className="relative shrink-0 mt-0.5">
        <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-2xs">
          {hasThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl as string}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${config.fallbackAvatarBg}`}
            >
              {config.fallbackAvatarIcon}
            </div>
          )}
        </div>

        {/* Floating Category Corner Badge */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ring-2 ring-white flex items-center justify-center shadow-xs ${config.cornerBadgeBg}`}
          aria-hidden="true"
        >
          {config.cornerIcon}
        </span>
      </div>

      {/* 2. Middle Content (Bold Subject + Context + Relative Time) */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs sm:text-[13px] leading-snug text-stocky-text-main line-clamp-2">
          <strong className="font-semibold text-stocky-text-main hover:underline">
            {leadSubject}
          </strong>{' '}
          <span className={isRead ? 'text-stocky-text-sub font-normal' : 'text-stocky-text-main/90 font-normal'}>
            {item.message}
          </span>
        </p>

        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-normal text-stocky-text-sub">
          <ClockIcon size="xs" className="w-3 h-3 opacity-60 shrink-0" />
          <span>{item.timestamp || t('notifications.justNow')}</span>
          {item.actionLabel && (
            <>
              <span className="opacity-30">·</span>
              <span className="text-stocky-primary font-medium hover:underline inline-flex items-center gap-0.5">
                {item.actionLabel}
                <ChevronRightIcon size="xs" className="w-2.5 h-2.5 rtl:rotate-180" />
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. Right Status & Actions (Blue Unread Dot + 3-Dots Menu) */}
      <div className="flex items-center gap-2 shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
        {/* Unread Blue Indicator Dot (Facebook Style) */}
        {!isRead && (
          <span
            className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-600/20 shrink-0"
            title="Unread notification"
            aria-label="Unread"
          />
        )}

        {/* 3-Dots Context Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Notification options"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stocky-text-sub hover:text-stocky-text-main hover:bg-black/[0.06] transition-colors opacity-70 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 cursor-pointer"
          >
            <MoreHorizontalIcon size="xs" className="w-4 h-4" />
          </button>

          {/* Floating Dropdown Menu */}
          {menuOpen && (
            <div className="absolute end-0 top-9 w-48 bg-white border border-stocky-border-subtle rounded-xl shadow-lg p-1 z-30 flex flex-col text-xs text-stocky-text-main animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  onToggleRead(item.id);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stocky-bg-global transition-colors cursor-pointer text-start w-full"
              >
                <CheckIcon size="xs" className="w-3.5 h-3.5 text-stocky-text-sub" />
                <span>{isRead ? t('notifications.markUnread') : t('notifications.markRead')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onDismiss(item.id);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer text-start w-full"
              >
                <TrashIcon size="xs" className="w-3.5 h-3.5 text-rose-500" />
                <span>{t('notifications.remove')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. FACEBOOK NOTIFICATION FEED (Header + Filter Tabs + Grouped Sections)
// ============================================================================

export interface FacebookNotificationFeedProps {
  items: NotificationQueueItem[];
  onMarkAllRead?: () => void;
  onNavigateToLogs?: () => void;
  onCloseDrawer?: () => void;
  className?: string;
  isDrawer?: boolean;
}

export function FacebookNotificationFeed({
  items,
  onMarkAllRead,
  onNavigateToLogs,
  onCloseDrawer,
  className = '',
  isDrawer = false,
}: FacebookNotificationFeedProps) {
  const { t } = useTranslation();
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Derive read status combining item prop and local state
  const isItemRead = (item: NotificationQueueItem) => {
    if (readIds.has(item.id)) return true;
    return Boolean(item.isRead);
  };

  const handleToggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const handleMarkAllRead = () => {
    const allIds = new Set(items.map((it) => it.id));
    setReadIds(allIds);
    onMarkAllRead?.();
  };

  const handleItemClick = (item: NotificationQueueItem) => {
    setReadIds((prev) => new Set(prev).add(item.id));
    if (onCloseDrawer) onCloseDrawer();
    item.onOpen();
  };

  // Filter active items (excluding dismissed)
  const activeItems = useMemo(() => {
    return items.filter((it) => !dismissedIds.has(it.id));
  }, [items, dismissedIds]);

  const unreadCount = useMemo(() => {
    return activeItems.filter((it) => !isItemRead(it)).length;
  }, [activeItems, readIds]);

  // Tab-filtered items
  const displayedItems = useMemo(() => {
    if (filterTab === 'unread') {
      return activeItems.filter((it) => !isItemRead(it));
    }
    return activeItems;
  }, [activeItems, filterTab, readIds]);

  // Facebook Chronological Grouping: "New" (first 3 or today) vs "Earlier"
  const { newItems, earlierItems } = useMemo(() => {
    if (displayedItems.length <= 3) {
      return { newItems: displayedItems, earlierItems: [] };
    }
    return {
      newItems: displayedItems.slice(0, 3),
      earlierItems: displayedItems.slice(3),
    };
  }, [displayedItems]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Feed Sub-Header: Filter Tabs ("All", "Unread") + "Mark All Read" */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-stocky-border-subtle bg-white shrink-0 gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-stocky-primary text-white shadow-2xs'
                : 'bg-stocky-bg-global text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            {t('notifications.all')}
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('unread')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'unread'
                ? 'bg-stocky-primary text-white shadow-2xs'
                : 'bg-stocky-bg-global text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            <span>{t('notifications.unread')}</span>
            {unreadCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterTab === 'unread'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1 text-xs font-medium text-stocky-primary hover:underline transition-all cursor-pointer py-1 px-2 rounded-lg hover:bg-stocky-primary/[0.06]"
          >
            <CheckIcon size="xs" className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('notifications.markAllAsRead')}</span>
            <span className="sm:hidden">{t('notifications.markAll')}</span>
          </button>
        )}
      </div>

      {/* Feed Body: Notification Rows */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 space-y-4">
        {displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-2xs">
              <CheckCircleIcon size="md" className="w-7 h-7 stroke-[2]" />
            </div>
            <h3 className="text-sm font-semibold text-stocky-text-main">
              {filterTab === 'unread' ? t('notifications.noUnreadNotifications') : t('notifications.allCaughtUp')}
            </h3>
            <p className="text-xs text-stocky-text-sub max-w-xs mt-1.5 leading-relaxed">
              {filterTab === 'unread'
                ? t('notifications.noUnreadDesc')
                : t('notifications.allCaughtUpDesc')}
            </p>
            {filterTab === 'unread' && (
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className="mt-4 px-4 py-1.5 rounded-full bg-stocky-bg-global border border-stocky-border-subtle text-xs font-medium text-stocky-text-main hover:bg-stocky-border-subtle/50 transition-colors cursor-pointer"
              >
                {t('notifications.viewAll')}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Section 1: "New" */}
            {newItems.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 pt-1 pb-1">
                  <h4 className="text-xs font-bold text-stocky-text-main tracking-tight uppercase">
                    {t('notifications.newSection')}
                  </h4>
                </div>
                <div className="space-y-0.5">
                  {newItems.map((item) => (
                    <FacebookNotificationItem
                      key={item.id}
                      item={item}
                      isRead={isItemRead(item)}
                      onToggleRead={handleToggleRead}
                      onDismiss={handleDismiss}
                      onItemClick={handleItemClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: "Earlier" */}
            {earlierItems.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="px-2 pt-1 pb-1">
                  <h4 className="text-xs font-bold text-stocky-text-sub tracking-tight uppercase">
                    {t('notifications.earlierSection')}
                  </h4>
                </div>
                <div className="space-y-0.5">
                  {earlierItems.map((item) => (
                    <FacebookNotificationItem
                      key={item.id}
                      item={item}
                      isRead={isItemRead(item)}
                      onToggleRead={handleToggleRead}
                      onDismiss={handleDismiss}
                      onItemClick={handleItemClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Feed Footer: Link to full activity logs */}
      {onNavigateToLogs && (
        <div className="border-t border-stocky-border-subtle px-4 py-3 bg-stocky-bg-global/30 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onCloseDrawer) onCloseDrawer();
              onNavigateToLogs();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stocky-text-sub hover:text-stocky-primary transition-colors cursor-pointer"
          >
            <ActivityIcon size="xs" className="w-3.5 h-3.5" />
            <span>{t('notifications.viewFullActivityLogs')}</span>
          </button>
          {isDrawer && onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              className="h-7 px-3 rounded-full border border-stocky-border-subtle bg-white hover:bg-stocky-bg-global text-xs font-medium text-stocky-text-main transition-colors cursor-pointer"
            >
              {t('notifications.close')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. NOTIFICATION CENTER WIDGET (Main Full-Page Container)
// ============================================================================

export function NotificationCenterWidget({
  items,
  onMarkAllRead,
  className = '',
}: NotificationCenterWidgetProps) {
  return (
    <div className={`stocky-notifications-workspace flex flex-col gap-6 ${className}`}>
      <div className="rounded-2xl bg-white border border-stocky-border-subtle overflow-hidden shadow-xs">
        <FacebookNotificationFeed
          items={items}
          onMarkAllRead={onMarkAllRead}
          isDrawer={false}
        />
      </div>
    </div>
  );
}

export * from './NotificationsDrawerWidget';


