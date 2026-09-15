'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarcodeIcon, ClockIcon } from '@stocky/icons';

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
 * - Uses `right-0 w-[20%]` with `items-center` to guarantee that both FABs
 *   are centered at 10% from the right edge, perfectly aligning with the
 *   center of the 5th (Attendance) button on the mobile bottom navigation bar.
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
  return (
    <div
      className="fixed bottom-[5.25rem] right-0 w-[20%] flex flex-col items-center gap-2.5 z-40 md:hidden pointer-events-none [&>*]:pointer-events-auto select-none"
      aria-label="Floating Action Controls"
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
            aria-label={isClockedIn ? 'Clocked In. Tap to Scan QR and Clock Out' : 'Tap to Scan QR and Clock In'}
            title={isClockedIn ? 'Clocked In · Scan QR to Clock Out' : 'Scan QR to Clock In'}
            className={`relative rounded-full flex items-center justify-center ring-[2.5px] ring-white shadow-xl transition-colors focus:outline-none cursor-pointer ${
              isClockedIn
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-stocky-text-main text-white hover:bg-black active:bg-neutral-800'
            }`}
            style={{ width: '52px', height: '52px' }}
          >
            {/* Active Shift Glow Ring & Indicator */}
            {isClockedIn && (
              <>
                <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-35 pointer-events-none" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-emerald-500 shadow-2xs" />
              </>
            )}

            <ClockIcon size="md" className={isClockedIn ? 'text-white' : 'text-white'} />
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
          aria-label="Scan Barcode with Camera"
          title="Scan Barcode"
          className="bg-stocky-primary text-stocky-text-main rounded-full flex items-center justify-center ring-[2.5px] ring-white shadow-xl hover:bg-stocky-primary-hover active:bg-stocky-primary-active transition-all focus:outline-none cursor-pointer"
          style={{ width: '52px', height: '52px' }}
        >
          <BarcodeIcon size="md" className="text-stocky-text-main" />
        </motion.button>
      )}
    </div>
  );
}
