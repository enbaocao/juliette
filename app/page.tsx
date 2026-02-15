import Link from 'next/link';
import Image from 'next/image';
import AuthForm from '@/components/auth/AuthForm';
import SignOutButton from '@/components/auth/SignOutButton';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: "Welcome",
  description:
    "Juliette is your AI educational assistant. Upload videos, ask questions, and get personalized explanations, practice problems, and animated visualizations.",
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col lg:flex-row text-[#1a1a1a]">
      {/* Left Column: Content */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24">
        <div className="max-w-lg w-full">
          <h1 className="text-5xl md:text-6xl mb-12 text-center text-[#1a1a1a] font-['Souvenir',sans-serif] font-normal tracking-tight">
            Welcome, Romeo
          </h1>

          {user ? (
            <div className="bg-[#FAFAFC] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center">
              <p className="text-gray-600 mb-2">Signed in as {user.email}</p>
              <p className="mb-6">
                <SignOutButton />
              </p>
              <Link
                href="/upload"
                className="inline-block py-3 px-8 bg-[#ffc8dd] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#ffbcd5] transition-colors shadow-md"
              >
                📹 Upload Video
              </Link>
            </div>
          ) : (
            <>
              <div className="bg-[#FAFAFC] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <AuthForm />
              </div>

              <div className="mt-12 flex justify-center">
                <Link
                  href="/upload"
                  className="py-3 px-8 bg-white border border-gray-200 hover:border-[#ffc2d1] text-gray-800 text-center font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  📹 Upload Video
                </Link>
              </div>
            </>
          )}
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
