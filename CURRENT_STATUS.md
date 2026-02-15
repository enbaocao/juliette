# Juliette - Current Build Status

## ✅ Completed Features

### 1. Video Upload System

**Status: COMPLETE**

- Drag-and-drop video upload interface (`/upload`)
- File validation (MP4, WebM, MOV, AVI, max 500MB)
- Upload to Supabase Storage
- Automatic job creation for transcription
- Redirect to video status page

**Files:**

- `app/upload/page.tsx` - Upload page
- `components/upload/VideoUpload.tsx` - Upload UI component
- `app/api/upload/route.ts` - Upload API endpoint

### 2. Transcription Worker

**Status: COMPLETE**

- Background job processor that polls `jobs` table
- Downloads videos from Supabase Storage
- Calls OpenAI Whisper API for transcription
- Chunks transcript into ~60 second segments with timestamps
- Stores chunks in `transcript_chunks` table
- Updates video status to 'transcribed'

**Files:**

- `workers/transcription-worker.ts` - Main worker implementation
- Run with: `npm run worker:transcription`

### 3. Q&A System with Three Modes

**Status: COMPLETE**

- Question interface with mode selector
- Three response modes:
  - **Simple**: Clear explanations with check questions
  - **Practice**: Personalized problems based on student interests
  - **Animation**: Animation template specifications (rendering not yet implemented)
- Keyword-based retrieval of relevant transcript chunks
- OpenAI GPT-4 integration for generating responses
- Stores questions and answers in database

**Files:**

- `app/videos/[id]/ask/page.tsx` - Q&A interface
- `components/qa/QuestionForm.tsx` - Question input form
- `components/qa/AnswerDisplay.tsx` - Answer display component
- `app/api/ask/route.ts` - Q&A API endpoint
- `utils/retrieval.ts` - Transcript chunk retrieval
- `utils/prompts.ts` - Prompt templates for each mode

### 4. Video Status Page

**Status: COMPLETE**

- Shows transcription status
- Links to Q&A interface when ready
- Displays video metadata

**Files:**

- `app/videos/[id]/page.tsx`

### 5. Database Schema

**Status: COMPLETE**

- `videos` table
- `transcript_chunks` table
- `questions` table
- `jobs` table
- `live_sessions` table (for Zoom integration)
- Row Level Security policies
- Storage buckets: `videos`, `renders`

