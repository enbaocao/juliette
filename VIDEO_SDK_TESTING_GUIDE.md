# Zoom Video SDK Testing Guide

## ✅ Implementation Complete!

The Zoom Video SDK integration has been fully implemented. Here's how to test it.

---

## 🎯 What Was Implemented

### 1. Bot Client with Video SDK ([bot-client.ts](rtms-service/src/bot-client.ts))

**New Methods:**
- ✅ `joinMeeting()` - Uses Zoom Video SDK to join meetings
- ✅ `setupVideoSDKAudioCapture()` - Captures audio from all participants
- ✅ Enhanced `disconnect()` - Proper cleanup of SDK resources

**Features:**
- Real meeting join using Video SDK
- Audio subscription for all participants
- Automatic subscription to new joiners
- PCM audio format conversion (16-bit, 16kHz)
- Integration with existing transcription pipeline

### 2. Dependencies Added

- ✅ `@zoom/videosdk` - Zoom Video SDK
- ✅ `web-audio-api` - Server-side audio processing

---

## 🚀 Quick Start

### Step 1: Configure Environment

Make sure `rtms-service/.env` has:

```bash
# Zoom Configuration
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_ACCOUNT_ID=your_zoom_account_id

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Service Configuration
PORT=4000
NODE_ENV=development
```

### Step 2: Start Services

**Terminal 1 - Bot Service:**
```bash
cd rtms-service
npm run dev
```

**Terminal 2 - Next.js App:**
```bash
npm run dev
```

### Step 3: Create Test Meeting

Using Zoom API or web interface, create a test meeting and note:
- Meeting Number (e.g., 123 456 7890)
- Meeting Password (if required)

---

## 🧪 Testing Steps

### Test 1: Health Check

```bash
curl http://localhost:4000/health
```

**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-15T...",
  "activeSessions": 0
}
```

### Test 2: Start Bot Session

**Method 1: Via Next.js API**
```bash
# First, create a live session in the database
curl -X POST http://localhost:3000/api/live-sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_uuid": "test-uuid-123",
    "meeting_number": "1234567890",
    "title": "Test Session"
  }'

# Note the session_id from response, then start transcription
curl -X POST http://localhost:3000/api/rtms/start \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "<session_id_from_above>"
  }'
```

**Method 2: Direct to Bot Service**
```bash
curl -X POST http://localhost:4000/bot/start \
  -H "Content-Type: application/json" \
  -d '{
    "meetingNumber": "1234567890",
    "password": "optional_password",
    "liveSessionId": "test-session-id"
  }'
```

**Expected Logs:**
```
🤖 Starting Zoom Bot for meeting: 1234567890
   Bot Name: Juliette AI Assistant
   Live Session ID: test-session-id
✅ Retrieved Zoom access token
✅ Generated meeting signature
🔗 Joining meeting 1234567890...
✅ Zoom Video SDK initialized
✅ Successfully joined Zoom meeting
✅ Audio stream started
🎤 Setting up audio capture...
✅ Subscribed to audio from: John Doe
✅ Audio processing pipeline connected
✅ Bot connected and ready to capture audio
```

### Test 3: Join Meeting and Speak

1. Open the Zoom meeting in your browser/app
2. Join with audio enabled
3. Speak for 15-20 seconds
4. Watch bot service logs for:
   ```
   🎙️  Processing audio buffer 1
   📝 Transcribed: "Hello, this is a test..."
   ✅ Wrote 3 transcript chunks
   📝 Transcribed buffer 1 at 2026-02-15T...
   ```

### Test 4: Check Database

```sql
-- Check live sessions
SELECT * FROM live_sessions WHERE is_transcribing = true;

-- Check transcript chunks
SELECT
  text,
  sequence_number,
  created_at
FROM transcript_chunks
WHERE is_realtime = true
ORDER BY sequence_number DESC
LIMIT 10;
```

**Expected:** You should see transcript chunks with your spoken words!

### Test 5: Check Status

```bash
curl http://localhost:4000/bot/status/<session_id>
```

**Expected:**
```json
{
  "isConnected": true,
  "totalAudioReceived": "327680",
  "audioBufferStatus": {
    "currentSize": 160000,
    "isFull": true,
    "buffersEmitted": 5
  },
  "transcriptionStatus": {
    "totalChunksProcessed": 15,
    "lastProcessedAt": "2026-02-15T..."
  }
}
```

### Test 6: Test Q&A with Live Context

In Zoom panel (or via API):
```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What did we just discuss?",
    "live_session_id": "<session_id>",
    "mode": "simple"
  }'
```

**Expected:** AI answer should reference recent transcript content!

### Test 7: Stop Bot

```bash
curl -X POST http://localhost:4000/bot/stop \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "<session_id>"
  }'
