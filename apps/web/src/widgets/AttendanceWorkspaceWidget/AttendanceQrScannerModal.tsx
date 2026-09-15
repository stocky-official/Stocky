'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  ZapIcon,
  ZapOffIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  WarehouseIcon,
} from '@stocky/icons';
import type { Location, AttendanceShift, PunchMethod } from '@stocky/types';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { checkBranchGeofence, type GeofenceCheckResult } from '@/lib/attendanceGeofence';

export interface AttendanceQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  currentUserId?: string | null;
  activeShift?: AttendanceShift | null;
  onPunchAttendance: (input: {
    locationId: string;
    method?: PunchMethod;
    qrToken?: string;
    notes?: string;
  }) => Promise<AttendanceShift>;
}

function playBeepSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

export function AttendanceQrScannerModal({
  isOpen,
  onClose,
  locations,
  activeShift,
  onPunchAttendance,
}: AttendanceQrScannerModalProps) {
  const isClockedIn = Boolean(activeShift);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [geofenceNotice, setGeofenceNotice] = useState<string | null>(null);
  const [punching, setPunching] = useState(false);
  const [punchResult, setPunchResult] = useState<{
    shift: AttendanceShift;
    branchName: string;
    action: 'in' | 'out';
  } | null>(null);
  const [focusRing, setFocusRing] = useState<{ x: number; y: number } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  // 1. Geofence Verification Hook (100-meter radius placeholder)
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    checkBranchGeofence(locations[0], 100, false).then((result: GeofenceCheckResult) => {
      if (!isMounted) return;
      if (!result.allowed && result.message) {
        setGeofenceNotice(result.message);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, locations]);

  // Handle QR code decoded
  const handleDecodedQr = useCallback(
    async (decodedText: string) => {
      const cleanCode = decodedText.trim();
      if (!cleanCode || isProcessingRef.current) return;
      isProcessingRef.current = true;

      // Audio & Haptic feedback
      playBeepSound();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(120);
      }

      try {
        setPunching(true);

        // 1. Detect branch from QR code
        let detectedBranch = locations.find(
          (l) =>
            cleanCode.includes(l.id) ||
            (l.code && cleanCode.toUpperCase().includes(l.code.toUpperCase())) ||
            cleanCode.toLowerCase().includes(l.name.toLowerCase())
        );

        if (!detectedBranch && cleanCode.startsWith('stocky:branch:')) {
          const branchId = cleanCode.replace('stocky:branch:', '').trim();
          detectedBranch = locations.find((l) => l.id === branchId);
        }

        const targetBranch =
          detectedBranch ||
          (activeShift?.locationId
            ? locations.find((l) => l.id === activeShift?.locationId) || detectedBranch || locations[0]
            : locations[0]);

        const targetLocId = targetBranch?.id || locations[0]?.id || '';
        const branchName = targetBranch?.name || 'Branch';

        // 2. Record Clock In / Out
        const res = await onPunchAttendance({
          locationId: targetLocId,
          method: 'qr_scan',
          qrToken: cleanCode,
          notes: isClockedIn
            ? `Clocked out via mobile QR scan at ${branchName}`
            : `Clocked in via mobile QR scan at ${branchName}`,
        });

        // Stop camera immediately
        await stopScanner();

        setPunchResult({
          shift: res,
          branchName,
          action: isClockedIn ? 'out' : 'in',
        });

        // Auto-close after brief confirmation
        setTimeout(() => {
          handleCloseModal();
        }, 2200);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to record punch. Please try scanning again.');
        isProcessingRef.current = false;
        setPunching(false);
      }
    },
    [locations, activeShift, isClockedIn, onPunchAttendance]
  );

  const handleDecodedQrRef = useRef(handleDecodedQr);
  handleDecodedQrRef.current = handleDecodedQr;

  const isStartingRef = useRef(false);

  const stopScanner = async () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // 1. Forcefully stop media tracks
    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      } catch {}
      activeStreamRef.current = null;
    }

    // 2. Stop DOM video streams
    try {
      const videoElements = document.querySelectorAll('#stocky-attendance-qr-scanner-element video');
      videoElements.forEach((video: any) => {
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
    } catch {}

    // 3. Stop Html5Qrcode safely with try/catch and promise catch
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        if (scanner.isScanning) {
          await scanner.stop().catch(() => {});
        }
      } catch {}
      try {
        scanner.clear();
      } catch {}
    }
  };

  // 2. Camera QR Scanner Lifecycle
  useEffect(() => {
    let isMounted = true;

    if (!isOpen || punchResult) {
      stopScanner().catch(() => {});
      return;
    }

    const containerId = 'stocky-attendance-qr-scanner-element';

    const startScanner = async () => {
      if (isStartingRef.current) return;
      isStartingRef.current = true;

      try {
        setErrorMsg(null);
        isProcessingRef.current = false;

        // Small tick for DOM mount
        await new Promise((r) => setTimeout(r, 100));
        if (!isMounted) {
          isStartingRef.current = false;
          return;
        }

        await stopScanner().catch(() => {});

        const viewportEl = document.getElementById(containerId);
        if (!viewportEl) {
          isStartingRef.current = false;
          return;
        }
        viewportEl.innerHTML = '';

        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
        scannerRef.current = html5QrCode;

        // Start full bleed camera feed without internal qrbox overlay
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            videoConstraints: {
              facingMode: 'environment',
              width: { min: 640, ideal: 1280 },
              height: { min: 480, ideal: 720 },
            },
          },
          (decodedText) => {
            handleDecodedQrRef.current(decodedText);
          },
          () => {
            // Frame scanned, no QR detected yet
          }
        );

        if (!isMounted) {
          try {
            if (html5QrCode.isScanning) {
              await html5QrCode.stop().catch(() => {});
            }
          } catch {}
          try {
            html5QrCode.clear();
          } catch {}
          return;
        }

        // Store active stream reference
        const videoEl = document.querySelector(
          `#${containerId} video`
        ) as HTMLVideoElement | null;
        if (videoEl && videoEl.srcObject) {
          activeStreamRef.current = videoEl.srcObject as MediaStream;
        }

        // Query track capabilities for torch & autofocus
        const track = activeStreamRef.current?.getVideoTracks?.()[0];
        if (track) {
          try {
            const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
            if (capabilities.torch) {
              setHasTorch(true);
            }
            if (capabilities.focusMode?.includes('continuous')) {
              track
                .applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] })
                .catch(() => {});
            }
          } catch (e) {
            console.warn('Track capabilities check error:', e);
          }
        }

        // Native BarcodeDetector hardware acceleration
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const nativeDetector = new (window as any).BarcodeDetector({
              formats: ['qr_code'],
            });

            const checkNativeDetection = async () => {
              if (!isMounted || !isOpen || isProcessingRef.current) return;
              const currentVideo = document.querySelector(
                `#${containerId} video`
              ) as HTMLVideoElement | null;

              if (currentVideo && currentVideo.readyState >= 2) {
                try {
                  const codes = await nativeDetector.detect(currentVideo);
                  if (codes && codes.length > 0 && codes[0].rawValue) {
                    handleDecodedQrRef.current(codes[0].rawValue);
                    return;
                  }
                } catch {}
              }

              rafIdRef.current = requestAnimationFrame(checkNativeDetection);
            };

            rafIdRef.current = requestAnimationFrame(checkNativeDetection);
          } catch (e) {
            console.warn('Native BarcodeDetector initialization error:', e);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Attendance QR scanner error:', err);
          setErrorMsg('Unable to access device camera. Please check browser permissions.');
        }
      } finally {
        isStartingRef.current = false;
      }
    };

    startScanner().catch(() => {});

    return () => {
      isMounted = false;
      stopScanner().catch(() => {});
    };
  }, [isOpen, punchResult]);

  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const next = !isTorchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: next }],
      });
      setIsTorchOn(next);
    } catch (err) {
      console.error('Error toggling torch:', err);
    }
  };

  const handleTapToFocus = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setFocusRing({ x, y });
    setTimeout(() => setFocusRing(null), 800);
  };

  const handleCloseModal = async () => {
    await stopScanner().catch(() => {});
    setPunchResult(null);
    setErrorMsg(null);
    setPunching(false);
    onClose();
  };

  const currentBranchName = locations[0]?.name || 'Current Branch';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] bg-black flex flex-col select-none overflow-hidden"
        >
          {/* 1. Header Bar: Shift info & Controls */}
          <div className="relative z-30 flex items-center justify-between px-4 py-3 pt-[max(env(safe-area-inset-top),0.75rem)] bg-gradient-to-b from-black/90 via-black/60 to-transparent">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                  isClockedIn
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'bg-stocky-accent text-stocky-text-main shadow-[#D8FF00]/20'
                }`}
              >
                <ClockIcon size="xs" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white leading-tight truncate">
                  {isClockedIn ? 'Scan to Clock Out' : 'Scan to Clock In'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isClockedIn ? 'bg-emerald-400 animate-pulse' : 'bg-[#D8FF00]'
                    }`}
                  />
                  <span className="text-[11px] text-white/80 font-medium truncate">
                    {isClockedIn
                      ? `Active shift · ${new Date(activeShift?.clockInAt || '').toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Currently Clocked Out'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasTorch && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
                  aria-label="Toggle Flashlight"
                  title="Flashlight"
                >
                  {isTorchOn ? <ZapIcon size="sm" className="text-[#D8FF00]" /> : <ZapOffIcon size="sm" />}
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
                aria-label="Close Scanner"
                title="Close"
              >
                <XIcon size="sm" />
              </button>
            </div>
          </div>

          {/* 2. Main Full-Bleed Viewport Section */}
          <div
            className="flex-1 relative w-full h-full overflow-hidden bg-black cursor-crosshair"
            onClick={handleTapToFocus}
            onTouchStart={handleTapToFocus}
          >
            {/* Layer 1: html5-qrcode Video Feed (Full cover) */}
            <div
              id="stocky-attendance-qr-scanner-element"
              className="!absolute !inset-0 w-full h-full overflow-hidden block [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:hidden pointer-events-none [&_#qr-shaded-region]:!hidden [&_#reader__scan_region]:!border-none [&_#reader__dashboard_section]:!hidden"
            />

            {/* Tap-to-Focus Ring */}
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
                  <div
                    className={`w-16 h-16 border-2 rounded-sm flex items-center justify-center ${
                      isClockedIn ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'border-[#D8FF00] shadow-[0_0_12px_rgba(216,255,0,0.8)]'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isClockedIn ? 'bg-emerald-400' : 'bg-[#D8FF00]'}`} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Layer 2: Single Centered QR Target Reticle & Shaded Vignette */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 px-4">
              {/* Centered QR Frame */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] overflow-hidden flex items-center justify-center">
                {/* 4 Crisp Glowing Corner Accents */}
                <span
                  className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl ${
                    isClockedIn ? 'border-emerald-400' : 'border-[#D8FF00]'
                  }`}
                />
                <span
                  className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl ${
                    isClockedIn ? 'border-emerald-400' : 'border-[#D8FF00]'
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl ${
                    isClockedIn ? 'border-emerald-400' : 'border-[#D8FF00]'
                  }`}
                />
                <span
                  className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl ${
                    isClockedIn ? 'border-emerald-400' : 'border-[#D8FF00]'
                  }`}
                />

                {/* Animated Laser Scanning Line */}
                <motion.div
                  className={`absolute inset-x-0 h-1 bg-gradient-to-r from-transparent ${
                    isClockedIn ? 'via-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]' : 'via-[#D8FF00] shadow-[0_0_12px_rgba(216,255,0,1)]'
                  } to-transparent`}
                  animate={{ top: ['6%', '92%', '6%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              {/* Viewfinder Guidance Instructions */}
              <div className="mt-7 flex flex-col items-center gap-1.5 px-6 text-center max-w-xs">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-xs font-semibold text-white border border-white/20 shadow-lg">
                  <QrCodeIcon size="xs" className={isClockedIn ? 'text-emerald-400' : 'text-[#D8FF00]'} />
                  <span>Align Branch QR Code inside frame</span>
                </div>
                <p className="text-[11px] text-white/75 leading-relaxed">
                  Scan the QR poster stationed at the branch entrance or kiosk.
                </p>
              </div>
            </div>

            {/* Geofence notice banner */}
            {geofenceNotice && (
              <div className="absolute top-4 inset-x-4 z-30 p-3 rounded-2xl bg-amber-500/90 backdrop-blur-md text-black text-xs font-medium flex items-center gap-2 shadow-lg">
                <AlertTriangleIcon size="xs" className="shrink-0" />
                <span>{geofenceNotice}</span>
              </div>
            )}

            {/* Error Message Pill */}
            {errorMsg && (
              <div className="absolute bottom-20 inset-x-4 z-30 p-3.5 rounded-2xl bg-red-600/95 backdrop-blur-md text-white text-xs font-medium text-center shadow-xl">
                {errorMsg}
              </div>
            )}
          </div>

          {/* 3. Bottom Status Bar */}
          <div className="relative z-30 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <WarehouseIcon size="xs" className="text-white/60 shrink-0" />
              <span className="truncate max-w-[220px] font-medium">{currentBranchName}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-medium text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              100m Geofence Active
            </span>
          </div>

          {/* 4. Success Overlay Modal */}
          <AnimatePresence>
            {punchResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
              >
                <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
                      punchResult.action === 'out' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-emerald-500 shadow-emerald-500/30'
                    } shadow-lg`}
                  >
                    <CheckCircleIcon size="md" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-stocky-text-main">
                      {punchResult.action === 'out' ? 'Clocked Out Successfully' : 'Clocked In Successfully'}
                    </h3>
                    <p className="text-xs text-stocky-text-sub">
                      Recorded at <span className="font-semibold text-stocky-text-main">{punchResult.branchName}</span>
                    </p>
                  </div>

                  <div className="w-full p-3 rounded-2xl bg-stocky-bg-global/70 border border-stocky-border-subtle text-xs flex items-center justify-between">
                    <span className="text-stocky-text-sub font-medium">Time Recorded</span>
                    <span className="font-bold text-stocky-text-main">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full h-11 rounded-full stocky-table-toolbar-button stocky-table-toolbar-button--primary text-xs font-semibold mt-1 cursor-pointer shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
