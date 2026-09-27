'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircleIcon, ShieldIcon, StockyLogoIcon } from '@stocky/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageLayout } from '@/components/ui/PageLayout';
import { AdminAuthProvider, ALLOWED_ADMIN_EMAIL, useAdminAuth } from './AdminAuthContext';
import { AdminSidebarNavWidget } from '@/widgets/AdminSidebarNavWidget/AdminSidebarNavWidget';
import { AdminTopBarWidget } from '@/widgets/AdminTopBarWidget/AdminTopBarWidget';
import { supabase } from '@/lib/supabase/client';

function AdminShellContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthorized, loading, requiresSignIn, signOut } = useAdminAuth();
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Fetch pending applications count for badges
  useEffect(() => {
    if (!isAuthorized) return;
    supabase
      .from('company_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => {
        setPendingCount(count || 0);
      });
  }, [isAuthorized]);

  // Handle redirect if unauthenticated
  useEffect(() => {
    if (!loading && requiresSignIn && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [loading, requiresSignIn, pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stocky-bg-global flex items-center justify-center p-6 text-stocky-text-sub text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stocky-accent text-stocky-text-main shadow-sm animate-pulse">
            <StockyLogoIcon size="sm" />
          </div>
          <span>Verifying administrator credentials...</span>
        </div>
      </div>
    );
  }

  if (requiresSignIn) {
    return null; // Will redirect via useEffect
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-stocky-bg-global flex items-center justify-center p-4 sm:p-6 text-start">
        <Card className="max-w-md w-full p-6 sm:p-8 space-y-5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl shadow-md text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stocky-status-warning-bg text-stocky-status-warning-fg border border-stocky-status-warning-border mx-auto">
            <ShieldIcon size="md" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-stocky-text-main">Access Denied (403)</h1>
            <p className="text-xs text-stocky-text-sub leading-relaxed">
              The Stocky Admin Portal is restricted to platform operators. Your current account (<strong className="text-stocky-text-main font-sans">{user?.email}</strong>) is not authorized.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle text-[11px] text-stocky-text-sub text-start">
            <span>Authorized Administrator Email:</span>
            <span className="block font-sans font-semibold text-stocky-text-main mt-0.5">
              {ALLOWED_ADMIN_EMAIL}
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <Button variant="primary" onClick={signOut} className="w-full justify-center text-xs h-10 rounded-full">
              Sign out & Switch Account
            </Button>
            <Button variant="ghost" onClick={() => router.push('/platform')} className="w-full justify-center text-xs h-10 rounded-full">
              Return to User Platform
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <PageLayout className="stocky-platform-shell min-h-screen bg-stocky-bg-global">
      {/* Mobile TopBar */}
      <AdminTopBarWidget pendingCount={pendingCount} />

      <div className="stocky-platform-body flex flex-1 min-h-0 min-w-0">
        {/* Desktop Sidebar */}
        <AdminSidebarNavWidget pendingCount={pendingCount} />

        {/* Main Content Area */}
        <main className="stocky-platform-content flex-1 overflow-y-auto min-w-0 max-w-full pb-24 md:pb-8 p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[1600px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </PageLayout>
  );
}

export function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShellContent>{children}</AdminShellContent>
    </AdminAuthProvider>
  );
}
