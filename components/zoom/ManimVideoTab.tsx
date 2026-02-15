'use client';

import { useState, useEffect } from 'react';
import { ZoomMeetingContext } from '@/hooks/useZoomApp';
import { LiveSession } from '@/lib/types';

interface ManimVideoTabProps {
  context: ZoomMeetingContext;
  session: LiveSession | null;
}

interface GeneratedAnimation {
  id: string;
  prompt: string;
  videoUrl: string;
  duration: number;
  timestamp: Date;
  usedFallback?: boolean;
}

export default function ManimVideoTab({ context, session }: ManimVideoTabProps) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(12);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAnimations, setGeneratedAnimations] = useState<GeneratedAnimation[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState<GeneratedAnimation | null>(null);

  // Suggest context-aware prompts based on session
  const suggestedPrompts = [
    {
      label: 'Visualize Current Topic',
      prompt: session?.title
        ? `Create an animation explaining: ${session.title}. Use relevant mathematical notation and diagrams.`
        : 'Explain the main concept from today\'s discussion with visual examples.',
      duration: 15,
    },
    {
      label: 'Quick Concept',
      prompt: 'Show a simple visual representation of the key formula or relationship we just discussed.',
      duration: 10,
    },
    {
      label: 'Step-by-Step Process',
      prompt: 'Break down the problem-solving process we covered into clear visual steps.',
      duration: 18,
    },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSelectedAnimation(null);

    try {
      // Add meeting context to the prompt
      const contextualPrompt = session?.title
        ? `Context: We're in a live lecture about "${session.title}". ${prompt}`
        : prompt;

      const response = await fetch('/api/generate-animation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: contextualPrompt,
          duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate animation');
      }

      const data = await response.json();

      const newAnimation: GeneratedAnimation = {
        id: Date.now().toString(),
        prompt: prompt,
        videoUrl: data.videoUrl,
        duration: data.duration || duration,
        timestamp: new Date(),
        usedFallback: data.usedFallback,
      };

      setGeneratedAnimations((prev) => [newAnimation, ...prev]);
      setSelectedAnimation(newAnimation);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate animation');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadSuggestedPrompt = (suggested: typeof suggestedPrompts[0]) => {
    setPrompt(suggested.prompt);
    setDuration(suggested.duration);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Generator Section */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-xl">🎬</span>
          Generate Manim Animation
        </h3>

        {/* Context Info */}
        {session?.title && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
            <p className="text-xs text-blue-900">
              <strong>Lecture Context:</strong> {session.title}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Animations will be generated with this context in mind
            </p>
          </div>
        )}

        {/* Suggested Prompts */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Quick Suggestions:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {suggestedPrompts.map((suggested, idx) => (
              <button
                key={idx}
                onClick={() => loadSuggestedPrompt(suggested)}
                disabled={isGenerating}
                className="px-2 py-1.5 text-xs bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 text-purple-900 disabled:opacity-50"
              >
                {suggested.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to visualize... Be specific about equations, graphs, shapes, or processes."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none mb-3 text-sm"
          rows={3}
          disabled={isGenerating}
        />

        {/* Duration Slider */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Duration: {duration}s {duration <= 10 ? '(Quick)' : duration >= 18 ? '(Detailed)' : ''}
          </label>
          <input
            type="range"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="8"
            max="25"
            step="1"
            className="w-full"
            disabled={isGenerating}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>8s</span>
            <span>25s</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating... (30-60s)
            </span>
          ) : (
            '🎬 Generate Animation'
          )}
        </button>
      </div>

      {/* Generated Animations List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isGenerating && !selectedAnimation && (
          <div className="bg-white border border-purple-200 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-700 font-medium mb-1">
              Claude Opus 4.6 is generating code...
            </p>
            <p className="text-xs text-gray-500">
              Then Manim will render it • This may take 30-60 seconds
            </p>
          </div>
        )}

        {selectedAnimation && (
          <div className="bg-white border border-purple-200 rounded-lg overflow-hidden mb-4">
            <div className="bg-purple-50 border-b border-purple-200 p-2">
              <p className="text-xs font-medium text-purple-900 flex items-center justify-between">
                <span>✨ Latest Animation</span>
                {selectedAnimation.usedFallback && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                    Fallback
                  </span>
                )}
              </p>
            </div>
            <div className="p-3">
              <p className="text-sm text-gray-700 mb-2">{selectedAnimation.prompt}</p>
              <video
                src={selectedAnimation.videoUrl}
                controls
                autoPlay
                loop
                className="w-full rounded border border-gray-200 mb-2"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{selectedAnimation.duration}s</span>
                <a
                  href={selectedAnimation.videoUrl}
                  download
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        )}

        {generatedAnimations.length > 0 && !isGenerating && (
          <>
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">
              Previous Animations ({generatedAnimations.length})
            </h4>
            <div className="space-y-2">
              {generatedAnimations.slice(1).map((anim) => (
                <div
                  key={anim.id}
                  onClick={() => setSelectedAnimation(anim)}
                  className="bg-white border border-gray-200 rounded-lg p-2 cursor-pointer hover:border-purple-400 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-16 h-12 bg-purple-100 rounded flex items-center justify-center text-xl">
                      🎬
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {anim.prompt}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {anim.duration}s • {new Date(anim.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {generatedAnimations.length === 0 && !isGenerating && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Animations Yet
            </h3>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              Generate your first animation to visualize concepts from today's lecture!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
