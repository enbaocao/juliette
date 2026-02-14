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
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              mode === 'simple'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
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
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              mode === 'practice'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
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
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              mode === 'animation'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
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

      {/* Interest Tags (only for practice mode) */}
      {mode === 'practice' && (
        <div>
          <label htmlFor="interests" className="block text-sm font-medium mb-2">
            Your Interests (optional)
            <span className="text-xs text-gray-500 ml-2">
              e.g., "sports, music, cooking"
            </span>
          </label>
          <input
            type="text"
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="Enter topics you're interested in, separated by commas"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            We'll use these to create more relatable practice problems
          </p>
        </div>
      )}

      {/* Question Input */}
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
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none"
          disabled={loading}
          required
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!question.trim() || loading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {loading ? 'Getting Answer...' : 'Ask Question'}
      </button>
    </form>
  );
}
