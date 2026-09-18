'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CameraIcon,
  XIcon,
  ZapIcon,
  ZapOffIcon,
  RefreshIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CalendarIcon,
  SparklesIcon,
} from '@stocky/icons';
import type { Worker } from 'tesseract.js';
import { parseExpiryDateFromText, type ParsedDateResult } from '@/lib/ocr/dateParser';
import { useTranslation } from '@/lib/i18n';

export interface ExpiryDateScannerModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelected: (isoDate: string, result?: ParsedDateResult) => void;
  initialDate?: string | null;
}

/**
 * Play a crisp two-tone chime upon successful expiry date detection
 */
function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Tone 1: C6
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, ctx.currentTime);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.12);

    // Tone 2: G6
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.09);
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.09);
    osc2.stop(ctx.currentTime + 0.28);
  } catch {}
}

/**
 * Play a subtle focus click sound
 */
function playFocusTapSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {}
}

/**
 * Capture high-resolution center scanning region from the live video stream.
 * Captures the center 85% width and 60% height of intrinsic camera feed,
 * guaranteeing anything in or near the visual target box is captured.
 */
function captureTargetCanvas(video: HTMLVideoElement): HTMLCanvasElement | null {
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) return null;

  const intrinsicWidth = video.videoWidth;
  const intrinsicHeight = video.videoHeight;

  // Center crop: 85% width, 60% height
  const sourceW = Math.round(intrinsicWidth * 0.85);
  const sourceH = Math.round(intrinsicHeight * 0.60);
  const sourceX = Math.round((intrinsicWidth - sourceW) / 2);
  const sourceY = Math.round((intrinsicHeight - sourceH) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = sourceW;
  canvas.height = sourceH;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Draw clean, uncorrupted video frame
  ctx.drawImage(video, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);

  return canvas;
}

