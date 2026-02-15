-- Migration: RTMS Integration
-- Description: Add real-time media streaming support for Zoom meetings
-- Created: 2026-02-14

-- Add RTMS fields to live_sessions table
ALTER TABLE live_sessions
ADD COLUMN rtms_stream_id TEXT,
ADD COLUMN rtms_status TEXT DEFAULT 'idle', -- idle | connecting | streaming | error
ADD COLUMN is_transcribing BOOLEAN DEFAULT FALSE,
ADD COLUMN transcription_started_at TIMESTAMPTZ,
ADD COLUMN last_transcript_at TIMESTAMPTZ;

-- Add real-time fields to transcript_chunks table
ALTER TABLE transcript_chunks
ADD COLUMN live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
ADD COLUMN speaker_id TEXT,
ADD COLUMN speaker_name TEXT,
ADD COLUMN is_realtime BOOLEAN DEFAULT FALSE,
ADD COLUMN sequence_number INTEGER,
ADD COLUMN confidence FLOAT;

-- Create rtms_connections table to track active RTMS streams
CREATE TABLE rtms_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    meeting_uuid TEXT NOT NULL,
    rtms_stream_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL, -- active | disconnected | error
    audio_buffer_size INTEGER DEFAULT 0,
    total_audio_received BIGINT DEFAULT 0,
    total_chunks_processed INTEGER DEFAULT 0,
    last_audio_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_transcript_chunks_live_session ON transcript_chunks(live_session_id);
CREATE INDEX idx_transcript_chunks_realtime ON transcript_chunks(is_realtime);
CREATE INDEX idx_transcript_chunks_sequence ON transcript_chunks(live_session_id, sequence_number);
CREATE INDEX idx_rtms_connections_session ON rtms_connections(live_session_id);
CREATE INDEX idx_rtms_connections_status ON rtms_connections(status);
CREATE INDEX idx_rtms_connections_stream_id ON rtms_connections(rtms_stream_id);

-- RLS policies for rtms_connections
ALTER TABLE rtms_connections ENABLE ROW LEVEL SECURITY;

-- Anyone can view active RTMS connections
CREATE POLICY "Anyone can view RTMS connections"
ON rtms_connections FOR SELECT
USING (true);

-- Only service role can insert/update RTMS connections (server-side only)
CREATE POLICY "Service role can manage RTMS connections"
ON rtms_connections FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Comment on tables and columns
COMMENT ON COLUMN live_sessions.rtms_stream_id IS 'Unique identifier for the RTMS stream connection';
COMMENT ON COLUMN live_sessions.rtms_status IS 'Current status of RTMS transcription: idle, connecting, streaming, or error';
COMMENT ON COLUMN live_sessions.is_transcribing IS 'Quick check if real-time transcription is currently active';
COMMENT ON COLUMN transcript_chunks.live_session_id IS 'Link to live session if this chunk is from real-time transcription';
COMMENT ON COLUMN transcript_chunks.is_realtime IS 'Flag indicating this chunk was generated in real-time vs batch processing';
COMMENT ON COLUMN transcript_chunks.sequence_number IS 'Chronological order within a live session for proper ordering';
COMMENT ON TABLE rtms_connections IS 'Tracks active RTMS WebSocket connections and their streaming metrics';
