"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LiveSession, Video } from "@/lib/types";
import ScreenRecorder from "@/components/zoom/ScreenRecorder";

export default function StudentPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(
    null,
  );
  const [sessionVideo, setSessionVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load active sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch("/api/live-sessions/active");
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error("Error loading sessions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
    const interval = setInterval(loadSessions, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Load video for selected session
  useEffect(() => {
    if (!selectedSession?.video_id) {
      setSessionVideo(null);
      return;
    }

    const loadVideo = async () => {
      try {
        const response = await fetch(`/api/videos/${selectedSession.video_id}`);
        if (response.ok) {
          const data = await response.json();
          setSessionVideo(data.video);
        }
      } catch (err) {
        console.error("Error loading video:", err);
      }
    };

    loadVideo();
    const interval = setInterval(loadVideo, 5000);
    return () => clearInterval(interval);
  }, [selectedSession?.video_id]);

  const handleRecordingComplete = () => {
    // Refresh the session to get the updated video_id
    if (selectedSession) {
      fetch(`/api/live-sessions/${selectedSession.id}`)
        .then((res) => res.json())
        .then((data) => setSelectedSession(data.session))
        .catch(console.error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffc8dd] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show session view if one is selected
  if (selectedSession) {
    return (
      <div className="min-h-screen bg-[#FAFAFC]">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-sm text-gray-600 hover:text-gray-900 mb-2 flex items-center"
                >
                  ← Back to Sessions
                </button>
                <h1 className="text-2xl font-['Souvenir',sans-serif] font-medium text-[#1a1a1a]">
                  {selectedSession.title || "Live Session"}
                </h1>
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                Live
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Show recorder if no video */}
          {!selectedSession.video_id && (
            <div className="mb-8">
              <ScreenRecorder
                sessionId={selectedSession.id}
                onRecordingComplete={handleRecordingComplete}
              />
            </div>
          )}

          {/* Show processing state */}
          {selectedSession.video_id &&
            sessionVideo &&
            sessionVideo.status !== "transcribed" && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center mb-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processing Your Recording
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  We&apos;re transcribing your recording. This usually takes 1-2
                  minutes for every 10 minutes of content.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
                  <p className="text-xs text-blue-800 font-medium">
                    Status: {sessionVideo.status}
                  </p>
                </div>
              </div>
            )}

          {/* Show Q&A interface when ready */}
          {selectedSession.video_id &&
            sessionVideo &&
            sessionVideo.status === "transcribed" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Ask Questions About This Lecture
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  The recording has been transcribed! You can now ask questions.
                </p>
                <Link
                  href={`/videos/${selectedSession.video_id}/ask`}
                  className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open Q&A Interface →
                </Link>
              </div>
            )}
        </div>
      </div>
    );
  }

  // Show list of active sessions
  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-['Souvenir',sans-serif] font-medium text-[#1a1a1a] mb-2">
            Active Live Sessions
          </h1>
          <p className="text-gray-600">
            Join a live session to record and ask questions about the lecture.
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Active Sessions
            </h2>
            <p className="text-gray-600 mb-6">
              There are no live sessions at the moment. Check back later or ask
              your teacher to start one!
            </p>
            <Link
              href="/teacher/videos"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Browse Recorded Videos →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#ffc8dd] hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></span>
                    Live
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(session.started_at).toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {session.title || "Untitled Session"}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Meeting: {session.meeting_number}
                </p>
                <button className="w-full px-4 py-2 bg-[#ffc8dd] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#ffbcd5] transition-colors">
                  Join Session →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
