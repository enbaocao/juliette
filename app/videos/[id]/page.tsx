import { supabaseAdmin } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import StatusAutoRefresh from '@/components/videos/StatusAutoRefresh';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: video } = await supabaseAdmin
    .from('videos')
    .select('title')
    .eq('id', id)
    .single();

  if (!video) return { title: 'Video' };
  return {
    title: video.title,
    description: `Watch and learn from "${video.title}". Ask AI-powered questions and get explanations, practice problems, or animated visualizations.`,
  };
}

export default async function VideoPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch video data
  const { data: video, error } = await supabaseAdmin
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !video) {
    notFound();
  }

  // Check video status
  const isDownloading = video.status === 'downloading';
  const isUploaded = video.status === 'uploaded';
  const isTranscribed = video.status === 'transcribed';
  const isProcessing = isDownloading || isUploaded;

  return (
    <div className="min-h-screen p-8">
      <StatusAutoRefresh enabled={isProcessing} />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm mb-2 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
          <p className="text-sm text-gray-500">
            Uploaded {new Date(video.created_at).toLocaleString()}
          </p>
        </div>

        {/* Status Card */}
        <div className="mb-8 p-6 border rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            {isTranscribed ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-semibold text-green-600 dark:text-green-400">
                  Ready for Questions
                </span>
              </>
            ) : isDownloading ? (
              <>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  Fetching Transcript
                </span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  Transcription in Progress
                </span>
              </>
            )}
          </div>

          {isDownloading && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                We&apos;re processing this YouTube video. If captions are unavailable, we&apos;ll automatically run audio transcription, which can take a few minutes.
              </p>
              <p className="text-xs text-gray-500">
                This page will automatically update when the transcript is ready.
              </p>
            </div>
          )}

          {isUploaded && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                We&apos;re currently transcribing your video. This usually takes a few minutes depending
                on the video length.
              </p>
              <p className="text-xs text-gray-500">
                This page will automatically update when transcription is complete.
              </p>
            </div>
          )}

          {isTranscribed && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your video has been transcribed and is ready for AI-powered Q&A!
            </p>
          )}
        </div>

        {/* Actions */}
        {isTranscribed ? (
          <div className="space-y-4">
            <Link
              href={`/videos/${id}/ask`}
              className="block w-full py-4 px-6 bg-[#ffc8dd] hover:bg-[#ffbcd5] text-[#1a1a1a] font-medium rounded-lg text-center transition-colors"
            >
              Start Asking Questions
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 text-sm">💡 Simple Mode</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Get clear explanations with check questions
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 text-sm">📝 Practice Mode</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Personalized problems based on your interests
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 text-sm">🎬 Animation Mode</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Visual explanations with Manim animations
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">
              {isDownloading
                ? 'Processing YouTube video and preparing transcript...'
                : 'Transcription in progress... Check back in a few minutes'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
