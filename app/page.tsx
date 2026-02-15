import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: "Welcome",
  description:
    "Juliette is your AI educational assistant. Upload videos, ask questions, and get personalized explanations, practice problems, and animated visualizations.",
};

export default function Home() {
  // AUTH DISABLED
  // let user: { email?: string } | null = null;
  // try {
  //   const supabase = await createClient();
  //   const { data } = await supabase.auth.getUser();
  //   user = data.user;
  // } catch {
  //   // Auth failed - show logged-out state
  // }

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col lg:flex-row text-[#1a1a1a]">
      {/* Header - simple when auth disabled */}
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

          {/* Auth form - buttons visible but non-functional when auth disabled */}
          <div className="bg-[#FAFAFC] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <Suspense fallback={<div className="py-4 text-center text-gray-500">Loading…</div>}>
              <AuthForm disabled />
            </Suspense>
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              href="/upload"
              className="py-3 px-8 bg-white border border-gray-200 hover:border-[#ffc2d1] text-gray-800 text-center font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              📹 Upload Video
            </Link>
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
