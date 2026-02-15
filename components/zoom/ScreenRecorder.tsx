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
  const mediaDevices =
    typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
  const hasGetDisplayMedia =
    Boolean(mediaDevices) && typeof (mediaDevices as any).getDisplayMedia === "function";

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mode, setMode] = useState<"screen" | "mic">(
    hasGetDisplayMedia ? "screen" : "mic",
  );

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

  const getErrName = (e: unknown) => {
    if (e && typeof e === "object" && "name" in e) return String((e as any).name);
    return "";
  };

  const getErrMessage = (e: unknown) => {
    if (e instanceof Error) return e.message;
    if (typeof e === "string") return e;
    return "";
  };

  const startRecording = async () => {
    try {
      setError(null);
      chunksRef.current = [];

      const wantsScreen = mode === "screen";

      // Screen mode: request display media (video+audio) for the UX, but record/upload audio-only.
      // Mic mode: record/upload mic audio only (no screen capture attempt).
      let displayStream: MediaStream | null = null;
      if (wantsScreen) {
        if (!hasGetDisplayMedia) {
          throw new Error(
            "Screen recording isn’t supported in this Zoom environment. Switch to Mic-only.",
          );
        }
        displayStream = await (mediaDevices as any).getDisplayMedia({
          video: true,
          audio: true,
        } as any);
      }

      const displayVideoTrack = wantsScreen
        ? displayStream?.getVideoTracks()[0] ?? null
        : null;
      const displayAudioTrack = wantsScreen
        ? displayStream?.getAudioTracks()[0] ?? null
        : null;

      // If system audio isn't provided from the display stream, fall back to mic.
      let micStream: MediaStream | null = null;
      let micTrack: MediaStreamTrack | null = null;

      if (!displayAudioTrack) {
        try {
          if (!mediaDevices || typeof mediaDevices.getUserMedia !== "function") {
            throw new Error("Audio capture is not available in this environment.");
          }

          micStream = await mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });
          micTrack = micStream.getAudioTracks()[0] ?? null;
        } catch (micErr) {
          const name = getErrName(micErr);
          if (name === "NotAllowedError" || name === "SecurityError") {
            throw new Error(
              "Microphone permission was blocked. Enable mic access for Zoom (Windows Settings → Privacy & security → Microphone, or macOS Privacy & Security → Microphone), then try again.",
            );
          }
          throw micErr;
        }
      }

      const audioTrack = displayAudioTrack ?? micTrack;
      if (!audioTrack) {
        throw new Error(
          "Couldn’t capture any audio. Your environment may be blocking system audio and microphone access.",
        );
      }

      // Audio-only stream for the MediaRecorder
      const audioOnlyStream = new MediaStream([audioTrack]);

      // Keep references to tracks to stop them on cleanup.
      // We keep the display video track running during recording so it is *actually* a screen recording session.
      const cleanupTracks: MediaStreamTrack[] = [
        ...(displayVideoTrack ? [displayVideoTrack] : []),
        ...(displayAudioTrack ? [displayAudioTrack] : []),
        ...(micTrack ? [micTrack] : []),
      ];
      streamRef.current = new MediaStream(cleanupTracks);

      const mimeType = pickSupportedMimeType();
      console.log("Using MIME type:", mimeType || "(browser default)", {
        hasDisplayAudio: Boolean(displayAudioTrack),
        usingMicFallback: Boolean(!displayAudioTrack && micTrack),
      });

      const mediaRecorder = new MediaRecorder(
        audioOnlyStream,
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

      // If user stops sharing, stop recording.
      if (displayVideoTrack) {
        displayVideoTrack.onended = () => stopRecording();
      }

      // If audio ends mid-flight, stop recording.
      audioTrack.onended = () => stopRecording();

      // Avoid unused var lint warnings in some setups
      void micStream;
    } catch (err) {
      console.error("Recording error:", err);
      const name = getErrName(err);
      const msg = getErrMessage(err);
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(
          "Permission denied. Please allow the screen capture prompt, and ensure microphone permission is enabled for Zoom.",
        );
        return;
      }
      setError(msg || "Failed to start recording. Please grant permissions.");
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
          Uploading audio and transcribing. This usually takes 10–60 seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="text-6xl mb-4">🎙️</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {isRecording
          ? "Recording in Progress"
          : mode === "screen"
            ? "Screen Record (Upload Audio Only)"
            : "Mic Only (Upload Audio Only)"}
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-6">
        {isRecording
          ? "Recording your screen plus audio-only upload. Stop when you're ready!"
          : mode === "screen"
            ? "We’ll screen-record your Zoom window, but only upload audio for fast transcription."
            : "We’ll record from your microphone only (no screen capture) for fast transcription."}
      </p>

      {!isRecording && !isProcessing && (
        <div className="w-full max-w-md mb-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("screen");
              }}
              disabled={!hasGetDisplayMedia}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === "screen"
                  ? "bg-white border-blue-300 text-blue-800"
                  : "bg-white/60 border-gray-200 text-gray-700 hover:bg-white"
              }`}
              title={
                hasGetDisplayMedia
                  ? "Screen-record your Zoom window, upload audio only"
                  : "Screen recording isn’t available in this Zoom environment"
              }
            >
              Screen
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("mic");
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                mode === "mic"
                  ? "bg-white border-blue-300 text-blue-800"
                  : "bg-white/60 border-gray-200 text-gray-700 hover:bg-white"
              }`}
            >
              Mic-only
            </button>
          </div>

          {!hasGetDisplayMedia && (
            <p className="mt-2 text-[11px] text-gray-600">
              Screen recording isn’t supported in this Zoom workspace on macOS.
              Use <span className="font-medium">Mic-only</span>, or run the app
              inside the Zoom desktop meeting client to enable screen capture.
            </p>
          )}
        </div>
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
        {isRecording
          ? "⏹ Stop Recording"
          : mode === "screen"
            ? "🎬 Start Screen Recording"
            : "🎤 Start Mic Recording"}
      </button>

      {!isRecording && !isProcessing && (
        <p className="text-xs text-gray-500 mt-4 text-center max-w-sm">
          {mode === "screen"
            ? "Pick your Zoom window when prompted. If system audio isn’t available, we’ll use your microphone."
            : "We’ll ask for microphone permission and upload only audio for transcription."}
        </p>
      )}
    </div>
  );
}
