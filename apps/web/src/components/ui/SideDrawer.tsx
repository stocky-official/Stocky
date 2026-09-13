'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export const STOCKY_DRAWER_TRANSITION = {
  type: 'spring' as const,
  stiffness: 350,
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
 * Smooth framer-motion spring sliding drawer with fade overlay.
 * Drawers are full-screen on phones and half viewport on desktop.
 */
export function SideDrawer({
  isOpen,
  onClose,
  children,
  ariaLabel,
  zIndex = 50,
  panelClassName = '',
}: SideDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="side-drawer-container"
          className="fixed inset-0"
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          initial="closed"
          animate="open"
          exit="closed"
        >
          <motion.div
            key="side-drawer-backdrop"
            variants={{
              closed: { opacity: 0 },
              open: { opacity: 1 },
            }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 stocky-overlay cursor-pointer"
            aria-hidden="true"
          />
          <motion.aside
            key="side-drawer-panel"
            variants={{
              closed: { x: '100%' },
              open: { x: '0%' },
            }}
            transition={STOCKY_DRAWER_TRANSITION}
            onClick={(event) => event.stopPropagation()}
            className={`absolute inset-y-0 right-0 flex h-dvh w-full flex-col overflow-hidden border-l border-stocky-border-subtle bg-white shadow-2xl md:w-[50vw] ${panelClassName}`}
          >
            {children as any}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
