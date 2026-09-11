'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export const STOCKY_DRAWER_TRANSITION = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 34,
  mass: 0.8,
};

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  zIndex?: number;
  panelClassName?: string;
}

/**
 * Shared responsive drawer primitive for the web platform.
 *
 * Drawers are full-screen on phones and exactly half the viewport on desktop.
 * Keeping the motion here prevents each workflow from drifting into a
 * different open/close interaction.
 */
export function SideDrawer({
  isOpen,
  onClose,
  children,
  ariaLabel,
  zIndex = 50,
  panelClassName = '',
}: SideDrawerProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence initial={false} mode="sync">
      {isOpen && (
        <div className="fixed inset-0" style={{ zIndex }} role="dialog" aria-modal="true" aria-label={ariaLabel}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 stocky-overlay"
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={STOCKY_DRAWER_TRANSITION}
            onClick={(event) => event.stopPropagation()}
            className={`absolute inset-y-0 right-0 flex h-dvh w-full flex-col overflow-hidden border-l border-stocky-border-subtle bg-white shadow-2xl md:w-[50vw] ${panelClassName}`}
          >
            {children as any}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
