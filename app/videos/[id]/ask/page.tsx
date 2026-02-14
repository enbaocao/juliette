'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import QuestionForm, { QuestionMode } from '@/components/qa/QuestionForm';
import AnswerDisplay from '@/components/qa/AnswerDisplay';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AskPage({ params }: PageProps) {
  const { id: videoId } = use(params);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState<any>(null);
  const [currentMode, setCurrentMode] = useState<QuestionMode>('simple');

  const handleSubmit = async (
    question: string,
    mode: QuestionMode,
    interestTags?: string[]
  ) => {
    setLoading(true);
    setError('');
    setAnswer(null);
    setCurrentMode(mode);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          question,
          mode,
          interestTags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/videos/${videoId}`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm mb-2 inline-block"
          >
            ← Back to Video
          </Link>
          <h1 className="text-3xl font-bold mb-2">Ask Questions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a response mode and ask your question about the video
          </p>
        </div>

        {/* Question Form */}
        <div className="mb-8">
          <QuestionForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-900">
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
              Analyzing video and generating response...
            </p>
          </div>
        )}

        {/* Answer Display */}
        {answer && !loading && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Answer</h2>
            <AnswerDisplay answer={answer} mode={currentMode} />
          </div>
        )}
      </div>
    </div>
  );
}
