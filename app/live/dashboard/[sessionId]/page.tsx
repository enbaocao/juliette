'use client';

import { use, useEffect, useState } from 'react';
import { LiveSession, Question } from '@/lib/types';

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default function LiveDashboardPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { sessionId } = resolvedParams;

  const [session, setSession] = useState<LiveSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load session and questions
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load session details (we'll need a new API endpoint)
        const sessionRes = await fetch(`/api/live-sessions/${sessionId}`);
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSession(sessionData.session);
        }

        // Load questions
        const questionsRes = await fetch(
          `/api/live-sessions/questions?session_id=${sessionId}`
        );
        if (questionsRes.ok) {
          const questionsData = await questionsRes.json();
          setQuestions(questionsData.questions);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Poll for updates every 3 seconds
    const interval = setInterval(async () => {
      try {
        const questionsRes = await fetch(
          `/api/live-sessions/questions?session_id=${sessionId}`
        );
        if (questionsRes.ok) {
          const questionsData = await questionsRes.json();
          setQuestions(questionsData.questions);
        }
      } catch (err) {
        console.error('Error polling questions:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error || 'Session not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Live Session Dashboard
              </h1>
              {session.title && (
                <p className="text-gray-600 mt-1">{session.title}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  session.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    session.status === 'active' ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                ></span>
                {session.status === 'active' ? 'Live' : 'Ended'}
              </div>
              <div className="text-sm text-gray-600">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Questions Yet
            </h2>
            <p className="text-gray-600">
              Questions from students will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {q.question}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          q.mode === 'simple'
                            ? 'bg-blue-100 text-blue-800'
                            : q.mode === 'practice'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {q.mode}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(q.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* AI Answer */}
                {q.answer ? (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      AI Response:
                    </p>
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {q.answer.content}
                    </p>

                    {/* References */}
                    {q.answer.references && q.answer.references.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs font-medium text-blue-900 mb-2">
                          Referenced from video:
                        </p>
                        <div className="space-y-1">
                          {q.answer.references.map((ref, idx) => (
                            <div key={idx} className="text-xs text-blue-700">
                              • {Math.floor(ref.start_sec / 60)}:
                              {String(Math.floor(ref.start_sec % 60)).padStart(
                                2,
                                '0'
                              )}{' '}
                              - {ref.text.substring(0, 100)}...
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interest Tags (for practice mode) */}
                    {q.interest_tags && q.interest_tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-600">
                          Student interests:
                        </span>
                        {q.interest_tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-sm text-gray-600">
                      Generating AI response...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
