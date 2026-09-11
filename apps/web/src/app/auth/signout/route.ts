import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCanonicalAuthOrigin } from '@/lib/authRedirect';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const host = process.env.NODE_ENV === 'development'
    ? request.headers.get('host')
    : request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || requestUrl.protocol.replace(':', '');
  const requestOrigin = host ? `${protocol}://${host}` : requestUrl.origin;
  const origin = getCanonicalAuthOrigin(requestOrigin);

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Failed to sign out on the server:', error);
  }

  const response = NextResponse.redirect(new URL('/', origin), { status: 302 });
  return response;
}

export async function GET(request: Request) {
  return POST(request);
}
