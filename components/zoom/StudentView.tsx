'use client';

import { useState, useEffect } from 'react';
import { ZoomMeetingContext } from '@/hooks/useZoomApp';
import { LiveSession, Question } from '@/lib/types';
import ManimVideoTab from './ManimVideoTab';

interface StudentViewProps {
  context: ZoomMeetingContext;
  session: LiveSession | null;
}

type TabType = 'questions' | 'manim' | 'personalized';

export default function StudentView({ context, session }: StudentViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('questions');
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
      return (
        <div className="flex flex-col h-full">
          {/* Session Info */}
          <div className="bg-[#ffe5ec] border-b border-[#ffc2d1] p-3">
            <p className="text-sm font-medium text-[#1a1a1a]">🟢 Live Session Active</p>
            {session.title && <p className="text-xs text-gray-700 mt-1">{session.title}</p>}
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('questions')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'questions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                💬 Q&A
              </button>
              <button
                onClick={() => setActiveTab('manim')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'manim' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                🎬 Animations
              </button>
              <button
                onClick={() => setActiveTab('personalized')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'personalized' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                ✨ Personalized
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'questions' && (
              <div className="p-4">
                {/* Ask form */}
                <div className="border-b border-gray-200 p-4 bg-white mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Ask a Question</h3>

                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What would you like to know about this lecture?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
                    rows={3}
                  />

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Response Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setMode('simple')}
                        className={`px-3 py-2 text-xs rounded-lg border ${mode === 'simple' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        Simple
                      </button>
                      <button
                        onClick={() => setMode('practice')}
                        className={`px-3 py-2 text-xs rounded-lg border ${mode === 'practice' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        Practice
                      </button>
                      <button
                        onClick={() => setMode('animation')}
                        className={`px-3 py-2 text-xs rounded-lg border ${mode === 'animation' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        Animation
                      </button>
                    </div>
                  </div>

                  {mode === 'practice' && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Interests (comma-separated)</label>
                      <input
                        type="text"
                        value={interestTags}
                        onChange={(e) => setInterestTags(e.target.value)}
                        placeholder="e.g., sports, music, cooking"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAsking ? 'Asking...' : 'Ask Question'}
                  </button>
                </div>

                {/* Recent Questions */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Your Questions</h3>

                  {recentQuestions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No questions yet. Be the first to ask!</p>
                  ) : (
                    <div className="space-y-3">
                      {recentQuestions.map((q) => (
                        <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900 flex-1">Q: {q.question}</p>
                            <span
                              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${q.mode === 'simple' ? 'bg-blue-100 text-blue-800' : q.mode === 'practice' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                }`}
                            >
                              {q.mode}
                            </span>
                          </div>

                          {q.answer ? (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-600 mb-1 font-medium">AI Answer:</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.answer.content}</p>

                              {q.answer.references && q.answer.references.length > 0 && (
                                <div className="mt-2 text-xs text-gray-500">
                                  <p className="font-medium">References:</p>
                                  {q.answer.references.map((ref, idx) => (
                                    <p key={idx}>
                                      • {Math.floor(ref.start_sec / 60)}:{String(Math.floor(ref.start_sec % 60)).padStart(2, '0')}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-2" />
                              Generating answer...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'manim' && <ManimVideoTab context={context} session={session} />}

            {activeTab === 'personalized' && (
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Learning</h3>
                  <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                    Get questions and practice problems tailored to your learning style and interests. Based on today&apos;s discussion: &quot;{session?.title || 'Current lecture'}&quot;
                  </p>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md mx-auto text-left">
                    <p className="text-xs text-gray-500 mb-2">Coming Soon:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Interest-based problem generation</li>
                      <li>• Adaptive difficulty levels</li>
                      <li>• Learning style preferences</li>
                      <li>• Progress tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

