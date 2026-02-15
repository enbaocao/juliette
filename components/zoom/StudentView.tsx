'use client';

import { useState, useEffect } from 'react';
import { ZoomMeetingContext } from '@/hooks/useZoomApp';
import { LiveSession, Question } from '@/lib/types';

interface StudentViewProps {
  context: ZoomMeetingContext;
  session: LiveSession | null;
}

export default function StudentView({ context, session }: StudentViewProps) {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<'simple' | 'practice' | 'animation'>('simple');
  const [interestTags, setInterestTags] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Poll for recent questions
  useEffect(() => {
    if (!session) return;

    const loadQuestions = async () => {
      try {
        const response = await fetch(
          `/api/live-sessions/questions?session_id=${session.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setRecentQuestions(data.questions);
        }
      } catch (err) {
        console.error('Error loading questions:', err);
      }
    };

    loadQuestions();
    const interval = setInterval(loadQuestions, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [session]);

  const handleAskQuestion = async () => {
    if (!question.trim() || !session) return;

    setIsAsking(true);
    setError(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: session.video_id || null,
          question: question.trim(),
          mode,
          interest_tags: interestTags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t),
          live_session_id: session.id,
          is_live: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to ask question');
      }

      const data = await response.json();

      // Add the new question to the top of the list
      setRecentQuestions((prev) => [data.question, ...prev]);

      // Clear form
      setQuestion('');
      setInterestTags('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ask question');
    } finally {
      setIsAsking(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">
            No Active Session
          </h2>
          <p className="text-gray-600">
            The teacher hasn't started a live session yet. When they do, you'll be able to ask
            questions here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Session Info */}
      <div className="bg-[#ffe5ec] border-b border-[#ffc2d1] p-3">
        <p className="text-sm font-medium text-[#1a1a1a]">
          🟢 Live Session Active
        </p>
        {session.title && (
          <p className="text-xs text-gray-700 mt-1">{session.title}</p>
        )}
      </div>

      {/* Question Input */}
      <div className="border-b border-gray-100 p-4 bg-white">
        <h3 className="font-semibold text-[#1a1a1a] mb-3">Ask a Question</h3>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to know about this lecture?"
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent resize-none mb-3 transition-all"
          rows={3}
        />

        {/* Mode Selection */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Response Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMode('simple')}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                mode === 'simple'
                  ? 'bg-[#ffc8dd] text-[#1a1a1a] border-[#ffc2d1] font-medium'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#ffc2d1]'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setMode('practice')}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                mode === 'practice'
                  ? 'bg-[#ffc8dd] text-[#1a1a1a] border-[#ffc2d1] font-medium'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#ffc2d1]'
              }`}
            >
              Practice
            </button>
            <button
              onClick={() => setMode('animation')}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                mode === 'animation'
                  ? 'bg-[#ffc8dd] text-[#1a1a1a] border-[#ffc2d1] font-medium'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#ffc2d1]'
              }`}
            >
              Animation
            </button>
          </div>
        </div>

        {/* Interest Tags (for practice mode) */}
        {mode === 'practice' && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Interests (comma-separated)
            </label>
            <input
              type="text"
              value={interestTags}
              onChange={(e) => setInterestTags(e.target.value)}
              placeholder="e.g., sports, music, cooking"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent transition-all"
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleAskQuestion}
          disabled={!question.trim() || isAsking}
          className="w-full px-4 py-2 bg-[#ffc8dd] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#ffbcd5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isAsking ? 'Asking...' : 'Ask Question'}
        </button>
      </div>

      {/* Recent Questions Feed */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#FAFAFC]">
        <h3 className="font-semibold text-[#1a1a1a] mb-3">Your Questions</h3>

        {recentQuestions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No questions yet. Be the first to ask!
          </p>
        ) : (
          <div className="space-y-3">
            {recentQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-[#1a1a1a] flex-1">
                    Q: {q.question}
                  </p>
                  <span
                    className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#ffe5ec] text-gray-700 border border-[#ffc2d1]"
                  >
                    {q.mode}
                  </span>
                </div>

                {q.answer && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 mb-1 font-medium">
                      AI Answer:
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {q.answer.content}
                    </p>

                    {q.answer.references && q.answer.references.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <p className="font-medium">References:</p>
                        {q.answer.references.map((ref, idx) => (
                          <p key={idx}>
                            • {Math.floor(ref.start_sec / 60)}:
                            {String(Math.floor(ref.start_sec % 60)).padStart(2, '0')}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!q.answer && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#ffc8dd] mr-2"></div>
                    Generating answer...
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
