-- Create live_sessions table for Zoom integration
CREATE TABLE live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_uuid TEXT NOT NULL UNIQUE, -- Zoom's unique meeting identifier
    meeting_number TEXT NOT NULL,      -- Human-readable meeting number
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL, -- Optional: link to a specific lecture video
    host_user_id UUID NOT NULL,        -- Teacher/host who started the session
    title TEXT,                        -- Optional session title
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active', -- active, ended
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add live_session_id to questions table to track live class questions
ALTER TABLE questions
ADD COLUMN live_session_id UUID REFERENCES live_sessions(id) ON DELETE SET NULL,
ADD COLUMN is_live BOOLEAN DEFAULT FALSE; -- Quick flag for filtering live questions

-- Create indexes
CREATE INDEX idx_live_sessions_meeting_uuid ON live_sessions(meeting_uuid);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_live_sessions_host ON live_sessions(host_user_id);
CREATE INDEX idx_questions_live_session ON questions(live_session_id);
CREATE INDEX idx_questions_is_live ON questions(is_live);

-- Enable Row Level Security
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_sessions
CREATE POLICY "Anyone can view active sessions"
    ON live_sessions FOR SELECT
    USING (status = 'active');

CREATE POLICY "Hosts can insert their own sessions"
    ON live_sessions FOR INSERT
    WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update their own sessions"
    ON live_sessions FOR UPDATE
    USING (auth.uid() = host_user_id);

-- Update questions policies to allow viewing live questions
CREATE POLICY "Users can view questions in active live sessions"
    ON questions FOR SELECT
    USING (
        live_session_id IN (
            SELECT id FROM live_sessions WHERE status = 'active'
        )
    );

-- Allow anyone in an active session to ask questions
CREATE POLICY "Users can insert questions in active sessions"
    ON questions FOR INSERT
    WITH CHECK (
        live_session_id IN (
            SELECT id FROM live_sessions WHERE status = 'active'
        )
    );
