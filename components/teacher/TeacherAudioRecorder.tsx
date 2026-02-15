"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "processing";

interface TeacherAudioRecorderProps {
  meetingKey: string;
  meetingNumber: string;
  title?: string;
}

function isMeetingKey(value: string) {
  // digits-only meeting key (we normalize by stripping non-digits)
  return /^\d{6,}$/.test(value);
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function TeacherAudioRecorder({
  meetingKey,
  meetingNumber,
  title,
}: TeacherAudioRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastVideoId, setLastVideoId] = useState<string | null>(null);
  const [chunkEverySec, setChunkEverySec] = useState(60);
  const [isChunkUploading, setIsChunkUploading] = useState(false);
  const [lastChunkStatus, setLastChunkStatus] = useState<string | null>(null);
  const [chunksUploaded, setChunksUploaded] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isStoppingRef = useRef(false);
  const isUploadInFlightRef = useRef(false);

  const canStart = useMemo(() => {
    return Boolean(meetingKey && meetingNumber && isMeetingKey(meetingKey));
  }, [meetingKey, meetingNumber]);

  const pickSupportedMimeType = () => {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ];
    for (const t of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return "";
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const flushAndUploadChunk = async ({ isFinal }: { isFinal: boolean }) => {
    // Guard: we only upload while recording, except for a final flush on stop.
    if (!recorderRef.current) return;
    if (isUploadInFlightRef.current) return;
    if (state !== "recording" && !isFinal) return;

    try {
      // Ask the recorder to flush buffered audio into ondataavailable.
      if (recorderRef.current.state === "recording") {
        try {
          recorderRef.current.requestData();
        } catch {
          // ignore
        }
      }

      // Give the browser a moment to deliver the dataavailable event.
      await new Promise((r) => setTimeout(r, 150));

      if (chunksRef.current.length === 0) {
        if (isFinal) setLastChunkStatus("No audio captured.");
        return;
      }

      isUploadInFlightRef.current = true;
      setIsChunkUploading(true);
      setLastChunkStatus(isFinal ? "Uploading final chunk…" : "Uploading chunk…");

      const sid = await ensureSession();

      // Rotate buffer so recording can keep going.
      const chunksToUpload = chunksRef.current.splice(0, chunksRef.current.length);
      const blob = new Blob(chunksToUpload, { type: chunksToUpload[0]?.type || "audio/webm" });
      if (!blob.size) {
        setLastChunkStatus("Chunk was empty.");
        return;
      }

      const file = new File([blob], `teacher-audio-chunk-${Date.now()}.webm`, {
        type: blob.type || "audio/webm",
      });

      const form = new FormData();
      form.append("file", file);
      form.append("title", title || `Live Session — ${new Date().toLocaleString()}`);
      form.append("session_id", sid);

      const res = await fetch("/api/transcribe-recording", {
        method: "POST",
        body: form,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Transcription failed (${res.status})`);
      }

      const videoId = data?.videoId as string | undefined;
      if (videoId) {
        setLastVideoId(videoId);
        setChunksUploaded((n) => n + 1);
        // Keep session.video_id updated to the latest chunk for downstream UI.
        await fetch("/api/live-sessions/link-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sid, video_id: videoId }),
        });
      }

      setLastChunkStatus(isFinal ? "Final chunk uploaded." : "Chunk uploaded.");
    } finally {
      setIsChunkUploading(false);
      isUploadInFlightRef.current = false;
    }
  };

  const ensureSession = async (): Promise<string> => {
    if (sessionId) return sessionId;

    const response = await fetch("/api/live-sessions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meeting_uuid: meetingKey,
        meeting_number: meetingNumber,
        title: title || null,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Failed to start live session");
    }

    const newSessionId = data?.session?.id as string | undefined;
    if (!newSessionId) {
      throw new Error("Live session started but no session id returned");
    }

    setSessionId(newSessionId);
    return newSessionId;
  };

  const startRecording = async () => {
    try {
      setError(null);
      setLastVideoId(null);
      setChunksUploaded(0);
      setLastChunkStatus(null);
      isStoppingRef.current = false;

      if (!canStart) {
        throw new Error(
          "Enter a valid meeting UUID and meeting number before recording.",
        );
      }

      await ensureSession();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Mic capture isn’t available in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickSupportedMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType, audioBitsPerSecond: 64000 } : { audioBitsPerSecond: 64000 },
      );
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Final flush when user stops.
        await flushAndUploadChunk({ isFinal: true });
      };

      recorder.start(1000);
      setDurationSec(0);
      setState("recording");

      timerRef.current = setInterval(() => {
        setDurationSec((s) => s + 1);
      }, 1000);

      chunkTimerRef.current = setInterval(() => {
        flushAndUploadChunk({ isFinal: false });
      }, Math.max(15, chunkEverySec) * 1000);
    } catch (e: any) {
      const name = e?.name as string | undefined;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(
          "Microphone permission blocked. Enable mic access for this site, then try again.",
        );
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to start recording");
      setState("idle");
    }
  };

  const stopRecording = () => {
    isStoppingRef.current = true;

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

  if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
  chunkTimerRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setState("processing");
  };

  // Keep the old API shape but route it to a final flush.
  const transcribeAndAttach = async () => {
    try {
      await flushAndUploadChunk({ isFinal: true });
    } finally {
      chunksRef.current = [];
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Live Session Recorder</h2>
          <p className="text-sm text-gray-600 mt-1">
            Record mic audio on the website, and students in Zoom will automatically
            pick it up via the meeting UUID.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Status</div>
          <div className="text-sm font-medium text-gray-900">
            {state === "idle" ? "Ready" : state === "recording" ? "Recording" : "Transcribing"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 bg-[#FAFAFC] p-4">
          <div className="text-xs text-gray-500">Meeting ID (key)</div>
          <div className="mt-1 font-mono text-xs break-all text-gray-900">
            {meetingKey || "—"}
          </div>
          {!meetingKey ? null : !isMeetingKey(meetingKey) ? (
            <div className="mt-2 text-xs text-red-600">Not a valid meeting id.</div>
          ) : null}
        </div>
        <div className="rounded-xl border border-gray-100 bg-[#FAFAFC] p-4">
          <div className="text-xs text-gray-500">Meeting Number</div>
          <div className="mt-1 font-mono text-sm text-gray-900">
            {meetingNumber || "—"}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {lastVideoId ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Transcript saved. Video id: <span className="font-mono text-xs">{lastVideoId}</span>
        </div>
      ) : null}

      {state === "recording" ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFC] p-4">
            <div className="text-xs text-gray-500">Chunking</div>
            <div className="mt-1 text-sm text-gray-900">
              Upload every <span className="font-mono">{chunkEverySec}s</span>
              {isChunkUploading ? " • uploading…" : ""}
            </div>
            <input
              type="range"
              min={15}
              max={180}
              step={15}
              value={chunkEverySec}
              onChange={(e) => setChunkEverySec(Number(e.target.value))}
              className="w-full mt-2"
              disabled={state !== "recording"}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>15s</span>
              <span>180s</span>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFC] p-4">
            <div className="text-xs text-gray-500">Progress</div>
            <div className="mt-1 text-sm text-gray-900">
              Chunks uploaded: <span className="font-mono">{chunksUploaded}</span>
            </div>
            {lastChunkStatus ? (
              <div className="mt-2 text-xs text-gray-600">{lastChunkStatus}</div>
            ) : (
              <div className="mt-2 text-xs text-gray-500">First upload happens automatically.</div>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-700">
          {state === "recording" ? (
            <span>
              Recording: <span className="font-mono">{formatDuration(durationSec)}</span>
            </span>
          ) : (
            <span className="text-gray-500">Tip: do a quick 10–20s test first.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {state !== "recording" ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={!canStart || state !== "idle"}
              className="px-4 py-2 rounded-lg bg-[#ffc8dd] hover:bg-[#ffbcd5] disabled:opacity-50 disabled:cursor-not-allowed text-[#1a1a1a] font-medium"
            >
              Start recording
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              disabled={isChunkUploading}
              className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-black text-white font-medium"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        This creates/updates a `live_sessions` row and stores transcript chunks under that session.
      </div>
    </div>
  );
}
