"use client";

import { useState, useEffect } from "react";
import { ZoomMeetingContext } from "@/hooks/useZoomApp";
import { LiveSession, Video } from "@/lib/types";

interface HostControlsProps {
  context: ZoomMeetingContext;
  session: LiveSession | null;
  onSessionCreated: (session: LiveSession) => void;
  onSessionEnded: () => void;
}

export default function HostControls({
  context,
  session,
  onSessionCreated,
  onSessionEnded,
}: HostControlsProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState<
    "idle" | "connecting" | "streaming" | "error"
  >("idle");
  const [isStartingTranscription, setIsStartingTranscription] = useState(false);

  // Load available videos
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await fetch("/api/videos");
        if (response.ok) {
          const data = await response.json();
          setVideos(
            data.videos.filter((v: Video) => v.status === "transcribed"),
          );
        }
      } catch (err) {
        console.error("Error loading videos:", err);
      }
    };

    loadVideos();
  }, []);

  // Poll for transcription status
  useEffect(() => {
    if (!session) return;

    const checkTranscriptionStatus = async () => {
      try {
        const response = await fetch(
          `/api/rtms/status?session_id=${session.id}`,
        );
        if (response.ok) {
          const data = await response.json();
          setTranscriptionStatus(data.rtms_status || "idle");
        }
      } catch (err) {
        console.error("Error checking transcription status:", err);
      }
    };

    checkTranscriptionStatus();
    const interval = setInterval(checkTranscriptionStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [session]);

  const handleStartSession = async () => {
    if (!selectedVideoId && !sessionTitle) {
      setError("Please select a video or enter a session title");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/live-sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_uuid: context.meetingUUID,
          meeting_number: context.meetingNumber,
          video_id: selectedVideoId || null,
          title: sessionTitle || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start session");
      }

      const data = await response.json();
      onSessionCreated(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndSession = async () => {
    if (!session) return;

    setIsEnding(true);
    setError(null);

    try {
      // Stop transcription first if active
      if (transcriptionStatus === "streaming") {
        await handleStopTranscription();
      }

      const response = await fetch("/api/live-sessions/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to end session");
      }

      onSessionEnded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end session");
    } finally {
      setIsEnding(false);
    }
  };

  const handleStartTranscription = async () => {
    if (!session) return;

    setIsStartingTranscription(true);
    setError(null);

    try {
      // Start bot transcription for this session
      const response = await fetch("/api/rtms/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start bot transcription");
      }

      setTranscriptionStatus("connecting");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start bot transcription",
      );
      setTranscriptionStatus("error");
    } finally {
      setIsStartingTranscription(false);
    }
  };

  const handleStopTranscription = async () => {
    if (!session) return;

    try {
      const response = await fetch("/api/rtms/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to stop transcription");
      }

      setTranscriptionStatus("idle");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to stop transcription",
      );
    }
  };

  if (session) {
    return (
      <div className="p-4 space-y-4">
        {/* Active Session Info */}
        <div className="bg-white border border-[#ffc2d1] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-[#1a1a1a]">🟢 Session Active</h2>
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {isEnding ? "Ending..." : "End Session"}
            </button>
          </div>
          {session.title && (
            <p className="text-sm text-gray-700 mb-1">
              <strong>Title:</strong> {session.title}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Meeting: {context.meetingNumber}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Live Transcription Controls */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-[#1a1a1a] mb-2">
            🎙️ Live Transcription
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Enable real-time meeting transcription for better AI context
          </p>

          {transcriptionStatus === "idle" && (
            <button
              onClick={handleStartTranscription}
              disabled={isStartingTranscription}
              className="w-full px-4 py-2 bg-[#ffc8dd] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#ffbcd5] disabled:opacity-50 transition-colors shadow-sm"
            >
              {isStartingTranscription
                ? "Starting..."
                : "Start Live Transcription"}
            </button>
          )}

          {transcriptionStatus === "connecting" && (
            <div className="flex items-center justify-center py-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#ffc8dd] mr-2"></div>
              Connecting to audio stream...
            </div>
          )}

          {transcriptionStatus === "streaming" && (
            <div>
              <div className="flex items-center mb-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Transcription active
              </div>
              <button
                onClick={handleStopTranscription}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Stop Transcription
              </button>
            </div>
          )}

          {transcriptionStatus === "error" && (
            <div className="text-sm text-red-600">
              ⚠️ Transcription error. Please try again.
            </div>
          )}
        </div>

        {/* Question Dashboard Link */}
        <div className="bg-[#ffe5ec] border border-[#ffc2d1] rounded-xl p-4">
          <h3 className="font-semibold text-[#1a1a1a] mb-2">
            Teacher Dashboard
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            View all student questions and AI responses in real-time
          </p>
          <a
            href={`/live/dashboard/${session.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-[#ffc8dd] text-[#1a1a1a] rounded-lg hover:bg-[#ffbcd5] text-sm font-medium transition-colors shadow-sm"
          >
            Open Dashboard →
          </a>
        </div>

        {/* Instructions */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-[#1a1a1a] mb-2">How it works:</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Students can now ask questions through this panel</li>
            <li>AI will answer based on the lecture content</li>
            <li>Monitor questions on the teacher dashboard</li>
            <li>End the session when class is over</li>
          </ul>
        </div>
      </div>
    );
  }

  // No active session - show start controls
  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-[#1a1a1a] mb-4">
          Start Live Session
        </h2>

        {/* Session Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Title (optional)
          </label>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="e.g., Calculus Lecture - Derivatives"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent transition-all"
          />
        </div>

        {/* Video Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link to Lecture Video (optional)
          </label>
          {videos.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No transcribed videos available. Upload videos first.
            </p>
          ) : (
            <select
              value={selectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc8dd] focus:border-transparent transition-all"
            >
              <option value="">No video (Q&A only)</option>
              {videos.map((video) => (
                <option key={video.id} value={video.id}>
                  {video.title}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Linking a video allows AI to reference lecture content when
            answering
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleStartSession}
          disabled={isCreating}
          className="w-full px-4 py-3 bg-[#ffc8dd] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#ffbcd5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isCreating ? "Starting..." : "Start Session"}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-[#ffe5ec] border border-[#ffc2d1] rounded-xl p-4">
        <h3 className="font-semibold text-[#1a1a1a] mb-2">💡 Tip</h3>
        <p className="text-sm text-gray-700">
          Start a session to enable students to ask questions. They&apos;ll get
          instant AI-powered explanations during class!
        </p>
      </div>
    </div>
  );
}
