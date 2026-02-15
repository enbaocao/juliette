# Transcription Pipeline - Complete Flow

## Overview

The transcription pipeline automatically processes recorded videos from the Zoom panel (or website) through OpenAI's Whisper ASR and makes them available for AI-powered Q&A.

## Complete Flow

### 1. **Video Recording** (Zoom Panel)
```typescript
// components/zoom/ScreenRecorder.tsx
Student clicks "Start Recording"
  ↓
Browser captures Zoom window + audio via getDisplayMedia()
  ↓
MediaRecorder creates WebM file
  ↓
Student clicks "Stop Recording"
```

### 2. **Upload to Supabase** (API Route)
```typescript
// app/api/upload/route.ts
POST /api/upload
  ↓
Receive WebM file from ScreenRecorder
  ↓
Upload to Supabase Storage → videos/[user_id]/[uuid].webm
  ↓
Create record in 'videos' table (status: 'uploaded')
  ↓
Create 'transcribe' job in 'jobs' table (status: 'pending')
  ↓
Return videoId to client
```

### 3. **Worker Processes Job** (Background Worker)
```typescript
// workers/transcription-worker.ts
Poll 'jobs' table every 5 seconds
  ↓
Find pending 'transcribe' jobs
  ↓
Update job status → 'processing'
  ↓
Download video from Supabase Storage
  ↓
Send to OpenAI Whisper API
```

### 4. **OpenAI Whisper Transcription**
```typescript
// OpenAI API Call
openai.audio.transcriptions.create({
  file: videoStream,
  model: 'whisper-1',
  response_format: 'verbose_json',
  timestamp_granularities: ['segment']
})
  ↓
Returns: {
  text: "full transcription...",
  segments: [
    { start: 0.0, end: 5.2, text: "Hello everyone..." },
    { start: 5.2, end: 12.8, text: "Today we'll discuss..." },
    ...
  ]
}
```

### 5. **Chunk & Save to Supabase**
```typescript
// workers/transcription-worker.ts
Take segments from Whisper
  ↓
Group into 60-second chunks
  ↓
Insert into 'transcript_chunks' table:
  - video_id
  - start_sec
  - end_sec
  - text
  ↓
Update 'videos' table → status: 'transcribed'
  ↓
Update 'jobs' table → status: 'completed'
```

### 6. **Student Asks Question** (Q&A)
```typescript
// app/api/ask/route.ts
POST /api/ask
  ↓
Retrieve relevant chunks via keyword matching
  ↓
retrieveRelevantChunks(videoId, question)
  ↓
Returns top 5 most relevant chunks
```

### 7. **GPT-4o Generates Answer**
```typescript
// app/api/ask/route.ts
Build prompt with chunks as context
  ↓
Call GPT-4o with system + user prompts
  ↓
OpenAI returns answer based on transcript chunks
  ↓
Save question + answer to 'questions' table
  ↓
Return to client
```

### 8. **Display to Student**
```typescript
// components/zoom/SimpleStudentView.tsx
Mode selection screen appears
  ↓
Student clicks a mode (Simple/Animation/Practice)
  ↓
Opens full Q&A interface in browser
  ↓
Student can ask unlimited questions
```

## Key Components

### Transcription Worker
**File:** `workers/transcription-worker.ts`

**Features:**
- ✅ Polls jobs table every 5 seconds
- ✅ Processes one job at a time
- ✅ Downloads video from Supabase
- ✅ Calls OpenAI Whisper API
- ✅ Chunks transcript into 60-second segments
- ✅ Saves to database
- ✅ Cleans up temp files
- ✅ Error handling & logging

**Start Command:**
```bash
npm run worker:transcription
# or
ts-node workers/transcription-worker.ts
```

### Upload API
**File:** `app/api/upload/route.ts`

**What it does:**
- Receives video file
- Uploads to Supabase Storage
- Creates video record
- Creates transcription job

### Ask API
**File:** `app/api/ask/route.ts`

**What it does:**
- Retrieves relevant transcript chunks
- Builds prompts based on mode
- Calls GPT-4o for answer
- Saves question/answer
- Returns result

### Retrieval Function
**File:** `utils/retrieval.ts`

**Strategies:**
- **Keyword matching** (MVP) - Simple TF-IDF style scoring
- **Future:** Vector embeddings + similarity search

## Database Schema

### `videos` Table
```sql
id          UUID PRIMARY KEY
user_id     TEXT
title       TEXT
storage_path TEXT
status      TEXT -- 'uploaded' | 'transcribed'
created_at  TIMESTAMP
```

