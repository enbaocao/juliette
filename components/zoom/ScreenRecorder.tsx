"use client";

import { useState, useRef } from "react";

interface ScreenRecorderProps {
  sessionId: string;
  onRecordingComplete: (videoId: string) => void;
  linkToSession?: boolean;
}

export default function ScreenRecorder({
  sessionId,
  onRecordingComplete,
  linkToSession = true,
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
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "window" } as MediaTrackConstraints,
        audio: true,
      });

      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";

      console.log("Using MIME type:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Chunk: ${(event.data.size / 1024).toFixed(2)} KB`);
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log(`Stopped. Chunks: ${chunksRef.current.length}`);
        await transcribeRecording();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
    } catch (err) {
      console.error("Recording error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start recording. Please grant permissions.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const transcribeRecording = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const chunks = chunksRef.current;

      if (chunks.length === 0) {
        throw new Error("No recording data. Please try again.");
      }

      const blob = new Blob(chunks, { type: "video/webm" });

      console.log(`Blob: ${(blob.size / 1024 / 1024).toFixed(2)} MB, ${chunks.length} chunks`);

      if (blob.size === 0) {
        throw new Error("Recording is empty. Please try again.");
      }

      const file = new File(
        [blob],
        `recording-${Date.now()}.webm`,
        { type: "video/webm" }
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", `Zoom Recording - ${new Date().toLocaleString()}`);
      formData.append("session_id", sessionId);

      console.log("Sending to Whisper API...");

      const response = await fetch("/api/transcribe-recording", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Transcription error:", errorText);
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Transcription complete:", data);

      if (linkToSession) {
        await fetch("/api/live-sessions/link-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            video_id: data.videoId,
          }),
        });
      }

      onRecordingComplete(data.videoId);
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to transcribe recording",
      );
      setIsProcessing(false);
    } finally {
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
          Transcribing with Whisper...
        </h3>
        <p className="text-sm text-gray-600 text-center max-w-sm">
          Your recording is being transcribed. This usually takes 30-60 seconds.
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
          ? "Recording your Zoom window. Stop when you're ready!"
          : "Record your Zoom meeting to ask AI-powered questions."}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 max-w-md">
          <p className="text-xs text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-600 underline mt-2"
          >
            Dismiss
          </button>
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
        disabled={isProcessing}
        className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          isRecording
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isRecording ? "⏹ Stop Recording" : "🎬 Start Recording"}
      </button>

      {!isRecording && !isProcessing && (
        <p className="text-xs text-gray-500 mt-4 text-center max-w-sm">
          Select your Zoom window and ensure audio is included.
        </p>
      )}
    </div>
  );
}
