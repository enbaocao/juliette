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

export default function AnswerDisplay({ answer, mode }: AnswerDisplayProps) {
  const renderedContent = normalizeMathDelimiters(answer.content || '');

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
