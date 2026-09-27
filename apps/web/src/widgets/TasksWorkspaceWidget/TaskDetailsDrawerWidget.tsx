'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { CheckCircleIcon, ListTodoIcon, XIcon } from '@stocky/icons';
import type { Location, Product, StockTask, StockTaskItem } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useTranslation } from '@/lib/i18n';

export interface TaskDetailsDrawerWidgetProps {
  task: StockTask | null;
  taskItems: StockTaskItem[];
  products: Product[];
  locations: Location[];
  members: Array<{
    id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string;
  }>;
  onClose: () => void;
}

function taskTypeLabel(taskType: StockTask['taskType'], t: (key: string) => string) {
  if (taskType === 'open') return t('tasks.openTask');
  return taskType === 'count'
    ? t('tasks.countQuantities')
    : t('tasks.checkExpiry');
}

function statusLabel(status: StockTask['status'], t: (key: string) => string) {
  switch (status) {
    case 'submitted':
      return t('tasks.statusSubmitted');
    case 'in_progress':
      return t('tasks.statusInProgress');
    case 'rejected':
      return t('tasks.statusRejected');
    case 'approved':
      return t('tasks.statusApproved');
    case 'cancelled':
      return t('tasks.statusCancelled');
    default:
      return t('tasks.statusAssigned');
  }
}

function formatDateTime(value: string | null | undefined, locale: string, notScheduledText: string) {
  return value
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(value))
    : notScheduledText;
}

function elapsedLabel(milliseconds: number, t: (key: string, params?: Record<string, string | number>) => string) {
  const minutes = Math.max(0, Math.floor(milliseconds / 60000));
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return t('tasks.elapsedHoursMinutes', { hours, minutes: minutes % 60 });
  }
  if (minutes > 0) {
    return t('tasks.elapsedMinutes', { minutes });
  }
  return t('tasks.elapsedNow');
}

