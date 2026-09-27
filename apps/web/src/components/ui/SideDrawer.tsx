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
  widthClassName?: string;
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
  widthClassName = 'md:w-[50vw]',
}: SideDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  const panelRef = useRef<HTMLElement>(null);
  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    const focusFirstControl = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const firstControl = panel.querySelector<HTMLElement>(focusableSelector);
      (firstControl || panel).focus();
    };
    const focusFrame = window.requestAnimationFrame(focusFirstControl);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const controls = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (controls.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
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
            ref={panelRef}
            tabIndex={-1}
            className={`fixed inset-y-0 right-0 flex h-dvh w-full flex-col overflow-hidden border-l border-stocky-border-subtle bg-stocky-bg-widget shadow-none ${widthClassName} ${panelClassName}`}
          >
            {children as any}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
