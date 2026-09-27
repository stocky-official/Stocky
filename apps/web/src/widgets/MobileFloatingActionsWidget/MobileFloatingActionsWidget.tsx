'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarcodeIcon, ClockIcon } from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

export interface MobileFloatingActionsWidgetProps {
  isAttendancePage: boolean;
  isClockedIn: boolean;
  onOpenAttendanceScanner: () => void;
  onOpenBarcodeScanner: () => void;
  hideBarcodeScanner?: boolean;
}

/**
 * MobileFloatingActionsWidget
 * Floating Action Button (FAB) stack positioned on mobile viewports.
 *
 * Geometric Alignment:
 * - Uses `ltr:right-0 rtl:left-0 w-[20%]` with `items-center` to guarantee that both FABs
 *   are centered at 10% from the trailing edge, perfectly aligning with the
 *   center of the 5th (Attendance) button on the mobile bottom navigation bar in both LTR and RTL.
 * - On the Attendance workspace, the Attendance QR Clock In/Out button is stacked
 *   directly on top of the Barcode button.
 */
export function MobileFloatingActionsWidget({
  isAttendancePage,
  isClockedIn,
  onOpenAttendanceScanner,
  onOpenBarcodeScanner,
  hideBarcodeScanner = false,
}: MobileFloatingActionsWidgetProps) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed bottom-[8rem] ltr:right-0 rtl:left-0 w-[20%] flex flex-col items-center gap-2.5 z-30 md:hidden pointer-events-none [&>*]:pointer-events-auto select-none"
      aria-label={t('toolbar.actions')}
    >
      {/* 1. Top FAB: Attendance QR Clock Button (Shown on Attendance page only) */}
      <AnimatePresence>
        {isAttendancePage && (
          <motion.button
            key="attendance-clock-fab"
            type="button"
            onClick={onOpenAttendanceScanner}
            initial={{ scale: 0, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 15 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            aria-label={isClockedIn ? t('floatingActions.clockOutAria') : t('floatingActions.clockInAria')}
            title={isClockedIn ? t('floatingActions.clockOutAria') : t('floatingActions.clockInAria')}
            className={`stocky-mobile-fab relative rounded-full flex items-center justify-center ring-[2.5px] ring-stocky-text-inverse shadow-bevel-float transition-colors focus:outline-none cursor-pointer ${
              isClockedIn
                ? 'bg-stocky-status-success-fg text-stocky-text-inverse'
                : 'bg-stocky-accent text-stocky-text-main hover:bg-stocky-accent-hover active:bg-stocky-accent-hover'
            }`}
          >
            {/* Active Shift Glow Ring & Indicator */}
            {isClockedIn && (
              <>
                <span className="absolute -inset-1 rounded-full border-2 border-stocky-status-success-fg animate-ping opacity-35 pointer-events-none" />
                <span className="absolute top-1 ltr:right-1 rtl:left-1 w-2.5 h-2.5 rounded-full bg-stocky-text-inverse border-2 border-stocky-status-success-fg shadow-2xs" />
              </>
            )}

            <ClockIcon size="md" className={isClockedIn ? 'text-stocky-text-inverse' : 'text-stocky-text-main'} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. Bottom FAB: Barcode Scanner Button (Always shown on mobile platform) */}
      {!hideBarcodeScanner && (
        <motion.button
          key="barcode-fab"
          type="button"
          onClick={onOpenBarcodeScanner}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          aria-label={t('floatingActions.scanBarcodeAria')}
          title={t('floatingActions.scanBarcodeAria')}
          className="stocky-mobile-fab bg-stocky-text-main text-stocky-text-inverse rounded-full flex items-center justify-center ring-[2.5px] ring-stocky-text-inverse shadow-bevel-float hover:bg-stocky-text-sub active:bg-stocky-text-sub transition-all focus:outline-none cursor-pointer"
        >
          <BarcodeIcon size="md" className="text-stocky-text-inverse" />
        </motion.button>
      )}
    </div>
  );
}