### `transcript_chunks` Table
```sql
id          UUID PRIMARY KEY
video_id    UUID REFERENCES videos(id)
start_sec   FLOAT
end_sec     FLOAT
text        TEXT
created_at  TIMESTAMP
```

### `jobs` Table
```sql
id          UUID PRIMARY KEY
type        TEXT -- 'transcribe' | 'render' | 'download'
payload     JSONB
status      TEXT -- 'pending' | 'processing' | 'completed' | 'failed'
error       TEXT
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### `questions` Table
```sql
id              UUID PRIMARY KEY
video_id        UUID REFERENCES videos(id)
user_id         TEXT
question        TEXT
mode            TEXT -- 'simple' | 'practice' | 'animation'
interest_tags   TEXT[]
answer          JSONB
created_at      TIMESTAMP
```

## Example Flow

### Student Records 5-Minute Lecture

**Recording:**
- Duration: 5:00
- File size: ~15-25 MB
- Format: WebM (VP8 + Opus)

**Upload:**
- Takes ~5-10 seconds
- Stored in Supabase Storage

**Transcription:**
- Whisper processes: ~30-60 seconds
- Returns ~20-30 segments
- Creates ~5 chunks (60-sec each)

**Q&A:**
- Retrieves top 5 relevant chunks
- GPT-4o processes: ~2-5 seconds
- Returns contextualized answer

**Total Time:** ~1-2 minutes from recording to first question

## Environment Variables

Required for transcription pipeline:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Demo User (for unauthenticated testing)
DEMO_USER_ID=demo-user-123
```

## Starting the Worker

### Development
```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start transcription worker
npm run worker:transcription
```

### Production
```bash
# Start Next.js
npm run build
npm start

# Start worker (in separate process/container)
node workers/transcription-worker.js
```

### Docker (Recommended for Production)
```dockerfile
# Separate container for worker
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["node", "workers/transcription-worker.js"]
```

## Monitoring

### Check Worker Status
```bash
# View worker logs
tail -f logs/transcription-worker.log
```

### Check Job Queue
```sql
-- Active jobs
SELECT * FROM jobs
WHERE type = 'transcribe'
AND status = 'pending'
ORDER BY created_at;

-- Failed jobs
SELECT * FROM jobs
WHERE type = 'transcribe'
AND status = 'failed'
ORDER BY created_at DESC;
```

### Check Transcriptions
```sql
-- Videos awaiting transcription
SELECT id, title, status, created_at
FROM videos
WHERE status = 'uploaded'
ORDER BY created_at DESC;

-- Recently transcribed
SELECT v.id, v.title, COUNT(tc.id) as chunk_count
FROM videos v
LEFT JOIN transcript_chunks tc ON tc.video_id = v.id
WHERE v.status = 'transcribed'
GROUP BY v.id, v.title
ORDER BY v.created_at DESC;
```

## Error Handling

### Worker Errors
- **Download fails** → Job marked as 'failed' with error
- **Whisper fails** → Job marked as 'failed' with error
- **Database insert fails** → Job marked as 'failed' with error
- **Worker crash** → Restart automatically (use PM2 or Docker restart policy)

### Client Errors
- **No chunks found** → Returns error message
- **Video not transcribed** → Shows "Processing..." state
- **API timeout** → Shows error, allows retry

## Performance

### Whisper API Limits
- **Max file size:** 25 MB
- **Max duration:** ~2 hours (in practice)
- **Processing time:** ~0.1x of audio duration
  - 10 min video = ~1 min processing
  - 60 min video = ~6 min processing

### Optimization Tips
1. **Chunk videos** - For long recordings, split into smaller files
2. **Queue management** - Process jobs in parallel (multiple workers)
3. **Caching** - Store processed chunks, don't reprocess
4. **Compression** - Use WebM with lower bitrate for smaller files

## Troubleshooting

### "Transcription taking too long"
- Check worker logs: `tail -f logs/transcription-worker.log`
- Verify OpenAI API key is set
- Check Whisper API status
- Confirm worker is running

### "No chunks found for video"
- Check video status: Should be 'transcribed'
- Query transcript_chunks table for video_id
- Check jobs table for errors
- Verify worker processed the job

### "Worker not processing jobs"
- Confirm worker is running
- Check environment variables
- Verify database connection
- Check OpenAI API quota

## Summary

✅ **Complete pipeline implemented**
✅ **OpenAI Whisper integration working**
✅ **Supabase storage & database connected**
✅ **Chunk-based retrieval functional**
✅ **Q&A uses transcriptions as context**
✅ **All three modes (Simple/Practice/Animation) supported**

The pipeline is production-ready and processes recordings automatically!
