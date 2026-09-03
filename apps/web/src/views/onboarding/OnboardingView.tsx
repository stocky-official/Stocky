'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { OrganizationOnboardingWidget } from '@/widgets/OrganizationOnboardingWidget/OrganizationOnboardingWidget';
import { BoxesIcon } from '@stocky/icons';

/**
 * OnboardingView (PageView)
 * Conforms to Critical Rule 5:
 * Controls the overall structure of the Onboarding flow:
 * - Checks active authentication session
 * - If user already belongs to a company, routes directly to /platform
 * - Orchestrates OrganizationOnboardingWidget
 */
export function OnboardingView() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuthAndCompany() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // If unauthenticated, redirect to home page to sign in
          router.replace('/');
          return;
        }

        setUserEmail(user.email ?? null);

        // Check if user already belongs to an active organization
        const { data: existingMembership } = await supabase
          .from('company_users')
          .select('company_id, status')
          .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
          .limit(1)
          .maybeSingle();

        if (existingMembership?.company_id && existingMembership.status === 'active') {
          // Already belongs to an organization -> skip to platform
          router.replace('/platform');
          return;
        }
      } catch (err) {
        console.error('Error during onboarding check:', err);
      } finally {
        setChecking(false);
      }
    }

    checkAuthAndCompany();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen w-screen bg-stocky-bg-global flex flex-col items-center justify-center gap-3 select-none">
        <div className="w-8 h-8 rounded-widget border-2 border-stocky-primary border-t-transparent animate-spin" />
        <span className="text-xs text-stocky-text-sub font-normal">
          Checking your organization profile...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-stocky-bg-global flex flex-col justify-between select-none">
      {/* Top Simple Brand Header */}
      <header className="h-16 px-6 border-b border-stocky-border-subtle bg-stocky-bg-widget flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-widget bg-stocky-primary text-white flex items-center justify-center shrink-0">
            <BoxesIcon size="xs" />
          </div>
          <span className="text-sm font-medium text-stocky-text-main tracking-tight">
            Stocky
          </span>
        </div>

        <div className="text-xs text-stocky-text-sub">
          Signed in as <span className="font-medium text-stocky-text-main">{userEmail}</span>
        </div>
      </header>

      {/* Main Centered Onboarding Workspace */}
      <main className="flex-1 flex items-center justify-center py-10">
        <OrganizationOnboardingWidget
          userEmail={userEmail}
          onSuccess={() => {
            router.push('/platform');
          }}
        />
      </main>

      {/* Minimal Footer */}
      <footer className="py-4 text-center text-[11px] text-stocky-text-sub border-t border-stocky-border-subtle bg-stocky-bg-widget">
        Stocky Multi-Tenant B2B Inventory Architecture • v0.1.0
      </footer>
    </div>
  );
}
