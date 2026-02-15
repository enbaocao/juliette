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

  // Check if there's an active session for this meeting
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(
          `/api/live-sessions/check?meeting_uuid=${encodeURIComponent(context.meetingUUID)}`
        );

        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    checkSession();

    // Poll for session updates every 10 seconds
    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, [context.meetingUUID]);

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

  return (
    <div className="flex flex-col h-screen bg-[#FAFAFC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 shadow-sm">
        <h1 className="text-xl font-['Souvenir',sans-serif] font-medium text-[#1a1a1a]">Juliette</h1>
        <p className="text-sm text-gray-600 mt-1">
          {context.role === 'host' ? '🎓 Teacher View' : '📚 Student View'}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {context.role === 'host' ? (
          <HostControls
            context={context}
            session={session}
            onSessionCreated={handleSessionCreated}
            onSessionEnded={handleSessionEnded}
          />
        ) : (
          <StudentView
            context={context}
            session={session}
          />
        )}
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
