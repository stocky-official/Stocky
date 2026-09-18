'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { OrganizationOnboardingWidget } from '@/widgets/OrganizationOnboardingWidget/OrganizationOnboardingWidget';
import { StockyLogoIcon } from '@stocky/icons';
import { PageContent, PageFooter, PageHeader, PageLayout } from '@/components/ui/PageLayout';

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
          const { data: company } = await supabase
            .from('companies')
            .select('code, status')
            .eq('id', existingMembership.company_id)
            .maybeSingle();

          if (company?.status && company.status !== 'verified') {
            router.replace('/verification-pending');
          } else {
            // Legacy companies without a status column remain accessible until
            // the reviewed verification migration is applied.
            const tenantUrl = company?.code ? `/${company.code.toLowerCase()}` : '/platform';
            router.replace(tenantUrl);
          }
          return;
        }

        const { data: existingApplication } = await supabase
          .from('company_applications')
          .select('status')
          .eq('requested_by_auth_user_id', user.id)
          .in('status', ['pending', 'approved'])
          .limit(1)
          .maybeSingle();

        if (existingApplication) {
          router.replace('/verification-pending');
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
      <PageLayout className="w-screen flex flex-col items-center justify-center gap-3 select-none">
        <div className="w-full max-w-md bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget p-8 shadow-bevel flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-stocky-border-default/60" />
          <div className="h-5 w-48 rounded-md bg-stocky-border-default/80" />
          <div className="h-3.5 w-64 rounded bg-stocky-border-default/40" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="w-screen flex flex-col justify-between select-none">
      {/* Top Simple Brand Header */}
      <PageHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-widget bg-stocky-primary text-stocky-text-main flex items-center justify-center shrink-0">
            <StockyLogoIcon size="xs" />
          </div>
          <span className="text-sm font-medium text-stocky-text-main tracking-tight">
            Stocky
          </span>
        </div>

        <div className="text-xs text-stocky-text-sub">
          Signed in as <span className="font-medium text-stocky-text-main">{userEmail}</span>
        </div>
      </PageHeader>

      {/* Main Centered Onboarding Workspace */}
      <PageContent className="flex-1 flex items-center justify-center py-10">
        <OrganizationOnboardingWidget
          userEmail={userEmail}
          onSuccess={() => {
            router.push('/verification-pending');
          }}
        />
      </PageContent>

      {/* Minimal Footer */}
      <PageFooter className="py-4 text-[11px]">
        Stocky Multi-Tenant B2B Inventory Architecture • v0.1.0
      </PageFooter>
    </PageLayout>
  );
}
