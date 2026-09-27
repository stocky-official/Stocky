'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

export interface ChartFilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onApply?: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}

export function ChartFilterBottomSheet({
  isOpen,
  onClose,
  title,
  onApply,
  onReset,
  children,
}: ChartFilterBottomSheetProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            key="bottom-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-stocky-text-main/40 backdrop-blur-xs"
          />

          {/* Sliding Window from the Bottom */}
          <motion.div
            key="bottom-sheet-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32, mass: 0.8 }}
            className="relative w-full sm:max-w-md bg-stocky-bg-widget border-t sm:border border-stocky-border-default rounded-t-3xl sm:rounded-2xl shadow-xl z-10 flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Top Handle Bar for Touch */}
            <div className="w-full pt-3 pb-1 flex justify-center sm:hidden">
              <div className="w-10 h-1.5 rounded-full bg-stocky-border-default/80" />
            </div>

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-stocky-border-subtle flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stocky-text-main">
                  {title}
                </h3>
                <p className="text-[11px] text-stocky-text-sub mt-0.5">
                  {t('home.charts.filterBottomSheetSubtitle')}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-stocky-bg-global hover:bg-stocky-border-subtle text-stocky-text-sub flex items-center justify-center transition-colors cursor-pointer"
              >
                <XIcon size="xs" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {children}
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3.5 border-t border-stocky-border-subtle bg-stocky-bg-global/40 flex items-center justify-between gap-3">
              {onReset ? (
                <button
                  type="button"
                  onClick={onReset}
                  className="h-10 px-4 rounded-xl text-xs font-semibold text-stocky-text-sub hover:text-stocky-text-main transition-colors cursor-pointer"
                >
                  {t('common.reset')}
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => {
                  if (onApply) onApply();
                  onClose();
                }}
                className="h-10 px-6 rounded-xl bg-stocky-primary hover:bg-stocky-primary-hover text-stocky-text-inverse text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                {t('filters.apply')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
