'use client';

import React, { useMemo, useRef, useState } from 'react';
import { XIcon } from '@stocky/icons';
import type {
  Product,
  StockTask,
  StockTaskExpected,
  StockTaskItem,
} from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';

export interface TaskReviewDrawerWidgetProps {
  task: StockTask | null;
  taskItems: StockTaskItem[];
  taskExpected: StockTaskExpected[];
  products: Product[];
  onClose: () => void;
  onReviewTask: (
    taskId: string,
    approve: boolean,
    note?: string
  ) => Promise<void>;
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : 'Not recorded';
}

export function TaskReviewDrawerWidget({
  task,
  taskItems,
  taskExpected,
  products,
  onClose,
  onReviewTask,
}: TaskReviewDrawerWidgetProps) {
  const lastTaskRef = useRef<StockTask | null>(task);
  if (task) lastTaskRef.current = task;
  const activeTask = task || lastTaskRef.current;

  const [reviewNote, setReviewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );
  const expectedMap = useMemo(
    () => new Map(taskExpected.map((e) => [e.taskItemId, e])),
    [taskExpected]
  );

  const handleReview = async (approve: boolean) => {
    if (!activeTask) return;
    setSaving(true);
    setError(null);
    try {
      await onReviewTask(activeTask.id, approve, reviewNote.trim() || undefined);
      setReviewNote('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not review this task.');
    } finally {
      setSaving(false);
    }
  };

  const currentItems = activeTask
    ? taskItems.filter((item) => item.taskId === activeTask.id)
    : [];

  return (
    <SideDrawer
      isOpen={Boolean(task)}
      onClose={() => !saving && onClose()}
      ariaLabel="Review stock task"
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
                Compare the submitted count with expected quantities before approving.
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-2.5">
              {currentItems.map((item) => {
                const product = productMap.get(item.productId);
                const expected = expectedMap.get(item.id);
                const difference =
                  activeTask.taskType === 'count'
                    ? Number(item.countedQuantity || 0) -
                      Number(expected?.expectedQuantity || 0)
                    : 0;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-stocky-border-subtle p-3 bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
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

                      {activeTask.taskType === 'count' ? (
                        <div className="text-right">
                          <span
                            className={`inline-block text-xs font-medium ${
                              difference === 0
                                ? 'text-stocky-text-sub'
                                : difference > 0
                                ? 'stocky-text-success'
                                : 'stocky-text-critical'
                            }`}
                          >
                            Expected {expected?.expectedQuantity ?? 0} · Counted{' '}
                            {item.countedQuantity ?? 0}
                          </span>
                        </div>
                      ) : (
                        <div className="text-right text-[11px] text-stocky-text-sub">
                          <span>Recorded {formatDate(expected?.expectedExpiryDate)}</span>
                          <br />
                          <strong className="text-stocky-text-main">
                            Found {formatDate(item.observedExpiryDate)}
                          </strong>
                        </div>
                      )}
                    </div>

                    {difference !== 0 && (
                      <p className="mt-2 text-[11px] font-medium text-stocky-text-sub">
                        Variance: {difference > 0 ? `+${difference}` : difference}{' '}
                        {product?.unitName || 'units'}
                      </p>
                    )}

                    {item.note && (
                      <p className="mt-2 rounded-lg bg-stocky-bg-global px-2.5 py-1.5 text-[11px] text-stocky-text-sub">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Review Note */}
            <div className="mt-5">
              <label className="block text-xs font-medium text-stocky-text-main">
                Review note <span className="font-normal text-stocky-text-sub">(optional)</span>
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="Add feedback or reasons for sending back..."
                className="mt-1.5 w-full resize-none rounded-xl border border-stocky-border-subtle px-3 py-2 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="mt-3 rounded-xl stocky-status-critical border px-3 py-2 text-xs">
                {error}
              </p>
            )}
          </div>

          {/* Standard h-10 Drawer Footer Actions */}
          <div className="flex gap-2 border-t border-stocky-border-subtle p-5">
            <button
              type="button"
              onClick={() => handleReview(false)}
              disabled={saving}
              className="h-10 flex-1 rounded-full border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Send back'}
            </button>
            <button
              type="button"
              onClick={() => handleReview(true)}
              disabled={saving}
              className="h-10 flex-1 rounded-full bg-stocky-primary hover:bg-stocky-primary-hover px-6 text-xs font-medium text-white transition-colors cursor-pointer disabled:opacity-60 shadow-sm"
            >
              {saving ? 'Saving...' : 'Approve & log'}
            </button>
          </div>
        </div>
      )}
    </SideDrawer>
  );
}
