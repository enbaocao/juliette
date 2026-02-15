"use client";

import { useCallback, useEffect, useState } from "react";
import { ZoomMeetingContext } from "@/hooks/useZoomApp";
import { LiveSession, Question, Video } from "@/lib/types";
import ManimVideoTab from "./ManimVideoTab";

type GeneratedAnimation = {
  id: string;
  prompt: string;
  videoUrl: string;
  duration: number;
  timestamp: Date;
  usedFallback?: boolean;
};

interface StudentViewProps {
  context: ZoomMeetingContext;
  session: LiveSession | null;
}

type TabType = "questions" | "manim" | "personalized";

export default function StudentView({ context, session }: StudentViewProps) {
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("questions");
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"simple" | "practice" | "animation">(
    "simple",
  );
  const [interestTags, setInterestTags] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  // Persist Manim tab state across tab switches
  const [manimAnimations, setManimAnimations] = useState<GeneratedAnimation[]>([]);
  const [selectedManim, setSelectedManim] = useState<GeneratedAnimation | null>(null);
  const [manimHasUnseen, setManimHasUnseen] = useState(false);

  const handleManimGenerated = useCallback(
    (anim: GeneratedAnimation) => {
      setManimAnimations((prev) => [anim, ...prev]);
      setSelectedManim(anim);
      if (activeTab !== "manim") {
        setManimHasUnseen(true);
      }
    },
    [activeTab],
  );

  const handleSelectManim = useCallback((anim: GeneratedAnimation | null) => {
    setSelectedManim(anim);
  }, []);

  // If the user switches sessions in the panel, reset confirmation.
  useEffect(() => {
    setHasConfirmed(false);
    setManimAnimations([]);
    setSelectedManim(null);
    setManimHasUnseen(false);
  }, [session?.id]);

  // Load video data if session has video_id
  useEffect(() => {
    if (!session?.video_id) {
      setVideo(null);
      return;
    }

    const loadVideo = async () => {
      setIsLoadingVideo(true);
      try {
        const response = await fetch(`/api/videos/${session.video_id}`);
        if (response.ok) {
          const data = await response.json();
          setVideo(data.video);
        }
      } catch (err) {
        console.error("Error loading video:", err);
      } finally {
        setIsLoadingVideo(false);
      }
    };

    loadVideo();
    // Poll for video status updates
    const interval = setInterval(loadVideo, 5000);
    return () => clearInterval(interval);
  }, [session?.video_id]);

  // Poll for recent questions
  useEffect(() => {
    if (!session) return;

    const loadQuestions = async () => {
      try {
        const response = await fetch(
          `/api/live-sessions/questions?session_id=${session.id}`,
        );
        if (response.ok) {
          const data = await response.json();
          setRecentQuestions(data.questions);
        }
      } catch (err) {
        console.error("Error loading questions:", err);
      }
    };

    loadQuestions();
    const interval = setInterval(loadQuestions, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [session]);

  const handleAskQuestion = async () => {
    if (!question.trim() || !session) return;

    setIsAsking(true);
    setError(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: session.video_id || null,
          question: question.trim(),
          mode,
          interest_tags: interestTags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t),
          live_session_id: session.id,
          is_live: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to ask question");
      }

      const data = await response.json();

      // Add the new question to the top of the list
      setRecentQuestions((prev) => [data.question, ...prev]);

      // Clear form
      setQuestion("");
      setInterestTags("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ask question");
    } finally {
      setIsAsking(false);
    }
  };

  // If no active session yet, show a confirmation / waiting screen (no permissions required)
  if (!session) {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFC]">
        <div className="bg-white border-b border-gray-100 p-4 shadow-sm">
          <h1 className="text-xl font-['Souvenir',sans-serif] font-medium text-[#1a1a1a]">
            Juliette
          </h1>
          <p className="text-sm text-gray-600 mt-1">📚 Student View</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🔗</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  Connect to your class session
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Pick a live session in the panel to start asking questions.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-[#FAFAFC] px-4 py-3">
              <p className="text-sm text-gray-800 font-medium">No session selected</p>
              <p className="text-xs text-gray-600 mt-1">
                If you don&apos;t see your teacher&apos;s session, ask them to start one on the website.
              </p>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              This panel never asks for microphone or screen permissions.
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-gray-100 p-2 text-center">
          <p className="text-xs text-gray-500">Powered by Juliette AI • {context.userName}</p>
        </div>
      </div>
    );
  }

  // Show processing state if video is being transcribed
  if (session?.video_id && video && video.status !== "transcribed") {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-[#ffe5ec] border-b border-[#ffc2d1] p-3">
          <p className="text-sm font-medium text-[#1a1a1a]">
            🟢 Live Session Active
          </p>
          {session?.title && (
            <p className="text-xs text-gray-700 mt-1">{session.title}</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Processing Your Recording
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We&apos;re transcribing your lecture recording. This usually takes
              1-2 minutes for every 10 minutes of content.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800 font-medium">
                Status: {video.status}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                You&apos;ll be able to ask questions as soon as transcription is
                complete!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If session is active but teacher hasn't linked a transcript/video yet, show waiting state.
  if (session && !session.video_id) {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFC]">
        <div className="bg-white border-b border-gray-100 p-4 shadow-sm">
          <h1 className="text-xl font-['Souvenir',sans-serif] font-medium text-[#1a1a1a]">
            Juliette
          </h1>
          <p className="text-sm text-gray-600 mt-1">📚 Student View</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🟢</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Live session active</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Your teacher has started the session. We&apos;re waiting for the first transcript to be uploaded.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-100 bg-[#FAFAFC] p-4">
              <div className="text-xs text-gray-500">Meeting ID</div>
              <div className="mt-1 font-mono text-lg text-gray-900">
                {session.meeting_number || "—"}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                <p className="text-sm text-blue-900 font-medium">
                  Waiting for transcript…
                </p>
              </div>
              <p className="text-xs text-blue-800 mt-1">
                Once your teacher stops recording on the website, you&apos;ll be able to ask questions.
              </p>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              No microphone or screen permissions required.
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-gray-100 p-2 text-center">
          <p className="text-xs text-gray-500">Powered by Juliette AI • {context.userName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Session Info */}
      <div className="bg-[#ffe5ec] border-b border-[#ffc2d1] p-3">
        <p className="text-sm font-medium text-[#1a1a1a]">
          🟢 Live Session Active
        </p>
        {session?.title && (
          <p className="text-xs text-gray-700 mt-1">{session.title}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "questions"
                ? "border-[#ffc8dd] text-[#1a1a1a]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            💬 Q&A
          </button>

          <button
            onClick={() => {
              setActiveTab("manim");
              setManimHasUnseen(false);
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "manim"
                ? "border-[#ffc8dd] text-[#1a1a1a]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span>🎬 Manim</span>
              {manimHasUnseen ? (
                <span className="inline-block h-2 w-2 rounded-full bg-[#ff4d6d]" />
              ) : null}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("personalized")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "personalized"
                ? "border-[#ffc8dd] text-[#1a1a1a]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            ✨ Personalized
          </button>
        </div>

        {activeTab === "questions" && (
          <div className="flex-1 overflow-y-auto p-4 flex gap-4">
            <div className="w-1/2 bg-white rounded-lg p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">
                Ask a question
              </h3>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know about this lecture?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent resize-none mb-3"
                rows={3}
              />

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Response Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setMode("simple")}
                    className={`px-3 py-2 text-xs rounded-lg border ${
                      mode === "simple"
                        ? "bg-[#ffc8dd] text-[#1a1a1a] border-[#ffc8dd]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    onClick={() => setMode("practice")}
                    className={`px-3 py-2 text-xs rounded-lg border ${
                      mode === "practice"
                        ? "bg-[#ffc8dd] text-[#1a1a1a] border-[#ffc8dd]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Practice
                  </button>
                  <button
                    onClick={() => setMode("animation")}
                    className={`px-3 py-2 text-xs rounded-lg border ${
                      mode === "animation"
                        ? "bg-[#ffc8dd] text-[#1a1a1a] border-[#ffc8dd]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Animation
                  </button>
                </div>
              </div>

              {mode === "practice" && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Interests (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={interestTags}
                    onChange={(e) => setInterestTags(e.target.value)}
                    placeholder="e.g., sports, music, cooking"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleAskQuestion}
                disabled={!question.trim() || isAsking}
                className="w-full px-4 py-2 bg-[#ffc8dd] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#ffbcd5] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAsking ? "Asking..." : "Ask Question"}
              </button>
            </div>

            {/* Recent Questions */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                Your Questions
              </h3>

              {recentQuestions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No questions yet. Be the first to ask!
                </p>
              ) : (
                <div className="space-y-3">
                  {recentQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="bg-white border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 flex-1">
                          Q: {q.question}
                        </p>
                        <span
                          className={`ml-2 px-2 py-0.5 text-xs rounded-full ${q.mode === "simple" ? "bg-blue-100 text-blue-800" : q.mode === "practice" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}`}
                        >
                          {q.mode}
                        </span>
                      </div>

                      {q.answer ? (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-600 mb-1 font-medium">
                            AI Answer:
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {q.answer.content}
                          </p>

                          {q.answer.references &&
                            q.answer.references.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500">
                                <p className="font-medium">References:</p>
                                {q.answer.references.map((ref, idx) => (
                                  <p key={idx}>
                                    • {Math.floor(ref.start_sec / 60)}:
                                    {String(
                                      Math.floor(ref.start_sec % 60),
                                    ).padStart(2, "0")}
                                  </p>
                                ))}
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-2" />
                          Generating answer...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/*
          Keep Manim tab mounted even when hidden, so auto-generation continues and we don't lose the loading state.
          We just hide it via CSS.
        */}
        <div className={activeTab === "manim" ? "block" : "hidden"}>
          <ManimVideoTab
            context={context}
            session={session}
            animations={manimAnimations}
            selectedAnimation={selectedManim}
            onAnimationGenerated={handleManimGenerated}
            onSelectAnimation={handleSelectManim}
          />
        </div>

        {activeTab === "personalized" && (
          <PersonalizedTab sessionId={session?.id || null} videoId={session?.video_id || null} />
        )}
      </div>
    </div>
  );
}

function PersonalizedTab({
  sessionId,
  videoId,
}: {
  sessionId: string | null;
  videoId: string | null;
}) {
  const [interests, setInterests] = useState("sports, music");
  const [topicHint, setTopicHint] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const generate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // For live sessions, ask uses live_session_id for retrieval.
          live_session_id: sessionId,
          video_id: videoId,
          is_live: true,
          mode: "practice",
          interest_tags: interests
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t),
          question: topicHint.trim()
            ? `Create personalized practice problems about: ${topicHint.trim()}`
            : "Create personalized practice problems based on today’s lecture.",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate practice problems");
      }

      setResult(data.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900">✨ Personalized practice</h3>
        <p className="text-xs text-gray-600 mt-1">
          Generate practice problems tailored to your interests, using the live session transcript as context.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Interests (comma-separated)
            </label>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent"
              placeholder="e.g., basketball, fashion, gaming"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Topic (optional)
            </label>
            <input
              value={topicHint}
              onChange={(e) => setTopicHint(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent"
              placeholder="e.g., conditional probability"
            />
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={generate}
            disabled={isGenerating || !sessionId}
            className="w-full px-4 py-2 bg-[#ffc8dd] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#ffbcd5] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating…" : "Generate practice problems"}
          </button>

          {!sessionId ? (
            <p className="text-xs text-gray-500">
              Waiting for a live session connection before generating.
            </p>
          ) : null}
        </div>
      </div>

      {result?.content ? (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Generated</h4>
          <div className="text-sm text-gray-800 whitespace-pre-wrap">{result.content}</div>
        </div>
      ) : null}
    </div>
  );
}
