-- Make storage_path optional for direct transcription workflow
-- Videos from direct transcription don't need storage since we don't store the video file

ALTER TABLE videos
ALTER COLUMN storage_path DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN videos.storage_path IS 'Path to video file in Supabase Storage. NULL for videos transcribed directly without storage (e.g., Zoom recordings).';
