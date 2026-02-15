// Database types
export interface Video {
  id: string;
  user_id: string;
  title: string;
  storage_path: string;
  status: 'downloading' | 'uploaded' | 'transcribed';
  youtube_url?: string;
  source?: 'upload' | 'youtube';
  created_at: string;
}

export interface TranscriptChunk {
  id: string;
  video_id?: string;
  live_session_id?: string;
  start_sec: number;
  end_sec: number;
  text: string;
  embedding?: number[];
  speaker_id?: string;
  speaker_name?: string;
  is_realtime?: boolean;
  sequence_number?: number;
  confidence?: number;
  created_at: string;
}

export interface Question {
  id: string;
  video_id: string;
  user_id: string;
  question: string;
  mode: 'simple' | 'practice' | 'animation';
  interest_tags?: string[];
  answer?: {
    content: string;
    references?: { start_sec: number; end_sec: number; text: string }[];
    animation_url?: string;
  };
  live_session_id?: string;
  is_live?: boolean;
  created_at: string;
}

export interface LiveSession {
  id: string;
  meeting_uuid: string;
  meeting_number: string;
  video_id?: string;
  host_user_id: string;
  title?: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'ended';
  rtms_stream_id?: string;
  rtms_status?: 'idle' | 'connecting' | 'streaming' | 'error';
  is_transcribing?: boolean;
  transcription_started_at?: string;
  last_transcript_at?: string;
  created_at: string;
}

export interface Job {
  id: string;
  type: 'transcribe' | 'render' | 'download';
  payload: {
    video_id?: string;
    storage_path?: string;
    youtube_url?: string;
    user_id?: string;
    template?: string;
    params?: Record<string, any>;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_path?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface RTMSConnection {
  id: string;
  live_session_id: string;
  meeting_uuid: string;
  rtms_stream_id: string;
  status: 'active' | 'disconnected' | 'error';
  audio_buffer_size?: number;
  total_audio_received?: string;
  total_chunks_processed?: number;
  last_audio_at?: string;
  connected_at: string;
  disconnected_at?: string;
  error_message?: string;
  created_at: string;
}
