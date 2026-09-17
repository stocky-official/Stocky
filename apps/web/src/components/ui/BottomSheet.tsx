'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from '@stocky/icons';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  activeCount?: number;
  onReset?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  zIndex?: number;
  className?: string;
  panelClassName?: string;
  mobileOnly?: boolean;
}

/**
 * Standardized BottomSheet drawer primitive.
 * Smooth spring-sliding sheet from the bottom on phones and mobile viewports,
 * centered modal on wider desktop viewports if rendered there.
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  activeCount,
  onReset,
  children,
  footer,
  zIndex = 50,
  className = '',
  panelClassName = '',
  mobileOnly = false,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 640);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const isActuallyMobileOnly = mobileOnly || className.includes('sm:hidden');

  useEffect(() => {
    if (!isOpen) return;
    if (isActuallyMobileOnly && isDesktop) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose, isActuallyMobileOnly, isDesktop]);

  if (!mounted || typeof document === 'undefined') return null;
  if (isActuallyMobileOnly && isDesktop) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 flex items-end justify-center ${
            isActuallyMobileOnly ? 'sm:!hidden' : 'sm:items-center'
          } ${className}`}
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : 'Bottom sheet'}
        >
          {/* Backdrop with Fade */}
          <motion.div
            key="bottom-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Sliding Panel */}
          <motion.div
            key="bottom-sheet-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32, mass: 0.8 }}
            className={`relative w-full sm:max-w-md bg-white border-t sm:border border-stocky-border-default rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 flex flex-col max-h-[85dvh] overflow-hidden ${panelClassName}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-full pt-3 pb-1 flex justify-center sm:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-stocky-border-subtle" />
            </div>

            {/* Optional Header */}
            {title && (
              <div className="px-4 py-3 border-b border-stocky-border-subtle flex items-center justify-between shrink-0 bg-white">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-stocky-text-main truncate">
                      {title}
                    </div>
                    {typeof activeCount === 'number' && activeCount > 0 && (
                      <span className="rounded-full bg-stocky-primary/10 px-2 py-0.5 text-[10px] font-semibold text-stocky-primary">
                        {activeCount} active
                      </span>
                    )}
                  </div>
                  {subtitle && (
                    <p className="text-[11px] text-stocky-text-sub truncate mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onReset && (
                    <button
                      type="button"
                      onClick={onReset}
                      className="text-xs font-semibold text-stocky-primary hover:underline cursor-pointer px-1"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-stocky-bg-global hover:bg-stocky-border-subtle text-stocky-text-sub hover:text-stocky-text-main flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    aria-label="Close sheet"
                  >
                    <XIcon size="xs" />
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable Body */}
            <div className="p-4 overflow-y-auto flex-1 overscroll-contain">
              {children}
            </div>

            {/* Optional Sticky Footer */}
            {footer && (
              <div className="p-3 border-t border-stocky-border-subtle bg-stocky-bg-global/50 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
