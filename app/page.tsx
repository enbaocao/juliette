import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full">
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
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Juliette
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          AI Educational Video Assistant - Upload videos, ask questions, get personalized animations and practice problems.
        </p>

        <div className="mb-8">
          <Link
            href="/upload"
            className="inline-block py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Upload Your First Video
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
