"use client";

import { useState, useEffect } from "react";
import { ZoomMeetingContext } from "@/hooks/useZoomApp";
import { Video } from "@/lib/types";
import ScreenRecorder from "./ScreenRecorder";
import Link from "next/link";

interface SimpleStudentViewProps {
  context: ZoomMeetingContext;
}

export default function SimpleStudentView({ context }: SimpleStudentViewProps) {
  const [recordedVideoId, setRecordedVideoId] = useState<string | null>(null);
  const [video, setVideo] = useState<Video | null>(null);

  // Load video status after recording
  useEffect(() => {
    if (!recordedVideoId) {
      setVideo(null);
      return;
    }

    const loadVideo = async () => {
      try {
        const response = await fetch(`/api/videos/${recordedVideoId}`);
        if (response.ok) {
          const data = await response.json();
          setVideo(data.video);
        }
      } catch (err) {
        console.error("Error loading video:", err);
      }
    };

    loadVideo();
    // Poll for video status updates
    const interval = setInterval(loadVideo, 5000);
    return () => clearInterval(interval);
  }, [recordedVideoId]);

  const handleRecordingComplete = (videoId: string) => {
    setRecordedVideoId(videoId);
  };

  const handleStartOver = () => {
    setRecordedVideoId(null);
    setVideo(null);
  };

  // Show recording interface if no video recorded yet
  if (!recordedVideoId) {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFC]">
        <div className="bg-white border-b border-gray-100 p-4 shadow-sm">
          <h1 className="text-xl font-['Souvenir',sans-serif] font-medium text-[#1a1a1a]">
            Juliette
          </h1>
          <p className="text-sm text-gray-600 mt-1">📚 Student View</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <ScreenRecorder
            sessionId={context.meetingUUID} // Use meeting UUID as identifier
            onRecordingComplete={handleRecordingComplete}
            linkToSession={false} // Don't link to a live session
          />
        </div>

        <div className="bg-white border-t border-gray-100 p-2 text-center">
          <p className="text-xs text-gray-500">
            Powered by Juliette AI • {context.userName}
          </p>
        </div>
      </div>
    );
  }

  // Show processing state if video is being transcribed
  if (video && video.status !== "transcribed") {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFC]">
        <div className="bg-white border-b border-gray-100 p-4 shadow-sm">
          <h1 className="text-xl font-['Souvenir',sans-serif] font-medium text-[#1a1a1a]">
            Juliette
          </h1>
          <p className="text-sm text-gray-600 mt-1">📚 Student View</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Processing Your Recording
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We're transcribing your lecture recording. This usually takes 1-2
              minutes for every 10 minutes of content.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
              <p className="text-xs text-blue-800 font-medium">
                Status: {video.status}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                You'll be able to ask questions as soon as transcription is
                complete!
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-gray-100 p-2 text-center">
          <p className="text-xs text-gray-500">
            Powered by Juliette AI • {context.userName}
          </p>
        </div>
      </div>
    );
  }

  // Show mode selection when transcription is complete
  return (
    <div className="flex flex-col h-full bg-[#FAFAFC]">
      <div className="bg-white border-b border-gray-100 p-4 shadow-sm">
        <h1 className="text-xl font-['Souvenir',sans-serif] font-medium text-[#1a1a1a]">
          Juliette
        </h1>
        <p className="text-sm text-gray-600 mt-1">📚 Student View</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Success message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">✅</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 mb-1">
                Recording Transcribed Successfully!
              </h3>
              <p className="text-xs text-green-700">
                Your lecture recording is ready. Choose how you'd like to learn:
              </p>
            </div>
          </div>
        </div>

        {/* Three mode options */}
        <div className="space-y-4">
          <Link
            href={`/videos/${recordedVideoId}/ask?mode=simple`}
            target="_blank"
            className="block p-6 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-start">
              <div className="text-4xl mr-4">💬</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Simple Q&A
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Get clear, concise explanations to your questions about the lecture
                </p>
                <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-800">
                  Best for: Understanding concepts quickly
                </div>
              </div>
            </div>
          </Link>

          <Link
            href={`/videos/${recordedVideoId}/ask?mode=animation`}
            target="_blank"
            className="block p-6 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-start">
              <div className="text-4xl mr-4">🎬</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Watch Animations
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  See concepts visualized with custom animations using Manim
                </p>
                <div className="bg-purple-50 rounded-lg p-2 text-xs text-purple-800">
                  Best for: Visual learners
                </div>
              </div>
            </div>
          </Link>

          <Link
            href={`/videos/${recordedVideoId}/ask?mode=practice`}
            target="_blank"
            className="block p-6 bg-white rounded-xl border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-start">
              <div className="text-4xl mr-4">✨</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Practice Problems
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Get personalized practice problems tailored to your interests
                </p>
                <div className="bg-green-50 rounded-lg p-2 text-xs text-green-800">
                  Best for: Hands-on practice
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Start over button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleStartOver}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Record Another Lecture
          </button>
        </div>
      </div>

      <div className="bg-white border-t border-gray-100 p-2 text-center">
        <p className="text-xs text-gray-500">
          Powered by Juliette AI • {context.userName}
        </p>
      </div>
    </div>
  );
}
