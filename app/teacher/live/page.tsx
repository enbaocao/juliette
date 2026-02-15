"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TeacherAudioRecorder from "@/components/teacher/TeacherAudioRecorder";

function normalizeMeetingKey(input: string) {
  // Accept meeting numbers like "123 456 789" or pasted variants.
  // We normalize to digits-only so matching is stable.
  return input.replace(/\D/g, "");
}

export default function TeacherLivePage() {
  const [meetingKey, setMeetingKey] = useState("");
  const [meetingNumber, setMeetingNumber] = useState("");
  const [title, setTitle] = useState("");

  const normalizedMeetingKey = useMemo(
    () => normalizeMeetingKey(meetingKey),
    [meetingKey],
  );

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/teacher"
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-['Souvenir',sans-serif] font-medium text-[#1a1a1a]">
            Live Session (Website Recorder)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Paste your Zoom meeting ID (numbers), start recording, and your students’ Zoom apps
            will auto-connect to the session.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900">Meeting info</h2>
          <p className="text-sm text-gray-600 mt-1">
            This is the only “manual” step: make sure the meeting ID matches the one the Zoom
            app sees.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-xs text-gray-500">Meeting ID (numbers)</div>
              <input
                value={meetingKey}
                onChange={(e) => setMeetingKey(e.target.value)}
                placeholder="e.g. 123 456 789"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
              />
            </label>

            <label className="block">
              <div className="text-xs text-gray-500">Meeting Number</div>
              <input
                value={meetingNumber}
                onChange={(e) => setMeetingNumber(e.target.value)}
                placeholder="e.g. 123456789"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
              />
            </label>

            <label className="block md:col-span-2">
              <div className="text-xs text-gray-500">Session title (optional)</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Algebra 2 — Week 3"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="mt-6">
          <TeacherAudioRecorder
            meetingKey={normalizedMeetingKey}
            meetingNumber={normalizeMeetingKey(meetingNumber)}
            title={title.trim() || undefined}
          />
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900">What students do</h3>
          <p className="text-sm text-gray-600 mt-1">
            They open the Juliette panel in Zoom. If you started the session with the
            same meeting ID, their panel will show “Live session active” and they can
            ask questions immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
