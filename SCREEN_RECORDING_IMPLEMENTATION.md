# Screen Recording Implementation

## Overview

Successfully pivoted from the complex Zoom Video SDK bot approach to a simpler, more reliable **browser-based screen recording** solution. Students now record their Zoom window directly from the Juliette app panel.

## Architecture

### New Flow

1. **Student launches Juliette app** in Zoom meeting panel
2. **Click "Start Recording"** → Browser prompts to share screen
3. **Select Zoom window** (with audio) to record
4. **Recording captured** using MediaRecorder API
5. **Stop Recording** → Upload to Supabase Storage
6. **Automatic transcription** via existing pipeline
7. **Q&A enabled** once transcription completes

### Key Benefits

✅ **No Video SDK complexity** - Pure browser APIs
✅ **No bot participant** - Students record directly
✅ **Reuses existing pipeline** - Video upload + transcription already works
✅ **Simple UX** - One button to start/stop recording
✅ **Works everywhere** - Any modern browser with screen capture support

## Implementation Details

### New Components

#### `ScreenRecorder.tsx`
- Uses `navigator.mediaDevices.getDisplayMedia()` for screen capture
- MediaRecorder API captures video/audio stream
- Uploads recording as WebM to existing `/api/upload` endpoint
- Links video to live session via `/api/live-sessions/link-video`
- Shows recording duration timer
- Handles processing/upload states

### Updated Components

#### `StudentView.tsx`
- Shows **ScreenRecorder** when session has no video_id
- Shows **Processing status** when video is uploading/transcribing
- Shows **Q&A interface** when video.status === 'transcribed'
- Polls for video status updates every 5 seconds

### New API Endpoints

#### `POST /api/live-sessions/link-video`
- Links a video_id to a live session
- Updates `live_sessions.video_id` field

#### `GET /api/videos/[id]`
- Fetches single video by ID
- Used to poll for transcription status

### Cleanup Completed

✅ Removed `rtms-service/` directory (was locked, now empty - manually delete)
✅ Removed bot/RTMS documentation files
✅ Removed `app/zoom/live/` directory
✅ Removed RTMS database migration
✅ Cleaned up `LiveSession` type (removed RTMS fields)
✅ Removed `RTMSConnection` interface

## User Flow

### For Students

1. Open Juliette app in Zoom meeting
2. See "Record This Lecture" interface
3. Click "Start Recording"
4. Browser prompts: "Choose what to share"
5. Select Zoom meeting window + Include audio
6. Recording begins with timer display
7. Click "Stop Recording" when done
8. Wait 1-2 minutes for transcription
9. Ask questions using three modes:
   - Simple explanations
   - Practice problems
   - Animations (Manim)

### For Teachers

- Same as before: Start/end live sessions
- No changes needed to host controls
- Sessions automatically linked to recordings

## Technical Notes

### Browser Compatibility

- Chrome/Edge: Full support ✅
- Firefox: Full support ✅
- Safari: Partial (check audio capture) ⚠️
- Requires HTTPS (except localhost)

### File Format

- Recording format: WebM (VP8 video + Opus audio)
- Existing transcription pipeline handles WebM ✅
- Typical 10-min recording: ~20-50 MB

### Error Handling

- Permission denied → Clear error message
- Upload failed → Retry with error display
- Transcription failed → Status shown in UI

## Testing Checklist

- [ ] Start Zoom meeting and open Juliette panel
- [ ] Click "Start Recording" and grant permissions
- [ ] Select Zoom window with audio
- [ ] Record 30 seconds of test content
- [ ] Stop recording and verify upload
- [ ] Check video record created in database
- [ ] Verify transcription job created
- [ ] Wait for transcription to complete
- [ ] Test asking questions with all three modes
- [ ] Verify references link to correct timestamps

## Next Steps

1. **Manual cleanup**: Delete empty `rtms-service/` directory
2. **Test the flow**: Follow testing checklist above
3. **Polish UI**: Add better loading states if needed
4. **Add analytics**: Track recording usage
5. **Consider features**:
   - Resume recording (multiple segments)
   - Video preview before upload
   - Chunk uploads for large files
   - Download recording locally

## Files Modified

- `components/zoom/ScreenRecorder.tsx` *(new)*
- `components/zoom/StudentView.tsx` *(updated)*
- `app/api/live-sessions/link-video/route.ts` *(new)*
- `app/api/videos/[id]/route.ts` *(new)*
- `lib/types.ts` *(cleaned up)*

## Files Removed

- `rtms-service/*` (entire directory)
- `app/zoom/live/*`
- `supabase/migrations/003_rtms_integration.sql`
- All bot/RTMS documentation files
