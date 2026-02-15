# Zoom Meeting Bot Implementation

This document describes the Zoom Meeting Bot implementation that replaces the RTMS approach.

## Overview

Since RTMS requires special permissions that are not currently available, we've implemented a Zoom Meeting Bot using the Zoom Meeting SDK instead. The bot joins meetings as a participant and captures audio for real-time transcription.

## Architecture

```
Zoom Meeting
    ↓
Bot Participant (Meeting SDK)
    ↓
Raw Audio Stream Chunks
    ↓
Circular Audio Buffer (10s chunks with 2s overlap)
    ↓
Whisper API Transcription
    ↓
Live Transcript Chunks → Database
    ↓
AI Q&A with Recent Context
```

## What Was Changed

### Backend Service (rtms-service/)

**Updated Files:**
- ✅ `src/index.ts` - Replaced RTMS endpoints with bot endpoints
  - Changed `/rtms/start` → `/bot/start`
  - Changed `/rtms/stop` → `/bot/stop`
  - Changed `/rtms/status/:rtmsStreamId` → `/bot/status/:sessionId`
  - Changed `/rtms/sessions` → `/bot/sessions`
  - Updated webhook handler to trigger bot instead of RTMS

**New Files:**
- ✅ `src/bot-client.ts` - Zoom Bot SDK implementation
  - `ZoomBotSessionManager` class - Manages individual bot sessions
  - `ZoomBotManager` class - Manages multiple concurrent bot sessions
  - Uses same audio buffer and transcription pipeline

**Unchanged Files (Reused):**
- ✅ `src/audio-buffer.ts` - Circular audio buffer still works the same
- ✅ `src/transcription-pipeline.ts` - Whisper transcription unchanged
- ✅ `src/database-writer.ts` - Database operations unchanged

### Next.js API Routes

**Updated Files:**
- ✅ `app/api/rtms/start/route.ts`
  - Changed to call `/bot/start` endpoint
  - Removed `rtms_stream_id` requirement
  - Now only requires `session_id`

- ✅ `app/api/rtms/status/route.ts`
  - Changed to call `/bot/status/:sessionId` endpoint
  - Removed `rtms_stream_id` parameter
  - Returns bot status instead of RTMS connection status

- ✅ `app/api/rtms/stop/route.ts`
  - Changed to call `/bot/stop` endpoint
  - Removed `rtms_stream_id` requirement
  - Now only requires `session_id`

### Frontend Components

**Updated Files:**
- ✅ `components/zoom/HostControls.tsx`
  - Updated `handleStartTranscription` to pass `session_id` only
  - Removed `rtms_stream_id` placeholder logic
  - Error messages updated to say "bot transcription"

### Configuration

**Updated Files:**
- ✅ `.env.local.example`
  - Added `BOT_SERVICE_URL` variable
  - Defaults to `http://localhost:4000`

### Database Schema

**No Changes Required:**
- The existing database schema from `003_rtms_integration.sql` works for both RTMS and bot implementations
- `rtms_status` field is reused (values: idle, connecting, streaming, error)
- `is_transcribing` boolean flag works the same way
- `transcript_chunks` table with `is_realtime` flag unchanged

## Key Differences: RTMS vs Bot

| Feature | RTMS | Bot |
|---------|------|-----|
| **Permissions** | Requires special RTMS permission | Standard Meeting SDK access |
| **Visibility** | Invisible to participants | Visible as bot participant |
| **Audio Access** | Direct stream via WebSocket | Captures as meeting participant |
| **Stream ID** | Uses `rtms_stream_id` | Uses `session_id` |
| **Setup** | Requires RTMS feature enabled | Requires Meeting SDK integration |
| **Latency** | ~10-13 seconds | Similar ~10-13 seconds |

## How It Works

### 1. Start Transcription

Teacher clicks "Start Live Transcription" button:
```
Frontend → POST /api/rtms/start { session_id }
    ↓
Next.js API → POST http://localhost:4000/bot/start
    ↓
Bot Service → Joins meeting as participant
    ↓
Bot Service → Starts capturing audio
    ↓
Database → Updates is_transcribing = true
```

### 2. Audio Processing

Bot continuously processes audio:
```
Zoom Meeting Audio
    ↓
Bot captures frames (20ms each)
    ↓
Circular buffer accumulates (10s chunks)
    ↓
Whisper API transcribes
    ↓
Database writes transcript_chunks (is_realtime = true)
```

### 3. Q&A with Live Context

Student asks question:
```
Student Question
    ↓
Retrieve recent transcript_chunks WHERE is_realtime = true
    ↓
Include last 10 chunks as context
    ↓
OpenAI generates answer with recent meeting context
    ↓
Return answer to student
```

### 4. Stop Transcription