```

**Expected Logs:**
```
🔌 Disconnecting bot from meeting
✅ Stopped audio stream
✅ Left Zoom meeting
✅ Bot disconnected
```

---

## 🐛 Troubleshooting

### Issue: "Failed to get Zoom access token"

**Cause:** Invalid OAuth credentials

**Fix:**
1. Verify `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_ACCOUNT_ID` in `.env`
2. Make sure your Zoom app is **Server-to-Server OAuth** type
3. Check app is activated in Zoom Marketplace

### Issue: "Failed to join Zoom meeting"

**Possible Causes:**
- Invalid meeting number
- Meeting requires password but none provided
- Meeting hasn't started yet
- Bot doesn't have permission to join

**Fix:**
1. Verify meeting number is correct (numbers only, no spaces)
2. Check if meeting requires password
3. Make sure meeting is started
4. Try with a different meeting

### Issue: "No audio element available yet"

**Cause:** Audio not activated in meeting

**Fix:**
1. Make sure someone has unmuted in the meeting
2. Bot will automatically subscribe when audio becomes available
3. Check meeting audio settings (shouldn't be audio-off meeting)

### Issue: "AudioContext is not defined" or web-audio-api errors

**Cause:** Server-side audio processing issues

**Fix:**
1. Make sure `web-audio-api` is installed: `npm install web-audio-api`
2. If issues persist, consider using alternative audio capture (see below)

### Issue: No transcripts appearing

**Possible Causes:**
- OpenAI API key invalid
- Audio not being captured
- Buffer not filling up (need ~10 seconds of audio)

**Fix:**
1. Check OpenAI API key and credits
2. Verify audio is being processed (check logs for buffer writes)
3. Speak continuously for 15+ seconds to trigger first transcript
4. Check `AUDIO_BUFFER_SECONDS` setting (default 10)

---

## 🔧 Advanced Configuration

### Adjust Audio Buffer Size

In `rtms-service/.env`:
```bash
# Smaller buffer = faster transcription but more API calls
AUDIO_BUFFER_SECONDS=8

# Overlap to prevent word cutoff
AUDIO_OVERLAP_SECONDS=2
```

### Change Whisper Model

```bash
# Default (fastest, cheapest)
WHISPER_MODEL=whisper-1

# For better accuracy (if available)
# WHISPER_MODEL=whisper-large-v3
```

### Debug Mode

Add to `bot-client.ts` for more logging:
```typescript
console.log('📊 Audio buffer size:', audioData.length);
console.log('📊 Total audio received:', this.totalAudioReceived.toString());
```

---

## 📊 Performance Expectations

### Latency
- **Audio to transcript**: ~10-13 seconds
  - 8-10s buffer accumulation
  - 2-4s Whisper API processing
  - <500ms database write

### Accuracy
- **Clear speech**: >95%
- **Background noise**: 80-90%
- **Multiple speakers**: 85-95% (but not separated by speaker)

### Costs
- **Whisper API**: $0.006/minute = $0.36/hour
- **Per 1-hour meeting**: ~$0.40-$0.50

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] Test with real meetings (not just test meetings)
- [ ] Test with multiple participants
- [ ] Test with background noise
- [ ] Verify transcripts are accurate
- [ ] Test Q&A uses recent context correctly
- [ ] Test reconnection after network issues
- [ ] Monitor memory usage during long meetings
- [ ] Test graceful shutdown
- [ ] Set up error alerting
- [ ] Configure proper logging
- [ ] Test with various audio qualities
- [ ] Verify GDPR/privacy compliance for recordings

---

## 🚢 Deployment

### Deploy Bot Service

**Option 1: DigitalOcean Droplet**
```bash
# On server
git clone <your-repo>
cd rtms-service
npm install
npm run build

# Set up PM2
npm install -g pm2
pm2 start dist/index.js --name zoom-bot-service
pm2 save
pm2 startup
```

**Option 2: Docker**
```dockerfile
FROM node:18
WORKDIR /app
COPY rtms-service/package*.json ./
RUN npm install
COPY rtms-service/ ./
RUN npm run build
CMD ["node", "dist/index.js"]
```

### Environment Variables in Production

Update production environment with:
- Production Zoom credentials
- Production Supabase URL and keys
- Production OpenAI API key
- Set `NODE_ENV=production`

---

## 📚 Useful Commands

```bash
# View bot service logs
cd rtms-service && npm run dev

# Check active sessions
curl http://localhost:4000/bot/sessions

# Stop all sessions (emergency)
curl -X POST http://localhost:4000/bot/stop-all

# Check Zoom Video SDK version
npm list @zoom/videosdk
```

---

## 🎉 Success Criteria

Your implementation is working if:

1. ✅ Bot successfully joins Zoom meeting
2. ✅ Bot appears in participants list
3. ✅ Transcript chunks appear in database within 15 seconds of speech
4. ✅ Q&A responses include recent meeting content
5. ✅ Bot gracefully disconnects when stopped
6. ✅ Multiple participants' audio is captured
7. ✅ No memory leaks during extended operation

---

## 💡 Next Steps

After successful testing:

1. **Optimize buffer size** - Find sweet spot between latency and API costs
2. **Add speaker diarization** - Identify who said what (requires per-participant audio)
3. **Improve error handling** - Auto-reconnect on network issues
4. **Add monitoring** - Track transcription quality and latency
5. **WebSocket updates** - Push real-time transcripts to frontend
6. **Export transcripts** - Allow downloading meeting transcripts

---

## 🤝 Support

If you encounter issues:

1. Check bot service logs for error messages
2. Verify all environment variables are set
3. Test with simplest possible meeting (1 participant)
4. Check Zoom API status page
5. Review [Video SDK documentation](https://developers.zoom.us/docs/video-sdk/)

**Happy testing!** 🚀
