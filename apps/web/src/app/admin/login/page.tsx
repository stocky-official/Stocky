'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircleIcon, CheckCircleIcon, ShieldIcon, StockyLogoIcon } from '@stocky/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ALLOWED_ADMIN_EMAIL, useAdminAuth } from '@/views/admin/AdminAuthContext';
import { signInWithGoogle } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAuthorized, loading } = useAdminAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && isAuthorized) {
      router.replace('/admin/dashboard');
    }
  }, [loading, user, isAuthorized, router]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle('/admin/dashboard');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to initialize Google authentication.');
      setSigningIn(false);
    }
  };

  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="min-h-screen bg-stocky-bg-global flex flex-col items-center justify-center p-4 sm:p-6 text-start">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stocky-primary text-stocky-text-main shadow-sm">
            <StockyLogoIcon size="md" />
          </div>
          <h1 className="text-2xl font-bold text-stocky-text-main">Stocky Admin Portal</h1>
          <p className="text-xs text-stocky-text-sub">
            Platform governance, tenant management, and organization verification.
          </p>
        </div>

        <Card className="p-6 sm:p-7 space-y-5 bg-stocky-bg-widget border-stocky-border-subtle shadow-md rounded-2xl">
          {/* Security Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle text-xs">
            <ShieldIcon size="sm" className="text-stocky-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <span className="font-semibold text-stocky-text-main block">Restricted Access Console</span>
              <p className="text-stocky-text-sub text-[11px] leading-relaxed">
                Only the authorized platform administrator (<strong className="text-stocky-text-main font-sans">{ALLOWED_ADMIN_EMAIL}</strong>) may access this area.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-stocky-status-critical-bg border border-stocky-status-critical-border text-stocky-status-critical-fg text-xs">
              <AlertCircleIcon size="xs" className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {user && !isAuthorized && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-stocky-status-warning-bg border border-stocky-status-warning-border text-stocky-status-warning-fg text-xs">
              <AlertCircleIcon size="sm" className="text-stocky-status-warning-fg shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Unauthorized Account</span>
                <span className="text-[11px] text-stocky-status-warning-fg">
                  You are signed in as <span className="font-sans font-medium">{user.email}</span>, which is not authorized for the admin portal. Please switch to <span className="font-sans font-medium">{ALLOWED_ADMIN_EMAIL}</span>.
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full h-11 rounded-full text-xs font-semibold shadow-sm justify-center gap-2"
            >
              {signingIn ? 'Redirecting to Google...' : 'Sign in with Google'}
            </Button>

            {isDev && (
              <a
                href={`/auth/dev-login?next=${encodeURIComponent('/admin/dashboard')}`}
                className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-global hover:bg-stocky-border-subtle/40 text-xs font-medium text-stocky-text-main flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>⚡ Quick Dev Login ({ALLOWED_ADMIN_EMAIL.split('@')[0]})</span>
              </a>
            )}
          </div>

          <div className="pt-3 border-t border-stocky-border-subtle text-center">
            <button
              type="button"
              onClick={() => router.push('/platform')}
              className="text-xs text-stocky-text-sub hover:text-stocky-text-main transition-colors cursor-pointer"
            >
              ← Return to user platform
            </button>
          </div>
        </Card>

        <p className="text-center text-[11px] text-stocky-text-sub">
          Stocky Enterprise Multi-Tenant Platform · Admin Security V2
        </p>
      </div>
    </div>
  );
}
