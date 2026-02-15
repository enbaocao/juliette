# Zoom RTMS Setup & Testing Guide

This guide walks you through setting up and testing the Zoom Real-Time Media Streaming (RTMS) integration for live meeting transcription.

## 📋 Prerequisites

- Node.js 18+ installed
- Zoom account with developer access
- Supabase project set up
- OpenAI API key
- ngrok or similar tunneling tool (for local development)

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

#### Main Application
```bash
# In the root directory
npm install
```

#### RTMS Service
```bash
# Navigate to RTMS service directory
cd rtms-service

# Install dependencies
npm install
```

### Step 2: Database Migration

Run the RTMS database migration to add required tables and fields:

```bash
# Connect to your Supabase project
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Manually via Supabase dashboard
# Go to SQL Editor and run the migration file:
# supabase/migrations/003_rtms_integration.sql
```

**Verify the migration:**
- Check that `live_sessions` table has new columns: `rtms_stream_id`, `rtms_status`, `is_transcribing`
- Check that `transcript_chunks` table has new columns: `live_session_id`, `is_realtime`, `sequence_number`
- Check that `rtms_connections` table was created

### Step 3: Environment Variables

#### Main Application (`.env.local`)

Add/update these variables:

```bash
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key

# Zoom credentials
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_WEBHOOK_SECRET_TOKEN=your_webhook_secret

# RTMS service URL
RTMS_SERVICE_URL=http://localhost:4000  # Development
# RTMS_SERVICE_URL=https://your-rtms-domain.com  # Production

# Demo user for MVP
DEMO_USER_ID=demo-user-123
```

#### RTMS Service (`rtms-service/.env`)

Create a `.env` file in the `rtms-service` directory:

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

# Audio Configuration (optional, uses defaults if not set)
AUDIO_BUFFER_SECONDS=10
AUDIO_OVERLAP_SECONDS=2
WHISPER_MODEL=whisper-1
```

### Step 4: Configure Zoom App

#### 4.1 Enable RTMS in Zoom Marketplace

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Navigate to **Manage** → **Your Apps**
3. Select your app (or create a new one)
4. Go to **Features** tab
5. Enable **"Real-Time Media Streams"**

#### 4.2 Add Required Scopes

In the **Scopes** section, add:
- `zoomApp:inMeeting`
- `zoomApp:getMeetingContext`
- `zoomApp:getRunningContext`
- `rtms:read:audio:admin`

#### 4.3 Configure Webhooks

1. Go to **Feature** → **Event Subscriptions**
2. Add Event Subscription URL: `https://your-ngrok-url.ngrok.io/webhook/zoom`
3. Subscribe to event: `meeting.rtms_started`
4. Save webhook secret token (add to `.env` files)

#### 4.4 Update App Manifest

Update your `zoom-app-manifest.json`:

```json
{
  "name": "Juliette AI Assistant",
  "scopes": [
    "zoomApp:inMeeting",
    "zoomApp:getMeetingContext",
    "zoomApp:getRunningContext",
    "rtms:read:audio:admin"
  ],
  "in_meeting_panel": {
    "config_url": "http://localhost:3001/zoom/panel",
    "can_render_for_all_users": true
  }
}
```

### Step 5: Local Development Setup

#### Terminal 1: Start ngrok for RTMS Service

```bash
ngrok http 4000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and update:
- Zoom webhook URL: `https://abc123.ngrok.io/webhook/zoom`
- Update `RTMS_SERVICE_URL` in main app's `.env.local` if needed

#### Terminal 2: Start RTMS Service

```bash
cd rtms-service
npm run dev
```

You should see:
```
🚀 RTMS Service started
   Port: 4000
   Environment: development
   Webhook endpoint: http://localhost:4000/webhook/zoom

✅ Ready to receive RTMS connections
```

#### Terminal 3: Start Next.js App

```bash
# From root directory
npm run dev
```

