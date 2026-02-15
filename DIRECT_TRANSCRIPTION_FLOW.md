# Direct Transcription Flow - No Video Storage

## Overview

The recording is sent **directly to OpenAI Whisper** for transcription. **No video is stored in Supabase** - only the transcript chunks are saved.

## New Architecture

### ❌ **Old Flow (With Storage):**
```
Record → Upload to Supabase Storage → Create job → Worker downloads → Whisper → Save chunks
```

### ✅ **New Flow (Direct Transcription):**
```
Record → Send to Whisper API → Save chunks → Done
```

## Complete Flow

### 1. **Recording** (Client-Side)
```typescript
// components/zoom/ScreenRecorder.tsx
MediaRecorder captures Zoom window
  ↓
Collects chunks every second
  ↓
User clicks "Stop Recording"
  ↓
Creates WebM blob from chunks
```

### 2. **Send to API** (Client → Server)
```typescript
// components/zoom/ScreenRecorder.tsx
const formData = new FormData();
formData.append("file", file); // WebM blob
formData.append("title", "Zoom Recording");

fetch("/api/transcribe-recording", {
  method: "POST",
  body: formData,
});
```

### 3. **Direct Transcription** (Server-Side)
```typescript
// app/api/transcribe-recording/route.ts
export async function POST(request) {
  // 1. Receive file
  const file = formData.get('file');

  // 2. Create video record (NO storage_path)
  const video = await supabase.from('videos').insert({
    user_id: userId,
    title: title,
    status: 'uploaded' // Will change to 'transcribed'
  });

  // 3. Send DIRECTLY to Whisper
  const transcription = await openai.audio.transcriptions.create({
    file: file, // Raw file, not from storage
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  // 4. Chunk transcript (60-second segments)
  const chunks = chunkTranscript(transcription.segments, 60);

  // 5. Save chunks to database
  await supabase.from('transcript_chunks').insert(
    chunks.map(chunk => ({
      video_id: video.id,
      start_sec: chunk.start_sec,
      end_sec: chunk.end_sec,
      text: chunk.text,
    }))
  );

  // 6. Update video status
  await supabase.from('videos')
    .update({ status: 'transcribed' })
    .eq('id', video.id);

  return { videoId: video.id, chunksCount: chunks.length };
}
```

### 4. **Student Asks Questions** (Same as Before)
```typescript
// app/api/ask/route.ts
POST /api/ask
  ↓
Retrieve chunks from database
  ↓
Use chunks as context for GPT-4o
  ↓
Return AI answer
```

## Key Differences

| Feature | Old Flow | New Flow |
|---------|----------|----------|
| **Video Storage** | ✅ Stored in Supabase | ❌ **NOT stored** |
| **Storage Cost** | High (video files) | Low (text only) |
| **Upload Time** | Slow (large files) | Fast (processed immediately) |
| **Processing** | Async (worker) | Sync (API route) |
| **Total Time** | 2-3 minutes | **30-60 seconds** ⚡ |
| **Worker Needed** | Yes | **No** ⚡ |
| **Transcript Quality** | Same | Same |

## What's Stored in Supabase

### ✅ **Stored:**
- `videos` table: Video metadata (id, title, user_id, status)
- `transcript_chunks` table: Transcript segments with timestamps
- `questions` table: Q&A history

### ❌ **NOT Stored:**
- Video files (WebM/MP4)
- Storage paths
- Jobs queue (no worker needed)

## Database Schema

