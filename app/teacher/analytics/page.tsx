import { supabaseAdmin } from '@/lib/supabase-server';
import Link from 'next/link';

export const metadata = {
  title: 'Analytics - Teacher Dashboard',
};

async function getAnalytics() {
  // Get all questions with timestamps
  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('mode, created_at, interest_tags');

  // Get videos with question counts
  const { data: videos } = await supabaseAdmin
    .from('videos')
    .select(`
      id,
      title,
      created_at,
      questions:questions(count)
    `)
    .order('created_at', { ascending: false });

  // Calculate stats
  const totalQuestions = questions?.length || 0;
  const simpleCount = questions?.filter((q) => q.mode === 'simple').length || 0;
  const practiceCount = questions?.filter((q) => q.mode === 'practice').length || 0;
  const animationCount = questions?.filter((q) => q.mode === 'animation').length || 0;

  // Get popular interest tags
  const allTags = questions
    ?.flatMap((q) => q.interest_tags || [])
    .filter(Boolean) || [];
  const tagCounts = allTags.reduce((acc: any, tag: string) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  const topTags = Object.entries(tagCounts)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  // Questions by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const questionsByDay = last7Days.map((day) => ({
    day,
    count: questions?.filter((q) => q.created_at.startsWith(day)).length || 0,
  }));

  return {
    totalQuestions,
    simpleCount,
    practiceCount,
    animationCount,
    topTags,
    questionsByDay,
    videos: videos || [],
  };
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();

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
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Insights into student engagement and learning patterns
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Mode Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Question Mode Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-3xl mb-2">💡</div>
              <div className="text-2xl font-bold">{analytics.simpleCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Simple Explanations
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {analytics.totalQuestions > 0
                  ? Math.round((analytics.simpleCount / analytics.totalQuestions) * 100)
                  : 0}
                % of total
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-3xl mb-2">📝</div>
              <div className="text-2xl font-bold">{analytics.practiceCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Practice Problems</div>
              <div className="mt-2 text-xs text-gray-500">
                {analytics.totalQuestions > 0
                  ? Math.round((analytics.practiceCount / analytics.totalQuestions) * 100)
                  : 0}
                % of total
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-3xl mb-2">🎬</div>
              <div className="text-2xl font-bold">{analytics.animationCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Animations</div>
              <div className="mt-2 text-xs text-gray-500">
                {analytics.totalQuestions > 0
                  ? Math.round((analytics.animationCount / analytics.totalQuestions) * 100)
                  : 0}
                % of total
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Questions This Week</h2>
          <div className="flex items-end gap-2 h-48">
            {analytics.questionsByDay.map((day, idx) => {
              const maxCount = Math.max(...analytics.questionsByDay.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 flex items-end w-full">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${day.count} questions`}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(day.day).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs font-semibold">{day.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Interest Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Popular Interest Tags</h2>
            {analytics.topTags.length === 0 ? (
              <p className="text-sm text-gray-500">No interest tags yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topTags.map((tag: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{tag.tag}</span>
                        <span className="text-sm text-gray-500">{tag.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${(tag.count / analytics.practiceCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most Engaged Videos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Most Engaged Videos</h2>
            {analytics.videos.length === 0 ? (
              <p className="text-sm text-gray-500">No videos yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.videos
                  .sort((a: any, b: any) => {
                    const aCount = a.questions?.[0]?.count || 0;
                    const bCount = b.questions?.[0]?.count || 0;
                    return bCount - aCount;
                  })
                  .slice(0, 5)
                  .map((video: any) => {
                    const questionCount = video.questions?.[0]?.count || 0;
                    return (
                      <Link
                        key={video.id}
                        href={`/videos/${video.id}`}
                        className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{video.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {questionCount} question{questionCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-2xl ml-3">
                            {questionCount > 10 ? '🔥' : questionCount > 5 ? '✨' : '📊'}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
