import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Claims an email invitation for the currently authenticated Supabase user.
 *
 * This is deliberately best-effort. The database function is the authority;
 * callers continue with their normal membership lookup if no invitation exists
 * or if an older environment has not applied the function yet.
 */
export async function claimInvitedCompanyMembership(client: SupabaseClient) {
  const { data, error } = await client.rpc('claim_company_membership');

  if (error) {
    console.warn('Unable to claim an invited company membership:', error.message);
  }

  return { data, error };
}