#### Terminal 4: Start ngrok for Next.js (if testing Zoom panel)

```bash
ngrok http 3000
```

Update Zoom app's `config_url` to use this ngrok URL.

---

## 🧪 Testing Guide

### Test 1: Verify RTMS Service Health

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-14T10:30:00.000Z",
  "activeSessions": 0
}
```

### Test 2: Test Database Connection

```bash
# Check if RTMS service can connect to Supabase
# Look for "✅ Successfully connected" in RTMS service logs
```

### Test 3: Test Zoom Webhook

Send a test webhook event:

```bash
curl -X POST http://localhost:4000/webhook/zoom \
  -H "Content-Type: application/json" \
  -d '{
    "event": "endpoint.url_validation",
    "payload": {
      "plainToken": "test123"
    }
  }'
```

Expected: Returns encrypted token response

### Test 4: End-to-End Live Session Test

#### 4.1 Start a Zoom Meeting

1. Create a test Zoom meeting
2. Open the Juliette Zoom App panel
3. Verify you see the "Teacher View" or "Student View"

#### 4.2 Start Live Session (As Host)

1. In the Zoom panel, click "Start Live Session"
2. Optionally select a video or add a title
3. Click "Start Session"
4. Verify session appears as "🟢 Session Active"

#### 4.3 Start Live Transcription

1. In the "Live Transcription" section, click "Start Live Transcription"
2. Status should change from "idle" → "connecting" → "streaming"
3. Verify in RTMS service logs:
   ```
   📨 Received Zoom webhook: meeting.rtms_started
   🔌 Connecting to RTMS stream: rtms-xxx
   ✅ Successfully connected to RTMS stream
   ```

#### 4.4 Test Real-Time Transcription

1. Speak into your microphone for 15-20 seconds
2. Wait ~10-15 seconds (buffer + transcription time)
3. Check database for transcript chunks:
   ```sql
   SELECT text, sequence_number, created_at
   FROM transcript_chunks
   WHERE is_realtime = true
   ORDER BY sequence_number DESC
   LIMIT 5;
   ```

Expected: You should see transcribed text appearing in the database

#### 4.5 Test Live Q&A with Context

1. As a student (or use second browser/device)
2. Open the Zoom panel
3. Ask a question related to what was just said
4. Verify the AI answer includes context from the live transcription
5. Check the answer references recent transcript chunks

#### 4.6 Monitor Transcription Status

1. Check transcription metrics in the teacher panel
2. Verify "Chunks processed" count increases
3. Verify "Last audio" timestamp updates

#### 4.7 Stop Transcription

1. Click "Stop Transcription" button
2. Verify status changes to "idle"
3. Check RTMS service logs for disconnection confirmation

#### 4.8 End Session

1. Click "End Session" button
2. Verify transcription automatically stops
3. Verify session status changes to "ended" in database

---

## 🐛 Troubleshooting

### Issue: RTMS Service Can't Connect to Supabase

**Symptoms:** Database connection errors in logs

**Solutions:**
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `rtms-service/.env`
2. Check Supabase project is active and accessible
3. Verify service role key has necessary permissions

### Issue: Webhook Not Receiving Events

**Symptoms:** No webhook events appearing in logs

**Solutions:**
1. Verify ngrok URL is correctly configured in Zoom
2. Check webhook secret token matches in both Zoom and `.env`
3. Test webhook endpoint manually with curl
4. Check Zoom webhook event subscription is active

### Issue: No Audio Data Received

**Symptoms:** RTMS connects but no transcription happens

**Solutions:**
1. Verify microphone is working in Zoom
2. Check RTMS connection status in database
3. Ensure `rtms:read:audio:admin` scope is enabled
4. Check audio buffer logs for incoming frames

### Issue: Transcription Fails

**Symptoms:** Audio received but no transcript chunks created

**Solutions:**
1. Verify `OPENAI_API_KEY` is valid
2. Check OpenAI API rate limits
3. Look for Whisper API errors in logs
4. Test with longer audio (need at least 1-2 seconds)

### Issue: High Latency (>20 seconds)

**Symptoms:** Transcription appears very delayed

**Solutions:**
1. Reduce `AUDIO_BUFFER_SECONDS` to 8 seconds
2. Check network latency to OpenAI API
3. Verify RTMS service has adequate resources (2GB RAM minimum)
4. Check for database connection pooling issues

---

## 📊 Monitoring & Logs

### RTMS Service Logs

Key log messages to watch for:

```
✅ RTMS connection confirmed          # Connection established
🎙️  Processing audio buffer X         # Audio being processed
📝 Transcribed: "..."                  # Whisper API success
✅ Wrote N transcript chunks           # Database write success
⚠️  RTMS session disconnected         # Connection lost
```

### Database Monitoring

Check active transcriptions:

```sql
-- Active RTMS connections
SELECT * FROM rtms_connections WHERE status = 'active';

