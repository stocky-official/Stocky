'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BoxesIcon, ArrowUpDownIcon, WarehouseIcon } from '@stocky/icons';

/**
 * LandingHeroWidget (v0.1.0)
 * Conforms to all v0.1.0 Design Rules:
 * - Max font size: 32px (2rem)
 * - Allowed weights: 300, 400, 500
 * - Background: #FFFFFF, Border: smooth clean #EBEBEB, NO shadows
 * - Button: #0057FF, 12px roundness
 */
export function LandingHeroWidget() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkExistingUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // If already signed up/in, direct to platform
        router.push('/platform');
      }
    }

    checkExistingUser();
  }, [router]);

  const handleGoogleSignUp = async () => {
    setLoading(true);
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=/platform`,
      },
    });
  };

  return (
    <Card className="max-w-[640px] w-full mx-auto text-center p-8 sm:p-12 space-y-8">
      {/* Brand Icon Badge */}
      <div className="w-12 h-12 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center mx-auto text-stocky-primary">
        <BoxesIcon size="lg" />
      </div>

      {/* Hero Headlines */}
      <div className="space-y-3">
        <h1 className="text-2xl font-medium text-stocky-text-main tracking-tight">
          Stocky
        </h1>
        <p className="text-base font-normal text-stocky-text-sub max-w-[460px] mx-auto leading-relaxed">
          Intelligent stock management platform designed for multi-hub logistics, inventory precision, and seamless replenishment.
        </p>
      </div>

      {/* Action Area: Sign up with Google & Enter Platform */}
      <div className="pt-2 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium gap-3 bg-stocky-primary hover:bg-stocky-primary-hover text-white rounded-widget"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#FFFFFF"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#FFFFFF"
                  opacity="0.9"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FFFFFF"
                  opacity="0.8"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#FFFFFF"
                  opacity="0.95"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign up with Google</span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/platform')}
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium bg-stocky-bg-widget border border-stocky-border-subtle text-stocky-text-main hover:bg-stocky-bg-global rounded-widget"
          >
            Enter Platform
          </Button>
        </div>

        <p className="text-xs font-light text-stocky-text-sub">
          Instant access with your Google account • Live multi-branch platform
        </p>
      </div>

      {/* Feature Badges */}
      <div className="pt-6 border-t border-stocky-border-subtle grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center gap-2">
          <BoxesIcon size="xs" className="text-stocky-accent" />
          <span className="text-xs font-normal text-stocky-text-sub">Stock Tracking</span>
        </div>
        <div className="p-3 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center gap-2">
          <ArrowUpDownIcon size="xs" className="text-stocky-accent" />
          <span className="text-xs font-normal text-stocky-text-sub">Movements</span>
        </div>
        <div className="p-3 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center gap-2">
          <WarehouseIcon size="xs" className="text-stocky-accent" />
          <span className="text-xs font-normal text-stocky-text-sub">Hub Logistics</span>
        </div>
      </div>
    </Card>
  );
}
