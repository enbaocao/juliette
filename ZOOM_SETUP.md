# Zoom Integration Setup Guide

This guide will help you set up and test the Zoom Apps integration for Juliette.

## Overview

The Zoom integration allows students to ask AI-powered questions during live Zoom classes directly within a Zoom panel, without leaving the meeting.

**How it works:**
1. Teacher starts a Zoom meeting and opens the Juliette app panel
2. Teacher starts a live session and optionally links a lecture video
3. Students open the same panel and ask questions
4. AI answers questions in real-time based on lecture content
5. Teacher monitors all questions on a web dashboard

## Prerequisites

- Active Zoom account (free or paid)
- Juliette app running locally (`npm run dev`)
- Supabase database with migrations applied
- OpenAI API key configured

## Step 1: Create a Zoom App

1. **Go to Zoom Marketplace:**
   - Visit https://marketplace.zoom.us/
   - Click "Develop" → "Build App"

2. **Create a new Zoom App:**
   - Select "Zoom Apps" (NOT "Meeting SDK" or "Chatbot")
   - Click "Create"
   - App Name: `Juliette AI Assistant` (or your choice)
   - Company Name: Your name/organization
   - Description: `AI-powered educational assistant for live classes`
   - Click "Create"

3. **Configure Basic Information:**
   - **Developer Contact Information:** Fill in your email and name
   - **App Homepage:** `http://localhost:3001` (for development)
   - Click "Continue"

## Step 2: Configure App Settings

### A. App Credentials

1. Navigate to "App Credentials" tab
2. Copy your **Client ID** and **Client Secret**
3. Add them to your `.env.local`:

```bash
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here
ZOOM_WEBHOOK_SECRET_TOKEN=your_webhook_secret_here
```

### B. Scopes

1. Navigate to "Scopes" tab
2. Add these scopes:
   - `zoomApp:inMeeting` - Run during meeting
   - `zoomApp:getMeetingContext` - Get meeting info
   - `zoomApp:getRunningContext` - Get user context

### C. Embedded App Configuration

1. Navigate to "Embedded App" → "In-Meeting"
2. Enable "In-Meeting Panel"
3. Set **Config URL:**
   ```
   http://localhost:3001/zoom/panel
   ```
4. Enable "Can render for all users"
5. **Allowed Origins:** Add your local dev URL
   ```
   http://localhost:3001
   ```

### D. Redirect URLs (OAuth)

1. Navigate to "OAuth" → "Redirect URL for OAuth"
2. Add:
   ```
   http://localhost:3001/zoom/auth
   ```

## Step 3: Enable Local Development Mode

Since Zoom Apps run in the Zoom client, you need to enable local development:

### Option A: Use ngrok (Recommended for Testing)

If Zoom can't reach `localhost:3001`, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# In a new terminal, run:
ngrok http 3001
```

This gives you a public URL like `https://abc123.ngrok.io`

**Update your Zoom App config:**
- Config URL: `https://abc123.ngrok.io/zoom/panel`
- Redirect URL: `https://abc123.ngrok.io/zoom/auth`
- Allowed Origins: `https://abc123.ngrok.io`

**Update your `.env.local`:**
```bash
NEXT_PUBLIC_ZOOM_REDIRECT_URL=https://abc123.ngrok.io/zoom/auth
```

### Option B: Use Zoom's Development Tools

Zoom provides development tools for testing apps locally:
1. Download Zoom Desktop Client (must be latest version)
2. Enable "Developer Mode" in Zoom settings

## Step 4: Apply Database Migration

Run the live sessions migration:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open `supabase/migrations/002_live_sessions.sql`
4. Copy the entire contents
5. Paste and click **Run**

This creates:
- `live_sessions` table
- Adds `live_session_id` and `is_live` to `questions` table
- Sets up proper RLS policies

## Step 5: Test the Integration

### 1. Start the Dev Server

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start transcription worker (optional)
npm run worker:transcription

