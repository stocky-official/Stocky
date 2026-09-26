import Link from 'next/link';
import { StockyLogoIcon } from '@stocky/icons';

export const metadata = {
  title: 'Stocky legal and security information',
  description: 'Stocky terms, privacy notice, and current security controls.',
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[#f9f9f9] px-6 py-12 text-[#111827]">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0057ff] text-white"><StockyLogoIcon size="sm" /></span>
          stocky
        </Link>
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0057ff]">Overted Technologies</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Legal and security information</h1>
          <p className="mt-4 max-w-2xl leading-7 text-[#526071]">This page states the current Stocky operating position clearly. It is not a substitute for a negotiated enterprise agreement or legal advice.</p>
          <p className="mt-2 text-sm text-[#748196]">Effective date: 26 September 2026 · Contact: legal@stocky.example</p>
        </header>

        <div className="space-y-5">
          <section id="privacy" className="scroll-mt-6 rounded-xl border border-[#d9e0eb] bg-white p-7">
            <h2 className="text-2xl font-semibold">Privacy notice</h2>
            <p className="mt-3 leading-7 text-[#526071]">Stocky processes account, company membership, inventory, movement, and audit data to provide the workspace requested by an organization. Workspace records are scoped to the organization and location permissions enforced by the application and database policies. We do not sell workspace data. Contact legal@stocky.example for data-subject requests, retention questions, or a data-processing addendum.</p>
          </section>

          <section id="terms" className="scroll-mt-6 rounded-xl border border-[#d9e0eb] bg-white p-7">
            <h2 className="text-2xl font-semibold">Terms of use</h2>
            <p className="mt-3 leading-7 text-[#526071]">Organizations are responsible for inviting authorized users, protecting sign-in links, maintaining accurate stock records, and using Stocky in accordance with applicable law. Access may be subject to verification, plan scope, usage limits, and an enterprise order form. Features, integrations, retention, and support commitments are governed by the applicable agreement.</p>
          </section>

          <section id="security" className="scroll-mt-6 rounded-xl border border-[#d9e0eb] bg-white p-7">
            <h2 className="text-2xl font-semibold">Security and enterprise readiness</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-[#526071]">
              <li>Authenticated access uses Supabase Auth with Google OAuth, passwordless email links, and configured enterprise SSO connections.</li>
              <li>Tenant and location boundaries are enforced through company membership checks, role-aware application views, and database row-level security.</li>
              <li>Stock movements, transfers, approvals, counts, and operational actions are retained as audit-oriented records.</li>
              <li>Overted Technologies does not currently claim SOC 2 or ISO 27001 certification. Request the current security questionnaire, DPA, SLA, and implementation controls from sales before procurement.</li>
            </ul>
            <a className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#0057ff] px-4 font-semibold text-white hover:bg-[#0046cc]" href="mailto:sales@stocky.example?subject=Stocky%20security%20and%20enterprise%20pack">Request the enterprise security pack</a>
          </section>
        </div>
      </div>
    </main>
  );
}
