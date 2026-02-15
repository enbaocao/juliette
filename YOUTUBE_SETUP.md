# YouTube Video Ingestion Setup Guide

This guide walks through setting up and testing the YouTube video ingestion feature for Juliette.

## Overview

The YouTube ingestion feature allows users to paste YouTube video links instead of uploading video files. The system:

1. Downloads the video from YouTube using yt-dlp
2. Uploads it to Supabase Storage
3. Transcribes it using the existing transcription pipeline
4. Makes it available for Q&A

## Prerequisites

- yt-dlp installed (✅ Already installed: v2026.2.4)
- Supabase project with database access
- Node.js and npm/yarn

## Step 1: Apply Database Migration

The database migration adds support for YouTube videos by adding three columns to the `videos` table:
- `youtube_url` - Stores the original YouTube URL
- `source` - Tracks whether the video came from 'upload' or 'youtube'
- Updates `storage_path` to be nullable (set by worker after download)

### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste the following SQL:

```sql
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
```

5. Click **Run**
6. Verify success message

### Option B: Via Script (If exec_sql RPC is available)

```bash
npm run migrate
```

## Step 2: Start the Workers

You need to run TWO workers for the full pipeline:

### Terminal 1: YouTube Download Worker
```bash
npm run worker:youtube
```

This worker:
- Polls for download jobs
- Downloads videos from YouTube using yt-dlp
- Uploads to Supabase Storage
- Creates transcription jobs

### Terminal 2: Transcription Worker
```bash
npm run worker:transcription
```

This worker:
- Polls for transcription jobs
- Transcribes videos using OpenAI Whisper
- Creates transcript chunks
- Marks videos as ready

## Step 3: Start the Development Server

### Terminal 3: Next.js Dev Server
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Step 4: Test the YouTube Ingestion Flow

### Test Case 1: Add a YouTube Video

