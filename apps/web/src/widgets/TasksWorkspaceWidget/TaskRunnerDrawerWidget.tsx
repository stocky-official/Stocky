'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarcodeIcon,
  CheckCircleIcon,
  ClockIcon,
  SearchIcon,
  XIcon,
} from '@stocky/icons';
import type { Product, StockTask, StockTaskItem } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';

type TaskResult = {
  countedQuantity: string;
  observedExpiryDate: string;
  note: string;
};

export interface TaskRunnerDrawerWidgetProps {
  task: StockTask | null;
  taskItems: StockTaskItem[];
  products: Product[];
  scanQuery?: string;
  onClose: () => void;
  onStartTask: (taskId: string) => Promise<void>;
  onSubmitTask: (
    taskId: string,
    items: Array<{
      taskItemId: string;
      countedQuantity?: number | null;
      observedExpiryDate?: string | null;
      note?: string | null;
    }>
  ) => Promise<void>;
}

function elapsedLabel(milliseconds: number) {
  const minutes = Math.max(0, Math.floor(milliseconds / 60000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export function TaskRunnerDrawerWidget({
  task,
  taskItems,
  products,
  scanQuery = '',
  onClose,
  onStartTask,
  onSubmitTask,
}: TaskRunnerDrawerWidgetProps) {
  const lastTaskRef = useRef<StockTask | null>(task);
  if (task) lastTaskRef.current = task;
  const activeTask = task || lastTaskRef.current;

  const [results, setResults] = useState<Record<string, TaskResult>>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StockTask['status']>('assigned');
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  useEffect(() => {
    if (!task) return;
    const initial: Record<string, TaskResult> = {};
    taskItems
      .filter((item) => item.taskId === task.id)
      .forEach((item) => {
        initial[item.id] = {
          countedQuantity: '',
          observedExpiryDate: '',
          note: '',
        };
      });
    setResults(initial);
    setSearch('');
    setError(null);
    setStatus(task.status);
    setStartedAt(task.createdAt);
  }, [task, taskItems]);

  useEffect(() => {
    if (task && scanQuery.trim()) {
      setSearch(scanQuery.trim());
    }
  }, [task, scanQuery]);

  useEffect(() => {
    if (!task) return;
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, [task]);

  const startRunner = async () => {
    if (!activeTask) return;
    setSaving(true);
    setError(null);
    try {
      await onStartTask(activeTask.id);
      setStatus('in_progress');
      setStartedAt((current) => current || new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Could not start this task.');
    } finally {
      setSaving(false);
    }
  };

  const updateResult = (
    itemId: string,
    key: keyof TaskResult,
    value: string
  ) => {
    setResults((current) => ({
      ...current,
      [itemId]: { ...current[itemId], [key]: value },
    }));
  };

  const currentItems = activeTask
    ? taskItems
        .filter((item) => item.taskId === activeTask.id)
        .filter((item) => {
          const product = productMap.get(item.productId);
          const query = search.trim().toLowerCase();
          return (
            !query ||
            [product?.name, product?.barcode, item.stockLotId]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(query))
          );
        })
    : [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeTask) return;

    const allItems = taskItems.filter((item) => item.taskId === activeTask.id);
    const payload = allItems.map((item) => {
      const res = results[item.id] || {
        countedQuantity: '',
        observedExpiryDate: '',
        note: '',
      };
      return activeTask.taskType === 'count'
        ? {
            taskItemId: item.id,
            countedQuantity:
              res.countedQuantity === '' ? null : Number(res.countedQuantity),
            note: res.note.trim() || null,
          }
        : {
            taskItemId: item.id,
            observedExpiryDate: res.observedExpiryDate || null,
            note: res.note.trim() || null,
          };
    });

    if (
      activeTask.taskType === 'count' &&
      payload.some(
        (item) =>
          item.countedQuantity == null ||
          !Number.isInteger(item.countedQuantity) ||
          (item.countedQuantity as number) < 0
      )
    ) {
      return setError('Enter a whole number for every product.');
    }

    if (
      activeTask.taskType === 'expiry' &&
      payload.some((item) => !item.observedExpiryDate && !item.note)
    ) {
      return setError(
        'Enter an expiry date or a note when the date cannot be read.'
      );
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmitTask(activeTask.id, payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not submit this task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer
      isOpen={Boolean(task)}
      onClose={() => !saving && onClose()}
      ariaLabel="Assigned stock task"
    >
      {activeTask && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-stocky-border-subtle px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-stocky-text-main">
                  {activeTask.title}
                </h2>
                <p className="mt-1 text-xs text-stocky-text-sub">
                  {taskItems.filter((item) => item.taskId === activeTask.id).length}{' '}
                  items · Time since assigned{' '}
                  {elapsedLabel(
                    now -
                      new Date(startedAt || activeTask.createdAt).getTime()
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && onClose()}
                className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global transition-colors cursor-pointer"
                aria-label="Close"
              >
                <XIcon size="xs" />
              </button>
            </div>
            {status === 'assigned' && (
              <p className="mt-3 rounded-xl stocky-status-info border px-3 py-2 text-xs">
                Start when you are ready. Count only what you can physically see,
                then submit the whole list.
              </p>
            )}
          </div>

          {/* Body */}
          {['assigned', 'rejected'].includes(status) ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stocky-bg-global text-stocky-primary">
                <ClockIcon size="lg" />
              </div>
              <h3 className="text-base font-medium text-stocky-text-main">
                {status === 'rejected' ? 'Correction needed' : 'Ready to begin?'}
              </h3>
              <p className="max-w-sm text-xs text-stocky-text-sub">
                {status === 'rejected'
                  ? 'Your manager sent this task back. Check the list again and resubmit it.'
                  : 'Use the barcode scanner or search each item below. The expected quantity is not shown during the task.'}
              </p>
              <button
                type="button"
                onClick={startRunner}
                disabled={saving}
                className="h-10 rounded-full bg-stocky-primary hover:bg-stocky-primary-hover px-6 text-xs font-medium text-white transition-colors cursor-pointer disabled:opacity-60"
              >
                {saving
                  ? 'Starting...'
                  : status === 'rejected'
                  ? 'Start correction'
                  : 'Start task'}
              </button>
              {error && (
                <p className="rounded-xl stocky-status-critical border px-3 py-2 text-xs">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-stocky-border-subtle p-5">
                <div className="relative">
                  <SearchIcon
                    size="xs"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stocky-text-sub"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search product or barcode..."
                    className="h-10 w-full rounded-xl border border-stocky-border-subtle pl-9 pr-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
                  />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-stocky-text-sub">
                  <BarcodeIcon size="xs" />
                  <span>
                    Scan a barcode or type it above. Complete every item before
                    submitting.
                  </span>
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-5 divide-y divide-stocky-border-subtle">
                {currentItems.map((item) => {
                  const product = productMap.get(item.productId);
                  const result = results[item.id] || {
                    countedQuantity: '',
                    observedExpiryDate: '',
                    note: '',
                  };
                  const completed = Boolean(item.completedAt);

                  return (
                    <div key={item.id} className="py-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                            completed
                              ? 'stocky-status-success'
                              : 'stocky-status-muted'
                          }`}
                        >
                          {completed ? (
                            <CheckCircleIcon size="xs" />
                          ) : (
                            <span className="text-[10px] font-medium">•</span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-stocky-text-main">
                            {product?.name || 'Product'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-stocky-text-sub">
                            {product?.barcode || 'No barcode'}
                            {item.stockLotId
                              ? ` · Batch ${item.stockLotId.slice(0, 8)}`
                              : ''}
                          </p>
                        </div>
                      </div>

                      {activeTask.taskType === 'count' ? (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            required
                            aria-label={`Count ${product?.name || 'product'}`}
                            value={result.countedQuantity}
                            onChange={(e) =>
                              updateResult(
                                item.id,
                                'countedQuantity',
                                e.target.value
                              )
                            }
                            className="h-10 w-32 rounded-xl border border-stocky-border-subtle px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors"
                            placeholder="Quantity"
                          />
                          <span className="text-xs text-stocky-text-sub">
                            {product?.unitName || 'units'}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 grid gap-2">
                          <label className="text-[11px] font-medium text-stocky-text-sub">
                            Expiry date
                            <input
                              type="date"
                              required={!result.note}
                              value={result.observedExpiryDate}
                              onChange={(e) =>
                                updateResult(
                                  item.id,
                                  'observedExpiryDate',
                                  e.target.value
                                )
                              }
                              className="mt-1 h-10 w-full rounded-xl border border-stocky-border-subtle px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors"
                            />
                          </label>
                          <input
                            value={result.note}
                            onChange={(e) =>
                              updateResult(item.id, 'note', e.target.value)
                            }
                            placeholder="Note if date is missing or unclear"
                            className="h-9 w-full rounded-xl border border-stocky-border-subtle px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {error && (
                <p className="mx-5 mb-2 rounded-xl stocky-status-critical border px-3 py-2 text-xs">
                  {error}
                </p>
              )}

              {/* Standard h-10 Drawer Footer Actions */}
              <div className="flex gap-2 border-t border-stocky-border-subtle p-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 flex-1 rounded-full border border-stocky-border-subtle px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
                >
                  Save for later
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 flex-1 rounded-full bg-stocky-primary hover:bg-stocky-primary-hover px-6 text-xs font-medium text-white transition-colors cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  {saving ? 'Submitting...' : 'Submit task'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </SideDrawer>
  );
}
