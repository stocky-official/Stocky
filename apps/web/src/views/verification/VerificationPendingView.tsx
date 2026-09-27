'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircleIcon, CheckCircleIcon, StockyLogoIcon } from '@stocky/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase/client';
import { signOutUser } from '@/lib/auth';
import { PageContent, PageHeader, PageLayout } from '@/components/ui/PageLayout';

type VerificationState = 'pending' | 'rejected' | 'suspended' | 'unknown';

const stateCopy: Record<VerificationState, { title: string; message: string }> = {
  pending: {
    title: 'Company verification is in progress',
    message: 'Your company profile was submitted successfully. Stocky will enable platform access after review.',
  },
  rejected: {
    title: 'Company verification needs attention',
    message: 'The submitted company profile was not approved. Contact Stocky support for the review note and next steps.',
  },
  suspended: {
    title: 'Platform access is suspended',
    message: 'This company account is currently unavailable. Contact Stocky support if you believe this is incorrect.',
  },
  unknown: {
    title: 'Company verification is in progress',
    message: 'We are checking your company profile. Access will appear here once verification is complete.',
  },
};

export function VerificationPendingView() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [verificationState, setVerificationState] = useState<VerificationState>('unknown');
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const loadVerificationState = useCallback(async () => {
    setChecking(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }

      setUserEmail(user.email ?? null);

      const { data: membership } = await supabase
        .from('company_users')
        .select('company_id')
        .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
        .limit(1)
        .maybeSingle();

      if (membership?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('code, status, verification_note')
          .eq('id', membership.company_id)
          .maybeSingle();

        if (company?.status === 'verified') {
          const tenantUrl = company.code ? `/${company.code.toLowerCase()}` : '/platform';
          router.replace(tenantUrl);
          return;
        }

        if (company?.status === 'rejected' || company?.status === 'suspended') {
          setVerificationState(company.status);
          setReviewNote(company.verification_note ?? null);
          return;
        }
      }

      const { data: application } = await supabase
        .from('company_applications')
        .select('status, review_note')
        .eq('requested_by_auth_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (application?.status === 'rejected') {
        setVerificationState('rejected');
        setReviewNote(application.review_note ?? null);
      } else {
        setVerificationState('pending');
        setReviewNote(application?.review_note ?? null);
      }
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    loadVerificationState();
  }, [loadVerificationState]);

  const handleSignOut = async () => {
    await signOutUser();
  };

  if (loading) {
    return (
      <PageLayout className="flex items-center justify-center text-stocky-text-sub">
        <span className="text-xs">Checking company verification status...</span>
      </PageLayout>
    );
  }

  const copy = stateCopy[verificationState];
  const isBlocked = verificationState === 'rejected' || verificationState === 'suspended';

  return (
    <PageLayout className="flex flex-col">
      <PageHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-widget bg-stocky-primary text-stocky-text-main flex items-center justify-center">
            <StockyLogoIcon size="xs" />
          </div>
          <span className="text-sm font-medium text-stocky-text-main">Stocky</span>
        </div>
        <span className="text-xs text-stocky-text-sub truncate max-w-[240px]">{userEmail}</span>
      </PageHeader>

      <PageContent className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-8 text-center space-y-5">
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${isBlocked ? 'bg-stocky-status-warning-bg text-stocky-status-warning-fg' : 'bg-stocky-status-success-bg text-stocky-status-success-fg'}`}>
            {isBlocked ? <AlertCircleIcon size="lg" /> : <CheckCircleIcon size="lg" />}
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-medium text-stocky-text-main">{copy.title}</h1>
            <p className="text-sm text-stocky-text-sub leading-relaxed">{copy.message}</p>
          </div>
          {reviewNote && (
            <div className="text-left p-3 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle text-xs text-stocky-text-sub">
              <span className="font-medium text-stocky-text-main block mb-1">Review note</span>
              {reviewNote}
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button variant="primary" onClick={loadVerificationState} disabled={checking}>
              {checking ? 'Checking...' : 'Check status'}
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
