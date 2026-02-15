import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col lg:flex-row text-[#1a1a1a]">
      {/* Left Column: Content */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 pt-16 md:pt-24 lg:pt-32">
        <div className="max-w-md w-full">
          <h1 className="text-5xl md:text-6xl mb-12 text-center text-[#1a1a1a] font-[Palatino,'Palatino_Linotype','Book_Antiqua',serif] tracking-tight">
            Welcome, Romeo
          </h1>

          <div className="bg-[#FDFBF7] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-4 group">
              <span className="text-lg font-bold text-blue-500">G</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Continue with Google</span>
            </button>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <span className="relative px-2 bg-[#FDFBF7] text-xs text-gray-500 uppercase tracking-wide">OR</span>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
              <button className="w-full py-3 px-4 bg-[#1a1a1a] text-white font-medium rounded-lg hover:bg-black transition-colors shadow-md">
                Continue with email
              </button>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/teacher"
              className="flex-1 py-3 px-6 bg-white border border-gray-200 hover:border-gray-400 text-gray-800 text-center font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              🎓 Teacher Dashboard
            </Link>
            <Link
              href="/upload"
              className="flex-1 py-3 px-6 bg-white border border-gray-200 hover:border-gray-400 text-gray-800 text-center font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
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
