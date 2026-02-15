'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Reference {
  start_sec: number;
  end_sec: number;
  text: string;
}

interface Answer {
  content: string;
  references?: Reference[];
  animation_spec?: any;
  animation_status?: string;
  animation_url?: string;
}

interface AnswerDisplayProps {
  answer: Answer;
  mode: string;
  question?: string;
  interestTags?: string[];
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function normalizeMathDelimiters(content: string): string {
  return content
    .replace(/```math\s*([\s\S]*?)```/g, (_, expr) => `\n$$\n${expr.trim()}\n$$\n`)
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_, expr) => `\n$$\n${expr.trim()}\n$$\n`)
    .replace(/\\\((.*?)\\\)/g, (_, expr) => `$${expr.trim()}$`);
}

function extractTopics(question: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i', 'in', 'is',
    'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'what', 'with', 'you', 'your',
  ]);

  const counts = new Map<string, number>();
  question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

export default function AnswerDisplay({ answer, mode, question = '', interestTags = [] }: AnswerDisplayProps) {
  const renderedContent = normalizeMathDelimiters(answer.content || '');
  const topics = extractTopics(question);

  if (mode === 'practice') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Topics</p>
            <div className="flex flex-wrap gap-2">
              {topics.length > 0 ? (
                topics.map((topic) => (
                  <span key={topic} className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border rounded-md">
                    {topic}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">No topics detected yet</span>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {interestTags.length > 0 ? (
                interestTags.map((interest) => (
                  <span
                    key={interest}
                    className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border rounded-md"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">No interests provided</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border min-h-[420px]">
            <h3 className="font-semibold mb-4 text-lg">Generated Problem</h3>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
                }}
              >
                {renderedContent}
              </ReactMarkdown>
            </div>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border min-h-[420px]">
            <h3 className="font-semibold mb-4 text-lg">Your Answer</h3>
            <textarea
              placeholder="Work through the problem here..."
              className="w-full h-[340px] resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-3">
              Your response is local-only for now (not saved yet).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Answer Content */}
      <div className="prose dark:prose-invert max-w-none">
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
            }}
          >
            {renderedContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Animation Status */}
      {mode === 'animation' && answer.animation_status === 'rendering' && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-yellow-600"
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
            <span className="text-sm text-yellow-700 dark:text-yellow-400">
              Animation is being rendered... This may take a few minutes.
            </span>
          </div>
        </div>
      )}

      {/* Animation Video */}
      {mode === 'animation' && answer.animation_url && (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border">
          <h3 className="font-semibold mb-3">Generated Animation</h3>
          <video
            src={answer.animation_url}
            controls
            className="w-full rounded-lg"
          />
        </div>
      )}

      {/* Video References */}
      {answer.references && answer.references.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Related Video Segments</h3>
          <div className="space-y-2">
            {answer.references.map((ref, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                    {formatTime(ref.start_sec)} - {formatTime(ref.end_sec)}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{ref.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
