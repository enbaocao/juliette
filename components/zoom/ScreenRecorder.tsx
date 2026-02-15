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
  const [preferSystemAudio, setPreferSystemAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pickSupportedMimeType = () => {
    // Prefer Opus in WebM (best-supported in Chromium-based browsers, incl. Zoom Apps)
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return ""; // Let browser default
  };

  const startRecording = async () => {
    try {
      setError(null);
      chunksRef.current = [];

      // Audio-only recording for Vercel-friendly transfers.
      // Default to mic (most reliable). Optionally, user can opt into attempting system audio.
      let stream: MediaStream | null = null;
      let gotSystemAudio = false;

      // 1) Mic first (best chance of success and the least confusing permission prompt)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      } catch (micErr) {
        console.error("Mic permission error:", micErr);
        // If mic fails, we still allow user to try system audio below if they opted in.
      }

      // 2) Optional: attempt system audio (often restricted in embedded/webview contexts)
      if ((!stream || stream.getAudioTracks().length === 0) && preferSystemAudio) {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: false,
            audio: true,
          } as any);

          const hasAudio = displayStream.getAudioTracks().length > 0;
          if (hasAudio) {
            // If we already have a mic stream, stop it and use system audio stream.
            if (stream) {
              stream.getTracks().forEach((t) => t.stop());
            }
            stream = displayStream;
            gotSystemAudio = true;
          } else {
            displayStream.getTracks().forEach((t) => t.stop());
          }
        } catch (sysErr) {
          console.warn("System audio capture failed:", sysErr);
        }
      }

      if (!stream || stream.getAudioTracks().length === 0) {
        throw new Error(
          "Couldn’t access audio. Please allow microphone access in macOS Privacy & Security → Microphone (and in Zoom), then try again.",
        );
      }

      streamRef.current = stream;

      const mimeType = pickSupportedMimeType();
      console.log("Using MIME type:", mimeType || "(browser default)", {
        gotSystemAudio,
        audioTracks: stream.getAudioTracks().length,
      });

      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType, audioBitsPerSecond: 64000 } : { audioBitsPerSecond: 64000 },
      );

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

      // If user stops sharing / mic ends, stop recording.
      const endTrack = stream.getAudioTracks()[0];
      if (endTrack) {
        endTrack.onended = () => stopRecording();
      }
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

      // Audio-only WebM (Opus) keeps uploads small and avoids server-side ffmpeg on Vercel.
      const blob = new Blob(chunks, { type: chunks[0]?.type || "audio/webm" });

      console.log(`Blob: ${(blob.size / 1024 / 1024).toFixed(2)} MB, ${chunks.length} chunks`);

      if (blob.size === 0) {
        throw new Error("Recording is empty. Please try again.");
      }

      const file = new File([blob], `recording-${Date.now()}.webm`, {
        type: blob.type || "audio/webm",
      });

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
          Uploading audio and transcribing. This usually takes 1060 seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="text-6xl mb-4">�️</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {isRecording ? "Recording in Progress" : "Record Audio"}
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-6">
        {isRecording
          ? "Recording audio. Stop when you're ready!"
          : "Record audio to ask AI-powered questions."}
      </p>

      {!isRecording && !isProcessing && (
        <label className="flex items-center gap-2 text-xs text-gray-600 mb-4 select-none">
          <input
            type="checkbox"
            checked={preferSystemAudio}
            onChange={(e) => setPreferSystemAudio(e.target.checked)}
            className="h-4 w-4"
          />
          Try system audio (may not work in Zoom panel; mic is default)
        </label>
      )}

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
          You’ll be asked for microphone permission. If you still get blocked, enable mic access for Zoom in macOS Privacy & Security → Microphone.
        </p>
      )}
    </div>
  );
}
