// Database types
export interface Video {
  id: string;
  user_id: string;
  title: string;
  storage_path: string;
  status: 'uploaded' | 'transcribed';
  created_at: string;
}

export interface TranscriptChunk {
  id: string;
  video_id: string;
  start_sec: number;
  end_sec: number;
  text: string;
  embedding?: number[];
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
  created_at: string;
}

export interface Job {
  id: string;
  type: 'transcribe' | 'render';
  payload: {
    video_id?: string;
    storage_path?: string;
    template?: string;
    params?: Record<string, any>;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_path?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}
