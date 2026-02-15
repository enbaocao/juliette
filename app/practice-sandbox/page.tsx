'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const DEFAULT_SYSTEM_PROMPT = `You are an educational AI assistant. You generate ONE practice problem per request — never more.

HARD RULE: Your entire response contains exactly ONE "## Problem:" header. After the Constraints section, STOP. Do not generate hints, solutions, follow-up problems, or additional content of any kind.

RESPONSE FORMAT — follow this structure exactly, with no preamble or commentary:

## Problem: [Concise Descriptive Title]

[2-4 sentence problem statement. Weave in the student's interests as narrative context, not decoration.]

**Example:**
- **Input:** [sample values]
- **Output:** [expected result]
- **Explanation:** [1-2 sentence walkthrough]

**Constraints:**
- [Assumptions or bounds, one per line]

[STOP HERE. Do not continue. No hints, no solutions, no follow-up.]

---

MATH RENDERING — non-negotiable:
- Inline math: single dollar signs. Write $y = mx + b$, not y = mx + b.
- Display math: double dollar signs on their own line:
  $$m = \frac{y_2 - y_1}{x_2 - x_1}$$
- EVERY variable, number-with-units, and equation MUST be wrapped in $ signs. No exceptions. "$x = 15$ hours", not "x = 15 hours".
- NEVER use \(...\), \[...\], backticks, or bare plaintext for any mathematical expression.
- NEVER duplicate an equation (e.g., $y = 1.5x + 10y = 1.5x + 10$ is WRONG — write it once).

NEVER INCLUDE: Hints, solutions, answer keys, or any guidance on how to solve the problem.

DIFFICULTY: Medium by default. Should require genuine multi-step reasoning, not a single substitution.

STUDENT INTERESTS (use as narrative context): {interests}
`;

export default function PracticeSandbox() {
  const [topic, setTopic] = useState('');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [problems, setProblems] = useState<string | null>(null);
  const [solution, setSolution] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setProblems(null);
    setSolution('');

    try {
      const interestTags = interests.trim()
        ? interests.split(',').map((t) => t.trim())
        : [];

      const response = await fetch('/api/practice-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          interestTags,
          systemPrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate practice problems');
      }

      setProblems(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate practice problems');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm mb-1 inline-block"
          >
            ← Home
          </Link>
          <h1 className="text-2xl font-bold">📝 Practice Problem Sandbox</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Test personalized practice problems with interest-based customization
          </p>
        </div>
      </div>

      {/* System Prompt Editor */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <button
            type="button"
            onClick={() => setShowPromptEditor(!showPromptEditor)}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
          >
            {showPromptEditor ? '▼' : '▶'} Edit System Prompt
          </button>
          {showPromptEditor && (
            <div className="mt-2">
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 font-mono text-xs"
                placeholder="System prompt..."
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                  className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Bar - Input Controls */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Topic (e.g., linear regression, derivatives)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 text-sm"
                disabled={loading}
                required
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Interests (optional, e.g., basketball, music)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 text-sm"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={!topic.trim() || loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors whitespace-nowrap text-sm"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </form>
          {error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Split Screen */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-180px)]">
          {/* Left Side - Problem Display */}
          <div className="border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
            {problems ? (
              <div className="p-6">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {problems}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm">Generate a problem to start practicing</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Solution Input */}
          <div className="flex flex-col bg-gray-50 dark:bg-gray-900">
            {problems ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Your Solution
                  </h3>
                </div>
                <div className="flex-1 flex flex-col p-4">
                  <textarea
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Type your solution here... Show your work step by step."
                    className="w-full flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none font-mono text-sm"
                  />
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {solution.length} characters
                    </span>
                    <button
                      onClick={() => setSolution('')}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <p className="text-sm">Your solution will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
