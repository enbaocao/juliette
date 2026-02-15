-- Add YouTube support columns to videos table
ALTER TABLE videos
ADD COLUMN youtube_url TEXT,
ADD COLUMN source TEXT DEFAULT 'upload' CHECK (source IN ('upload', 'youtube'));

-- Add index for checking duplicate YouTube videos
CREATE INDEX idx_videos_youtube_url ON videos(youtube_url)
WHERE youtube_url IS NOT NULL;

-- Add comment explaining the new status values
COMMENT ON COLUMN videos.status IS 'Video processing status: downloading, uploaded, transcribed';

-- Add comment for source column
COMMENT ON COLUMN videos.source IS 'Video source: upload (direct file upload) or youtube (YouTube link)';

-- Add comment for youtube_url column
COMMENT ON COLUMN videos.youtube_url IS 'Original YouTube URL if source is youtube';

-- Allow storage_path to be empty initially for downloading videos
-- (it will be set by the download worker once the video is uploaded to storage)
ALTER TABLE videos ALTER COLUMN storage_path DROP NOT NULL;
