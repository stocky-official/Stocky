'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { CheckCircleIcon, XIcon } from '@stocky/icons';
import type { Location, Product, StockTask, StockTaskItem } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { UserAvatar } from '@/components/ui/UserAvatar';

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

function taskTypeLabel(taskType: StockTask['taskType']) {
  return taskType === 'count' ? 'Count quantities' : 'Check expiry dates';
}

function statusLabel(status: StockTask['status']) {
  return status.replace('_', ' ');
}

function formatDateTime(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(value))
    : 'Not scheduled';
}

function elapsedLabel(milliseconds: number) {
  const minutes = Math.max(0, Math.floor(milliseconds / 60000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export function TaskDetailsDrawerWidget({
  task,
  taskItems,
  products,
  locations,
  members,
  onClose,
}: TaskDetailsDrawerWidgetProps) {
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
      ariaLabel="Task details"
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
                {taskTypeLabel(activeTask.taskType)} ·{' '}
                {locationMap.get(activeTask.locationId) || 'Location'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global transition-colors cursor-pointer"
              aria-label="Close"
            >
              <XIcon size="xs" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-stocky-bg-global p-3.5 border border-stocky-border-subtle/50">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-stocky-text-sub">
                  Time since assigned
                </p>
                <p className="mt-1 text-base font-semibold text-stocky-text-main">
                  {elapsedLabel(
                    now - new Date(activeTask.createdAt).getTime()
                  )}
                </p>
                <p className="mt-1 text-[10px] text-stocky-text-sub">
                  {activeTask.startedAt
                    ? `Started ${formatDateTime(activeTask.startedAt)}`
                    : 'Not started yet'}
                </p>
              </div>

              <div className="rounded-xl bg-stocky-bg-global p-3.5 border border-stocky-border-subtle/50">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-stocky-text-sub">
                  Progress
                </p>
                <p className="mt-1 text-base font-semibold text-stocky-text-main">
                  {completedCount} of {currentItems.length}
                </p>
                <p className="mt-1 text-[10px] text-stocky-text-sub">
                  items completed
                </p>
              </div>
            </div>

            {/* Scheduled Window */}
            {activeTask.scheduledStartAt && (
              <div className="rounded-xl stocky-status-info border px-3.5 py-2.5 text-xs">
                <span className="font-semibold block">Scheduled work window</span>
                <span className="mt-0.5 block text-[11px] opacity-90">
                  {formatDateTime(activeTask.scheduledStartAt)} –{' '}
                  {formatDateTime(activeTask.scheduledEndAt)}
                </span>
              </div>
            )}

            {/* Status & Assignee Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-stocky-border-subtle p-3 bg-white">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-stocky-text-sub">
                  Status
                </p>
                <p className="mt-1 text-xs font-semibold capitalize text-stocky-text-main">
                  {statusLabel(activeTask.status)}
                </p>
              </div>

              <div className="rounded-xl border border-stocky-border-subtle p-3 bg-white">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-stocky-text-sub">
                  Assigned to
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
                    {assignee?.full_name || assignee?.email || 'Unassigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Breakdown */}
            <div>
              <p className="text-xs font-semibold text-stocky-text-main mb-2">
                Task items ({currentItems.length})
              </p>
              <div className="divide-y divide-stocky-border-subtle rounded-xl border border-stocky-border-subtle bg-white overflow-hidden">
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
                          <span className="text-[10px]">•</span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-stocky-text-main">
                          {product?.name || 'Product'}
                        </p>
                        <p className="mt-0.5 text-[10px] text-stocky-text-sub">
                          {product?.barcode || 'No barcode'} ·{' '}
                          {item.status === 'pending' ? 'Pending' : 'Completed'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Standard h-10 Drawer Footer Action */}
          <div className="border-t border-stocky-border-subtle p-5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-full rounded-full border border-stocky-border-subtle px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </SideDrawer>
  );
}