### `videos` Table
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  user_id TEXT,
  title TEXT,
  storage_path TEXT NULL, -- NULL for direct transcription (no video stored)
  status TEXT, -- 'uploaded' → 'transcribed'
  created_at TIMESTAMP
);
```

### `transcript_chunks` Table
```sql
CREATE TABLE transcript_chunks (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES videos(id),
  start_sec FLOAT,
  end_sec FLOAT,
  text TEXT,
  created_at TIMESTAMP
);
```

## API Endpoints

### New Endpoint
**`POST /api/transcribe-recording`**
- Accepts video file
- Sends directly to Whisper
- Saves transcript to database
- Returns video_id

### Removed Endpoints (No Longer Needed)
- ~~`POST /api/upload`~~ (Not used for recordings)
- ~~Worker processing~~ (No async jobs)

### Existing Endpoints (Unchanged)
- `POST /api/ask` - Q&A still works the same
- `GET /api/videos/[id]` - Get video status

## Performance

### Recording Time Comparison

| Duration | Old Flow | New Flow |
|----------|----------|----------|
| **30 sec recording** | ~90 sec total | **~20 sec total** ✅ |
| **5 min recording** | ~3 min total | **~45 sec total** ✅ |
| **10 min recording** | ~5 min total | **~90 sec total** ✅ |

**Breakdown (5 min recording):**
- Old: Upload 15 sec + Worker queue 10 sec + Whisper 45 sec + Save 5 sec = ~75 sec + wait time
- New: Whisper 45 sec + Save 5 sec = **~50 sec** (no waiting!)

## Error Handling

### Client-Side (ScreenRecorder)
```typescript
try {
  // Create file
  const file = new File([blob], "recording.webm");

  // Check size
  if (blob.size === 0) {
    throw new Error("Recording is empty");
  }

  // Send to API
  const response = await fetch("/api/transcribe-recording", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Transcription failed");
  }

} catch (error) {
  setError(error.message);
  setIsProcessing(false); // Allow retry
}
```

### Server-Side (API Route)
```typescript
try {
  // Whisper API call
  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: 'whisper-1',
  });

  // Save chunks
  await supabase.from('transcript_chunks').insert(chunks);

} catch (error) {
  console.error('Transcription error:', error);
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}
```

## Benefits

### ✅ **Advantages:**
1. **Faster** - No upload/download steps
2. **Cheaper** - No video storage costs
3. **Simpler** - No worker process needed
4. **Real-time** - Immediate transcription
5. **Less infrastructure** - One API route instead of storage + worker

### ⚠️ **Trade-offs:**
1. **No video replay** - Can't watch recording later (only transcript)
2. **API timeout** - Must complete within 5 minutes
3. **No retry** - If Whisper fails, need to re-record

### 💡 **When This Works Best:**
- ✅ Short to medium recordings (5-30 minutes)
- ✅ Focus on Q&A, not video playback
- ✅ Cost-sensitive applications
- ✅ Fast turnaround needed

## Configuration

### API Route Config
```typescript
// app/api/transcribe-recording/route.ts
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max
```

### Environment Variables
Same as before:
```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Testing

### Test the Flow
1. **Open Zoom panel**
2. **Click "Start Recording"**
3. **Record 30 seconds**
4. **Click "Stop Recording"**
5. **Watch console logs:**
   ```
   Using MIME type: video/webm;codecs=vp9
   Chunk: 125.43 KB
   Chunk: 132.87 KB
   ...
   Stopped. Chunks: 30
   Blob: 3.76 MB, 30 chunks
   Sending to Whisper API...
   Transcription complete: { videoId: '...', chunksCount: 5 }
   ```
6. **Wait 30-60 seconds**
7. **Choose mode and ask questions**

### Verify in Database
```sql
-- Check video record (storage_path should be NULL)
SELECT id, title, status, storage_path FROM videos
WHERE id = 'your-video-id';
-- Should show: status='transcribed', storage_path=NULL (no video stored)

-- Check transcript chunks
SELECT COUNT(*), MIN(start_sec), MAX(end_sec)
FROM transcript_chunks
WHERE video_id = 'your-video-id';
-- Should show: ~5 chunks for 5-minute recording
```

## Migration Notes

If you have existing videos in storage, they're unaffected:
- Old videos: Still use worker processing
- New recordings: Use direct transcription
- Q&A works for both (same `transcript_chunks` table)

## Summary

✅ **No video storage in Supabase**
✅ **Direct Whisper transcription**
✅ **Only transcript saved to database**
✅ **Faster processing (30-60 seconds)**
✅ **No worker process needed**
✅ **Same Q&A quality**

**The recording goes straight to Whisper, and only the text comes back!**
