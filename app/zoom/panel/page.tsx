'use client';

import { useState, useEffect } from 'react';
import QuestionForm, { QuestionMode } from '@/components/qa/QuestionForm';
import AnswerDisplay from '@/components/qa/AnswerDisplay';

export default function ZoomPanelPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<any>(null);
  const [currentMode, setCurrentMode] = useState<QuestionMode>('simple');
  const [error, setError] = useState('');

  // Fetch available videos
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos/list');
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
        if (data.videos?.length > 0) {
          setSelectedVideo(data.videos[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  };

  const handleSubmit = async (
    question: string,
    mode: QuestionMode,
    interestTags?: string[]
  ) => {
    if (!selectedVideo) {
      setError('Please select a video first');
      return;
    }

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
          videoId: selectedVideo,
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
    <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 overflow-y-auto">
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="text-4xl mb-2">🎓</div>
          <h1 className="text-2xl font-bold mb-1">Juliette in Zoom</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ask questions about your class videos
          </p>
        </div>

        {/* Video Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Video</label>
          <select
            value={selectedVideo}
            onChange={(e) => setSelectedVideo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            disabled={loading}
          >
            {videos.length === 0 ? (
              <option>No videos available</option>
            ) : (
              videos.map((video) => (
                <option key={video.id} value={video.id}>
                  {video.title}
                  {video.status !== 'transcribed' && ' (Processing...)'}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Question Form */}
        <div className="mb-6">
          <QuestionForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center p-12 border rounded-lg bg-white dark:bg-gray-800">
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
            <p className="text-gray-600 dark:text-gray-400">Getting your answer...</p>
          </div>
        )}

        {/* Answer */}
        {answer && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-bold mb-4">Answer</h2>
            <AnswerDisplay answer={answer} mode={currentMode} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Powered by Juliette AI • claude.com/code</p>
        </div>
      </div>
    </div>
  );
}
