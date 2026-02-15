import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: "Welcome",
  description:
    "Juliette is your AI educational assistant. Upload videos, ask questions, and get personalized explanations, practice problems, and animated visualizations.",
};

export default async function Home({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;

  let user: { email?: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth failed - show logged-out state
  }

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#FAFAFC] flex flex-col lg:flex-row text-[#1a1a1a]">
      {/* Left Column: Content */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-14 lg:p-20">
        <div className="max-w-lg w-full">
          <h1 className="text-5xl md:text-[3.4rem] mb-10 text-center text-[#1a1a1a] font-['Souvenir',sans-serif] font-normal tracking-tight">
            Welcome, Romeo
          </h1>

          {user ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-600">You&apos;re signed in as {user.email}</p>
              <Link
                href="/upload"
                className="py-3 px-8 bg-[#ffc8dd] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#ffbcd5] transition-colors shadow-md"
              >
                Go to Upload
              </Link>
            </div>
          ) : (
            <div className="bg-[#FAFAFC] p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <Suspense fallback={<div className="py-4 text-center text-gray-500">Loading…</div>}>
                <AuthForm />
              </Suspense>
              {error === 'auth' && (
                <p className="text-sm text-red-600 mt-3 text-center">
                  Authentication failed. Please try again.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Image */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-10">
        <div className="relative w-full max-w-lg aspect-[4/3] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
          <Image
            src="/hero-image.png"
            alt="Students studying late at night"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
