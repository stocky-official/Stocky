'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const PWA_THEME_COLORS = {
  home: '#14261C',
  default: '#FFFFFF',
} as const;

export const PWA_STATUS_BAR_STYLES = {
  home: 'black-translucent',
  default: 'default',
} as const;

const RESERVED_PATHS = new Set([
  'admin',
  'auth',
  'onboarding',
  'verification-pending',
  'api',
  '_next',
  'favicon.ico',
  'manifest.json',
  'icon.svg',
  'apple-icon.png',
  'apple-touch-icon.png',
  'sw.js',
]);

/**
 * Checks if the current pathname corresponds to the Home hero view.
 * Matches:
 * - "/platform"
 * - "/platform/"
 * - Single-segment tenant roots, e.g. "/circlek", "/circlek/"
 * Does NOT match:
 * - "/" (landing/auth)
 * - "/circlek/inventory", "/circlek/tasks", etc.
 * - "/onboarding", "/auth/..."
 */
export function isHomeRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const clean = pathname.split('?')[0].replace(/\/+$/, '');
  if (!clean) return false;

  if (clean === '/platform') return true;

  const segments = clean.split('/').filter(Boolean);
  if (segments.length === 1 && !RESERVED_PATHS.has(segments[0].toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Dynamically updates PWA theme and status bar meta tags in document.head.
 */
export function syncPWATheme(isHome: boolean) {
  if (typeof document === 'undefined') return;

  const targetColor = isHome ? PWA_THEME_COLORS.home : PWA_THEME_COLORS.default;
  const targetAppleStatusBarStyle = isHome ? PWA_STATUS_BAR_STYLES.home : PWA_STATUS_BAR_STYLES.default;

  // 1. Synchronize <meta name="theme-color"> (Android Chrome, modern Safari)
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
  if (themeColorMetas.length > 0) {
    themeColorMetas.forEach((meta) => meta.setAttribute('content', targetColor));
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', targetColor);
    document.head.appendChild(meta);
  }

  // 2. Synchronize <meta name="apple-mobile-web-app-status-bar-style"> (iOS Standalone WebClip)
  let appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleStatusBarMeta) {
    appleStatusBarMeta.setAttribute('content', targetAppleStatusBarStyle);
  } else {
    appleStatusBarMeta = document.createElement('meta');
    appleStatusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    appleStatusBarMeta.setAttribute('content', targetAppleStatusBarStyle);
    document.head.appendChild(appleStatusBarMeta);
  }

  // 3. Synchronize <meta name="msapplication-navbutton-color"> (Windows Phone / Edge legacy)
  let msNavMeta = document.querySelector('meta[name="msapplication-navbutton-color"]');
  if (msNavMeta) {
    msNavMeta.setAttribute('content', targetColor);
  } else {
    msNavMeta = document.createElement('meta');
    msNavMeta.setAttribute('name', 'msapplication-navbutton-color');
    msNavMeta.setAttribute('content', targetColor);
    document.head.appendChild(msNavMeta);
  }
}

/**
 * PWAThemeColorSync
 * Global client component mounted in root layout to listen to route transitions
 * and dynamically tune the mobile status bar background and icons.
 */
export function PWAThemeColorSync() {
  const pathname = usePathname();

  useEffect(() => {
    const isHome = isHomeRoute(pathname);
    syncPWATheme(isHome);
  }, [pathname]);

  return null;
}
