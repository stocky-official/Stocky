'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDownIcon, StockyLogoIcon, XIcon } from '@stocky/icons';

export function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Stocky PWA ServiceWorker active:', registration.scope);
          })
          .catch((error) => {
            console.warn('Stocky ServiceWorker registration failed:', error);
          });
      });
    }

    // 2. Listen for Install Prompt (Chrome / Edge / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user already dismissed install banner recently
      const dismissed = localStorage.getItem('stocky_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Listen for Online / Offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem('stocky_pwa_dismissed', 'true');
    } catch {}
  };

  return (
    <>
      {/* Offline Status Bar */}
      {isOffline && (
          <div className="stocky-pwa-offline-banner fixed top-0 left-0 right-0 z-50 bg-stocky-status-warning-fg text-stocky-text-inverse text-xs py-1.5 px-4 text-center font-medium shadow-md flex items-center justify-center gap-2">
            <span>You are currently offline. Cached stock records remain available.</span>
          </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && (
          <div className="stocky-pwa-install-banner fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-stocky-bg-widget/95 backdrop-blur-md border border-stocky-border-subtle rounded-widget p-4 shadow-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stocky-primary flex items-center justify-center shrink-0 shadow-md">
              <StockyLogoIcon size="sm" className="text-stocky-text-main" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-stocky-text-main">
                Install Stocky App
              </h4>
              <p className="text-[11px] text-stocky-text-sub truncate">
                Fast fullscreen experience & camera scanning
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-stocky-primary hover:bg-stocky-primary-hover text-stocky-text-inverse text-xs font-medium rounded-widget transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowDownIcon size="xs" />
                Install
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-7 h-7 rounded-widget hover:bg-stocky-bg-global text-stocky-text-sub flex items-center justify-center transition-colors cursor-pointer"
                title="Dismiss"
              >
                <XIcon size="xs" />
              </button>
            </div>
          </div>
      )}
    </>
  );
}
