import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: "Welcome",
  description:
    "Juliette is your AI educational assistant. Upload videos, ask questions, and get personalized explanations, practice problems, and animated visualizations.",
};

export default async function Home({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;

  // If user is already logged in, redirect to upload page
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      redirect(next ?? '/upload');
    }
  } catch {
    // Auth failed - show logged-out state
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col lg:flex-row text-[#1a1a1a]">
      {/* Header */}
      <header className="fixed top-8 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 lg:px-14 md:top-10">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity gap-0">
          <Image src="/logo.png" alt="Juliette" width={56} height={56} className="flex-shrink-0" />
          <span className="font-['Souvenir',sans-serif] text-3xl font-medium text-[#1a1a1a]">
            Juliette
          </span>
        </Link>
        <Link
          href="/teacher"
          className="py-2 px-4 rounded-lg text-sm font-medium text-[#1a1a1a] border border-gray-200 bg-white/80 hover:bg-white/90 hover:border-[#ffc2d1] transition-colors"
        >
          Teacher Login
        </Link>
      </header>

      {/* Left Column: Content */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 pt-24 md:pt-32 lg:pt-40">
        <div className="max-w-lg w-full">
          <h1 className="text-5xl md:text-6xl mb-12 text-center text-[#1a1a1a] font-['Souvenir',sans-serif] font-normal tracking-tight">
            Welcome, Romeo
          </h1>

          <div className="bg-[#FAFAFC] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <Suspense fallback={<div className="py-4 text-center text-gray-500">Loading…</div>}>
              <AuthForm />
            </Suspense>
            {error === 'auth' && (
              <p className="text-sm text-red-600 mt-3 text-center">
                Authentication failed. Please try again.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Image */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 md:p-12 lg:p-16">
        <div className="relative w-full max-w-lg aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
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