export function ExpiryDateScannerModalWidget({
  isOpen,
  onClose,
  onDateSelected,
  initialDate,
}: ExpiryDateScannerModalWidgetProps): any {
  const { t, locale, isRtl } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const [mounted, setMounted] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [engineStatus, setEngineStatus] = useState(() => t('modals.expiryScanner.initializingOcr'));
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(
    null
  );
  const [focusRing, setFocusRing] = useState<{ x: number; y: number } | null>(null);

  // Live OCR feedback & results
  const [liveOcrText, setLiveOcrText] = useState<string>('');
  const [detectedResult, setDetectedResult] = useState<ParsedDateResult | null>(null);
  const [autoApplyCountdown, setAutoApplyCountdown] = useState<number | null>(null);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);

  // Manual fallback input
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualDateInput, setManualDateInput] = useState(initialDate || '');

  const isProcessingFrameRef = useRef(false);
  const isLockedRef = useRef(false);
  const scanLoopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Hardware MediaStream Shutdown
  const stopCameraStream = useCallback(() => {
    if (scanLoopTimerRef.current) {
      clearInterval(scanLoopTimerRef.current);
      scanLoopTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    isProcessingFrameRef.current = false;
    isLockedRef.current = false;

    // Stop stored stream tracks
    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      } catch (err) {
        console.warn('Error stopping activeStream tracks:', err);
      }
      activeStreamRef.current = null;
    }

    // Stop tracks attached to videoRef
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream | null;
      if (stream) {
        try {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
        } catch {}
      }
      videoRef.current.srcObject = null;
    }

    // Force query all videos in DOM to release camera hardware
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
    } catch {}
  }, []);

  // Guarantee camera shutdown whenever isOpen is false or component unmounts
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
    }
  }, [isOpen, stopCameraStream]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // 2. Initialize Tesseract Worker once on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    setIsEngineReady(false);
    setEngineStatus('Loading neural OCR engine...');
    setLiveOcrText('');

    async function initWorker() {
      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng', 1, {
          logger: (m) => {
            if (m.status && m.progress !== undefined && m.progress < 1) {
              setEngineStatus(`${m.status.replace(/_/g, ' ')} (${Math.round(m.progress * 100)}%)`);
            }
          },
        });

        // Set PSM to SPARSE_TEXT (11) for scattered packaging labels without corrupting whitelist
        await worker.setParameters({
          tessedit_pageseg_mode: '11' as any,
        });

        if (!isCancelled) {
          workerRef.current = worker;
          setIsEngineReady(true);
          setEngineStatus('Ready to scan');
        } else {
          await worker.terminate();
        }
      } catch (err: any) {
        console.error('Failed to initialize Tesseract worker:', err);
        if (!isCancelled) {
          setEngineStatus(`OCR engine notice: ${err.message || 'Ready'}`);
          setIsEngineReady(true);
        }
      }
    }

    initWorker();

    return () => {
      isCancelled = true;
      if (workerRef.current) {
        workerRef.current.terminate().catch(() => {});
        workerRef.current = null;
      }
    };
  }, [isOpen]);

  // 3. Start Camera Video Feed
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setCameraError(null);
    setDetectedResult(null);
    setAutoApplyCountdown(null);
    setShowManualInput(false);
    setLiveOcrText('');
    isLockedRef.current = false;
    isProcessingFrameRef.current = false;

    async function startCamera() {
      stopCameraStream();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Query track capabilities (Torch, Zoom, Continuous Focus)
        const track = stream.getVideoTracks()[0];
        if (track && track.getCapabilities) {
          try {
            const capabilities: any = track.getCapabilities();

            if (capabilities.torch) {
              setHasTorch(true);
            }

            if (capabilities.zoom) {
              const minZ = capabilities.zoom.min || 1;
              const maxZ = capabilities.zoom.max || 5;
              const stepZ = capabilities.zoom.step || 0.1;
              setZoomRange({ min: minZ, max: maxZ, step: stepZ });

              // Auto macro zoom (1.8x - 2.0x) for small packaging text
              const initialMacro = Math.min(Math.max(minZ, 1.8), maxZ);
              if (initialMacro > 1) {
                track
                  .applyConstraints({ advanced: [{ zoom: initialMacro } as any] })
                  .catch(() => {});
                setCurrentZoom(initialMacro);
              }
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
      } catch (err: any) {
        console.error('Camera stream access failed:', err);
        if (isMounted) {
          setCameraError(
            err.message || 'Unable to access camera. Please verify camera permissions.'
          );
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopCameraStream();
    };
  }, [isOpen, stopCameraStream]);

  // 4. Frame OCR Recognition Core
  const processCurrentFrame = useCallback(async () => {
    if (
      isLockedRef.current ||
      isProcessingFrameRef.current ||
      !workerRef.current ||
      !videoRef.current
    ) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0) return;

    isProcessingFrameRef.current = true;
    setIsScanning(true);

    try {
      const canvas = captureTargetCanvas(video);
      if (!canvas) return;

      const worker = workerRef.current;
      const {
        data: { text },
      } = await worker.recognize(canvas);

      if (text && text.trim().length > 0) {
        const cleanSnippet = text.replace(/[\r\n]+/g, ' ').trim();
        setLiveOcrText(cleanSnippet.slice(0, 40));

        const parsed = parseExpiryDateFromText(text);

        if (parsed && !isLockedRef.current) {
          isLockedRef.current = true;
          setDetectedResult(parsed);

          // Audio chime & haptic feedback
          playSuccessChime();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([60, 40, 60]);
          }

          // Auto-apply countdown after 2.5 seconds
          setAutoApplyCountdown(3);
        }
      }
    } catch (err) {
      console.warn('Frame scan notice:', err);
    } finally {
      isProcessingFrameRef.current = false;
      setIsScanning(false);
    }
  }, []);

  // 5. Live continuous sampling loop
  useEffect(() => {
    if (!isOpen || !isEngineReady || !autoScanEnabled || detectedResult) {
      if (scanLoopTimerRef.current) {
        clearInterval(scanLoopTimerRef.current);
        scanLoopTimerRef.current = null;
      }
      return;
    }

    scanLoopTimerRef.current = setInterval(() => {
      processCurrentFrame();
    }, 700);

    return () => {
      if (scanLoopTimerRef.current) {
        clearInterval(scanLoopTimerRef.current);
        scanLoopTimerRef.current = null;
      }
    };
  }, [isOpen, isEngineReady, autoScanEnabled, detectedResult, processCurrentFrame]);

  // 6. Auto-apply countdown handler
  useEffect(() => {
    if (autoApplyCountdown === null) return;

    if (autoApplyCountdown <= 0) {
      if (detectedResult) {
        handleConfirmDate();
      }
      return;
    }

    countdownTimerRef.current = setTimeout(() => {
      setAutoApplyCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [autoApplyCountdown, detectedResult]);

  // Confirm and apply chosen date
  const handleConfirmDate = () => {
    if (!detectedResult) return;
    const resultToApply = detectedResult;
    stopCameraStream();
    onClose();
    onDateSelected(resultToApply.isoDate, resultToApply);
  };

  // Manual date apply
  const handleManualDateApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDateInput) return;
    stopCameraStream();
    onClose();
    onDateSelected(manualDateInput);
  };

  // Reset lock and scan again
  const handleRescan = () => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
    }
    setDetectedResult(null);
    setAutoApplyCountdown(null);
    setLiveOcrText('');
    isLockedRef.current = false;
    isProcessingFrameRef.current = false;
  };

  const handleClose = () => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
    }
    stopCameraStream();
    onClose();
  };

  // Apply optical/digital zoom
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

  // Tap-to-focus
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

  // Toggle Torch
  const handleToggleTorch = async () => {
    const track = activeStreamRef.current?.getVideoTracks?.()[0];
    if (!track || !hasTorch) return;
    try {
      const nextTorch = !isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.error('Error toggling torch:', err);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-black flex flex-col select-none"
        >
          {/* Top Header Bar */}
          <div className="relative z-20 flex items-center justify-between px-4 py-3 pt-5 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CalendarIcon size="sm" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white tracking-tight leading-tight">
                  {t('modals.expiryScanner.title')}
                </h3>
                <p className="text-[11px] text-white/60 font-normal">
                  {isEngineReady ? t('modals.expiryScanner.inBrowserOcr') : engineStatus}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasTorch && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
                  aria-label={t('modals.expiryScanner.toggleTorch')}
                >
                  {isTorchOn ? <ZapIcon size="sm" /> : <ZapOffIcon size="sm" />}
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
                aria-label={t('modals.expiryScanner.closeScanner')}
              >
                <XIcon size="sm" />
              </button>
            </div>
          </div>

          {/* Camera Viewfinder with Tap-To-Focus */}
          <div
            className="flex-1 relative w-full h-full overflow-hidden bg-black cursor-crosshair"
            onClick={handleTapToFocus}
            onTouchStart={handleTapToFocus}
          >
            {/* Live Video Layer */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
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
                      ? 'bg-emerald-500 text-white shadow'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t('modals.expiryScanner.macroZoom1')}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyZoom(Math.min(2, zoomRange.max));
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                    Math.abs(currentZoom - 2) < 0.3
                      ? 'bg-emerald-500 text-white shadow'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t('modals.expiryScanner.macroZoom2')}
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
                        ? 'bg-emerald-500 text-white shadow'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {t('modals.expiryScanner.macroZoom3')}
                  </button>
                )}
              </div>
            )}

            {/* Tap-to-Focus Reticle */}
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

            {/* Target Reticle Overlay */}
            {!cameraError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20 px-4">
                <div
                  className={`relative w-[86vw] max-w-[340px] h-[110px] rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    detectedResult
                      ? 'border-2 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.5)] bg-emerald-950/20 backdrop-blur-[2px]'
                      : 'border-2 border-white/40 shadow-[0_0_16px_rgba(0,0,0,0.5)]'
                  }`}
                >
                  {/* High-Contrast Reticle Corners */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-lg shadow-[0_0_8px_rgba(16,185,129,0.8)]" />

                  {/* Animated Laser Scanning Line (while searching) */}
                  {!detectedResult && (
                    <motion.div
                      className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]"
                      animate={{
                        y: [-45, 45, -45],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}

                  {/* Success Checkmark inside reticle */}
                  {detectedResult && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white shadow-lg text-xs font-medium"
                    >
                      <CheckCircleIcon size="sm" />
                      <span>{t('modals.expiryScanner.dateLocked')}</span>
                    </motion.div>
                  )}
                </div>

                {/* Real-time OCR Text Feedback */}
                {liveOcrText && !detectedResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 px-3 py-1 bg-black/75 backdrop-blur-md rounded-full border border-white/20 text-[11px] text-white/90 max-w-xs truncate shadow-lg flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span className="text-emerald-400 font-medium shrink-0">{t('modals.expiryScanner.reading')}</span>
                    <span className="truncate">&ldquo;{liveOcrText}&rdquo;</span>
                  </motion.div>
                )}

                {/* Guide Text */}
                <p className="mt-3 text-xs font-medium text-white/85 text-center drop-shadow-md max-w-xs">
                  {detectedResult
                    ? t('modals.expiryScanner.guideDetected')
                    : t('modals.expiryScanner.guideScan')}
                </p>
              </div>
            )}

            {/* Camera Error Message */}
            {cameraError && (
              <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
                <div className="p-6 bg-slate-900/95 rounded-3xl border border-white/10 max-w-xs text-center space-y-3 shadow-2xl text-white">
                  <AlertCircleIcon size="lg" className="text-red-400 mx-auto" />
                  <h3 className="text-sm font-medium">{t('modals.expiryScanner.cameraAccessRequired')}</h3>
                  <p className="text-xs text-white/70 leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition-colors"
                  >
                    {t('modals.expiryScanner.close')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action & Confirmation Dock */}
          <div className="relative z-20 px-4 py-4 pb-8 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col items-center">
            {detectedResult ? (
              /* Success Confirmation Card */
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-md bg-slate-900/95 border border-emerald-500/50 rounded-3xl p-4 shadow-2xl backdrop-blur-xl text-white space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <SparklesIcon size="sm" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
                        {t('modals.expiryScanner.expirationDetected')}
                      </span>
                      <h4 className="text-lg font-medium tracking-tight text-white">
                        {detectedResult.displayDate}
                      </h4>
                    </div>
                  </div>

                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-normal">
                    ISO: {detectedResult.isoDate}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/60 bg-black/40 rounded-xl px-3 py-1.5 border border-white/5">
                  <span className="truncate">{t('modals.expiryScanner.stamp', { text: detectedResult.rawMatch })}</span>
                  <span className="text-emerald-400 font-medium shrink-0 ml-2">
                    {t('modals.expiryScanner.confidence', { confidence: Math.round(detectedResult.confidence * 100) })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRescan}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/15 active:scale-98 text-white rounded-2xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RefreshIcon size="xs" />
                    <span>{t('modals.expiryScanner.rescan')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDate}
                    className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-white rounded-2xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircleIcon size="xs" />
                    <span>
                      {autoApplyCountdown !== null
                        ? t('modals.expiryScanner.applyDateCountdown', { seconds: autoApplyCountdown })
                        : t('modals.expiryScanner.applyDate')}
                    </span>
                  </button>
                </div>
              </motion.div>
            ) : showManualInput ? (
              /* Manual Date Entry Fallback Form */
              <form
                onSubmit={handleManualDateApply}
                className="w-full max-w-md bg-slate-900/95 border border-white/20 rounded-3xl p-4 shadow-2xl backdrop-blur-xl text-white space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white">{t('modals.expiryScanner.manualModalTitle')}</span>
                  <button
                    type="button"
                    onClick={() => setShowManualInput(false)}
                    className="text-xs text-white/60 hover:text-white"
                  >
                    {t('modals.expiryScanner.backToCamera')}
                  </button>
                </div>
                <input
                  type="date"
                  value={manualDateInput}
                  onChange={(e) => setManualDateInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowManualInput(false)}
                    className="py-2 px-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-medium"
                  >
                    {t('modals.expiryScanner.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!manualDateInput}
                    className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-xl text-xs font-medium"
                  >
                    {t('modals.expiryScanner.confirmDate')}
                  </button>
                </div>
              </form>
            ) : (
              /* Shutter & Manual Capture Controls */
              <div className="w-full max-w-md flex flex-col items-center gap-3">
                <div className="flex items-center justify-between w-full px-6">
                  {/* Auto-scan mode toggle */}
                  <button
                    type="button"
                    onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                    className={`text-[11px] px-3 py-1 rounded-full font-medium transition-all ${
                      autoScanEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/10 text-white/60 border border-white/15'
                    }`}
                  >
                    {t('modals.expiryScanner.autoScan', { status: autoScanEnabled ? t('modals.expiryScanner.on') : t('modals.expiryScanner.off') })}
                  </button>

                  {/* Manual Shutter Button */}
                  <button
                    type="button"
                    onClick={processCurrentFrame}
                    disabled={isScanning || !isEngineReady}
                    className="w-16 h-16 rounded-full border-4 border-white/80 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-xl"
                    aria-label={t('modals.expiryScanner.captureAndRead')}
                  >
                    <div
                      className={`w-full h-full rounded-full transition-colors ${
                        isScanning ? 'bg-emerald-400 animate-pulse' : 'bg-white'
                      }`}
                    />
                  </button>

                  <div className="w-16 text-right">
                    {isScanning && (
                      <span className="text-[10px] text-emerald-400 animate-pulse font-medium">
                        {t('modals.expiryScanner.scanning')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-[11px] text-white/60 text-center">
                    {t('modals.expiryScanner.shutterHint')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowManualInput(true)}
                    className="text-[11px] text-emerald-400/90 hover:text-emerald-300 underline underline-offset-2 transition-colors"
                  >
                    {t('modals.expiryScanner.manualEntryPrompt')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