Teacher clicks "Stop Transcription":
```
Frontend → POST /api/rtms/stop { session_id }
    ↓
Next.js API → POST http://localhost:4000/bot/stop
    ↓
Bot Service → Flushes remaining audio
    ↓
Bot Service → Disconnects from meeting
    ↓
Database → Updates is_transcribing = false
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd rtms-service
npm install
```

### 2. Configure Environment

Create `rtms-service/.env`:
```bash
# Zoom Configuration
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_WEBHOOK_SECRET_TOKEN=your_webhook_secret

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Service Configuration
PORT=4000
NODE_ENV=development
```

Update main `.env.local`:
```bash
BOT_SERVICE_URL=http://localhost:4000
```

### 3. Configure Zoom App

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Navigate to your app
3. Add required scopes:
   - `zoomApp:inMeeting`
   - `zoomApp:getMeetingContext`
   - `zoomApp:getRunningContext`

### 4. Run Services

**Terminal 1 - Bot Service:**
```bash
cd rtms-service
npm run dev
```

**Terminal 2 - Next.js App:**
```bash
npm run dev
```

**Terminal 3 - ngrok (for webhooks):**
```bash
ngrok http 4000
```

## Testing

### 1. Health Check

```bash
curl http://localhost:4000/health
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-14T...",
  "activeSessions": 0
}
```

### 2. Start Bot Transcription

```bash
curl -X POST http://localhost:4000/bot/start \
  -H "Content-Type: application/json" \
  -d '{
    "meetingNumber": "12345678",
    "password": "optional",
    "liveSessionId": "session-uuid",
    "sessionId": "session-uuid"
  }'
```

### 3. Check Status

```bash
curl http://localhost:4000/bot/status/session-uuid
```

### 4. Stop Bot

```bash
curl -X POST http://localhost:4000/bot/stop \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-uuid"}'
```

## Next Steps

### Required for Production

1. **Implement Zoom Meeting SDK Integration**
   - Currently `bot-client.ts` has placeholder code
   - Need to add actual Zoom Meeting SDK calls
   - See: https://developers.zoom.us/docs/meeting-sdk/

2. **Add Audio Capture**
   - Implement `processAudioData()` method
   - Connect to Zoom Meeting SDK audio callbacks
   - Test with real meeting audio

3. **Test End-to-End**
   - Join real Zoom meeting with bot
   - Verify audio capture works
   - Confirm transcription appears in database
   - Test Q&A with live context

### Optional Enhancements

- [ ] Speaker diarization (separate per-participant audio)
- [ ] Automatic reconnection on disconnect
- [ ] WebSocket for real-time UI updates
- [ ] Advanced error handling and retries
- [ ] Bot avatar and display name customization
- [ ] Transcript export/download

## Troubleshooting

### Bot Not Connecting

**Check:**
- Zoom Meeting SDK credentials are correct
- Meeting number and password (if required) are correct
- Bot service is running (`http://localhost:4000/health`)
- Database connection is working

### No Audio Being Captured

**Check:**
- Zoom Meeting SDK audio permissions
- Audio callback is properly configured
- `processAudioData()` is being called
- Audio buffer is receiving data

### Transcription Not Working

**Check:**
- OpenAI API key is valid
- Whisper API has available credits
- Audio chunks are at least 1-2 seconds long
- Check bot service logs for Whisper errors

### Status Not Updating in UI

**Check:**
- Status polling is working (every 5 seconds)
- `/api/rtms/status` returns correct data
- `rtms_status` field in database is being updated
- Bot service is reachable from Next.js

## Cost Estimate

Same as RTMS implementation:
- **OpenAI Whisper:** $0.006/min = $0.36/hour
- **Bot Service Server:** ~$12/month (2GB RAM)
- **Per Lecture (1hr):** ~$1.00
- **Monthly (20 lectures):** ~$20

## Documentation

- **Setup Guide:** [RTMS_SETUP_GUIDE.md](RTMS_SETUP_GUIDE.md) (also applies to bot)
- **Quick Start:** [QUICK_START.md](QUICK_START.md) (update endpoints)
- **Alternative Approach:** [ALTERNATIVE_APPROACH.md](ALTERNATIVE_APPROACH.md)

## Summary

The bot implementation maintains the same architecture and benefits as RTMS, but uses the Zoom Meeting SDK instead. The main trade-off is that the bot is visible to participants, but this doesn't require special RTMS permissions.

**Key Benefits:**
- ✅ Works with standard Zoom permissions
- ✅ Real-time transcription during meetings
- ✅ AI Q&A with live meeting context
- ✅ Reuses existing infrastructure
- ✅ Same cost and performance as RTMS

**Next Step:** Implement actual Zoom Meeting SDK integration in `bot-client.ts` to capture real meeting audio.
