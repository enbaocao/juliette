'use client';

import { useState, useEffect } from 'react';

interface TranscriptionStatusProps {
  sessionId: string;
}

interface StatusData {
  rtms_status: 'idle' | 'connecting' | 'streaming' | 'error';
  is_transcribing: boolean;
  total_chunks_processed?: number;
  last_audio_at?: string;
  connected_at?: string;
}

export default function TranscriptionStatus({ sessionId }: TranscriptionStatusProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/rtms/status?session_id=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (err) {
        console.error('Error fetching transcription status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!status || status.rtms_status === 'idle') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-600">
          📝 Live transcription not active
        </p>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status.rtms_status) {
      case 'streaming':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status.rtms_status) {
      case 'streaming':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getTimeSince = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="bg-white border border-[#ffc2d1] rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-[#1a1a1a] flex items-center">
          {getStatusIcon()} Transcription Status
        </h4>
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {status.rtms_status.toUpperCase()}
        </span>
      </div>

      {status.rtms_status === 'streaming' && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Chunks processed:</span>
            <span className="font-medium text-[#1a1a1a]">
              {status.total_chunks_processed || 0}
            </span>
          </div>

          {status.last_audio_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Last audio:</span>
              <span className="font-medium text-[#1a1a1a]">
                {getTimeSince(status.last_audio_at)}
              </span>
            </div>
          )}

          {status.connected_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Started:</span>
              <span className="font-medium text-[#1a1a1a]">
                {formatTime(status.connected_at)}
              </span>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Real-time transcription active
            </div>
          </div>
        </div>
      )}

      {status.rtms_status === 'connecting' && (
        <div className="flex items-center text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#ffc8dd] mr-2"></div>
          Establishing connection...
        </div>
      )}

      {status.rtms_status === 'error' && (
        <div className="text-sm text-red-600">
          ⚠️ An error occurred. Please restart transcription.
        </div>
      )}
    </div>
  );
}
