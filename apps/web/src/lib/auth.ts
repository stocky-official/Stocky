import { supabase } from '@/lib/supabase/client';
import { getAuthRedirectOrigin, normalizeInternalPath } from '@/lib/authRedirect';

function getAuthCallbackUrl(nextPath: string) {
  const origin = getAuthRedirectOrigin();
  const normalizedNext = normalizeInternalPath(nextPath);
  return `${origin}/auth/callback?next=${encodeURIComponent(normalizedNext)}`;
}

/**
 * Initiates Google OAuth sign-in with canonical redirect handling.
 */
export async function signInWithGoogle(nextPath = '/platform') {
  const redirectTo = getAuthCallbackUrl(nextPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }

  return data;
}

/** Sends a passwordless sign-in or sign-up link to the supplied email address. */
export async function signInWithEmail(email: string, nextPath = '/platform') {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: getAuthCallbackUrl(nextPath),
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error('Email sign-in error:', error);
    throw error;
  }

  return data;
}

/** Starts an enterprise SSO flow for a configured Supabase SSO domain. */
export async function signInWithEnterpriseSso(domain: string, nextPath = '/platform') {
  const { data, error } = await supabase.auth.signInWithSSO({
    domain: domain.trim().toLowerCase(),
    options: {
      redirectTo: getAuthCallbackUrl(nextPath),
    },
  });

  if (error) {
    console.error('Enterprise SSO error:', error);
    throw error;
  }

  return data;
}

/**
 * Unified sign-out flow:
 * 1. Signs out from the Supabase browser client (clears localStorage & client session).
 * 2. Calls the server-side /auth/signout endpoint to delete all HttpOnly SSR auth cookies.
 * 3. Forces a clean browser navigation to '/', wiping all React/Next memory state.
 */
export async function signOutUser() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.warn('Client sign-out warning:', error);
  }

  try {
    await fetch('/auth/signout', { method: 'POST' });
  } catch (error) {
    console.warn('Server sign-out warning:', error);
  }

  // Force clean reload to root page
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}
