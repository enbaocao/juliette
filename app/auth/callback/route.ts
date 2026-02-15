import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/upload';
  const safeNext = next.startsWith('/') ? next : '/upload';

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedOrigin =
    forwardedProto && forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
  const appOrigin = configuredOrigin || forwardedOrigin || url.origin;

  try {
    if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${appOrigin}${safeNext}`);
      }
    }
  } catch {
    // Fall through to error redirect
  }

  // Auth error - redirect to home with error
  return NextResponse.redirect(`${appOrigin}/?error=auth`);
}
