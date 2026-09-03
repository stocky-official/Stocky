import Link from 'next/link';
import { AlertTriangleIcon, ArrowUpDownIcon } from '@stocky/icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stocky-bg-base text-stocky-text-primary">
      <Card className="max-w-md w-full text-center p-8 space-y-4">
        <div className="w-12 h-12 rounded-full bg-stocky-status-lowStock-bg text-stocky-status-lowStock-fg flex items-center justify-center mx-auto">
          <AlertTriangleIcon size="lg" />
        </div>
        <h1 className="text-xl font-bold">Authentication Notice</h1>
        <p className="text-xs text-stocky-text-muted leading-relaxed">
          The authentication code could not be verified. If you are configuring Google OAuth,
          ensure that Google Client ID and Client Secret are added to your Supabase Dashboard
          under <span className="text-stocky-brand-light">Authentication → Providers → Google</span>.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary" size="md" className="w-full">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
