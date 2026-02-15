'use client';

import { useState } from 'react';

export default function TestAnimationPage() {
  const [context, setContext] = useState('');
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [manimStatus, setManimStatus] = useState<any>(null);

  // Check Manim installation on mount
  useState(() => {
    fetch('/api/generate-animation')
      .then((res) => res.json())
      .then(setManimStatus)
      .catch(console.error);
  });

  const exampleContexts = [
    {
      name: 'Derivative Definition',
      text: 'The derivative represents the instantaneous rate of change. Graph the function f(x) = x² with a secant line between two points. Animate the second point approaching the first, showing how the secant line becomes the tangent line. Show the formula: f\'(x) = lim(h→0) [f(x+h) - f(x)]/h',
      duration: 15,
    },
    {
      name: 'Pythagorean Theorem',
      text: 'Visual proof of the Pythagorean theorem a² + b² = c². Draw a right triangle with sides labeled a=3, b=4, c=5. Build squares on each side showing their areas: 9, 16, and 25. Visually demonstrate that 9 + 16 = 25 by moving the smaller squares into the larger one.',
      duration: 12,
    },
    {
      name: 'Wave Interference',
      text: 'When two sine waves meet, they undergo superposition. Show two sine waves: y₁ = sin(x) in blue and y₂ = sin(x + π/2) in red, moving toward each other. Animate them overlapping and combining into a resultant wave showing constructive interference where they add together.',
      duration: 18,
    },
    {
      name: 'Quadratic Formula',
      text: 'Solving x² + 5x + 6 = 0 using the quadratic formula. Show the equation, then display the formula x = [-b ± √(b²-4ac)] / 2a. Substitute a=1, b=5, c=6 step by step. Calculate the discriminant: 25-24=1. Show both solutions: x = -2 and x = -3.',
      duration: 20,
    },
    {
      name: 'Vector Addition',
      text: 'Vector addition using the parallelogram method. Draw vector A (3→) in blue and vector B (2↑) in red starting from the origin. Animate creating a parallelogram using these vectors. Show the resultant vector R as the diagonal, with magnitude √(3²+2²) ≈ 3.6.',
      duration: 12,
    },
    {
      name: 'Limit Concept',
      text: 'The limit as x approaches 2 for f(x) = (x²-4)/(x-2). Graph this function showing the hole at x=2. Animate a point moving along the curve toward x=2 from both sides. Show algebraically that it simplifies to x+2, so the limit is 4.',
      duration: 15,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!context.trim()) {
      setError('Please enter some context');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/generate-animation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: context.trim(),
          duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate animation');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate animation');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (example: typeof exampleContexts[0]) => {
    setContext(example.text);
    setDuration(example.duration);
    setError('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🎬 Animation Generator Test</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Powered by Claude Opus 4.6 + Manim • Generate educational math animations from text
          </p>
        </div>

        {/* Manim Status */}
        {manimStatus && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              manimStatus.ready
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {manimStatus.ready ? (
                <>
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span className="text-sm text-green-700 dark:text-green-300">
                    {manimStatus.status}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-yellow-600 dark:text-yellow-400">⚠</span>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <div>{manimStatus.status}</div>
                    <div className="text-xs mt-1">{manimStatus.message}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Example Buttons */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Quick Examples:</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {exampleContexts.map((example) => (
              <button
                key={example.name}
                onClick={() => loadExample(example)}
                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                <div className="font-medium">{example.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{example.duration}s</div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
            <div>
              <label htmlFor="context" className="block text-sm font-medium mb-2">
                Context / Transcription
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Enter educational content or transcription here..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 resize-none"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 1000 characters. Be specific about what you want visualized (equations, graphs, shapes, etc.)
              </p>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium mb-2">
                Target Duration: {duration} seconds
                <span className="text-xs text-gray-500 ml-2">(Shorter is faster to generate)</span>
              </label>
              <input
                type="range"
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="8"
                max="40"
                step="1"
                className="w-full"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>8s (Quick)</span>
                <span>40s (Detailed)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !context.trim()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Generating Animation...' : 'Generate Animation'}
            </button>
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-8 text-center">
            <svg
              className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
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
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Claude Opus 4.6 is generating animation code...
            </p>
            <p className="text-sm text-gray-500">
              Then Manim will render it • May take 30-60 seconds
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success Result */}
        {result && result.success && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">✓ Animation Generated!</h2>
                {result.usedFallback && (
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">
                    Fallback Mode
                  </span>
                )}
              </div>

              {/* Video Player */}
              <div className="mb-4">
                <video
                  src={result.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-lg border"
                />
              </div>

              <div className="flex gap-2">
                <a
                  href={result.videoUrl}
                  download
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  Download Video
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(result.videoUrl)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Copy URL
                </button>
              </div>
            </div>

            {/* Generated Code */}
            <details className="bg-white dark:bg-gray-800 rounded-lg border">
              <summary className="p-4 cursor-pointer font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                View Generated Manim Code
              </summary>
              <div className="p-4 border-t">
                <pre className="text-xs overflow-x-auto bg-gray-900 text-gray-100 p-4 rounded">
                  <code>{result.code}</code>
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
