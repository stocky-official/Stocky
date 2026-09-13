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
  onProductFound?: (item: Item) => void;
  onCodeNotFound?: (barcode: string) => void;
  onBarcodeFound?: (barcode: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  hideFloatingButton?: boolean;
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

/**
 * Play a low subtle click tone for tap-to-focus
 */
function playFocusTapSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
}

export function BarcodeScannerWidget({
  onProductFound,
  onCodeNotFound,
  onBarcodeFound,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  hideFloatingButton = false,
}: BarcodeScannerWidgetProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (next: boolean) => {
    if (!next && controlledOnClose) controlledOnClose();
    if (!isControlled) setInternalIsOpen(next);
  };
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

  // Optical/Digital Macro Zoom & Tap-to-Focus state
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(
    null
  );
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [focusRing, setFocusRing] = useState<{ x: number; y: number } | null>(null);

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
        if (onBarcodeFound) {
          await stopScanner();
          setIsOpen(false);
          onBarcodeFound(cleanCode);
          return;
        }
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
            expiryDate: data.expiry_date,
            expiryNotificationDays: data.expiry_notification_days,
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
            onProductFound?.(item);
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
    [onBarcodeFound, onProductFound, onCodeNotFound]
  );

  const activeStreamRef = useRef<MediaStream | null>(null);

  // Bulletproof Cleanup helper to release camera hardware immediately
  const stopScanner = async () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // 1. Forcefully stop all tracks on the stored active MediaStream
    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      } catch (err) {
        console.warn('Error stopping stored media stream:', err);
      }
      activeStreamRef.current = null;
    }

    // 2. Query any remaining video elements in the DOM and stop their tracks
    try {
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video) => {
        const stream = video.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
          video.srcObject = null;
        }
      });
    } catch (err) {
      console.warn('Error stopping DOM video tracks:', err);
    }

    // 3. Stop and clear Html5Qrcode instance
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        // Ignore if already stopped
      }
      try {
        scanner.clear();
      } catch (err) {}
    }
  };

  const isStartingRef = useRef(false);
  const handleBarcodeScannedRef = useRef(handleBarcodeScanned);
  handleBarcodeScannedRef.current = handleBarcodeScanned;

  // Start Scanner when modal opens
  useEffect(() => {
    let isMounted = true;

    async function startScanner() {
      if (!isOpen || isStartingRef.current) return;
      isStartingRef.current = true;
      setCameraError(null);
      setScannedResult(null);
      setShowManualInput(false);
      setManualInput('');
      isHandlingScanRef.current = false;

      // Small tick to ensure container element is mounted in DOM
      await new Promise((r) => setTimeout(r, 80));
      if (!isMounted) {
        isStartingRef.current = false;
        return;
      }

      // Stop any leftover scanner and wipe previous viewport DOM elements
      await stopScanner();

      const viewportEl = document.getElementById('stocky-camera-viewport');
      if (!viewportEl) {
        console.warn('Viewport element not yet mounted');
        isStartingRef.current = false;
        return;
      }
      viewportEl.innerHTML = '';

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
            handleBarcodeScannedRef.current(decodedText);
          },
          () => {
            // Frame parsing errors are ignored
          }
        );

        // Store reference to active stream for immediate shutdown
        const videoEl = document.querySelector(
          '#stocky-camera-viewport video'
        ) as HTMLVideoElement | null;
        if (videoEl && videoEl.srcObject) {
          activeStreamRef.current = videoEl.srcObject as MediaStream;
        }

        // Query track capabilities for zoom, focus, and torch
        const track = activeStreamRef.current?.getVideoTracks?.()[0];
        if (track) {
          try {
            const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};

            // 1. Zoom support & auto macro zoom (2x for small retail barcodes)
            if (capabilities.zoom) {
              const minZ = capabilities.zoom.min || 1;
              const maxZ = capabilities.zoom.max || 5;
              const stepZ = capabilities.zoom.step || 0.1;
              setZoomRange({ min: minZ, max: maxZ, step: stepZ });

              const initialMacroZoom = Math.min(Math.max(minZ, 2.0), maxZ);
              if (initialMacroZoom > 1) {
                track
                  .applyConstraints({ advanced: [{ zoom: initialMacroZoom } as any] })
                  .catch(() => {});
                setCurrentZoom(initialMacroZoom);
              }
            }

            // 2. Enforce continuous autofocus
            if (capabilities.focusMode?.includes('continuous')) {
              track
                .applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] })
                .catch(() => {});
            }

            // 3. Torch capability
            if (capabilities.torch) {
              setHasTorch(true);
            }
          } catch (e) {
            console.warn('Track capabilities check error', e);
          }
        }

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
              const currentVideo = document.querySelector(
                '#stocky-camera-viewport video'
              ) as HTMLVideoElement | null;

              if (currentVideo && currentVideo.readyState >= 2) {
                try {
                  const barcodes = await nativeDetector.detect(currentVideo);
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    handleBarcodeScannedRef.current(barcodes[0].rawValue);
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

      } catch (err: any) {
        console.error('Failed to start camera scanner:', err);
        setCameraError(
          err.message || 'Unable to access camera. Please allow camera permissions.'
        );
      } finally {
        isStartingRef.current = false;
      }
    }

    if (isOpen) {
      startScanner();
    }

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

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

  const handleApplyZoom = async (level: number) => {
    const track = activeStreamRef.current?.getVideoTracks?.()[0];
    if (track && track.applyConstraints) {
      try {
        await track.applyConstraints({
          advanced: [{ zoom: level } as any],
        });
        setCurrentZoom(level);
      } catch (err) {
        console.warn('Failed to apply zoom:', err);
      }
    }
  };

  const handleTapToFocus = async (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    const container = e.currentTarget.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && (e as React.TouchEvent).touches.length > 0) {
      clientX = (e as React.TouchEvent).touches[0].clientX;
      clientY = (e as React.TouchEvent).touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - container.left;
    const y = clientY - container.top;

    setFocusRing({ x, y });
    setTimeout(() => {
      setFocusRing(null);
    }, 1200);

    playFocusTapSound();

    // Re-trigger continuous autofocus on video track
    const track = activeStreamRef.current?.getVideoTracks?.()[0];
    if (track && track.applyConstraints) {
      try {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.focusMode?.includes('continuous')) {
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as any],
          });
        }
      } catch (err) {
        console.warn('Failed to trigger tap focus:', err);
      }
    }
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
      {!hideFloatingButton && (
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
      )}

      {/* 2. Full-Screen Camera Viewfinder Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black flex flex-col"
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

            {/* Viewfinder Center Container with Tap-To-Focus */}
            <div
              className="flex-1 relative w-full h-full overflow-hidden bg-black cursor-crosshair select-none"
              onClick={handleTapToFocus}
              onTouchStart={handleTapToFocus}
            >
              {/* Layer 1: html5-qrcode video viewport - Enforced full cover, no flex, absolute */}
              <div
                id="stocky-camera-viewport"
                className="!absolute !inset-0 w-full h-full overflow-hidden block [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:hidden pointer-events-none"
              />

              {/* Quick Macro Zoom Controls (1x / 2x / 3x) */}
              {zoomRange && zoomRange.max > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-xl">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyZoom(1);
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                      Math.abs(currentZoom - 1) < 0.2
                        ? 'bg-stocky-primary text-white shadow'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    1x
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyZoom(Math.min(2, zoomRange.max));
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                      Math.abs(currentZoom - 2) < 0.3
                        ? 'bg-stocky-primary text-white shadow'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    2x
                  </button>
                  {zoomRange.max >= 3 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyZoom(3);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                        Math.abs(currentZoom - 3) < 0.3
                          ? 'bg-stocky-primary text-white shadow'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      3x
                    </button>
                  )}
                </div>
              )}

              {/* Animated Tap-to-Focus Reticle Ring */}
              <AnimatePresence>
                {focusRing && (
                  <motion.div
                    key="focus-ring"
                    initial={{ scale: 1.5, opacity: 1 }}
                    animate={{ scale: 1, opacity: 0.85 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ left: focusRing.x, top: focusRing.y }}
                    className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30"
                  >
                    <div className="w-16 h-16 border-2 border-yellow-400 rounded-sm shadow-[0_0_12px_rgba(250,204,21,0.8)] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Layer 2: Target Scan Reticle Overlay - Guaranteed Centered Layer */}
              {!cameraError && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  <div className="relative w-[80vw] max-w-[320px] h-[180px] flex items-center justify-center">
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
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && (
                <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
                  <div className="p-6 bg-stocky-bg-widget/95 rounded-widget border border-stocky-border-subtle max-w-xs text-center space-y-3 shadow-xl">
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
                    Tap screen to focus • Use 2x zoom for small barcodes
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
