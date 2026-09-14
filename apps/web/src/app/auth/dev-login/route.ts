import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get('next') || '/platform';
  const host = request.headers.get('host') || 'localhost:3000';

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'abdelrahman.m.abualola@gmail.com',
    password: 'StockyTest2026!',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL(next, 'http://' + host));
}
