import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'auth',
  'app',
  'localhost',
  '127.0.0.1',
]);

const RESERVED_ROOT_PATHS = new Set([
  'platform',
  'admin',
  'auth',
  'onboarding',
  'verification-pending',
  'api',
  '_next',
  'favicon.ico',
  'manifest.json',
  'icon.svg',
  'apple-icon.png',
  'apple-touch-icon.png',
  'sw.js',
]);

const PLATFORM_VIEWS = new Set([
  'stock',
  'suppliers',
  'transfers',
  'locations',
  'tasks',
  'team',
  'settings',
  'activity',
  'logs',
  'notifications',
  'expiring',
  'expiry',
]);

function copyResponseCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value);
  });
  return target;
}

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';
  const pathname = url.pathname;

  let supabaseResponse = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // 1. Check Subdomain Multi-tenancy (e.g. circlek.stocky.app, crk.localhost:3000)
  let subdomain: string | null = null;
  const hostWithoutPort = hostname.split(':')[0].toLowerCase();
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostWithoutPort);
  const hostParts = hostWithoutPort.split('.');

  if (!isIpAddress && hostParts.length > 1) {
    const potentialSub = hostParts[0];
    if (!RESERVED_SUBDOMAINS.has(potentialSub)) {
      subdomain = potentialSub;
    }
  }

  // 2. Identify Public vs Protected Routes
  const isAuthRoute = pathname.startsWith('/auth');
  const isRootOnMainHost = !subdomain && (pathname === '/' || pathname === '');
  const isPublicRoute = isAuthRoute || isRootOnMainHost;

  // 3. Inspect Supabase Authentication Session via SSR
  let user = null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(
            cookiesToSet: Array<{
              name: string;
              value: string;
              options?: any;
            }>
          ) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
    } catch (err) {
      console.error('Proxy Supabase auth check error:', err);
    }
  }

  // 4. Enforce Authentication on All Platform / Tenant Routes
  if (!user && !isPublicRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    const targetPath = pathname + (url.search || '');
    redirectUrl.search = `?next=${encodeURIComponent(targetPath)}`;

    if (subdomain) {
      // Reconstruct main host without the tenant subdomain
      const port = hostname.split(':')[1];
      const mainHostWithoutPort = hostParts.slice(1).join('.');
      redirectUrl.host = port ? `${mainHostWithoutPort}:${port}` : mainHostWithoutPort;
    }

    const redirectResponse = NextResponse.redirect(redirectUrl);
    return copyResponseCookies(supabaseResponse, redirectResponse);
  }

  // 5. Handle Subdomain Tenant Routing for Authenticated Sessions
  if (subdomain) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-stocky-tenant', subdomain);
    requestHeaders.set('x-stocky-tenant-prefix', '');

    if (pathname === '/' || pathname === '') {
      url.pathname = '/platform';
      const rewriteResponse = NextResponse.rewrite(url, { headers: requestHeaders });
      return copyResponseCookies(supabaseResponse, rewriteResponse);
    }

    const trimmedPath = pathname.replace(/^\//, '').toLowerCase().split('?')[0];
    if (PLATFORM_VIEWS.has(trimmedPath)) {
      const canonicalView =
        trimmedPath === 'expiry' ? 'expiring' : trimmedPath === 'logs' ? 'activity' : trimmedPath;
      url.pathname = `/platform/${canonicalView}`;
      const rewriteResponse = NextResponse.rewrite(url, { headers: requestHeaders });
      return copyResponseCookies(supabaseResponse, rewriteResponse);
    }

    return copyResponseCookies(
      supabaseResponse,
      NextResponse.next({ request: { headers: requestHeaders } })
    );
  }

  // 6. Handle Path-Based Multi-tenancy for Authenticated Sessions (e.g. /circlek or /circlek/stock)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const firstSegment = segments[0].toLowerCase();

    if (!RESERVED_ROOT_PATHS.has(firstSegment) && !firstSegment.includes('.')) {
      const tenantCode = firstSegment;
      const rawSubView = segments[1]?.toLowerCase().split('?')[0];
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-stocky-tenant', tenantCode);
      requestHeaders.set('x-stocky-tenant-prefix', `/${tenantCode}`);

      if (!rawSubView) {
        url.pathname = '/platform';
        const rewriteResponse = NextResponse.rewrite(url, { headers: requestHeaders });
        return copyResponseCookies(supabaseResponse, rewriteResponse);
      }

      const canonicalView =
        rawSubView === 'expiry' ? 'expiring' : rawSubView === 'logs' ? 'activity' : rawSubView;

      if (PLATFORM_VIEWS.has(canonicalView)) {
        url.pathname = `/platform/${canonicalView}`;
        const rewriteResponse = NextResponse.rewrite(url, { headers: requestHeaders });
        return copyResponseCookies(supabaseResponse, rewriteResponse);
      }

      // Route unknown tenant subviews into platform so the layout handles 404 cleanly
      url.pathname = `/platform/${canonicalView}`;
      const rewriteResponse = NextResponse.rewrite(url, { headers: requestHeaders });
      return copyResponseCookies(supabaseResponse, rewriteResponse);
    }
  }

  return supabaseResponse;
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|js)$).*)',
  ],
};
