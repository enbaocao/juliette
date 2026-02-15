import { supabaseAdmin } from '@/lib/supabase-server';
import Link from 'next/link';

export const metadata = {
  title: 'Video Library',
  description: 'Browse and manage all your uploaded educational videos. View status and access each video for student Q&A.',
};

async function getVideosWithStats() {
  const { data: videos } = await supabaseAdmin
    .from('videos')
    .select(`
      *,
      questions:questions(count)
    `)
    .order('created_at', { ascending: false });

  return videos || [];
}

export default async function VideosPage() {
  const videos = await getVideosWithStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/teacher"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-2 inline-block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold">Video Library</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                All your educational videos
              </p>
            </div>
            <Link
              href="/upload"
              className="px-4 py-2 bg-[#ffc8dd] hover:bg-[#ffbcd5] text-[#1a1a1a] rounded-lg transition-colors"
            >
              + Upload Video
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📹</div>
            <h2 className="text-2xl font-bold mb-2">No videos yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Upload your first educational video to get started
            </p>
            <Link
              href="/upload"
              className="inline-block px-6 py-3 bg-[#ffc8dd] hover:bg-[#ffbcd5] text-[#1a1a1a] rounded-lg transition-colors"
            >
              Upload Your First Video
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video: any) => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg border hover:border-[#ffc8dd] transition-all overflow-hidden"
              >
                {/* Video Thumbnail Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-6xl">🎬</div>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>

                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        video.status === 'transcribed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}
                    >
                      {video.status === 'transcribed' ? '✓ Ready' : '⏳ Processing'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                    <span>{video.questions?.[0]?.count || 0} questions</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
