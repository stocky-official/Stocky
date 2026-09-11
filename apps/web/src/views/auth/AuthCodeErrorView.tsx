'use client';

import Link from 'next/link';
import { AlertTriangleIcon } from '@stocky/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageContent, PageLayout } from '@/components/ui/PageLayout';

export function AuthCodeErrorView() {
  return (
    <PageLayout>
      <PageContent className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-full stocky-status-warning flex items-center justify-center mx-auto">
            <AlertTriangleIcon size="lg" />
          </div>
          <h1 className="text-xl font-medium">Authentication Notice</h1>
          <p className="text-xs text-stocky-text-sub leading-relaxed">
            The authentication code could not be verified. If you are configuring Google OAuth,
            ensure that Google Client ID and Client Secret are added to your Supabase Dashboard
            under <span className="text-stocky-primary">Authentication → Providers → Google</span>.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button variant="primary" size="md" className="w-full">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
