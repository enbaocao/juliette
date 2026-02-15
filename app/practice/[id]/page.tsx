'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { supabase } from '@/lib/supabase';

type PracticeQuestionRow = {
  id: string;
  content: string;
  created_at?: string;
};

export default function PracticeQuestionPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState<PracticeQuestionRow | null>(null);
  const [solution, setSolution] = useState('');

  const tableName = useMemo(() => {
    // You can override without redeploying the page UI.
    // Example: NEXT_PUBLIC_PRACTICE_QUESTIONS_TABLE=practice_questions
    return process.env.NEXT_PUBLIC_PRACTICE_QUESTIONS_TABLE || 'practice_questions';
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;

      setLoading(true);
      setError('');
      setQuestion(null);

      const { data, error } = await supabase
        .from(tableName)
        .select('id, content, created_at')
        .eq('id', id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Question not found');
        setLoading(false);
        return;
      }

      setQuestion(data as PracticeQuestionRow);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, tableName]);

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
          <h1 className="text-2xl font-bold">📝 Practice Problem</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loaded from Supabase (id: <span className="font-mono">{id}</span>)
          </p>
        </div>
      </div>

      {/* Main Content - Split Screen */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-120px)]">
          {/* Left Side - Problem Display */}
          <div className="border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <p className="text-sm">Loading question…</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              </div>
            ) : question ? (
              <div className="p-6">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {question.content}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <p className="text-sm">No question loaded</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Solution Input */}
          <div className="flex flex-col bg-gray-50 dark:bg-gray-900">
            {question ? (
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
                    className="w-full flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent dark:bg-gray-800 resize-none font-mono text-sm"
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
