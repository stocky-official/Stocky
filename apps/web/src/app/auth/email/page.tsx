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
    <main className="min-h-screen bg-[#f9f9f9] px-6 py-12 text-[#111827]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <button type="button" className="flex items-center gap-2 self-start text-lg font-semibold" onClick={() => router.push('/')}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0057ff] text-white"><StockyLogoIcon size="sm" /></span>
          stocky
        </button>

        <section className="rounded-xl border border-[#d9e0eb] bg-white p-7 shadow-[0_12px_30px_rgba(17,24,39,0.06)]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0057ff]">Workspace access</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Choose how to continue</h1>
          <p className="mt-3 text-sm leading-6 text-[#526071]">Use a secure email link, Google, or your company’s configured SSO connection.</p>

          <form className="mt-7 space-y-3" onSubmit={handleEmail}>
            <label className="block text-sm font-medium" htmlFor="auth-email">Work email</label>
            <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-[#b9c5d6] px-4 outline-none focus:border-[#0057ff] focus:ring-2 focus:ring-[#0057ff]/20" placeholder="you@company.com" />
            <button type="submit" disabled={busy !== null} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0057ff] px-4 font-semibold text-white transition hover:bg-[#0046cc] disabled:cursor-wait disabled:opacity-60">
              {busy === 'email' ? 'Sending link…' : 'Continue with email'} <ChevronRightIcon size="xs" />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-[#748196]"><span className="h-px flex-1 bg-[#e2e7ef]" />or<span className="h-px flex-1 bg-[#e2e7ef]" /></div>

          <button type="button" onClick={() => void handleGoogle()} disabled={busy !== null} className="min-h-12 w-full rounded-xl border border-[#b9c5d6] px-4 font-semibold text-[#1d2b3d] hover:bg-[#f5f8fc] disabled:cursor-wait disabled:opacity-60">
            {busy === 'google' ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="mt-7 border-t border-[#e2e7ef] pt-6">
            <label className="block text-sm font-medium" htmlFor="sso-domain">Enterprise SSO domain <span className="font-normal text-[#748196]">(optional)</span></label>
            <div className="mt-2 flex gap-2">
              <input id="sso-domain" type="text" autoComplete="organization" value={domain} onChange={(event) => setDomain(event.target.value)} className="h-12 min-w-0 flex-1 rounded-xl border border-[#b9c5d6] px-4 outline-none focus:border-[#0057ff] focus:ring-2 focus:ring-[#0057ff]/20" placeholder="company.com" />
              <button type="button" onClick={() => void handleSso()} disabled={!domain.trim() || busy !== null} className="min-h-12 rounded-xl border border-[#0057ff] px-4 font-semibold text-[#0057ff] hover:bg-[#eef4ff] disabled:cursor-not-allowed disabled:opacity-50">{busy === 'sso' ? 'Opening…' : 'Use SSO'}</button>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#748196]">If your organization is not connected yet, request an enterprise setup from sales.</p>
          </div>

          {message && <p className="mt-5 rounded-xl bg-[#e9f7ef] px-4 py-3 text-sm text-[#166534]" role="status">{message}</p>}
          {error && <p className="mt-5 rounded-xl bg-[#fff1f1] px-4 py-3 text-sm text-[#a32929]" role="alert">{error}</p>}
        </section>

        <p className="text-center text-xs leading-5 text-[#748196]">By continuing, you agree to the <a className="underline" href="/legal#terms">Terms</a> and acknowledge the <a className="underline" href="/legal#privacy">Privacy Notice</a>.</p>
      </div>
    </main>
  );
}
