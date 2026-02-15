import { supabaseAdmin } from '@/lib/supabase-server';

export const metadata = {
  title: 'Teacher Dashboard',
  description: 'Track question volume and the topics students are most confused about.',
};

type TopicInsight = {
  topic: string;
  count: number;
};

const STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'between', 'but', 'by', 'can', 'could',
  'did', 'do', 'does', 'for', 'from', 'get', 'had', 'has', 'have', 'how', 'if', 'in', 'into', 'is', 'it',
  'its', 'just', 'me', 'more', 'my', 'of', 'on', 'or', 'our', 'should', 'so', 'some', 'than', 'that',
  'the', 'their', 'them', 'there', 'these', 'they', 'this', 'to', 'up', 'us', 'was', 'we', 'what',
  'when', 'where', 'which', 'who', 'why', 'with', 'would', 'you', 'your', 'i', 'im', 'explain', 'help',
  'understand', 'difference', 'mean', 'means', 'work', 'works', 'working', 'using', 'use', 'used',
]);

function toTitleCase(text: string) {
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function deriveConfusionTopics(questions: string[]): TopicInsight[] {
  const unigramCounts = new Map<string, number>();
  const bigramCounts = new Map<string, number>();

  for (const question of questions) {
    const tokens = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

    for (const token of tokens) {
      unigramCounts.set(token, (unigramCounts.get(token) || 0) + 1);
    }

    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
    }
  }

  const topics: TopicInsight[] = [];

  const topBigrams = [...bigramCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, count]) => ({ topic: toTitleCase(topic), count }));

  topics.push(...topBigrams);

  if (topics.length < 8) {
    const existing = new Set(topics.map((t) => t.topic.toLowerCase()));
    const topUnigrams = [...unigramCounts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic: toTitleCase(topic), count }));

    for (const item of topUnigrams) {
      if (!existing.has(item.topic.toLowerCase())) {
        topics.push(item);
      }

      if (topics.length >= 8) {
        break;
      }
    }
  }

  return topics;
}

async function getTeacherInsights() {
  const { count: totalQuestions } = await supabaseAdmin
    .from('questions')
    .select('*', { count: 'exact', head: true });

  const { data: questionRows } = await supabaseAdmin
    .from('questions')
    .select('question')
    .not('question', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500);

  const questionTexts = (questionRows || [])
    .map((row) => row.question)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return {
    totalQuestions: totalQuestions || 0,
    topics: deriveConfusionTopics(questionTexts),
  };
}

export default async function TeacherDashboard() {
  const insights = await getTeacherInsights();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600 mt-2">Question volume and where students are getting stuck.</p>

        <div className="mt-8 bg-white border rounded-xl p-8">
          <p className="text-sm uppercase tracking-wide text-gray-500">Student Questions Asked</p>
          <p className="text-5xl font-bold text-gray-900 mt-3">{insights.totalQuestions}</p>
        </div>

        <div className="mt-8 bg-white border rounded-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900">Topics Students Are Confused About</h2>

          {insights.topics.length === 0 ? (
            <p className="text-gray-600 mt-4">No clear topic signals yet. This list will populate as students ask more questions.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {insights.topics.map((topic) => (
                <li key={topic.topic} className="flex items-center justify-between border rounded-lg px-4 py-3">
                  <span className="text-gray-900 font-medium">{topic.topic}</span>
                  <span className="text-sm text-gray-500">{topic.count} mentions</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
