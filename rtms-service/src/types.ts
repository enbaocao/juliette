// Type definitions for RTMS service

export interface RTMSConfig {
  meetingUUID: string;
  meetingNumber: string;
  rtmsStreamId: string;
  liveSessionId: string;
}

export interface AudioFrame {
  data: Buffer;
  timestamp: number;
  sampleRate: number;
  channels: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface WhisperResponse {
  text: string;
  segments: TranscriptionSegment[];
  language?: string;
  duration?: number;
}

export interface RTMSConnection {
  id: string;
  liveSessionId: string;
  meetingUUID: string;
  rtmsStreamId: string;
  status: 'active' | 'disconnected' | 'error';
  audioBufferSize: number;
  totalAudioReceived: bigint;
  totalChunksProcessed: number;
  lastAudioAt?: Date;
  connectedAt: Date;
  disconnectedAt?: Date;
  errorMessage?: string;
}

export interface TranscriptChunk {
  id?: string;
  liveSessionId: string;
  startSec: number;
  endSec: number;
  text: string;
  isRealtime: boolean;
  sequenceNumber: number;
  speakerName?: string;
  confidence?: number;
  createdAt?: Date;
}

export interface ZoomWebhookEvent {
  event: string;
  event_ts: number;
  payload: {
    account_id: string;
    object: {
      id: string;
      uuid: string;
      host_id: string;
      topic: string;
      type: number;
      start_time: string;
      duration: number;
      timezone: string;
      rtms_stream_id?: string;
    };
  };
}
