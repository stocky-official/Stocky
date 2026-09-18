'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircleIcon, CheckCircleIcon, StockyLogoIcon, XIcon } from '@stocky/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase/client';
import { signInWithGoogle } from '@/lib/auth';
import { PageContent, PageHeader, PageLayout } from '@/components/ui/PageLayout';

interface CompanyApplicationRow {
  id: string;
  requested_email: string;
  company_name: string;
  company_code: string | null;
  initial_branch_name: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  review_note: string | null;
  created_at: string;
}

export function PlatformVerificationView() {
  const router = useRouter();
  const [applications, setApplications] = useState<CompanyApplicationRow[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRequiresSignIn(true);
        return;
      }

      const { data: admin } = await supabase
        .from('platform_admins')
        .select('auth_user_id, is_active')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!admin) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(true);

      const { data, error } = await supabase
        .from('company_applications')
        .select('id, requested_email, company_name, company_code, initial_branch_name, status, review_note, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data ?? []) as CompanyApplicationRow[]);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to load company applications.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleAdminSignIn = async () => {
    setSigningIn(true);
    setErrorMessage(null);

    try {
      await signInWithGoogle('/admin/verifications');
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to start Google sign-in.');
      setSigningIn(false);
    }
  };

  const reviewApplication = async (application: CompanyApplicationRow, action: 'approve' | 'reject') => {
    setSavingId(application.id);
    setErrorMessage(null);

    const functionName = action === 'approve'
      ? 'approve_company_application'
      : 'reject_company_application';

    const { error } = await supabase.rpc(functionName, {
      p_application_id: application.id,
      p_review_note: notes[application.id]?.trim() || null,
    });

    if (error) {
      setErrorMessage(error.message || `Failed to ${action} application.`);
    } else {
      await loadApplications();
    }

    setSavingId(null);
  };

  if (loading) {
    return (
      <PageLayout className="flex items-center justify-center text-stocky-text-sub">
        <span className="text-xs">Loading company applications...</span>
      </PageLayout>
    );
  }

  if (requiresSignIn) {
    return (
      <PageLayout className="flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center space-y-5 p-8">
          <div className="w-10 h-10 rounded-widget bg-stocky-primary text-stocky-text-main flex items-center justify-center mx-auto">
            <StockyLogoIcon size="sm" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-medium text-stocky-text-main">Stocky admin sign-in</h1>
            <p className="text-sm text-stocky-text-sub">
              Sign in with your Stocky platform administrator account to review company applications.
            </p>
          </div>
          {errorMessage && (
            <div className="p-3 rounded-widget bg-red-50 border border-red-200 text-red-700 text-xs">
              {errorMessage}
            </div>
          )}
          <Button variant="primary" onClick={handleAdminSignIn} disabled={signingIn} className="w-full">
            {signingIn ? 'Redirecting to Google...' : 'Sign in with Google'}
          </Button>
          <Button variant="ghost" onClick={() => router.push('/')}>
            Return to Stocky home
          </Button>
        </Card>
      </PageLayout>
    );
  }

  if (!isAdmin) {
    return (
      <PageLayout className="flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center space-y-4 p-8">
          <AlertCircleIcon size="lg" className="mx-auto text-amber-600" />
          <h1 className="text-xl font-medium text-stocky-text-main">Stocky admin access required</h1>
          <p className="text-sm text-stocky-text-sub">This area is reserved for platform verification staff.</p>
          <Button variant="outline" onClick={() => router.replace('/platform')}>Return to platform</Button>
        </Card>
      </PageLayout>
    );
  }

  const pendingApplications = applications.filter((application) => application.status === 'pending');

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-widget bg-stocky-primary text-stocky-text-main flex items-center justify-center">
            <StockyLogoIcon size="xs" />
          </div>
          <div>
            <span className="text-sm font-medium text-stocky-text-main block">Stocky Admin</span>
            <span className="text-[11px] text-stocky-text-sub">Company verification</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.replace('/platform')}>Back to platform</Button>
      </PageHeader>

      <PageContent className="stocky-page-content--narrow space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium text-stocky-text-main">Company applications</h1>
            <p className="text-sm text-stocky-text-sub mt-1">Review pending companies before enabling operational access.</p>
          </div>
          <span className="text-xs text-stocky-text-sub">{pendingApplications.length} pending</span>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-widget bg-red-50 border border-red-200 text-red-700 text-xs">
            {errorMessage}
          </div>
        )}

        {applications.length === 0 ? (
          <Card className="p-10 text-center text-sm text-stocky-text-sub">No company applications yet.</Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const isPending = application.status === 'pending';
              return (
                <Card key={application.id} className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <h2 className="text-base font-medium text-stocky-text-main">{application.company_name}</h2>
                      <p className="text-xs text-stocky-text-sub mt-1">
                        {application.company_code || 'No code'} • {application.initial_branch_name || 'No primary branch'}
                      </p>
                      <p className="text-xs text-stocky-text-sub">Requested by {application.requested_email}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${isPending ? 'bg-amber-50 text-amber-700 border-amber-200' : application.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {application.status}
                    </span>
                  </div>

                  {isPending && (
                    <>
                      <textarea
                        value={notes[application.id] ?? ''}
                        onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))}
                        placeholder="Optional review note"
                        rows={2}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<XIcon size="xs" />}
                          onClick={() => reviewApplication(application, 'reject')}
                          disabled={savingId === application.id}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<CheckCircleIcon size="xs" />}
                          onClick={() => reviewApplication(application, 'approve')}
                          disabled={savingId === application.id}
                        >
                          Approve and activate
                        </Button>
                      </div>
                    </>
                  )}

                  {application.review_note && (
                    <p className="text-xs text-stocky-text-sub border-t border-stocky-border-subtle pt-3">
                      Review note: {application.review_note}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
