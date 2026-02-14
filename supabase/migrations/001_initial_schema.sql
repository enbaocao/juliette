-- Create videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'uploaded', -- uploaded, transcribed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transcript_chunks table
CREATE TABLE transcript_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    start_sec FLOAT NOT NULL,
    end_sec FLOAT NOT NULL,
    text TEXT NOT NULL,
    embedding VECTOR(1536), -- Optional: for vector search with pgvector
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    question TEXT NOT NULL,
    mode TEXT NOT NULL, -- simple, practice, animation
    interest_tags TEXT[], -- For personalized practice problems
    answer JSONB, -- Stores the AI response
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create jobs table for async processing
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- transcribe, render
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    result_path TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_transcript_chunks_video_id ON transcript_chunks(video_id);
CREATE INDEX idx_questions_video_id ON questions(video_id);
CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policies (basic - adjust based on your auth requirements)
CREATE POLICY "Users can view their own videos"
    ON videos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos"
    ON videos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view transcripts of their videos"
    ON transcript_chunks FOR SELECT
    USING (video_id IN (SELECT id FROM videos WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own questions"
    ON questions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own questions"
    ON questions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
