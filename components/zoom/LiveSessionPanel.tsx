'use client';

import { useState, useEffect } from 'react';
import { ZoomMeetingContext } from '@/hooks/useZoomApp';
import { LiveSession } from '@/lib/types';
import HostControls from './HostControls';
import StudentView from './StudentView';

interface LiveSessionPanelProps {
  context: ZoomMeetingContext;
}

export default function LiveSessionPanel({ context }: LiveSessionPanelProps) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([]);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);

  // Load active sessions; students pick one (avoids meeting-role-only Zoom APIs)
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setSessionLoadError(null);
        const response = await fetch('/api/live-sessions/active');
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load sessions');
        }

        setActiveSessions(data.sessions || []);
      } catch (error) {
        console.error('Error checking session:', error);
        setSessionLoadError(error instanceof Error ? error.message : 'Failed to load sessions');
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadSessions();

    // Poll for session updates every 10 seconds
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSessionCreated = (newSession: LiveSession) => {
    setSession(newSession);
  };

  const handleSessionEnded = () => {
    setSession(null);
  };

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffc8dd]"></div>
      </div>
    );
  }

  // Students auto-join the live session (no recording in Zoom)
  if (context.role !== 'host') {
    if (session) {
      return <StudentView context={context} session={session} />;
    }

    return (
      <div className="flex flex-col h-full bg-[#FAFAFC]">
        <div className="bg-white border-b border-gray-100 p-4 shadow-sm">
          <h1 className="text-xl font-['Souvenir',sans-serif] font-medium text-[#1a1a1a]">Juliette</h1>
          <p className="text-sm text-gray-600 mt-1">📚 Student View</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900">Pick your live session</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select the session your teacher started.
            </p>

            {sessionLoadError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {sessionLoadError}
              </div>
            ) : null}

            {activeSessions.length === 0 ? (
              <div className="mt-4 rounded-xl border border-gray-200 bg-[#FAFAFC] px-4 py-3">
                <p className="text-sm text-gray-700 font-medium">No active sessions yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Ask your teacher to start a session on the website.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {activeSessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSession(s)}
                    className="w-full text-left rounded-xl border border-gray-200 hover:border-[#ffc8dd] hover:shadow-sm transition-all px-4 py-3 bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {s.title || 'Live Session'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          Meeting: {s.meeting_number}
                        </div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Live
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

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

  // Hosts get the full controls
  return (
    <div className="flex flex-col h-screen bg-[#FAFAFC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 shadow-sm">
        <h1 className="text-xl font-['Souvenir',sans-serif] font-medium text-[#1a1a1a]">Juliette</h1>
        <p className="text-sm text-gray-600 mt-1">🎓 Teacher View</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <HostControls
          context={context}
          session={session}
          onSessionCreated={handleSessionCreated}
          onSessionEnded={handleSessionEnded}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 p-2 text-center">
        <p className="text-xs text-gray-500">
          Powered by Juliette AI • {context.userName}
        </p>
      </div>
    </div>
  );
}
