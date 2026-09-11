/**
 * Keep one canonical origin for local OAuth.
 *
 * `localhost` and `127.0.0.1` are different browser origins, so Supabase
 * stores their sessions separately. Stocky uses `localhost` as the one
 * canonical development origin so OAuth callbacks and sessions stay aligned.
 */
export function getCanonicalAuthOrigin(origin: string) {
  if (process.env.NODE_ENV !== 'development') return origin;

  const url = new URL(origin);
  if (url.hostname === '127.0.0.1') url.hostname = 'localhost';
  return url.origin;
}

export function getAuthRedirectOrigin() {
  return getCanonicalAuthOrigin(window.location.origin);
}