# Terminal 3: If using ngrok
ngrok http 3001
```

### 2. Install the App in Zoom

1. In Zoom Marketplace, go to your app
2. Click "Local Test" or "Install"
3. Authorize the app

### 3. Start a Test Meeting

1. **Start a Zoom meeting** (can be with just yourself)
2. Click "Apps" in the meeting toolbar
3. Find and open "Juliette AI Assistant"
4. The panel should open on the right side

### 4. Test Teacher Flow

As the host:
1. In the panel, you should see "Teacher View"
2. Enter a session title (e.g., "Test Lecture")
3. Optionally select a transcribed video
4. Click "Start Session"
5. Click "Open Dashboard →" to open teacher dashboard in browser

### 5. Test Student Flow

To test as a student:
1. Join the same meeting from another device/account (or use Zoom's "Participant" view)
2. Open the Juliette app panel
3. You should see "Student View"
4. Ask a test question
5. Select mode (Simple/Practice/Animation)
6. Watch the AI respond

### 6. Verify Dashboard

1. In the teacher dashboard (opened from panel)
2. You should see questions appear in real-time
3. Each question shows the AI response
4. Dashboard polls every 3 seconds for updates

## Troubleshooting

### Panel doesn't load

**Check:**
- Is the Next.js dev server running?
- Is the Config URL correct in Zoom App settings?
- If using ngrok, is it running and URL updated everywhere?
- Check browser console in Zoom (right-click panel → Inspect)

**Common errors:**
```
Failed to configure Zoom SDK
```
→ Make sure you're running inside a Zoom meeting, not just the Zoom app

### "No active session" message

**Check:**
- Did the teacher start a session?
- Is the database migration applied?
- Check Network tab for failed API calls
- Verify Supabase connection

### Questions not appearing

**Check:**
- Is `/api/ask` endpoint working?
- Check the Network tab for errors
- Verify OpenAI API key is valid
- Check Supabase RLS policies allow inserting/reading

### Teacher can't see questions

**Check:**
- Is polling working? (Check Network tab every 3 seconds)
- Are questions being saved? (Check Supabase `questions` table)
- Is `live_session_id` set correctly?

## Production Deployment

When ready for production:

1. **Update Zoom App URLs:**
   - Replace `localhost:3001` with your production domain
   - Update Config URL, Redirect URLs, Allowed Origins

2. **Submit for Review:**
   - Go to Zoom Marketplace → Your App → Submit for Review
   - This is required for public use

3. **Update Environment Variables:**
   ```bash
   NEXT_PUBLIC_ZOOM_REDIRECT_URL=https://yourdomain.com/zoom/auth
   ```

## Architecture Notes

### Components

- **`/zoom/panel`** - Main panel that loads in Zoom
- **`useZoomApp` hook** - Manages Zoom SDK initialization
- **`LiveSessionPanel`** - Router between host/student views
- **`HostControls`** - Teacher interface for managing sessions
- **`StudentView`** - Student interface for asking questions
- **`/live/dashboard/[sessionId]`** - Teacher web dashboard

### API Endpoints

- `GET /api/live-sessions/check` - Check for active session
- `POST /api/live-sessions/start` - Start new session
- `POST /api/live-sessions/end` - End session
- `GET /api/live-sessions/questions` - Get questions for session
- `GET /api/live-sessions/[sessionId]` - Get session details
- `GET /api/videos` - List available videos
- `POST /api/ask` - Ask question (updated to support live sessions)

### Database Schema

```sql
live_sessions (
  id,
  meeting_uuid,       -- Zoom meeting identifier
  meeting_number,     -- Human-readable meeting number
  video_id,           -- Optional linked video
  host_user_id,       -- Teacher
  title,              -- Optional session name
  status,             -- active | ended
  started_at,
  ended_at
)

questions (
  ...existing fields...
  live_session_id,    -- NEW: Links to live session
  is_live             -- NEW: Quick flag for filtering
)
```

## Demo Script

For hackathon demo:

1. **Setup (before demo):**
   - Pre-upload and transcribe a demo video
   - Start Zoom meeting
   - Open Juliette panel

2. **Demo (5 minutes):**
   - **[0:00]** Show Zoom meeting with panel open
   - **[0:30]** As teacher, start session and link demo video
   - **[1:00]** Open teacher dashboard in browser
   - **[1:30]** Switch to student view, ask question
   - **[2:00]** Show AI answer appear in real-time
   - **[2:30]** Show question in teacher dashboard
   - **[3:00]** Demo different modes (simple, practice, animation)
   - **[4:00]** Show transcript references
   - **[4:30]** End session, Q&A

Good luck with your demo! 🚀