export function TaskDetailsDrawerWidget({
  task,
  taskItems,
  products,
  locations,
  members,
  onClose,
}: TaskDetailsDrawerWidgetProps) {
  const { t, locale: language } = useTranslation();
  const lastTaskRef = useRef<StockTask | null>(task);
  if (task) lastTaskRef.current = task;
  const activeTask = task || lastTaskRef.current;

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!task) return;
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, [task]);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );
  const locationMap = useMemo(
    () => new Map(locations.map((loc) => [loc.id, loc.name])),
    [locations]
  );
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  const currentItems = activeTask
    ? taskItems.filter((item) => item.taskId === activeTask.id)
    : [];
  const completedCount = currentItems.filter(
    (item) => item.status !== 'pending'
  ).length;
  const assignee = activeTask
    ? memberMap.get(activeTask.assignedToCompanyUserId)
    : null;

  return (
    <SideDrawer
      isOpen={Boolean(task)}
      onClose={onClose}
      ariaLabel={t('tasks.title')}
    >
      {activeTask && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-stocky-border-subtle px-5 py-4">
            <div>
              <h2 className="text-lg font-medium text-stocky-text-main">
                {activeTask.title}
              </h2>
              <p className="mt-1 text-xs text-stocky-text-sub">
                {locationMap.get(activeTask.locationId) || t('common.location')} ·{' '}
                {t('tasks.createdAgo', {
                  time: elapsedLabel(now - new Date(activeTask.createdAt).getTime(), t),
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global transition-colors cursor-pointer"
              aria-label={t('common.close')}
            >
              <XIcon size="xs" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-stocky-bg-global p-3.5 border border-stocky-border-subtle/50">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-stocky-text-sub">
                  {t('common.type')}
                </p>
                <p className="mt-1 text-sm font-semibold text-stocky-text-main flex items-center gap-1.5">
                  {activeTask.taskType === 'open' && <ListTodoIcon size="xs" className="text-stocky-primary" />}
                  {taskTypeLabel(activeTask.taskType, t)}
                </p>
              </div>

              <div className="rounded-xl bg-stocky-bg-global p-3.5 border border-stocky-border-subtle/50">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-stocky-text-sub">
                  {t('tasks.progress')}
                </p>
                {activeTask.taskType === 'open' ? (
                  <p className="mt-1 text-sm font-semibold text-stocky-text-main">
                    {t('tasks.directTask')}
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-base font-semibold text-stocky-text-main">
                      {completedCount} / {currentItems.length}
                    </p>
                    <p className="mt-0.5 text-[10px] text-stocky-text-sub">
                      {t('tasks.itemsCompleted')}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* If Open Task: Task Instructions Card */}
            {activeTask.taskType === 'open' && (
              <div className="rounded-2xl border border-stocky-border-subtle bg-stocky-bg-global/40 p-4">
                <h4 className="text-xs font-semibold text-stocky-text-main flex items-center gap-2">
                  <ListTodoIcon size="xs" className="text-stocky-primary" />
                  {t('tasks.taskDetails')}
                </h4>
                <p className="mt-2 text-xs text-stocky-text-main whitespace-pre-wrap leading-relaxed">
                  {activeTask.notes || t('tasks.noInstructions')}
                </p>
              </div>
            )}

            {/* Scheduled Window */}
            {activeTask.scheduledStartAt && (
              <div className="rounded-xl stocky-status-info border px-3.5 py-2.5 text-xs">
                <span className="font-semibold block">{t('tasks.workTimeframe')}</span>
                <span className="mt-0.5 block text-[11px] opacity-90">
                  {formatDateTime(activeTask.scheduledStartAt, language, t('tasks.notScheduled'))} –{' '}
                  {formatDateTime(activeTask.scheduledEndAt, language, t('tasks.notScheduled'))}
                </span>
              </div>
            )}

            {activeTask.reviewNote && (
              <div className="rounded-xl stocky-status-warning border px-3.5 py-2.5 text-xs">
                <span className="font-semibold block">{t('tasks.reviewNotes')}</span>
                <span className="mt-0.5 block whitespace-pre-wrap text-[11px]">{activeTask.reviewNote}</span>
              </div>
            )}

            {/* Status & Assignee Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-stocky-border-subtle p-3 bg-stocky-bg-widget">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-stocky-text-sub">
                  {t('common.status')}
                </p>
                <p className="mt-1 text-xs font-semibold capitalize text-stocky-text-main">
                  {statusLabel(activeTask.status, t)}
                </p>
              </div>

              <div className="rounded-xl border border-stocky-border-subtle p-3 bg-stocky-bg-widget">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-stocky-text-sub">
                  {t('tasks.assignTo')}
                </p>
                <div className="mt-1.5 flex items-center gap-2 min-w-0">
                  <UserAvatar
                    src={assignee?.avatar_url}
                    name={assignee?.full_name}
                    email={assignee?.email}
                    size="xs"
                    className="h-5 w-5 shrink-0"
                  />
                  <p className="truncate text-xs font-medium text-stocky-text-main">
                    {assignee?.full_name || assignee?.email || t('tasks.unassigned')}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Breakdown (For count/expiry tasks) */}
            {activeTask.taskType !== 'open' && (
              <div>
                <p className="text-xs font-semibold text-stocky-text-main mb-2">
                  {t('tasks.taskItems')} ({currentItems.length})
                </p>
                <div className="divide-y divide-stocky-border-subtle rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget overflow-hidden">
                  {currentItems.map((item) => {
                    const product = productMap.get(item.productId);
                    const isCompleted = item.status !== 'pending';

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-3.5 py-3"
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                            isCompleted
                              ? 'stocky-status-success'
                              : 'stocky-status-muted'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircleIcon size="xs" />
                          ) : (
                            <span className="text-[10px] font-medium">•</span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-stocky-text-main">
                            {product?.name || t('inventory.productName')}
                          </p>
                          <p className="mt-0.5 text-[11px] text-stocky-text-sub">
                            {product?.barcode || product?.categoryName || t('drawers.receiveStock.noBarcode')}
                          </p>
                        </div>
                        {isCompleted && (
                          <div className="text-end text-xs text-stocky-text-main">
                            {activeTask.taskType === 'count' ? (
                              <span>
                                {t('tasks.counted')}: <strong>{item.countedQuantity ?? 0}</strong>
                              </span>
                            ) : (
                              <span>
                                {t('tasks.expiry')}:{' '}
                                <strong>
                                  {item.observedExpiryDate
                                    ? formatDateTime(item.observedExpiryDate, language, t('tasks.noneRecorded'))
                                    : t('tasks.noneRecorded')}
                                </strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-stocky-border-subtle p-5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-full rounded-full border border-stocky-border-subtle text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </SideDrawer>
  );
}
