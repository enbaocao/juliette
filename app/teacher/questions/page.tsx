import { supabaseAdmin } from '@/lib/supabase-server';
import Link from 'next/link';

export const metadata = {
  title: 'Student Questions',
  description: 'Review all student questions across your videos. See answers, modes used, and engagement patterns.',
};

async function getAllQuestions() {
  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select(`
      *,
      videos (
        id,
        title
      )
    `)
    .order('created_at', { ascending: false });

  return questions || [];
}

function formatTime(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default async function QuestionsPage() {
  const questions = await getAllQuestions();

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
          <h1 className="text-2xl font-bold">Student Questions</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor and respond to student inquiries
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button className="px-4 py-2 bg-[#ffc8dd] text-[#1a1a1a] rounded-lg">All</button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg hover:border-[#ffc8dd]">
            💡 Simple
          </button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg hover:border-[#ffc8dd]">
            📝 Practice
          </button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg hover:border-[#ffc8dd]">
            🎬 Animation
          </button>
        </div>

        {/* Questions Feed */}
        {questions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold mb-2">No questions yet</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Student questions will appear here once they start asking
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q: any) => (
              <div
                key={q.id}
                className="bg-white dark:bg-gray-800 rounded-lg border p-6 hover:border-[#ffc8dd] transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Mode Icon */}
                  <div className="text-3xl">
                    {q.mode === 'simple' ? '💡' : q.mode === 'practice' ? '📝' : '🎬'}
                  </div>

                  {/* Question Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Link
                          href={`/videos/${q.videos?.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          {q.videos?.title || 'Unknown video'}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">{formatTime(q.created_at)}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {q.mode}
                      </span>
                    </div>

                    <p className="text-lg mb-3">{q.question}</p>

                    {/* Interest Tags (for practice mode) */}
                    {q.interest_tags && q.interest_tags.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {q.interest_tags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Answer Preview */}
                    {q.answer && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {q.answer.content?.substring(0, 200)}...
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/videos/${q.videos?.id}/ask`}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        View Full Answer →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
