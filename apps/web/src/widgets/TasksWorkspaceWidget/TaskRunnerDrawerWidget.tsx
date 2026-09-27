'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarcodeIcon,
  CheckCircleIcon,
  ClockIcon,
  ListTodoIcon,
  SearchIcon,
  XIcon,
} from '@stocky/icons';
import type { Product, StockTask, StockTaskItem } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { useTranslation } from '@/lib/i18n';
import { BarcodeScannerWidget } from '../BarcodeScannerWidget/BarcodeScannerWidget';

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

export function TaskRunnerDrawerWidget({
  task,
  taskItems,
  products,
  scanQuery = '',
  onClose,
  onStartTask,
  onSubmitTask,
}: TaskRunnerDrawerWidgetProps) {
  const { t } = useTranslation();
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

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
    try {
      const saved = window.localStorage.getItem(`stocky-task-draft:${task.id}`);
      if (saved) {
        const draft = JSON.parse(saved) as Record<string, Partial<TaskResult>>;
        Object.keys(initial).forEach((itemId) => {
          const savedResult = draft[itemId];
          if (savedResult) {
            initial[itemId] = {
              countedQuantity: savedResult.countedQuantity || '',
              observedExpiryDate: savedResult.observedExpiryDate || '',
              note: savedResult.note || '',
            };
          }
        });
      }
    } catch {
      // Ignore malformed local drafts and start with a clean task form.
    }
    setResults(initial);
    setSearch('');
    setError(null);
    setStatus(task.status);
    setStartedAt(task.startedAt || task.createdAt);
    setScannerOpen(false);
    setHighlightedItemId(null);
  }, [task, taskItems]);

  useEffect(() => {
    if (!activeTask || activeTask.taskType === 'open' || Object.keys(results).length === 0) return;
    try {
      window.localStorage.setItem(`stocky-task-draft:${activeTask.id}`, JSON.stringify(results));
    } catch {
      // Draft persistence is best effort; submission remains server-backed.
    }
  }, [activeTask, results]);

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
      setError(err?.message || t('tasks.startFailed'));
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

    if (activeTask.taskType === 'open') {
      setSaving(true);
      setError(null);
      try {
        await onSubmitTask(activeTask.id, []);
        window.localStorage.removeItem(`stocky-task-draft:${activeTask.id}`);
        onClose();
      } catch (err: any) {
        setError(err?.message || t('tasks.submitFailed'));
      } finally {
        setSaving(false);
      }
      return;
    }

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
      return setError(t('tasks.errorWholeNumber'));
    }

    if (
      activeTask.taskType === 'expiry' &&
      payload.some((item) => !item.observedExpiryDate && !item.note)
    ) {
      return setError(t('tasks.errorExpiryOrNote'));
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmitTask(activeTask.id, payload);
      window.localStorage.removeItem(`stocky-task-draft:${activeTask.id}`);
      onClose();
    } catch (err: any) {
      setError(err?.message || t('tasks.submitFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SideDrawer
        isOpen={Boolean(task)}
        onClose={() => !saving && onClose()}
        ariaLabel={t('tasks.title')}
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
                  {activeTask.taskType === 'open'
                    ? t('tasks.directTask')
                    : `${taskItems.filter((item) => item.taskId === activeTask.id).length} ${t('tasks.itemsCount')}`}
                  {' · '}
                  {t('tasks.timeSinceAssigned', {
                    time: elapsedLabel(
                      now -
                        new Date(startedAt || activeTask.createdAt).getTime(),
                      t
                    ),
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && onClose()}
                className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global transition-colors cursor-pointer"
                aria-label={t('common.close')}
              >
                <XIcon size="xs" />
              </button>
            </div>
            {status === 'assigned' && (
              <p className="mt-3 rounded-xl stocky-status-info border px-3 py-2 text-xs">
                {activeTask.taskType === 'open'
                  ? t('tasks.assignedOpenDesc')
                  : t('tasks.assignedCountDesc')}
              </p>
            )}
          </div>

          {/* Body */}
          {['assigned', 'rejected'].includes(status) ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stocky-bg-global text-stocky-primary">
                {activeTask.taskType === 'open' ? <ListTodoIcon size="md" /> : <ClockIcon size="md" />}
              </div>
              <h3 className="text-base font-medium text-stocky-text-main">
                {status === 'rejected' ? t('tasks.correctionNeeded') : t('tasks.readyToBegin')}
              </h3>
              <p className="max-w-sm text-xs text-stocky-text-sub">
                {status === 'rejected'
                  ? `${t('tasks.rejectedDesc')}${activeTask.reviewNote ? ` ${activeTask.reviewNote}` : ''}`
                  : activeTask.taskType === 'open'
                  ? (activeTask.notes || t('tasks.startTaskInstructions'))
                  : t('tasks.scannerPrompt')}
              </p>
              <button
                type="button"
                onClick={startRunner}
                disabled={saving}
                className="h-10 rounded-full bg-stocky-primary hover:bg-stocky-primary-hover px-6 text-xs font-medium text-stocky-text-inverse transition-colors cursor-pointer disabled:opacity-60"
              >
                {saving
                  ? t('common.loading')
                  : status === 'rejected'
                  ? t('tasks.startCorrection')
                  : t('tasks.startRunner')}
              </button>
              {error && (
                <p className="rounded-xl stocky-status-critical border px-3 py-2 text-xs">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              {activeTask.taskType === 'open' ? (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="rounded-2xl border border-stocky-border-subtle bg-stocky-bg-global/40 p-4">
                    <h4 className="text-xs font-semibold text-stocky-text-main flex items-center gap-2">
                      <ListTodoIcon size="xs" className="text-stocky-primary" />
                      {t('tasks.taskDetails')}
                    </h4>
                    <p className="mt-2 text-xs text-stocky-text-main whitespace-pre-wrap leading-relaxed">
                      {activeTask.notes || t('tasks.noInstructions')}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-stocky-border-subtle bg-stocky-status-success-fg p-4">
                    <p className="text-xs text-stocky-text-sub">
                      {t('tasks.workAccomplished')}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="border-b border-stocky-border-subtle p-5">
                    <div className="flex gap-2">
                      <div className="relative min-w-0 flex-1">
                        <SearchIcon
                          size="xs"
                          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-stocky-text-sub"
                        />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder={t('tasks.searchProducts')}
                          className="h-10 w-full rounded-xl border border-stocky-border-subtle ps-9 pe-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-stocky-border-subtle px-3 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors"
                      >
                        <BarcodeIcon size="xs" />
                        <span>{t('tasks.scanBarcode')}</span>
                      </button>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-stocky-text-sub">
                      <BarcodeIcon size="xs" />
                      <span>
                        {t('tasks.scanBarcodePrompt')}
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
                        <div key={item.id} className={`py-4 ${highlightedItemId === item.id ? 'rounded-xl bg-stocky-primary/10 px-3' : ''}`}>
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
                                {product?.name || t('inventory.productName')}
                              </p>
                              <p className="mt-0.5 text-[11px] text-stocky-text-sub">
                                {product?.barcode || product?.categoryName || t('drawers.receiveStock.noBarcode')}
                              </p>
                            </div>
                          </div>

                          {activeTask.taskType === 'count' ? (
                            <div className="mt-3 flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={result.countedQuantity}
                                onChange={(e) =>
                                  updateResult(
                                    item.id,
                                    'countedQuantity',
                                    e.target.value
                                  )
                                }
                                placeholder={t('tasks.quantityCounted')}
                                className="h-10 flex-1 rounded-xl border border-stocky-border-subtle px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors"
                              />
                              <input
                                value={result.note}
                                onChange={(e) =>
                                  updateResult(item.id, 'note', e.target.value)
                                }
                                placeholder={t('tasks.noteOptional')}
                                className="h-10 flex-1 rounded-xl border border-stocky-border-subtle px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
                              />
                            </div>
                          ) : (
                            <div className="mt-3 grid gap-2">
                              <label className="text-[11px] font-medium text-stocky-text-sub">
                                {t('tasks.expiryDate')}
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
                                placeholder={t('tasks.noteIfUnclear')}
                                className="h-9 w-full rounded-xl border border-stocky-border-subtle px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

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
                  {t('tasks.saveForLater')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 flex-1 rounded-full bg-stocky-primary hover:bg-stocky-primary-hover px-6 text-xs font-medium text-stocky-text-inverse transition-colors cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  {saving ? t('common.loading') : t('tasks.submitTask')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      </SideDrawer>
      <BarcodeScannerWidget
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        hideFloatingButton
        onBarcodeFound={(barcode) => {
          const scannedItem = activeTask
            ? taskItems.find((item) => item.taskId === activeTask.id && productMap.get(item.productId)?.barcode === barcode)
            : undefined;
          setSearch('');
          setScannerOpen(false);
          if (!scannedItem) {
            setError(t('tasks.barcodeNotFound'));
          } else {
            setHighlightedItemId(scannedItem.id);
            setError(null);
            window.setTimeout(() => setHighlightedItemId(null), 2500);
          }
        }}
      />
    </>
  );
}
