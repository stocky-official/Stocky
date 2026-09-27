import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCanonicalAuthOrigin, normalizeInternalPath } from '@/lib/authRedirect';
import { claimInvitedCompanyMembership } from '@/lib/claimMembership';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  // In Next dev, request.url may be reconstructed with a different local
  // hostname. The Host header represents the origin the browser actually
  // used, then the canonicalizer below keeps the redirect one-way.
  const host = process.env.NODE_ENV === 'development'
    ? request.headers.get('host')
    : request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || requestUrl.protocol.replace(':', '');
  const requestOrigin = host ? `${protocol}://${host}` : requestUrl.origin;
  const origin = getCanonicalAuthOrigin(requestOrigin);

  // Complete the code exchange on the canonical local origin. Redirecting
  // before exchanging is important because cookies issued for localhost are
  // not available to 127.0.0.1, and vice versa.
  if (process.env.NODE_ENV === 'development' && origin !== requestOrigin) {
    return NextResponse.redirect(`${origin}${requestUrl.pathname}${requestUrl.search}`);
  }

  const code = searchParams.get('code');
  const next = normalizeInternalPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user already has an active company membership
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let destination = next;
      // Platform-admin routes must remain accessible to admins who do not yet
      // belong to a company. Regular users without a membership go through
      // organization onboarding as before.
      const isPlatformAdminRoute = next.startsWith('/admin/');
      if (user && !isPlatformAdminRoute) {
        // Invitations are created before the teammate has an Auth identity, so
        // their row cannot be found by auth_user_id until this first sign-in.
        // Claim it before resolving the destination to prevent a false onboarding
        // redirect for an invited teammate.
        await claimInvitedCompanyMembership(supabase);

        const { data: memberships, error: membershipError } = await supabase
          .from('company_users')
          .select('company_id, status')
          .eq('auth_user_id', user.id)
          .limit(1);
        let membership = memberships?.[0] ?? null;
        let membershipLookupFailed = Boolean(membershipError);

        if (!membership && user.email) {
          const { data: emailMemberships, error: emailMembershipError } = await supabase
            .from('company_users')
            .select('company_id, status')
            .eq('email', user.email.toLowerCase())
            .limit(1);
          membership = emailMemberships?.[0] ?? null;
          membershipLookupFailed = Boolean(emailMembershipError);
        }

        if (membershipLookupFailed && !membership) {
          destination = '/auth/auth-code-error?reason=membership_lookup_failed';
        } else if (!membership || !membership.company_id) {
          destination = '/onboarding';
        } else if (destination === '/platform' || destination.startsWith('/platform/')) {
          const { data: comp } = await supabase
            .from('companies')
            .select('code')
            .eq('id', membership.company_id)
            .maybeSingle();

          if (comp?.code) {
            const companySlug = comp.code.toLowerCase();
            destination = destination === '/platform' ? `/${companySlug}` : destination.replace('/platform', `/${companySlug}`);
          }
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${destination}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${destination}`);
      } else {
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
