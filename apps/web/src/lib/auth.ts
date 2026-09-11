import { supabase } from '@/lib/supabase/client';
import { getAuthRedirectOrigin } from '@/lib/authRedirect';

/**
 * Initiates Google OAuth sign-in with canonical redirect handling.
 */
export async function signInWithGoogle(nextPath = '/platform') {
  const origin = getAuthRedirectOrigin();
  const normalizedNext = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(normalizedNext)}`;

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
