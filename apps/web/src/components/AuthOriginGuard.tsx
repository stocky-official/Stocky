'use client';

import { useEffect } from 'react';
import { getCanonicalAuthOrigin } from '@/lib/authRedirect';

/**
 * Keep the entire local app on the same origin before OAuth starts.
 * Supabase stores its PKCE verifier and session in origin-scoped storage, so
 * allowing localhost and 127.0.0.1 to mix produces an unverifiable callback.
 * Localhost is the canonical development origin.
 */
export function AuthOriginGuard() {
  useEffect(() => {
    const canonicalOrigin = getCanonicalAuthOrigin(window.location.origin);
    if (canonicalOrigin === window.location.origin) return;

    window.location.replace(
      `${canonicalOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  }, []);

  return null;
}
