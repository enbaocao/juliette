import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { createClient } from '@/lib/supabase/server';
import { Upload, LayoutDashboard, PlayCircle } from 'lucide-react';

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
            <div className="flex flex-col items-center gap-6 w-full">
              <p className="text-gray-500 text-sm">What would you like to do today?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <Link
                  href="/upload"
                  className="p-6 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-[#ffc8dd] hover:shadow-[0_4px_20px_rgb(255,200,221,0.2)] transition-all text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#ffe5ec] flex items-center justify-center">
                    <Upload className="w-6 h-6 text-[#e8a0b4]" />
                  </div>
                  <h3 className="font-semibold text-[#1a1a1a] mb-1">Upload Video</h3>
                  <p className="text-xs text-gray-500">Add a new video for AI analysis</p>
                </Link>

                <Link
                  href="/teacher"
                  className="p-6 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-[#ffc8dd] hover:shadow-[0_4px_20px_rgb(255,200,221,0.2)] transition-all text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#ffe5ec] flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6 text-[#e8a0b4]" />
                  </div>
                  <h3 className="font-semibold text-[#1a1a1a] mb-1">Dashboard</h3>
                  <p className="text-xs text-gray-500">Manage videos & analytics</p>
                </Link>

                <Link
                  href="/teacher/videos"
                  className="p-6 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-[#ffc8dd] hover:shadow-[0_4px_20px_rgb(255,200,221,0.2)] transition-all text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#ffe5ec] flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-[#e8a0b4]" />
                  </div>
                  <h3 className="font-semibold text-[#1a1a1a] mb-1">Browse Videos</h3>
                  <p className="text-xs text-gray-500">Watch and ask questions</p>
                </Link>
              </div>
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
