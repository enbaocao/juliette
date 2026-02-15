# 🚀 Quick Start Guide - RTMS Testing

Get the RTMS integration running in 5 minutes for local testing.

## Prerequisites Check

```bash
# Verify Node.js version (need 18+)
node --version

# Verify you have required environment variables
# Check .env.local exists with Supabase and OpenAI keys
```

---

## 1. Install Dependencies (2 minutes)

```bash
# Main app
npm install

# RTMS service
cd rtms-service
npm install
cd ..
```

---

## 2. Run Database Migration (1 minute)

Option A: Via Supabase Dashboard
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to SQL Editor
3. Copy content from `supabase/migrations/003_rtms_integration.sql`
4. Run the SQL

Option B: Via Supabase CLI
```bash
supabase db push
```

**Verify:** Check that `rtms_connections` table exists in your database.

---

## 3. Configure Environment (1 minute)

### Create `rtms-service/.env` file:

```bash
cp rtms-service/.env.example rtms-service/.env
```

Edit `rtms-service/.env` and add your keys:
- Copy `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` from your `.env.local`
- Copy `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` from your `.env.local`
- Copy `OPENAI_API_KEY` from your `.env.local`

### Update main `.env.local`:

Add this line:
```bash
RTMS_SERVICE_URL=http://localhost:4000
```

---

## 4. Start Services (1 minute)

Open **3 terminals**:

### Terminal 1: RTMS Service
```bash
cd rtms-service
npm run dev
```

Wait for: `✅ Ready to receive RTMS connections`

### Terminal 2: Next.js App
```bash
npm run dev
```

Wait for: `Ready on http://localhost:3000`

### Terminal 3: ngrok (for Zoom webhooks)
```bash
ngrok http 4000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

---

## 5. Quick Test (30 seconds)

### Test RTMS Service Health:

```bash
curl http://localhost:4000/health
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-14...",
  "activeSessions": 0
}
```

### Test Main App:

Open browser: `http://localhost:3000`

---

## 🎬 Testing the Integration

### Without Real Zoom Meeting (API Testing):

```bash
# Test starting a session
curl -X POST http://localhost:3000/api/live-sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_uuid": "test-meeting-123",
    "meeting_number": "12345678",
    "title": "Test Lecture"
  }'

# Test transcription status
curl http://localhost:3000/api/rtms/status?session_id=<session_id_from_above>
```

### With Real Zoom Meeting:

**NOTE:** Full Zoom testing requires:
1. Zoom app configured in Marketplace
2. RTMS feature enabled
3. Webhook configured with ngrok URL

**Basic Zoom Panel Test:**
1. Update `zoom-app-manifest.json` config_url to ngrok URL
2. Open Zoom meeting
3. Add your Zoom app
4. Verify panel loads

---

## 📝 Quick Verification Checklist

- [ ] RTMS service running on port 4000
- [ ] Next.js app running on port 3000
- [ ] Health endpoint returns healthy status
- [ ] Database has `rtms_connections` table
- [ ] All environment variables set

---

## 🐛 Common Issues

### "Cannot connect to Supabase"
→ Check `SUPABASE_SERVICE_ROLE_KEY` in `rtms-service/.env`

### "OpenAI API error"
→ Verify `OPENAI_API_KEY` is valid and has credits

### "Port 4000 already in use"
→ Change `PORT` in `rtms-service/.env` to different port (e.g., 4001)

### "Module not found"
→ Run `npm install` in both root and `rtms-service/` directories

---

## Next Steps

1. ✅ Basic setup working? → See [RTMS_SETUP_GUIDE.md](RTMS_SETUP_GUIDE.md) for full Zoom integration
2. ❓ Having issues? → Check troubleshooting section in setup guide
3. 🚢 Ready for production? → See deployment section in setup guide

---

## 📊 What Should Be Running?

```
Terminal 1:  🟢 rtms-service    (port 4000)
Terminal 2:  🟢 next dev        (port 3000)
Terminal 3:  🟢 ngrok           (forwarding to 4000)
```

**You're all set!** The RTMS infrastructure is now running and ready to receive Zoom meeting audio streams.
