'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CameraIcon,
  XIcon,
  ZapIcon,
  ZapOffIcon,
  RefreshIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  SearchIcon,
} from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import type { Item } from '@stocky/types';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export interface BarcodeScannerWidgetProps {
  onProductFound: (item: Item) => void;
  onCodeNotFound?: (barcode: string) => void;
}

// All major retail 1D & 2D barcode formats
const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
];

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
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore audio errors
  }
}

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
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isHandlingScanRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  // Core Lookup Handler for detected or typed barcodes
  const handleBarcodeScanned = useCallback(
    async (rawCode: string) => {
      const cleanCode = rawCode.trim();
      if (!cleanCode || isHandlingScanRef.current) return;
      isHandlingScanRef.current = true;

      // Audio & Haptic feedback
      playBeepSound();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }

      setIsSearching(true);

      try {
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

          // Open drawer and close camera after brief confirmation
          setTimeout(() => {
            stopScanner();
            setIsOpen(false);
            onProductFound(item);
          }, 600);
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
    [onProductFound, onCodeNotFound]
  );

  // Cleanup helper
  const stopScanner = async () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

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

  // Start Scanner when modal opens
  useEffect(() => {
    let isMounted = true;

    async function startScanner() {
      if (!isOpen) return;
      setCameraError(null);
      setScannedResult(null);
      setShowManualInput(false);
      setManualInput('');
      isHandlingScanRef.current = false;

      // Small tick to ensure container element is mounted in DOM
      await new Promise((r) => setTimeout(r, 80));
      if (!isMounted) return;

      const viewportEl = document.getElementById('stocky-camera-viewport');
      if (!viewportEl) {
        console.warn('Viewport element not yet mounted');
        return;
      }

      try {
        // Initialize Html5Qrcode with full retail barcode support and hardware BarcodeDetector
        const scanner = new Html5Qrcode('stocky-camera-viewport', {
          formatsToSupport: SUPPORTED_FORMATS,
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 20,
            aspectRatio: 1.0,
            disableFlip: false,
            videoConstraints: {
              facingMode: 'environment',
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
            },
          },
          (decodedText: string) => {
            handleBarcodeScanned(decodedText);
          },
          () => {
            // Frame parsing errors are ignored
          }
        );

        // Native BarcodeDetector acceleration (for Android Chrome / Edge)
        // Directly detects barcodes off the HTMLVideoElement with near-zero latency
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const nativeDetector = new (window as any).BarcodeDetector({
              formats: [
                'ean_13',
                'ean_8',
                'code_128',
                'code_39',
                'code_93',
                'upc_a',
                'upc_e',
                'qr_code',
                'itf',
              ],
            });

            const checkNativeDetection = async () => {
              if (!isMounted || !isOpen || isHandlingScanRef.current) return;
              const videoEl = document.querySelector(
                '#stocky-camera-viewport video'
              ) as HTMLVideoElement | null;

              if (videoEl && videoEl.readyState >= 2) {
                try {
                  const barcodes = await nativeDetector.detect(videoEl);
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    handleBarcodeScanned(barcodes[0].rawValue);
                    return;
                  }
                } catch {
                  // Frame detection error
                }
              }

              rafIdRef.current = requestAnimationFrame(checkNativeDetection);
            };

            rafIdRef.current = requestAnimationFrame(checkNativeDetection);
          } catch (e) {
            console.warn('Native BarcodeDetector not active', e);
          }
        }

        // Check if torch/flashlight is supported
        try {
          const capabilities: any = scanner.getRunningTrackCapabilities?.();
          if (capabilities && capabilities.torch) {
            setHasTorch(true);
          }
        } catch {
          // Ignore
        }
      } catch (err: any) {
        console.error('Failed to start camera scanner:', err);
        setCameraError(
          err.message || 'Unable to access camera. Please allow camera permissions.'
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
  }, [isOpen, handleBarcodeScanned]);

  const handleClose = async () => {
    await stopScanner();
    setIsOpen(false);
    setScannedResult(null);
    setCameraError(null);
    setShowManualInput(false);
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
        advanced: [{ torch: nextTorch } as any],
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.error('Error toggling torch:', err);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleBarcodeScanned(manualInput.trim());
    }
  };

  return (
    <>
      {/* 1. Mobile Floating Camera Button (Shown on phone viewports) */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Scan Barcode with Camera"
        className="fixed bottom-20 right-4 z-40 md:hidden bg-stocky-primary text-white rounded-full flex items-center justify-center shadow-xl hover:bg-stocky-primary-hover active:bg-stocky-primary-active transition-all focus:outline-none"
        style={{ width: '54px', height: '54px' }}
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
            <div className="relative z-10 flex items-center justify-between px-4 py-3 pt-5 bg-gradient-to-b from-black/90 to-transparent">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white tracking-tight">
                  Barcode Scanner
                </span>
                {isSearching && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-stocky-primary text-white font-normal animate-pulse">
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
                className="w-full h-full absolute inset-0 flex items-center justify-center [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
              />

              {/* Target Scan Reticle Overlay */}
              {!cameraError && (
                <div className="pointer-events-none relative w-[80vw] max-w-[340px] h-[180px] flex items-center justify-center">
                  {/* High-Contrast Reticle Corners */}
                  <div className="absolute -top-1 -left-1 w-7 h-7 border-t-3 border-l-3 border-stocky-primary rounded-tl-sm shadow-[0_0_8px_rgba(0,87,255,0.6)]" />
                  <div className="absolute -top-1 -right-1 w-7 h-7 border-t-3 border-r-3 border-stocky-primary rounded-tr-sm shadow-[0_0_8px_rgba(0,87,255,0.6)]" />
                  <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-3 border-l-3 border-stocky-primary rounded-bl-sm shadow-[0_0_8px_rgba(0,87,255,0.6)]" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-3 border-r-3 border-stocky-primary rounded-br-sm shadow-[0_0_8px_rgba(0,87,255,0.6)]" />

                  {/* Animated Laser Scanning Line */}
                  {!scannedResult && (
                    <motion.div
                      className="w-full h-0.5 bg-green-400 shadow-[0_0_12px_rgba(74,222,128,1)]"
                      animate={{
                        y: [-75, 75, -75],
                      }}
                      transition={{
                        duration: 2.0,
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
            <div className="relative z-10 px-4 py-4 pb-6 bg-gradient-to-t from-black/95 to-transparent flex flex-col items-center gap-3">
              {scannedResult ? (
                scannedResult.found ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm bg-green-950/95 border border-green-500/60 rounded-widget p-3.5 flex items-center gap-3 text-left shadow-lg"
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
                    className="w-full max-w-sm bg-amber-950/95 border border-amber-500/60 rounded-widget p-3.5 space-y-2 text-left shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircleIcon size="sm" className="text-amber-400 shrink-0" />
                      <span className="text-xs font-medium text-white">
                        Item Not Found
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200 font-normal">
                      Barcode <span className="font-medium">{scannedResult.code}</span> is not registered in the catalog.
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
                <div className="w-full max-w-sm flex flex-col items-center gap-2">
                  <p className="text-xs text-white/80 font-normal text-center">
                    Align any product barcode within the reticle
                  </p>

                  {/* Optional Manual Entry Toggle */}
                  {showManualInput ? (
                    <form
                      onSubmit={handleManualSubmit}
                      className="w-full flex items-center gap-2 mt-1"
                    >
                      <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="Type barcode e.g. 6223000..."
                        autoFocus
                        className="flex-1 px-3 py-1.5 bg-white/10 border border-white/20 rounded-widget text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-stocky-primary"
                      />
                      <button
                        type="submit"
                        disabled={!manualInput.trim()}
                        className="px-3 py-1.5 bg-stocky-primary text-white text-xs font-medium rounded-widget hover:bg-stocky-primary-hover disabled:opacity-50"
                      >
                        Lookup
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowManualInput(true)}
                      className="text-[11px] text-white/60 hover:text-white underline underline-offset-2 transition-colors"
                    >
                      Can't scan? Type barcode manually
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
