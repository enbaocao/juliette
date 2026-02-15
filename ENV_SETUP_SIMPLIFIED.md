# Simplified Environment Setup

## ✅ What You Actually Need

Since you're using a **general Zoom app** (not Server-to-Server OAuth), here's the simplified setup:

---

## 1. Main App `.env.local`

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (required)
OPENAI_API_KEY=sk-your_key

# Zoom SDK Credentials (from your Zoom app)
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_WEBHOOK_SECRET_TOKEN=your_webhook_secret

# Bot Service
BOT_SERVICE_URL=http://localhost:4000

# Optional
DEMO_USER_ID=demo-user-123
ANTHROPIC_API_KEY=your_anthropic_key
```

---

## 2. Bot Service `rtms-service/.env`

```bash
# Zoom Video SDK Credentials (same as above)
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_WEBHOOK_SECRET_TOKEN=your_webhook_secret

# Supabase (same as above)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (same as above)
OPENAI_API_KEY=sk-your_key

# Service Config
PORT=4000
NODE_ENV=development

# Audio Config (optional)
AUDIO_BUFFER_SECONDS=10
AUDIO_OVERLAP_SECONDS=2
WHISPER_MODEL=whisper-1
```

---

## 📝 Where to Get Zoom Credentials

### Option 1: Use Your Existing Zoom App

If you already have a Zoom app:

1. Go to [marketplace.zoom.us](https://marketplace.zoom.us)
2. Go to **Develop** → **Build App**
3. Select your app
4. Go to **App Credentials**
5. Copy:
   - **Client ID** → `ZOOM_CLIENT_ID`
   - **Client Secret** → `ZOOM_CLIENT_SECRET`

### Option 2: Create New Video SDK App (Recommended)

For best results with Video SDK:

1. Go to [marketplace.zoom.us](https://marketplace.zoom.us)
2. Click **Develop** → **Build App**
3. Choose **Video SDK**
4. Fill in basic info
5. Go to **App Credentials**
6. Copy:
   - **SDK Key** → `ZOOM_CLIENT_ID`
   - **SDK Secret** → `ZOOM_CLIENT_SECRET`

---

## 🎯 Quick Test

Once configured:

```bash
# Terminal 1: Start bot service
cd rtms-service
npm run dev

# You should see:
# ✅ Zoom Bot Service started
# (No errors about missing ZOOM_ACCOUNT_ID)

# Terminal 2: Start Next.js
npm run dev
```

---

## ✅ What Changed

**Before (incorrect for your setup):**
- ❌ Required Server-to-Server OAuth
- ❌ Needed ZOOM_ACCOUNT_ID
- ❌ Made OAuth API calls

**Now (correct for Video SDK):**
- ✅ Uses JWT signature authentication
- ✅ Only needs Client ID and Secret
- ✅ No OAuth API calls needed

---

## 🔍 Verify Your Setup

The bot service should start without errors. If you see:

```
✅ Zoom credentials validated
✅ Generated JWT signature for Video SDK
```

You're good to go! 🎉

---

## 💡 Notes

- **Client ID** and **SDK Key** are the same thing (different names in different Zoom app types)
- **Client Secret** and **SDK Secret** are the same thing
- For Video SDK, JWT signatures are generated locally - no need for OAuth tokens
- Your existing Zoom app credentials should work fine!
