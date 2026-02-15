import Link from 'next/link';

export const metadata = {
  title: 'Zoom Integration',
  description: 'Set up Juliette for live Q&A in Zoom meetings. Students can ask questions during class and get instant AI-powered answers.',
};

export default function ZoomIntegrationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href="/teacher"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Zoom Integration</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Enable live Q&A in your Zoom meetings
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎥</div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Zoom App Status</h2>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  Ready to use in Zoom meetings
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Students can open the Juliette panel during your Zoom meetings to ask questions
                and receive AI-powered answers in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Start Your Zoom Meeting</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Begin your class or presentation as usual
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Students Open Juliette Panel</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Students click the &quot;Apps&quot; button in Zoom and select Juliette
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ask Questions Live</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Students select a video and ask questions during the meeting
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Get AI Answers</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Juliette provides instant answers with explanations, practice problems, or
                  animations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">For Teachers:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Go to Zoom Marketplace and install the Juliette app</li>
                <li>Authorize the app to access your Zoom account</li>
                <li>Share the app link with your students</li>
                <li>Start your meeting - the app will be available in the Apps panel</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">For Students:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Join your teacher&apos;s Zoom meeting</li>
                <li>Click the &quot;Apps&quot; button at the bottom of the Zoom window</li>
                <li>Search for &quot;Juliette&quot; and open it</li>
                <li>Select the relevant video and start asking questions!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Features in Zoom */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Features in Zoom Meetings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl mb-2">💡</div>
              <h3 className="font-semibold text-sm mb-1">Simple Mode</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Quick explanations with check questions
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-semibold text-sm mb-1">Practice Mode</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Personalized problems based on interests
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-2xl mb-2">🎬</div>
              <h3 className="font-semibold text-sm mb-1">Animation Mode</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Visual explanations with Manim
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/zoom/panel"
            target="_blank"
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-colors"
          >
            Test Zoom Panel
          </Link>
          <Link
            href="/teacher"
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-center transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
