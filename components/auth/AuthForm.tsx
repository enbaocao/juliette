'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

type AuthFormProps = {
  /** When true, buttons are visible but non-functional (auth disabled) */
  disabled?: boolean;
};

export default function AuthForm({ disabled = false }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/upload';
  const supabase = createClient();

  const getSafeNextPath = () => {
    if (!next.startsWith('/')) return '/upload';
    return next;
  };

  const getRedirectUrl = () => {
    const url = new URL('/auth/callback', window.location.origin);
    url.searchParams.set('next', getSafeNextPath());
    return url.toString();
  };

  const getDirectGoogleAuthUrl = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }

    const authUrl = new URL('/auth/v1/authorize', supabaseUrl);
    authUrl.searchParams.set('provider', 'google');
    authUrl.searchParams.set('redirect_to', getRedirectUrl());
    return authUrl.toString();
  };

  const handleGoogleSignIn = async () => {
    if (disabled) return;
    setLoading(true);
    setMessage(null);
    // Yield to browser so loading state renders before network call
    await new Promise((r) => setTimeout(r, 0));
    try {
      const authPromise = supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
          skipBrowserRedirect: true,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Google sign-in timed out')), 8000);
      });

      const { data, error } = await Promise.race([authPromise, timeoutPromise]);

      if (error) throw error;

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      window.location.assign(getDirectGoogleAuthUrl());
    } catch (err: unknown) {
      try {
        window.location.assign(getDirectGoogleAuthUrl());
      } catch {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Sign in failed' });
        setLoading(false);
      }
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: getRedirectUrl() },
      });
      if (error) throw error;
      setMessage({
        type: 'success',
        text: 'Check your email for the login link!',
      });
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send magic link',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || disabled}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-4 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="text-base font-medium text-gray-700 group-hover:text-gray-900">
          {loading ? 'Redirecting to Google…' : 'Continue with Google'}
        </span>
      </button>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <span className="relative px-2 bg-[#ffe5ec] text-xs text-gray-500 uppercase tracking-wide">OR</span>
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || disabled}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all disabled:opacity-50"
          required
        />
        <button
          type="submit"
          disabled={loading || disabled}
          className="w-full py-3 px-4 bg-[#ffc8dd] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#ffbcd5] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with email
        </button>
      </form>

      {message && (
        <p
          className={`text-sm mt-2 ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
