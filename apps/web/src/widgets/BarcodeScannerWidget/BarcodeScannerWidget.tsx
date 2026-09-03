'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, XIcon, ZapIcon, ZapOffIcon, RefreshIcon, CheckCircleIcon, AlertCircleIcon } from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import type { Item } from '@stocky/types';
import { Html5Qrcode } from 'html5-qrcode';


export interface BarcodeScannerWidgetProps {
  onProductFound: (item: Item) => void;
  onCodeNotFound?: (barcode: string) => void;
}

/**
 * Play a high-pitch subtle audio beep confirmation upon barcode detection
 */
function playBeepSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 pitch
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore audio context errors if not allowed
  }
}

/**
 * BarcodeScannerWidget (Stocky Mobile Web Architecture)
 * - Mobile hovering FAB with Camera Icon
 * - Direct phone camera feed with high-contrast reticle
 * - Hardware-accelerated barcode decoding with fallback
 * - Instant catalog lookup & drawer trigger
 */
export function BarcodeScannerWidget({
  onProductFound,
  onCodeNotFound,
}: BarcodeScannerWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    found: boolean;
    itemName?: string;
  } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const scannerRef = useRef<any>(null);
  const isHandlingScanRef = useRef(false);

  // Initialize and start scanner when overlay is open
  useEffect(() => {
    let isMounted = true;

    async function startScanner() {
      if (!isOpen) return;
      setCameraError(null);
      setScannedResult(null);
      isHandlingScanRef.current = false;

      // Small tick to ensure <div id="stocky-camera-viewport"> is mounted in the DOM
      await new Promise((r) => setTimeout(r, 60));
      if (!isMounted) return;

      const viewportEl = document.getElementById('stocky-camera-viewport');
      if (!viewportEl) {
        console.warn('Scanner container not yet in DOM');
        return;
      }

      try {
        const scanner = new Html5Qrcode('stocky-camera-viewport');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 260, height: 160 },
            aspectRatio: 1.0,
          },
          async (decodedText: string) => {
            if (isHandlingScanRef.current) return;
            isHandlingScanRef.current = true;

            // Audio & Haptic feedback
            playBeepSound();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(100);
            }

            setIsSearching(true);
            const cleanCode = decodedText.trim();

            try {
              // Query Supabase for the scanned barcode
              const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('barcode', cleanCode)
                .limit(1)
                .maybeSingle();

              if (error) throw error;

              if (data) {
                const item: Item = {
                  id: data.id,
                  companyId: data.company_id,
                  branchId: data.branch_id,
                  categoryName: data.category_name,
                  name: data.name,
                  quantity: data.quantity,
                  balance: data.balance,
                  barcode: data.barcode,
                  createdAt: data.created_at,
                  updatedAt: data.updated_at,
                };

                setScannedResult({
                  code: cleanCode,
                  found: true,
                  itemName: item.name,
                });

                // Auto-trigger drawer and close scanner after a brief visual confirmation
                setTimeout(() => {
                  stopScanner();
                  setIsOpen(false);
                  onProductFound(item);
                }, 750);
              } else {
                setScannedResult({
                  code: cleanCode,
                  found: false,
                });
                if (onCodeNotFound) {
                  onCodeNotFound(cleanCode);
                }
              }
            } catch (err: any) {
              console.error('Error querying scanned barcode:', err);
              setScannedResult({
                code: cleanCode,
                found: false,
              });
            } finally {
              setIsSearching(false);
            }
          },
          () => {
            // Frame parsing errors are ignored for smooth scanning
          }
        );

        // Check if torch/flashlight is supported
        try {
          const capabilities: any = scanner.getRunningTrackCapabilities?.();
          if (capabilities && capabilities.torch) {
            setHasTorch(true);
          }
        } catch {
          // Ignore capability check error
        }
      } catch (err: any) {
        console.error('Failed to start camera scanner:', err);
        setCameraError(
          err.message || 'Unable to access camera. Please allow camera permissions in your browser.'
        );
      }
    }

    if (isOpen) {
      startScanner();
    }

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen, onProductFound, onCodeNotFound]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
  };

  const handleClose = async () => {
    await stopScanner();
    setIsOpen(false);
    setScannedResult(null);
    setCameraError(null);
    isHandlingScanRef.current = false;
  };

  const handleScanAgain = () => {
    setScannedResult(null);
    isHandlingScanRef.current = false;
  };

  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.error('Error toggling torch:', err);
    }
  };

  return (
    <>
      {/* 1. Hovering Mobile Camera Button (Hidden on Desktop, Visible on Phone) */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Scan Barcode with Camera"
        className="fixed bottom-20 right-4 z-40 md:hidden w-13 h-13 bg-stocky-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-stocky-primary-hover active:bg-stocky-primary-active transition-colors focus:outline-none focus:ring-2 focus:ring-stocky-primary focus:ring-offset-2"
        style={{ width: '52px', height: '52px' }}
      >
        <CameraIcon size="md" className="text-white" />
      </motion.button>

      {/* 2. Full-Screen Camera Viewfinder Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            {/* Top Navigation & Controls */}
            <div className="relative z-10 flex items-center justify-between px-4 py-4 pt-6 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white tracking-tight">
                  Barcode Scanner
                </span>
                {isSearching && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-stocky-primary/80 text-white font-normal animate-pulse">
                    Looking up...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    {isTorchOn ? <ZapIcon size="sm" /> : <ZapOffIcon size="sm" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <XIcon size="sm" />
                </button>
              </div>
            </div>

            {/* Viewfinder Center Container */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {/* html5-qrcode video viewport */}
              <div
                id="stocky-camera-viewport"
                className="w-full h-full absolute inset-0 flex items-center justify-center"
              />

              {/* Target Scan Reticle Overlay */}
              {!cameraError && (
                <div className="pointer-events-none relative w-[260px] h-[160px] flex items-center justify-center">
                  {/* Corner Reticle Marks */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-stocky-primary rounded-tl-sm" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-stocky-primary rounded-tr-sm" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-stocky-primary rounded-bl-sm" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-stocky-primary rounded-br-sm" />

                  {/* Animated Laser Scanning Line */}
                  {!scannedResult && (
                    <motion.div
                      className="w-full h-0.5 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                      animate={{
                        y: [-60, 60, -60],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && (
                <div className="z-10 p-6 bg-stocky-bg-widget/95 rounded-widget border border-stocky-border-subtle max-w-xs text-center space-y-3">
                  <AlertCircleIcon size="lg" className="text-red-500 mx-auto" />
                  <h3 className="text-sm font-medium text-stocky-text-main">
                    Camera Access Required
                  </h3>
                  <p className="text-xs text-stocky-text-sub leading-relaxed">
                    {cameraError}
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full py-2 bg-stocky-primary text-white text-xs font-medium rounded-widget hover:bg-stocky-primary-hover transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Status & Feedback Bar */}
            <div className="relative z-10 px-6 py-6 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-3">
              {scannedResult ? (
                scannedResult.found ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm bg-green-950/90 border border-green-500/50 rounded-widget p-3.5 flex items-center gap-3 text-left"
                  >
                    <CheckCircleIcon size="md" className="text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {scannedResult.itemName}
                      </p>
                      <p className="text-[11px] text-green-300 font-normal">
                        Barcode: {scannedResult.code} • Opening details...
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm bg-amber-950/90 border border-amber-500/50 rounded-widget p-3.5 space-y-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircleIcon size="sm" className="text-amber-400 shrink-0" />
                      <span className="text-xs font-medium text-white">
                        Item Not Found
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 font-normal">
                      Scanned barcode <span className="font-medium">{scannedResult.code}</span> is not registered in the catalog.
                    </p>
                    <button
                      type="button"
                      onClick={handleScanAgain}
                      className="w-full mt-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-widget text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshIcon size="xs" />
                      Scan Another
                    </button>
                  </motion.div>
                )
              ) : (
                <p className="text-xs text-white/70 font-normal text-center">
                  Direct your camera at any retail barcode on the product packaging
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
