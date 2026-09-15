'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  ZapIcon,
  ZapOffIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
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

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

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

  // 2. Camera QR Scanner Lifecycle
  useEffect(() => {
    if (!isOpen || punchResult) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
      return;
    }

    const containerId = 'stocky-attendance-qr-scanner-element';
    let html5QrCode: Html5Qrcode;

    const startScanner = async () => {
      try {
        setErrorMsg(null);
        isProcessingRef.current = false;

        html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
          },
          async (decodedText) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            // Audio chime
            playBeepSound();

            try {
              setPunching(true);

              // 1. Detect branch from QR code
              let detectedBranch = locations.find((l) =>
                decodedText.includes(l.id) ||
                (l.code && decodedText.toUpperCase().includes(l.code.toUpperCase())) ||
                decodedText.toLowerCase().includes(l.name.toLowerCase())
              );

              if (!detectedBranch && decodedText.startsWith('stocky:branch:')) {
                const branchId = decodedText.replace('stocky:branch:', '').trim();
                detectedBranch = locations.find((l) => l.id === branchId);
              }

              const targetBranch = detectedBranch || activeShift?.locationId
                ? locations.find((l) => l.id === activeShift?.locationId) || detectedBranch || locations[0]
                : locations[0];

              const targetLocId = targetBranch?.id || locations[0]?.id || '';
              const branchName = targetBranch?.name || 'Branch';

              // 2. Record Clock In / Out
              const res = await onPunchAttendance({
                locationId: targetLocId,
                method: 'qr_scan',
                qrToken: decodedText,
                notes: isClockedIn
                  ? `Clocked out via mobile QR scan at ${branchName}`
                  : `Clocked in via mobile QR scan at ${branchName}`,
              });

              // Stop camera before showing success
              if (scannerRef.current) {
                await scannerRef.current.stop().catch(() => {});
                scannerRef.current = null;
              }

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
          () => {
            // Frame scanned, no QR detected yet - ignore
          }
        );

        // Check if torch is available
        const track = (html5QrCode as any).getRunningTrackCameraCapabilities?.();
        if (track && track.torch) {
          setHasTorch(true);
        }
      } catch (err: any) {
        console.error('Attendance QR scanner error:', err);
        setErrorMsg('Unable to access device camera. Please check browser permissions.');
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
    };
  }, [isOpen, punchResult, locations, activeShift, isClockedIn, onPunchAttendance]);

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

  const handleCloseModal = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {}).finally(() => {
        scannerRef.current = null;
      });
    }
    setPunchResult(null);
    setErrorMsg(null);
    setPunching(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] bg-black flex flex-col select-none"
        >
          {/* Header Bar */}
          <div className="relative z-20 flex items-center justify-between px-4 py-3 pt-safe bg-gradient-to-b from-black/90 via-black/60 to-transparent">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isClockedIn ? 'bg-emerald-500 text-white' : 'bg-stocky-primary text-black'
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
                      isClockedIn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-[11px] text-white/80 font-medium truncate">
                    {isClockedIn
                      ? `Active Shift started at ${new Date(activeShift?.clockInAt || '').toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Currently Clocked Out'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasTorch && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
                  aria-label="Toggle Torch"
                >
                  {isTorchOn ? <ZapIcon size="sm" className="text-amber-300" /> : <ZapOffIcon size="sm" />}
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
                aria-label="Close Scanner"
              >
                <XIcon size="sm" />
              </button>
            </div>
          </div>

          {/* Main Viewfinder Section */}
          <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
            {/* HTML5 QR Code Video Target */}
            <div
              id="stocky-attendance-qr-scanner-element"
              className="absolute inset-0 w-full h-full object-cover flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
            />

            {/* Viewfinder Target Framing & Reticle */}
            <div className="relative z-10 pointer-events-none flex flex-col items-center">
              <div className="relative w-64 h-64 border-2 border-white/40 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] overflow-hidden">
                {/* 4 Glowing Corner Accents */}
                <span
                  className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl ${
                    isClockedIn ? 'border-emerald-400' : 'border-stocky-primary'
                  }`}
                />
                <span
                  className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl ${
                    isClockedIn ? 'border-emerald-400' : 'border-stocky-primary'
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl ${
                    isClockedIn ? 'border-emerald-400' : 'border-stocky-primary'
                  }`}
                />
                <span
                  className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl ${
                    isClockedIn ? 'border-emerald-400' : 'border-stocky-primary'
                  }`}
                />

                {/* Animated Laser Scanning Beam */}
                <motion.div
                  className={`absolute inset-x-0 h-1 bg-gradient-to-r from-transparent ${
                    isClockedIn ? 'via-emerald-400' : 'via-stocky-primary'
                  } to-transparent shadow-lg`}
                  animate={{ top: ['5%', '92%', '5%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              {/* Viewfinder Instructions */}
              <div className="mt-6 flex flex-col items-center gap-1.5 px-6 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-white border border-white/20">
                  <QrCodeIcon size="xs" className={isClockedIn ? 'text-emerald-400' : 'text-stocky-primary'} />
                  <span>Align Branch QR Code inside frame</span>
                </div>
                <p className="text-[11px] text-white/70 max-w-xs">
                  Scan the QR poster at the branch entrance or on the kiosk station.
                </p>
              </div>
            </div>

            {/* Geofence notice banner (if applicable) */}
            {geofenceNotice && (
              <div className="absolute top-4 inset-x-4 z-30 p-3 rounded-2xl bg-amber-500/90 backdrop-blur-md text-black text-xs font-medium flex items-center gap-2">
                <AlertTriangleIcon size="xs" className="shrink-0" />
                <span>{geofenceNotice}</span>
              </div>
            )}

            {/* Error Message Pill */}
            {errorMsg && (
              <div className="absolute bottom-16 inset-x-4 z-30 p-3 rounded-2xl bg-red-600/90 backdrop-blur-md text-white text-xs font-medium text-center shadow-lg">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Success Overlay Card */}
          <AnimatePresence>
            {punchResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
              >
                <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
                      punchResult.action === 'out' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
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
                    className="w-full h-11 rounded-full stocky-table-toolbar-button stocky-table-toolbar-button--primary text-xs font-semibold mt-2 cursor-pointer shadow-sm"
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