**Files:**

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_live_sessions.sql`

### 6. Zoom Apps Integration

**Status: COMPLETE** ✅

- Zoom Apps SDK integration with panel UI
- Teacher controls for starting/ending live sessions
- Student interface for asking questions during class
- Real-time question feed with polling
- Teacher web dashboard for monitoring questions
- Live session management (start, end, check status)
- Support for linking lecture videos to live sessions

**Files:**

- `app/zoom/panel/page.tsx` - Main Zoom panel page
- `hooks/useZoomApp.ts` - Zoom SDK hook
- `components/zoom/LiveSessionPanel.tsx` - Panel router
- `components/zoom/HostControls.tsx` - Teacher interface
- `components/zoom/StudentView.tsx` - Student interface
- `app/live/dashboard/[sessionId]/page.tsx` - Teacher dashboard
- `app/api/live-sessions/*` - Live session API endpoints
- `lib/zoom.ts` - Zoom configuration
- `ZOOM_SETUP.md` - Complete setup guide

**Setup Instructions:** See [ZOOM_SETUP.md](ZOOM_SETUP.md) for detailed Zoom App configuration

## 🚧 Not Yet Implemented

### 1. Manim Animation Rendering

**Priority: HIGH**

- Docker container with Manim installed
- Render worker that processes animation jobs
- Template implementations (function_graph, vector_addition, etc.)
- Upload rendered MP4s to Supabase Storage

**Estimated Time: 6-8 hours**

**Note:** This is the only major feature remaining for the hackathon MVP!

### 2. Authentication

**Priority: LOW for MVP**

- Currently using hardcoded demo user ID
- For production: Supabase Auth with magic link/OAuth
- User session management

**Estimated Time: 2-3 hours**

### 3. Vector Search (Optional Enhancement)

**Priority: LOW**

- Currently using simple keyword matching
- Can upgrade to pgvector + OpenAI embeddings
- Better retrieval accuracy

**Estimated Time: 3-4 hours**

## 🛠️ What You Need To Do Now

### Step 1: Set Up Supabase (REQUIRED)

1. **Create a Supabase project:**
   - Go to https://app.supabase.com
   - Click "New Project"
   - Set a database password
   - Wait for project to be ready

2. **Run the SQL migrations:**
   - In Supabase dashboard, go to **SQL Editor**
   - First, run `supabase/migrations/001_initial_schema.sql`
   - Then, run `supabase/migrations/002_live_sessions.sql` (for Zoom integration)
   - Verify all tables appear in **Table Editor**

3. **Create storage buckets:**
   - Go to **Storage** in Supabase
   - Create bucket named `videos` (private)
   - Create bucket named `renders` (private)

4. **Get your credentials:**
   - Go to **Settings → API**
   - Copy:
     - Project URL
     - `anon` public key
     - `service_role` secret key (⚠️ keep this secret!)

### Step 2: Set Up OpenAI (REQUIRED)

1. Go to https://platform.openai.com
2. Create an API key
3. Add credits to your account
4. Cost estimate: ~$0.006 per minute of video transcription

### Step 3: Configure Environment Variables (REQUIRED)

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI
OPENAI_API_KEY=sk-your-key-here

# Zoom (optional - only needed for Zoom integration)
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_WEBHOOK_SECRET_TOKEN=your_zoom_webhook_secret

# Optional: Demo user ID (for MVP without auth)
DEMO_USER_ID=demo-user-123
```

### Step 4: Test the Application

```bash
# Terminal 1: Run the web app
npm run dev
# Opens on http://localhost:3001

# Terminal 2: Run the transcription worker
npm run worker:transcription
```

**Test Flow:**

1. Visit http://localhost:3001
2. Click "Upload Your First Video"
3. Upload a short test video (1-2 minutes)
4. You'll be redirected to the video status page
5. Watch the transcription worker logs in Terminal 2
6. Once transcribed, click "Start Asking Questions"
7. Try all three modes: Simple, Practice, Animation

### Step 5: Troubleshooting

**If upload fails:**

- Check Supabase storage buckets exist
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check browser console for errors

**If transcription doesn't start:**

- Verify worker is running (`npm run worker:transcription`)
- Check OpenAI API key is valid
- Look for errors in worker terminal
- Verify job was created in `jobs` table

**If Q&A fails:**

- Check video status is 'transcribed' in database
- Verify OpenAI API key has credits
- Check API logs in browser console

## 📊 Project Structure

```
juliette/
├── app/                       # Next.js pages
│   ├── api/                  # API routes
│   │   ├── ask/             # Q&A endpoint
│   │   ├── upload/          # Upload endpoint
│   │   ├── videos/          # Videos list
│   │   └── live-sessions/   # Live session management
│   ├── upload/              # Upload page
│   ├── videos/[id]/         # Video pages
│   ├── zoom/panel/          # Zoom panel page
│   └── live/dashboard/      # Teacher dashboard
├── components/               # React components
│   ├── qa/                  # Q&A components
│   ├── upload/              # Upload components
│   └── zoom/                # Zoom integration components
├── hooks/                    # React hooks
│   └── useZoomApp.ts        # Zoom SDK hook
├── lib/                      # Core libraries
│   ├── openai.ts            # OpenAI client
│   ├── supabase.ts          # Supabase client (public)
│   ├── supabase-server.ts   # Supabase admin client
│   ├── zoom.ts              # Zoom configuration
│   └── types.ts             # TypeScript types
├── utils/                    # Utilities
│   ├── prompts.ts           # AI prompt templates
│   └── retrieval.ts         # Transcript retrieval
├── workers/                  # Background workers
│   └── transcription-worker.ts
└── supabase/                # Database
    └── migrations/
        ├── 001_initial_schema.sql
        └── 002_live_sessions.sql
```

## ✅ Testing Zoom Integration (Optional)

The Zoom integration is now complete! To test it:

1. **Follow the setup guide:** See [ZOOM_SETUP.md](ZOOM_SETUP.md) for detailed instructions
2. **Create a Zoom App** in the Zoom Marketplace (takes ~15 min)
3. **Configure the app** with your local URL or ngrok tunnel
4. **Test in a Zoom meeting:**
   - Start a meeting
   - Open the Juliette app panel
   - As host: Start a session
   - As student: Ask questions
   - View questions on teacher dashboard

## 🎯 Next Steps for Hackathon

**Remaining work:**

1. **Manim Animation Templates (Optional - 6-8 hours)**
   - Set up Docker with Manim
   - Implement 3 templates
   - Create render worker
   - Test animations
   - **Note:** This is the only major feature not yet implemented

**Core MVP is COMPLETE!** The app now supports:
- ✅ Video upload and transcription
- ✅ AI Q&A with 3 modes
- ✅ Zoom live class integration
- ✅ Teacher dashboard

## 💡 Tips

- **Focus on the demo:** Prepare a 2-minute demo video on a clear topic (e.g., derivatives, probability)
- **Test early:** Upload and test with your demo video ASAP
- **Skip features if needed:** Zoom integration is cool but not essential if time is tight
- **Animation templates:** Start with 1 simple template (function_graph) and expand if time permits

## 🆘 Need Help?

Common issues and solutions are in SETUP.md. For bugs, check:

1. Browser console (F12)
2. Worker logs in terminal
3. Supabase logs in dashboard
4. Check all environment variables are set correctly
