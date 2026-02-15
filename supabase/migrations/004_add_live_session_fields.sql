-- Add missing fields used by RTMS service to live_sessions
ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS meeting_password TEXT,
  ADD COLUMN IF NOT EXISTS is_transcribing BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transcription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_transcript_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rtms_status TEXT,
  ADD COLUMN IF NOT EXISTS rtms_stream_id TEXT;

-- Index for quick lookup by rtms_stream_id
CREATE INDEX IF NOT EXISTS idx_live_sessions_rtms_stream_id ON live_sessions(rtms_stream_id);