-- Recent real-time chunks
SELECT
  session_id,
  COUNT(*) as chunk_count,
  MAX(created_at) as last_chunk
FROM transcript_chunks
WHERE is_realtime = true
GROUP BY session_id;

-- Live sessions with transcription
SELECT
  id,
  title,
  rtms_status,
  is_transcribing,
  transcription_started_at
FROM live_sessions
WHERE status = 'active';
```

### Performance Metrics

Monitor these metrics:
- **Audio → Transcript latency**: Should be 10-15 seconds
- **Transcription accuracy**: >90% for clear speech
- **Chunks per minute**: ~4-6 chunks (10s buffer)
- **Memory usage**: <500MB per active session
- **API costs**: $0.36 per hour of transcription

---

## 🚢 Production Deployment

### RTMS Service Deployment

**Recommended: DigitalOcean Droplet or AWS EC2**

1. Create server (2GB RAM minimum)
2. Install Node.js 18+
3. Clone repository
4. Install dependencies: `cd rtms-service && npm install`
5. Build: `npm run build`
6. Set up PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name rtms-service
   pm2 save
   pm2 startup
   ```
7. Configure firewall to allow port 4000
8. Set up domain/SSL (recommended: Let's Encrypt)
9. Update environment variables
10. Update Zoom webhook URL to production domain

### Next.js Deployment

Deploy to Vercel or similar:

```bash
# Update RTMS_SERVICE_URL in production environment
# Push to GitHub/GitLab
# Connect to Vercel
# Deploy
```

---

## 💰 Cost Estimates

**Monthly costs for 20 one-hour lectures:**

- OpenAI Whisper API: $7.20/month ($0.36/hour × 20)
- RTMS Service Server (2GB): $12/month (DigitalOcean)
- **Total: ~$20/month**

**Per-lecture cost: ~$1.00**

---

## 📚 Additional Resources

- [Zoom RTMS Documentation](https://developers.zoom.us/docs/rtms/)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [Supabase Documentation](https://supabase.com/docs)
- [RTMS Node.js Samples](https://github.com/zoom/rtms-quickstart-js)

---

## ✅ Success Checklist

Before going live, verify:

- [ ] Database migration completed successfully
- [ ] All environment variables configured
- [ ] RTMS service starts without errors
- [ ] Webhook receives test events
- [ ] Can create live session in Zoom panel
- [ ] Transcription starts and shows "streaming" status
- [ ] Real-time chunks appear in database
- [ ] Q&A uses live transcript context
- [ ] Transcription stops cleanly
- [ ] Session ends properly
- [ ] No memory leaks after extended use
- [ ] Production servers configured and deployed

---

## 🎉 You're Ready!

Once all tests pass, your Zoom RTMS integration is ready for live use. Students can now ask questions during Zoom lectures and get AI-powered answers with real-time meeting context!

For issues or questions, check the troubleshooting section or review the RTMS service logs.
