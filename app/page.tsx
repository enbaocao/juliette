import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: "Welcome",
  description:
    "Juliette is your AI educational assistant. Upload videos, ask questions, and get personalized explanations, practice problems, and animated visualizations.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col lg:flex-row text-[#1a1a1a]">
      {/* Header - homepage only */}
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
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 pt-16 md:pt-24 lg:pt-32">
        <div className="max-w-lg w-full">
          <h1 className="text-5xl md:text-6xl mb-12 text-center text-[#1a1a1a] font-['Souvenir',sans-serif] font-normal tracking-tight">
            Welcome, Romeo
          </h1>

          <div className="bg-[#FAFAFC] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <button className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-4 group">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-base font-medium text-gray-700 group-hover:text-gray-900">Continue with Google</span>
            </button>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <span className="relative px-2 bg-[#ffe5ec] text-xs text-gray-500 uppercase tracking-wide">OR</span>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
              <button className="w-full py-3 px-4 bg-[#ffc8dd] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#ffbcd5] transition-colors shadow-md">
                Continue with email
              </button>
            </div>
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
