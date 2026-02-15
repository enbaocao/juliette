-- Add fields for real-time transcription to transcript_chunks table
ALTER TABLE transcript_chunks
  ADD COLUMN IF NOT EXISTS live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_realtime BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sequence_number INTEGER,
  ADD COLUMN IF NOT EXISTS speaker_id TEXT,
  ADD COLUMN IF NOT EXISTS speaker_name TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_live_session ON transcript_chunks(live_session_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_realtime ON transcript_chunks(is_realtime);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_sequence ON transcript_chunks(live_session_id, sequence_number);

-- Allow viewing transcripts from active live sessions
CREATE POLICY IF NOT EXISTS "Users can view transcripts from active live sessions"
  ON transcript_chunks FOR SELECT
  USING (
    live_session_id IN (
      SELECT id FROM live_sessions WHERE status = 'active'
    )
  );
