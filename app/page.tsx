import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-5xl w-full">
        <div className="flex justify-center mb-8">
          <Image
            src="/juliette.jpg"
            alt="Juliette"
            width={200}
            height={200}
            className="rounded-lg object-cover"
            priority
          />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-center">
          Welcome to Juliette
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 text-center max-w-3xl mx-auto">
          AI Educational Video Assistant with Zoom Integration - Empower your classroom with real-time Q&A, personalized practice, and visual animations.
        </p>

        <div className="mb-12 flex gap-4 justify-center flex-wrap">
          <Link
            href="/teacher"
            className="inline-block py-4 px-10 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg transition-colors shadow-lg"
          >
            🎓 Teacher Dashboard
          </Link>
          <Link
            href="/upload"
            className="inline-block py-4 px-10 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-lg transition-colors shadow-lg"
          >
            📹 Upload Video
          </Link>
          <Link
            href="/practice-sandbox"
            className="inline-block py-4 px-10 bg-green-600 hover:bg-green-700 text-white text-lg font-medium rounded-lg transition-colors shadow-lg"
          >
            📝 Practice Sandbox
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">📹 Video Upload</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Upload educational videos or provide URLs for automatic transcription
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">💡 AI Q&A</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ask questions and get simple explanations, practice problems, or animated visualizations
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">🎥 Zoom Integration</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Live Q&A in Zoom meetings with teacher feedback
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
