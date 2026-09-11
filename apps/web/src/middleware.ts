import { NextRequest, NextResponse } from 'next/server';

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

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';
  const pathname = url.pathname;

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

  if (subdomain) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-stocky-tenant', subdomain);
    requestHeaders.set('x-stocky-tenant-prefix', '');

    if (pathname === '/' || pathname === '') {
      url.pathname = '/platform';
      return NextResponse.rewrite(url, { headers: requestHeaders });
    }

    const trimmedPath = pathname.replace(/^\//, '').toLowerCase().split('?')[0];
    if (PLATFORM_VIEWS.has(trimmedPath)) {
      const canonicalView =
        trimmedPath === 'expiry' ? 'expiring' : trimmedPath === 'logs' ? 'activity' : trimmedPath;
      url.pathname = `/platform/${canonicalView}`;
      return NextResponse.rewrite(url, { headers: requestHeaders });
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // 2. Check Path-Based Multi-tenancy (e.g. localhost:3000/circlek/stock or stocky.vercel.app/crk/suppliers)
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
        return NextResponse.rewrite(url, { headers: requestHeaders });
      }

      const canonicalView =
        rawSubView === 'expiry' ? 'expiring' : rawSubView === 'logs' ? 'activity' : rawSubView;

      if (PLATFORM_VIEWS.has(canonicalView)) {
        url.pathname = `/platform/${canonicalView}`;
        return NextResponse.rewrite(url, { headers: requestHeaders });
      }

      // Route unknown tenant subviews into platform so the layout handles 404 cleanly
      url.pathname = `/platform/${canonicalView}`;
      return NextResponse.rewrite(url, { headers: requestHeaders });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|js)$).*)',
  ],
};