1. Navigate to http://localhost:3000/upload
2. Click the **"YouTube Link"** tab
3. Paste a YouTube URL (example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
4. Click **"Add YouTube Video"**
5. You should be redirected to `/videos/{id}`

**Expected Behavior:**
- Page shows: **"Downloading from YouTube"** status with blue indicator
- Download worker logs show: "Processing download job..."
- After 30-60 seconds (depending on video size):
  - Status changes to: **"Transcription in Progress"**
  - Transcription worker picks up the job
- After transcription completes:
  - Status changes to: **"Ready for Questions"**
  - "Start Asking Questions" button appears

### Test Case 2: Duplicate YouTube URL

1. Try adding the same YouTube URL again
2. The system should return the existing video without re-downloading
3. You should see a message: "This video has already been added"

### Test Case 3: Invalid YouTube URL

1. Try entering an invalid URL like `https://youtube.com/invalid`
2. Should see error: "Invalid YouTube URL. Please use format: youtube.com/watch?v=..."

### Test Case 4: Private/Unavailable Video

1. Try a private or deleted YouTube video
2. Download job should fail gracefully
3. Video status should remain 'uploaded' with error in jobs table

### Test Case 5: File Upload Still Works

1. Click the **"Upload File"** tab
2. Upload a video file (MP4, MOV, etc.)
3. Verify the original upload flow still works

## Monitoring

### Check Download Worker Logs

```bash
# Worker logs show:
📥 YouTube download worker started
Polling every 5000ms for new download jobs...
Processing download job abc123 for video xyz789
Downloading YouTube video: https://youtube.com/watch?v=...
✓ Downloaded video: 45678900 bytes
Uploading to Supabase Storage: videos/user-id/video-id.mp4
✓ Uploaded to storage: videos/user-id/video-id.mp4
✓ Created transcription job for video xyz789
✓ Download job abc123 completed successfully
```

### Check Database Tables

```sql
-- Check video record
SELECT id, title, status, source, youtube_url, created_at
FROM videos
ORDER BY created_at DESC
LIMIT 5;

-- Check download jobs
SELECT id, type, status, payload, error, created_at
FROM jobs
WHERE type = 'download'
ORDER BY created_at DESC
LIMIT 5;

-- Check transcription jobs
SELECT id, type, status, payload, created_at
FROM jobs
WHERE type = 'transcribe'
ORDER BY created_at DESC
LIMIT 5;
```

### Check Supabase Storage

1. Go to Supabase Dashboard → Storage → `videos` bucket
2. Navigate to `{user-id}/` folder
3. Verify downloaded YouTube videos are present with `.mp4` extension

## Troubleshooting

### Issue: "yt-dlp: command not found"

**Solution:**
```bash
brew install yt-dlp
# or
pip install yt-dlp
```

### Issue: Download takes too long or times out

**Possible causes:**
- Video is very large (>500MB limit)
- Slow network connection
- YouTube throttling

**Solution:**
- Check worker logs for timeout errors
- Verify video size is under 500MB
- Try a shorter video for testing

### Issue: "Failed to upload to storage"

**Possible causes:**
- Supabase Storage bucket not configured
- Service role key missing/invalid
- Insufficient permissions

**Solution:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Check Supabase Storage bucket exists and is named `videos`
- Verify bucket permissions allow uploads

### Issue: Migration fails with "column already exists"

**Solution:**
Migration was already applied. You can check with:
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'videos' AND column_name = 'youtube_url';
```

If it returns a row, the migration is already applied.

### Issue: Download succeeds but transcription doesn't start

**Possible causes:**
- Transcription worker not running
- OpenAI API key missing/invalid

**Solution:**
- Verify transcription worker is running: `npm run worker:transcription`
- Check `.env.local` for `OPENAI_API_KEY`
- Check jobs table for failed transcription jobs

## Architecture Overview

```
User pastes YouTube URL
    ↓
POST /api/upload-youtube
    ├─ Validates URL format
    ├─ Creates video record (status='downloading')
    └─ Creates download job
    ↓
YouTube Download Worker polls for jobs
    ├─ Executes yt-dlp to download video
    ├─ Uploads to Supabase Storage
    ├─ Updates video (status='uploaded')
    └─ Creates transcription job
    ↓
Transcription Worker polls for jobs
    ├─ Downloads video from Storage
    ├─ Calls OpenAI Whisper API
    ├─ Creates transcript chunks
    └─ Updates video (status='transcribed')
    ↓
Video ready for Q&A!
```

## Files Modified/Created

### New Files:
- `workers/youtube-download-worker.ts` - Worker to download YouTube videos
- `app/api/upload-youtube/route.ts` - API endpoint for YouTube URL submission
- `supabase/migrations/002_add_youtube_support.sql` - Database schema updates
- `scripts/apply-migration.ts` - Migration helper script
- `YOUTUBE_SETUP.md` - This guide

### Modified Files:
- `lib/types.ts` - Added 'download' job type, 'downloading' status, youtube_url field
- `components/upload/VideoUpload.tsx` - Added YouTube link tab and input
- `app/videos/[id]/page.tsx` - Added 'downloading' status display
- `package.json` - Added `worker:youtube` script

## Next Steps

After successful testing:

1. **Deploy to production:**
   - Ensure yt-dlp is installed on production server
   - Run database migration in production
   - Deploy workers as background processes
   - Configure worker monitoring/restart on failure

2. **Add enhancements:**
   - Progress tracking for downloads
   - Video thumbnail extraction
   - Support for YouTube playlists
   - Vimeo/other platform support

3. **Performance monitoring:**
   - Track download times
   - Monitor storage usage
   - Set up alerts for failed jobs

## Success Criteria

✅ User can paste YouTube URL and video gets transcribed
✅ Download process doesn't block UI (async via jobs)
✅ Error messages are clear and actionable
✅ Existing file upload functionality still works
✅ Videos from YouTube are indistinguishable from uploaded files once transcribed
✅ No duplicate downloads for same YouTube URL
✅ Download failures are handled gracefully

---

**Questions or issues?** Check the worker logs first, then inspect the database tables to see where the pipeline failed.
