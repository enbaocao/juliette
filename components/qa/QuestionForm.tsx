'use client';

import { useState } from 'react';

export type QuestionMode = 'simple' | 'practice' | 'animation';

interface QuestionFormProps {
  onSubmit: (question: string, mode: QuestionMode, interestTags?: string[]) => void;
  loading: boolean;
}

export default function QuestionForm({ onSubmit, loading }: QuestionFormProps) {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<QuestionMode>('simple');
  const [interests, setInterests] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const interestTags =
      mode === 'practice' && interests.trim()
        ? interests.split(',').map((t) => t.trim())
        : undefined;

    onSubmit(question, mode, interestTags);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">Response Mode</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setMode('simple')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${mode === 'simple'
                ? 'border-[#ffc8dd] bg-[#ffe5ec] dark:bg-pink-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
          >
            <div className="text-2xl mb-2">💡</div>
            <div className="font-semibold mb-1">Simple Explanation</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Clear explanation with check questions
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('practice')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${mode === 'practice'
                ? 'border-[#ffc8dd] bg-[#ffe5ec] dark:bg-pink-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-semibold mb-1">Practice Problems</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Personalized problems & solutions
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('animation')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${mode === 'animation'
                ? 'border-[#ffc8dd] bg-[#ffe5ec] dark:bg-pink-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
          >
            <div className="text-2xl mb-2">🎬</div>
            <div className="font-semibold mb-1">Animation</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Visual explanation with Manim
            </div>
          </button>
        </div>
      </div>

      {mode === 'practice' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="practice-topic" className="block text-sm font-medium mb-2">
              Topics
            </label>
            <input
              type="text"
              id="practice-topic"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Chain rule, derivatives, limits"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent dark:bg-gray-800"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="interests" className="block text-sm font-medium mb-2">
              Interests
            </label>
            <input
              type="text"
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g., sports, music, gaming"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent dark:bg-gray-800"
              disabled={loading}
            />
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor="question" className="block text-sm font-medium mb-2">
            Your Question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to know about this video?"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent dark:bg-gray-800 resize-none"
            disabled={loading}
            required
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!question.trim() || loading}
        className="w-full py-3 px-4 bg-[#ffc8dd] hover:bg-[#ffbcd5] disabled:bg-gray-400 disabled:cursor-not-allowed text-[#1a1a1a] font-medium rounded-lg transition-colors"
      >
        {loading ? 'Getting Answer...' : mode === 'practice' ? 'Generate Practice Problem' : 'Ask Question'}
      </button>
    </form>
  );
}
