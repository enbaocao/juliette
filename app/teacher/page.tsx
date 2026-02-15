import { supabaseAdmin } from '@/lib/supabase-server';
import Link from 'next/link';

export const metadata = {
  title: 'Teacher Dashboard',
  description:
    'Manage your educational videos, track student engagement, and view analytics. See recent questions and video library at a glance.',
};

async function getDashboardStats() {
  // Get video counts
  const { count: totalVideos } = await supabaseAdmin
    .from('videos')
    .select('*', { count: 'exact', head: true });

  const { count: transcribedVideos } = await supabaseAdmin
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'transcribed');

  // Get question counts
  const { count: totalQuestions } = await supabaseAdmin
    .from('questions')
    .select('*', { count: 'exact', head: true });

  // Get recent questions
  const { data: recentQuestions } = await supabaseAdmin
    .from('questions')
    .select(`
      id,
      question,
      mode,
      created_at,
      videos (
        id,
        title
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get mode distribution
  const { data: modeStats } = await supabaseAdmin
    .from('questions')
    .select('mode');

  const modeDistribution = {
    simple: modeStats?.filter((q) => q.mode === 'simple').length || 0,
    practice: modeStats?.filter((q) => q.mode === 'practice').length || 0,
    animation: modeStats?.filter((q) => q.mode === 'animation').length || 0,
  };

  return {
    totalVideos: totalVideos || 0,
    transcribedVideos: transcribedVideos || 0,
    totalQuestions: totalQuestions || 0,
    recentQuestions: recentQuestions || [],
    modeDistribution,
  };
}

async function getRecentVideos() {
  const { data: videos } = await supabaseAdmin
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  return videos || [];
}

export default async function TeacherDashboard() {
  const stats = await getDashboardStats();
  const recentVideos = await getRecentVideos();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your videos and track student engagement
              </p>
            </div>
            <Link
              href="/upload"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              + Upload Video
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Videos
            </div>
            <div className="text-3xl font-bold">{stats.totalVideos}</div>
            <div className="text-xs text-gray-500 mt-2">
              {stats.transcribedVideos} transcribed
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Student Questions
            </div>
            <div className="text-3xl font-bold">{stats.totalQuestions}</div>
            <div className="text-xs text-gray-500 mt-2">Across all videos</div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Most Popular Mode
            </div>
            <div className="text-3xl font-bold">
              {stats.modeDistribution.simple >= stats.modeDistribution.practice &&
              stats.modeDistribution.simple >= stats.modeDistribution.animation
                ? '💡'
                : stats.modeDistribution.practice >= stats.modeDistribution.animation
                ? '📝'
                : '🎬'}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Simple: {stats.modeDistribution.simple} | Practice:{' '}
              {stats.modeDistribution.practice} | Animation: {stats.modeDistribution.animation}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Engagement Rate
            </div>
            <div className="text-3xl font-bold">
              {stats.totalVideos > 0
                ? ((stats.totalQuestions / stats.totalVideos) * 100).toFixed(0)
                : 0}
              %
            </div>
            <div className="text-xs text-gray-500 mt-2">Questions per video</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Videos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Videos</h2>
                <Link
                  href="/teacher/videos"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {recentVideos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No videos yet. Upload your first video to get started!
                </div>
              ) : (
                recentVideos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/videos/${video.id}`}
                    className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{video.title}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          video.status === 'transcribed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}
                      >
                        {video.status === 'transcribed' ? 'Ready' : 'Processing'}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Questions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Student Questions</h2>
                <Link
                  href="/teacher/questions"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {stats.recentQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No questions yet. Students will appear here once they start asking questions.
                </div>
              ) : (
                stats.recentQuestions.map((q: any) => (
                  <div key={q.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {q.mode === 'simple' ? '💡' : q.mode === 'practice' ? '📝' : '🎬'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-2">{q.question}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{q.videos?.title || 'Unknown video'}</span>
                          <span>•</span>
                          <span>{new Date(q.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/teacher/analytics"
            className="p-6 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-500 transition-colors"
          >
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold mb-1">View Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Deep dive into student engagement metrics
            </p>
          </Link>

          <Link
            href="/teacher/zoom"
            className="p-6 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-500 transition-colors"
          >
            <div className="text-3xl mb-3">🎥</div>
            <h3 className="font-semibold mb-1">Zoom Integration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Set up live Q&A in Zoom meetings
            </p>
          </Link>

          <Link
            href="/teacher/settings"
            className="p-6 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-500 transition-colors"
          >
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="font-semibold mb-1">Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure your preferences and notifications
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
