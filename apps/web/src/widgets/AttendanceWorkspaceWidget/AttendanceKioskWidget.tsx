'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Location, AttendanceShift, PunchMethod } from '@stocky/types';
import {
  QrCodeIcon,
  CameraIcon,
  CheckCircleIcon,
  WarehouseIcon,
  ClockIcon,
  RefreshIcon,
  AlertTriangleIcon,
} from '@stocky/icons';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useTranslation } from '@/lib/i18n';

export interface AttendanceKioskWidgetProps {
  locations: Location[];
  onPunchAttendance: (input: {
    locationId: string;
    method?: PunchMethod;
    qrToken?: string;
    notes?: string;
  }) => Promise<AttendanceShift>;
}

export function AttendanceKioskWidget({
  locations,
  onPunchAttendance,
}: AttendanceKioskWidgetProps) {
  const { t, isRtl } = useTranslation();
  const [activeSection, setActiveSection] = useState<'poster' | 'scanner'>('poster');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');
  const [punchStatus, setPunchStatus] = useState<{
    success: boolean;
    message: string;
    shift?: AttendanceShift;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId) || locations[0];
  const qrUrl = selectedLocation
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=stocky:branch:${selectedLocation.id}`
    : '';

  // Camera Punch-in Scanner Lifecycle
  useEffect(() => {
    if (activeSection !== 'scanner') {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
          setIsScanning(false);
        });
      }
      return;
    }

    const elementId = 'stocky-kiosk-scanner-container';
    let html5QrCode: Html5Qrcode;

    const startScanner = async () => {
      try {
        setScannerError(null);
        html5QrCode = new Html5Qrcode(elementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            // Beep audio confirmation
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.frequency.setValueAtTime(880, audioCtx.currentTime);
              osc.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch {}

            // Handle punch
            try {
              let targetLocId = selectedLocationId;
              if (decodedText.startsWith('stocky:branch:')) {
                targetLocId = decodedText.split('stocky:branch:')[1];
              }
              const res = await onPunchAttendance({
                locationId: targetLocId || selectedLocationId,
                method: 'qr_scan',
                qrToken: decodedText,
              });
              const action = res.clockOutAt ? t('modals.kiosk.clockOut') : t('modals.kiosk.clockIn');
              setPunchStatus({
                success: true,
                message: t('modals.kiosk.clockSuccess', { action, status: res.status }),
                shift: res,
              });
            } catch (err: any) {
              setPunchStatus({
                success: false,
                message: err.message || t('modals.kiosk.clockFailed'),
              });
            }
          },
          () => {}
        );
        setIsScanning(true);
      } catch (err: any) {
        console.warn('Scanner camera error:', err);
        setScannerError(t('modals.kiosk.cameraError'));
        setIsScanning(false);
      }
    };

    const timer = setTimeout(startScanner, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
          setIsScanning(false);
        });
      }
    };
  }, [activeSection, selectedLocationId, t, onPunchAttendance]);

  const handleManualPunch = async () => {
    try {
      const res = await onPunchAttendance({
        locationId: selectedLocationId,
        method: 'kiosk',
        notes: t('modals.kiosk.kioskNote'),
      });
      const action = res.clockOutAt ? t('modals.kiosk.clockOut') : t('modals.kiosk.clockIn');
      setPunchStatus({
        success: true,
        message: t('modals.kiosk.clockSuccess', { action, status: res.status }),
        shift: res,
      });
    } catch (err: any) {
      setPunchStatus({
        success: false,
        message: err.message || t('modals.kiosk.clockFailed'),
      });
    }
  };

  return (
    <div
      className="flex flex-col w-full p-4 sm:p-6"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRtl ? 'Cairo, sans-serif' : undefined }}
    >
      {/* Kiosk Mode Switcher */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-stocky-border-subtle flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-stocky-text-main">
            {t('modals.kiosk.title')}
          </h2>
          <p className="text-xs text-stocky-text-sub mt-0.5">
            {t('modals.kiosk.subtitle')}
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-full bg-stocky-bg-global border border-stocky-border-subtle">
          <button
            type="button"
            onClick={() => setActiveSection('poster')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              activeSection === 'poster'
                ? 'bg-stocky-bg-widget text-stocky-primary shadow-sm'
                : 'text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            {t('modals.kiosk.posterTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('scanner')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              activeSection === 'scanner'
                ? 'bg-stocky-bg-widget text-stocky-primary shadow-sm'
                : 'text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            {t('modals.kiosk.kioskTab')}
          </button>
        </div>
      </div>

      {/* BRANCH SELECTOR */}
      <div className="max-w-md mb-6">
        <label className="block text-xs font-semibold text-stocky-text-main mb-1.5">
          {t('modals.kiosk.selectBranch')}
        </label>
        <div className="relative">
          <WarehouseIcon
            size="xs"
            className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-stocky-text-sub"
          />
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget ps-9 pe-4 text-xs font-medium text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer text-start"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1: QR POSTER */}
      {activeSection === 'poster' && (
        <div className="max-w-xl mx-auto bg-stocky-bg-widget border border-stocky-border-subtle rounded-card p-8 shadow-sm text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-widget bg-stocky-primary/10 text-stocky-primary flex items-center justify-center mb-4">
            <QrCodeIcon size="md" />
          </div>

          <h3 className="text-lg font-semibold text-stocky-text-main">
            {t('modals.kiosk.stationTitle', {
              branch: selectedLocation?.name || t('modals.kiosk.defaultBranch'),
            })}
          </h3>
          <p className="text-xs text-stocky-text-sub mt-1 max-w-sm">
            {t('modals.kiosk.posterSubheading')}
          </p>

          {/* Generated QR Code */}
          <div className="my-6 p-4 rounded-widget border-2 border-dashed border-stocky-border-subtle bg-stocky-bg-global/30">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Branch Attendance QR Code"
                className="w-56 h-56 rounded-widget object-contain mx-auto"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-stocky-text-sub text-xs">
                {t('modals.kiosk.noLocationSelected')}
              </div>
            )}
          </div>

          <div className="text-xs font-semibold text-stocky-text-sub mb-6">
            {t('modals.kiosk.branchToken')}{' '}
            <code className="bg-stocky-bg-global px-2 py-0.5 rounded text-stocky-text-main">
              {selectedLocation?.id?.slice(0, 8)}
            </code>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 px-5 rounded-full bg-stocky-primary text-white text-xs font-medium hover:bg-stocky-primary-hover transition-colors cursor-pointer"
            >
              {t('modals.kiosk.printPoster')}
            </button>
            <a
              href={qrUrl}
              download={`${selectedLocation?.name || 'branch'}-qr-code.png`}
              target="_blank"
              rel="noreferrer"
              className="h-10 px-5 rounded-full border border-stocky-border-subtle text-stocky-text-main text-xs font-medium hover:border-stocky-primary hover:text-stocky-primary transition-colors cursor-pointer inline-flex items-center"
            >
              {t('modals.kiosk.downloadPng')}
            </a>
          </div>
        </div>
      )}

      {/* SECTION 2: DIGITAL KIOSK / SCANNER */}
      {activeSection === 'scanner' && (
        <div className="max-w-xl mx-auto flex flex-col items-center">
          {punchStatus && (
            <div
              className={`w-full p-4 rounded-widget mb-4 border flex items-center gap-3 ${
                punchStatus.success
                  ? 'stocky-status-success border'
                  : 'stocky-status-critical border'
              }`}
            >
              {punchStatus.success ? <CheckCircleIcon size="sm" /> : <AlertTriangleIcon size="sm" />}
              <div className="text-xs font-semibold flex-1">{punchStatus.message}</div>
              <button
                type="button"
                onClick={() => setPunchStatus(null)}
                className="text-xs font-semibold hover:opacity-75 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          <div className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-card p-6 text-center flex flex-col items-center">
            <div
              id="stocky-kiosk-scanner-container"
              className="w-full max-w-sm h-64 bg-black rounded-widget overflow-hidden mb-4"
            />

            {scannerError && (
              <div className="text-xs text-stocky-status-warning-fg mb-3 flex items-center gap-1.5">
                <AlertTriangleIcon size="xs" />
                <span>{scannerError}</span>
              </div>
            )}

            <p className="text-xs text-stocky-text-sub max-w-sm mb-4">
              {t('modals.kiosk.cameraInstructions')}
            </p>

            <button
              type="button"
              onClick={handleManualPunch}
              className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-6 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ClockIcon size="xs" />
              <span>{t('modals.kiosk.punchBtn')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
