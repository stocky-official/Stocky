'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRightIcon, StockyLogoIcon } from '@stocky/icons';
import { signInWithEmail, signInWithEnterpriseSso, signInWithGoogle } from '@/lib/auth';
import { isSafeInternalPath, normalizeInternalPath } from '@/lib/authRedirect';

export default function EmailAuthPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState('/platform');
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | 'sso' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextParam = new URLSearchParams(window.location.search).get('next');
    if (isSafeInternalPath(nextParam)) setNextPath(normalizeInternalPath(nextParam));
  }, []);

  const handleEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    try {
      setBusy('email');
      setError(null);
      await signInWithEmail(email, nextPath);
      setMessage('Check your inbox for a secure Stocky sign-in link.');
    } catch (authError: any) {
      setError(authError?.message || 'We could not send the sign-in link. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    try {
      setBusy('google');
      setError(null);
      await signInWithGoogle(nextPath);
    } catch (authError: any) {
      setError(authError?.message || 'Google sign-in could not be started.');
      setBusy(null);
    }
  };

  const handleSso = async () => {
    if (!domain.trim()) return;
    try {
      setBusy('sso');
      setError(null);
      await signInWithEnterpriseSso(domain, nextPath);
    } catch (authError: any) {
      setError(authError?.message || 'No SSO connection is configured for that domain yet. Contact sales to set one up.');
      setBusy(null);
    }
  };

  return (
    <main className="min-h-screen bg-stocky-bg-global px-6 py-12 text-stocky-text-main">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <button type="button" className="flex items-center gap-2 self-start text-lg font-semibold" onClick={() => router.push('/')}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stocky-accent text-stocky-text-main"><StockyLogoIcon size="sm" /></span>
          stocky
        </button>

        <section className="rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget p-7 shadow-bevel-float">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-stocky-primary">Workspace access</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Choose how to continue</h1>
          <p className="mt-3 text-sm leading-6 text-stocky-text-sub">Use a secure email link, Google, or your company’s configured SSO connection.</p>

          <form className="mt-7 space-y-3" onSubmit={handleEmail}>
            <label className="block text-sm font-medium" htmlFor="auth-email">Work email</label>
            <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-stocky-border-default px-4 outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-accent-soft" placeholder="you@company.com" />
            <button type="submit" disabled={busy !== null} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-stocky-primary px-4 font-semibold text-stocky-text-inverse transition hover:bg-stocky-primary-hover disabled:cursor-wait disabled:opacity-60">
              {busy === 'email' ? 'Sending link…' : 'Continue with email'} <ChevronRightIcon size="xs" />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-stocky-text-sub"><span className="h-px flex-1 bg-stocky-border-subtle" />or<span className="h-px flex-1 bg-stocky-border-subtle" /></div>

          <button type="button" onClick={() => void handleGoogle()} disabled={busy !== null} className="min-h-12 w-full rounded-xl border border-stocky-border-default px-4 font-semibold text-stocky-text-main hover:bg-stocky-bg-hover disabled:cursor-wait disabled:opacity-60">
            {busy === 'google' ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="mt-7 border-t border-stocky-border-subtle pt-6">
            <label className="block text-sm font-medium" htmlFor="sso-domain">Enterprise SSO domain <span className="font-normal text-stocky-text-sub">(optional)</span></label>
            <div className="mt-2 flex gap-2">
              <input id="sso-domain" type="text" autoComplete="organization" value={domain} onChange={(event) => setDomain(event.target.value)} className="h-12 min-w-0 flex-1 rounded-xl border border-stocky-border-default px-4 outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-accent-soft" placeholder="company.com" />
              <button type="button" onClick={() => void handleSso()} disabled={!domain.trim() || busy !== null} className="min-h-12 rounded-xl border border-stocky-primary px-4 font-semibold text-stocky-primary hover:bg-stocky-accent-soft disabled:cursor-not-allowed disabled:opacity-50">{busy === 'sso' ? 'Opening…' : 'Use SSO'}</button>
            </div>
            <p className="mt-2 text-xs leading-5 text-stocky-text-sub">If your organization is not connected yet, request an enterprise setup from sales.</p>
          </div>

          {message && <p className="stocky-status-success mt-5 rounded-xl px-4 py-3 text-sm" role="status">{message}</p>}
          {error && <p className="stocky-status-critical mt-5 rounded-xl px-4 py-3 text-sm" role="alert">{error}</p>}
        </section>

        <p className="text-center text-xs leading-5 text-stocky-text-sub">By continuing, you agree to the <a className="underline" href="/legal#terms">Terms</a> and acknowledge the <a className="underline" href="/legal#privacy">Privacy Notice</a>.</p>
      </div>
    </main>
  );
}
