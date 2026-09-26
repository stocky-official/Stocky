import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeInternalPath } from '@/lib/authRedirect';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const next = normalizeInternalPath(requestUrl.searchParams.get('next'));
  const email = process.env.STOCKY_DEV_LOGIN_EMAIL;
  const password = process.env.STOCKY_DEV_LOGIN_PASSWORD;

  if (!email || !password) {
    return new NextResponse('Development login is not configured', { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
