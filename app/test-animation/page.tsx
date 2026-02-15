'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function TestAnimationPage() {
  const [context, setContext] = useState('');
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [manimStatus, setManimStatus] = useState<any>(null);

  // Check Manim installation on mount
  // Check Manim installation on mount
  useEffect(() => {
    fetch('/api/generate-animation')
      .then((res) => res.json())
      .then(setManimStatus)
      .catch(console.error);
  }, []);

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
    <div className="min-h-screen bg-[#FAFAFC] text-[#1a1a1a]">
      {/* Header */}
      {/* <header className="fixed top-8 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 lg:px-14">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity gap-0">
          <Image src="/logo.png" alt="Juliette" width={56} height={56} className="flex-shrink-0" />
          <span className="font-['Souvenir',sans-serif] text-3xl font-medium text-[#1a1a1a]">
            Juliette
          </span>
        </Link>
        <Link
          href="/"
          className="py-2 px-4 rounded-lg text-sm font-medium text-[#1a1a1a] border border-gray-200 bg-white/80 hover:bg-white/90 hover:border-[#ffc2d1] transition-colors"
        >
          Back to Home
        </Link>
      </header> */}

      <div className="max-w-4xl mx-auto px-8 pt-32 pb-16">
        {/* Page Title */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl mb-4 text-[#1a1a1a] font-['Souvenir',sans-serif] font-normal tracking-tight">
            🎬 Animation Generator
          </h1>
          <p className="text-gray-600">
            Powered by Claude Opus 4.6 + Manim • Generate educational math animations from text
          </p>
        </div>

        {/* Manim Status */}
        {manimStatus && (
          <div
            className={`mb-6 p-4 rounded-2xl border ${manimStatus.ready
              ? 'bg-green-50 border-green-200'
              : 'bg-[#fff8f0] border-[#ffc8dd]'
              }`}
          >
            <div className="flex items-center gap-2">
              {manimStatus.ready ? (
                <>
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-green-700">
                    {manimStatus.status}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[#e8a87c]">⚠</span>
                  <div className="text-sm text-[#1a1a1a]">
                    <div>{manimStatus.status}</div>
                    <div className="text-xs mt-1 text-gray-600">{manimStatus.message}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Example Buttons */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-3 text-gray-700">Quick Examples:</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {exampleContexts.map((example) => (
              <button
                key={example.name}
                onClick={() => loadExample(example)}
                className="px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl hover:border-[#ffc2d1] hover:shadow-md transition-all text-left"
              >
                <div className="font-medium text-[#1a1a1a]">{example.name}</div>
                <div className="text-xs text-gray-500 mt-1">{example.duration}s</div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 space-y-6">
            <div>
              <label htmlFor="context" className="block text-sm font-medium mb-2 text-gray-700">
                Context / Transcription
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Enter educational content or transcription here..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffc8dd] focus:border-[#ffc8dd] bg-[#FAFAFC] resize-none transition-all"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Max 1000 characters. Be specific about what you want visualized (equations, graphs, shapes, etc.)
              </p>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium mb-2 text-gray-700">
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
                className="w-full accent-[#ffc8dd]"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>8s (Quick)</span>
                <span>40s (Detailed)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !context.trim()}
              className="w-full py-3 px-4 bg-[#ffc8dd] hover:bg-[#ffbcd5] disabled:bg-gray-200 disabled:cursor-not-allowed text-[#1a1a1a] font-medium rounded-xl transition-colors shadow-md"
            >
              {loading ? 'Generating Animation...' : 'Generate Animation'}
            </button>
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-10 text-center">
            <svg
              className="animate-spin h-12 w-12 text-[#ffc8dd] mx-auto mb-4"
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
            <p className="text-[#1a1a1a] mb-2">
              Claude Opus 4.6 is generating animation code...
            </p>
            <p className="text-sm text-gray-500">
              Then Manim will render it • May take 30-60 seconds
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Result */}
        {result && result.success && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-[#1a1a1a]">✓ Animation Generated!</h2>
                {result.usedFallback && (
                  <span className="text-xs bg-[#fff8f0] text-[#e8a87c] px-3 py-1 rounded-full border border-[#ffc8dd]">
                    Fallback Mode
                  </span>
                )}
              </div>

              {/* Video Player */}
              <div className="mb-6">
                <video
                  src={result.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-2xl border border-gray-100"
                />
              </div>

              <div className="flex gap-3">
                <a
                  href={result.videoUrl}
                  download
                  className="px-5 py-2.5 bg-[#ffc8dd] hover:bg-[#ffbcd5] text-[#1a1a1a] font-medium rounded-xl text-sm transition-colors shadow-md"
                >
                  Download Video
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(result.videoUrl)}
                  className="px-5 py-2.5 bg-white border border-gray-200 hover:border-[#ffc2d1] rounded-xl text-sm transition-all"
                >
                  Copy URL
                </button>
              </div>
            </div>

            {/* Generated Code */}
            <details className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
              <summary className="p-6 cursor-pointer font-medium hover:bg-[#FAFAFC] transition-colors text-[#1a1a1a]">
                View Generated Manim Code
              </summary>
              <div className="p-6 border-t border-gray-100">
                <pre className="text-xs overflow-x-auto bg-[#1a1a1a] text-gray-100 p-4 rounded-xl">
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
