'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  CheckIcon,
  TimerIcon,
  PlusIcon,
  BoxesIcon,
  RotateCcwIcon,
  SparklesIcon,
} from '@stocky/icons';
import type { Item } from '@stocky/types';

export interface AuditItemRow {
  id: string;
  name: string;
  category: string;
  barcode: string;
  expectedQty: number;
  countedQty: number;
  isReconciled: boolean;
}

export interface StockAuditWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  shelfName?: string;
  auditItems?: AuditItemRow[];
  onCompleteAudit?: (results: AuditItemRow[]) => void;
}

const DEFAULT_AUDIT_ITEMS: AuditItemRow[] = [
  {
    id: 'aud-1',
    name: 'Whole Milk 1L Pasteurized',
    category: 'Dairy & Fresh',
    barcode: '622100100101',
    expectedQty: 24,
    countedQty: 24,
    isReconciled: true,
  },
  {
    id: 'aud-2',
    name: 'Greek Yogurt 200g Natural',
    category: 'Dairy & Fresh',
    barcode: '622100100102',
    expectedQty: 48,
    countedQty: 48,
    isReconciled: false,
  },
  {
    id: 'aud-3',
    name: 'Cheddar Cheese Block 500g',
    category: 'Dairy & Fresh',
    barcode: '622100100103',
    expectedQty: 18,
    countedQty: 18,
    isReconciled: false,
  },
  {
    id: 'aud-4',
    name: 'Salted Butter 200g',
    category: 'Dairy & Fresh',
    barcode: '622100100104',
    expectedQty: 36,
    countedQty: 30,
    isReconciled: false,
  },
];

export function StockAuditWidget({
  isOpen,
  onClose,
  shelfName = 'Aisle 04 • Cold Display Shelf B',
  auditItems = DEFAULT_AUDIT_ITEMS,
  onCompleteAudit,
}: StockAuditWidgetProps) {
  const [items, setItems] = useState<AuditItemRow[]>(auditItems);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(1);
  const [timerSeconds, setTimerSeconds] = useState<number>(45);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const resetTimer = () => {
    setTimerSeconds(45);
    setIsTimerRunning(true);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Increment item count using packaging multiplier tiers (+1 Unit, +6 Pack, +24 Case, +100 Carton)
  const handleIncrement = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const newCount = Math.max(0, item.countedQty + delta);
          return {
            ...item,
            countedQty: newCount,
            isReconciled: newCount === item.expectedQty,
          };
        }
        return item;
      })
    );
  };

  // Toggle Reconciled status
  const handleToggleReconciled = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const nextReconciled = !item.isReconciled;
          return {
            ...item,
            isReconciled: nextReconciled,
            // If toggling on, sync count to expected if count was 0
            countedQty: nextReconciled && item.countedQty === 0 ? item.expectedQty : item.countedQty,
          };
        }
        return item;
      })
    );

    // Auto-advance to next unreconciled item
    const nextIndex = items.findIndex((it, i) => i > index && !it.isReconciled);
    if (nextIndex !== -1) {
      setActiveItemIndex(nextIndex);
      resetTimer();
    }
  };

  const reconciledCount = items.filter((i) => i.isReconciled).length;
  const progressPercent = Math.round((reconciledCount / items.length) * 100);

  const handleFinish = () => {
    if (onCompleteAudit) {
      onCompleteAudit(items);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Slide-up Audit Logger Modal/Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed inset-x-0 bottom-0 z-50 max-w-2xl mx-auto bg-white rounded-t-[32px] border-t border-x border-slate-200 shadow-2xl p-5 sm:p-6 pb-12 flex flex-col space-y-5 max-h-[92vh] overflow-y-auto"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-1" />

            {/* Header: Shelf title + Countdown pill */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Rapid Cycle Count
                  </span>
                  <span className="text-xs text-slate-400">
                    {reconciledCount}/{items.length} verified
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 tracking-tight">
                  {shelfName}
                </h3>
              </div>

              {/* Bevel-Style Rest / Target Countdown Pill */}
              <div className="flex items-center gap-2 bg-slate-100/90 rounded-full px-3 py-1.5 border border-slate-200/80">
                <TimerIcon size="xs" className="text-slate-500" />
                <span className="text-xs font-mono font-semibold text-slate-700">
                  {formatTime(timerSeconds)}
                </span>
                <button
                  type="button"
                  onClick={resetTimer}
                  title="Reset shelf timer"
                  className="text-slate-400 hover:text-slate-700 transition-colors ml-0.5 cursor-pointer"
                >
                  <RotateCcwIcon size="xs" />
                </button>
              </div>
            </div>

            {/* Audit Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <motion.div
                className="bg-emerald-500 h-full rounded-full"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Audit Items List (Matching Bevel Workout Set Logger) */}
            <div className="space-y-3">
              {items.map((item, idx) => {
                const isActive = activeItemIndex === idx;
                const isDiscrepancy = item.isReconciled && item.countedQty !== item.expectedQty;

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveItemIndex(idx)}
                    className={`p-4 rounded-2xl border transition-all select-none cursor-pointer ${
                      isActive
                        ? 'bg-white border-stocky-primary shadow-bevel ring-1 ring-stocky-primary/20'
                        : item.isReconciled
                        ? 'bg-emerald-50/30 border-emerald-100/80'
                        : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Step / Set Badge + SKU Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            item.isReconciled
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : isActive
                              ? 'bg-stocky-primary text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.isReconciled ? <CheckIcon size="xs" /> : idx + 1}
                        </div>

                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate block">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.barcode}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Expected vs Counted Pills */}
                      <div className="flex items-center gap-2">
                        <div className="text-center px-2.5 py-1 bg-slate-100/90 rounded-xl text-xs">
                          <span className="text-[10px] text-slate-400 block uppercase">Exp</span>
                          <span className="font-semibold text-slate-700">{item.expectedQty}</span>
                        </div>

                        <div
                          className={`text-center px-3 py-1 rounded-xl text-xs font-semibold border ${
                            isDiscrepancy
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : item.isReconciled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-900 border-slate-200'
                          }`}
                        >
                          <span className="text-[10px] text-slate-400 block uppercase">Count</span>
                          <span>{item.countedQty}</span>
                        </div>

                        {/* Right: Big Green Reconcile Checkmark Button */}
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleReconciled(idx);
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                            item.isReconciled
                              ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                              : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                          title="Mark Reconciled"
                        >
                          <CheckIcon size="sm" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Active SKU: Packaging Multiplier Increment Picker (Bevel Plate Rack translated) */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="text-[11px] text-slate-400 font-medium">
                          Quick Increment:
                        </span>

                        <div className="flex items-center gap-1.5">
                          {[
                            { label: '+1 Unit', val: 1 },
                            { label: '+6 Pack', val: 6 },
                            { label: '+12 Box', val: 12 },
                            { label: '+24 Case', val: 24 },
                          ].map((tier) => (
                            <button
                              key={tier.label}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIncrement(idx, tier.val);
                              }}
                              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
                            >
                              {tier.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIncrement(idx, -1);
                            }}
                            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center text-xs font-semibold transition-colors cursor-pointer"
                            title="Subtract 1"
                          >
                            -1
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Floating Session Status Bar & Finish Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <CheckIcon size="xs" />
                <span>Complete Audit ({reconciledCount}/{items.length} Reconciled)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Save & Pause
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
