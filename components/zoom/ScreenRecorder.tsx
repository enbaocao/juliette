"use client";

import { useState, useRef } from "react";

interface ScreenRecorderProps {
  sessionId: string;
  onRecordingComplete: (videoId: string) => void;
}

export default function ScreenRecorder({
  sessionId,
  onRecordingComplete,
}: ScreenRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError(null);

      // Request screen capture with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "window",
        } as MediaTrackConstraints,
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await uploadRecording();
      };

      // Start recording
      mediaRecorder.start(1000); // Capture data every second
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Handle user stopping the screen share
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start recording. Please ensure you grant screen capture permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const uploadRecording = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Create video blob
      const blob = new Blob(chunksRef.current, { type: "video/webm" });

      // Create form data
      const formData = new FormData();
      formData.append("file", blob, `recording-${Date.now()}.webm`);
      formData.append("title", `Zoom Recording - ${new Date().toLocaleString()}`);
      formData.append("session_id", sessionId);

      // Upload to server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      // Link video to session
      await fetch("/api/live-sessions/link-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          video_id: data.videoId,
        }),
      });

      onRecordingComplete(data.videoId);
    } catch (err) {
      console.error("Error uploading recording:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload recording"
      );
    } finally {
      setIsProcessing(false);
      chunksRef.current = [];
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Processing Recording...
        </h3>
        <p className="text-sm text-gray-600 text-center max-w-sm">
          Your recording is being uploaded and transcribed. This may take a few
          minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="text-6xl mb-4">🎥</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {isRecording ? "Recording in Progress" : "Record This Lecture"}
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-6">
        {isRecording
          ? "Recording your Zoom window. Stop when you're ready to ask questions!"
          : "Record your Zoom meeting window to ask AI-powered questions about the lecture."}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 max-w-md">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {isRecording && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="font-mono text-lg font-semibold">
              {formatDuration(recordingDuration)}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          isRecording
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isRecording ? "⏹ Stop Recording" : "🎬 Start Recording"}
      </button>

      {!isRecording && (
        <p className="text-xs text-gray-500 mt-4 text-center max-w-sm">
          You'll be prompted to select which window to share. Choose your Zoom
          meeting window and ensure audio is included.
        </p>
      )}
    </div>
  );
}
