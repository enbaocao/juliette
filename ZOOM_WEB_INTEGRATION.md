# Zoom App & Website Integration Guide

## Overview

Juliette now has **full integration** between the Zoom app and the main website. Students can access live sessions from both places and record lectures using browser-based screen capture.

## Architecture Summary

### Two Ways to Access Features

**1. Inside Zoom (Zoom Apps SDK Panel)**
- Students open Juliette panel during Zoom meeting
- Can record the Zoom window directly
- Ask questions in real-time
- Path: `/zoom/panel`

**2. On Main Website (Student Dashboard)**
- Students visit website at `/student`
- See all active live sessions
- Can record any window/screen
- Ask questions about recorded content
- Path: `/student`

## User Flows

### For Students

#### Option A: Inside Zoom Meeting
1. Join Zoom meeting
2. Open Juliette app from Zoom Apps
3. See "Record This Lecture" button
4. Click to start recording Zoom window
5. Stop recording when done
6. Wait for transcription (~1-2 min per 10 min)
7. Ask questions using three modes:
   - 💬 Simple explanations
   - ✨ Practice problems
   - 🎬 Animated visualizations

#### Option B: From Website
1. Visit `yourapp.com/student`
2. See list of active live sessions
3. Click "Join Session"
4. Click "Start Recording"
5. Select what to record (Zoom window, other window, entire screen)
6. Stop recording when done
7. Wait for transcription
8. Ask questions

### For Teachers

#### Starting a Live Session
1. **In Zoom**: Open Juliette panel → Enter session title → Start session
2. **On Website**: Use teacher dashboard to view analytics

#### Managing Sessions
- View all student questions in real-time at `/live/dashboard/[sessionId]`
- See which topics students are confused about
- Track engagement metrics

## Technical Implementation

### New Pages Created

#### `/student` - Student Dashboard
- Lists all active live sessions
- Shows recording interface
- Handles video transcription status
- Links to Q&A when ready

### New API Endpoints

#### `GET /api/live-sessions/active`
- Returns all active sessions (status = 'active')
- Used by student dashboard to show available sessions

#### `GET /api/live-sessions/[id]`
- Returns specific session details
- Used to refresh session state after recording

#### `GET /api/videos/[id]`
- Returns video details including transcription status
- Polls to check when transcription completes

#### `POST /api/live-sessions/link-video`
- Links a recorded video to a live session
- Called after screen recording upload completes

### Updated Components

#### `ScreenRecorder.tsx`
- Reusable component for screen recording
- Works in both Zoom panel and website
- Uses `getDisplayMedia()` API
- Handles upload and linking

#### `StudentView.tsx` (Zoom Panel)
- Shows recorder when session has no video
- Shows processing state during transcription
- Shows Q&A interface when ready

#### Home Page (`/`)
- Featured "Join Live Session" card
- Clear separation of student vs teacher features

## Database Schema

### `live_sessions` table
```sql
- id (uuid)
- meeting_uuid (text)
- meeting_number (text)
- video_id (uuid, nullable) -- Links to recorded video
- host_user_id (text)
- title (text, nullable)
- status ('active' | 'ended')
- started_at (timestamp)
- ended_at (timestamp, nullable)
- created_at (timestamp)
```

### Flow:
1. Teacher starts session → `video_id` is NULL
2. Student records → Video created in `videos` table
3. Recording linked → `video_id` updated
4. Transcription completes → `videos.status` = 'transcribed'
5. Q&A enabled

## Key Features

### ✅ Screen Recording
- **Browser-based** (no desktop app needed)
- **Flexible** (record Zoom, other apps, or entire screen)
- **Audio capture** included
- **Automatic upload** to Supabase Storage

### ✅ Live Sessions
- **Active session list** shows all ongoing lectures
- **Real-time polling** updates every 10 seconds
- **Teacher dashboard** shows all student questions
- **Status tracking** (recording → processing → ready)

### ✅ Q&A Modes
All three modes work with live recordings:
1. **Simple Mode** - Short explanation with check questions
2. **Practice Mode** - Personalized problems based on interest tags
3. **Animation Mode** - Manim-rendered visualizations

### ✅ Cross-Platform
- Works in Zoom panel (Zoom Apps SDK)
- Works on website (standalone)
- Same backend, same features
- Recordings accessible from both

## URLs Reference

### Student Pages
- `/student` - Join live sessions & record
- `/videos/[id]/ask` - Ask questions about specific video
- `/teacher/videos` - Browse all recorded videos

### Teacher Pages
- `/teacher` - Analytics dashboard
- `/teacher/videos` - Video library
- `/teacher/questions` - All student questions
- `/live/dashboard/[sessionId]` - Live session monitor

### Zoom Integration
- `/zoom/panel` - Zoom app panel (auto-detects host/student)
- `/zoom/auth` - Zoom OAuth authentication

## Testing Checklist

### In Zoom App
- [ ] Host can start session from Zoom panel
- [ ] Student sees "Record This Lecture" button
- [ ] Recording captures video + audio
- [ ] Upload completes successfully
- [ ] Transcription job created
- [ ] Status updates show in UI
- [ ] Q&A works after transcription

### On Website
- [ ] `/student` shows active sessions
- [ ] Can join a session
- [ ] Recording works
- [ ] Upload and transcription work
- [ ] Can ask questions when ready
- [ ] Teacher dashboard shows questions

## Configuration

### Environment Variables
All existing variables still work:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`

No additional configuration needed!

## Troubleshooting

### "No sessions found"
- Check that a teacher has started a session
- Verify session status is 'active' in database
- Check API endpoint `/api/live-sessions/active`

### "Recording button not showing"
- Old session may have video_id set
- End current session and start new one
- Ensure dropdown is set to "Students will record"

### "Recording permission denied"
- Browser blocked screen capture
- Check browser permissions
- Use HTTPS (required for getDisplayMedia)

### "Transcription stuck"
- Check jobs table for status
- Verify OpenAI API key is set
- Check worker process is running

## Next Steps

### Potential Enhancements
1. **Multiple recordings per session** - Let students record multiple segments
2. **Live transcription** - Real-time transcript display during recording
3. **Collaborative Q&A** - Students see each other's questions
4. **Question upvoting** - Popular questions highlighted
5. **Recording preview** - Watch before uploading
6. **Chunked uploads** - Better for large files
7. **Mobile support** - Record on mobile devices

## Summary

✅ **Zoom app features now accessible on website**
✅ **Screen recording works everywhere**
✅ **Students can join from Zoom or web**
✅ **Teachers can manage from either place**
✅ **Same transcription pipeline for all recordings**
✅ **All three Q&A modes fully functional**

The integration is complete and ready to use!
