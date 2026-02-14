# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Juliette is an AI-powered educational video assistant built for a hackathon MVP. It ingests educational videos, generates transcripts, and answers student questions with three modes:
1. **Simple explanations** - Short explanation with check questions
2. **Practice problems** - Personalized problems based on student interest tags
3. **Animations** - Manim-rendered visualizations using predefined templates

The app also integrates with Zoom for live classroom Q&A.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI (Whisper for transcription, GPT for Q&A, embeddings for search)
- **Animations**: Manim (Docker-based render worker with predefined templates)
- **Integration**: Zoom Apps SDK

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Install dependencies
npm install
```

## Architecture

### Core Flow

1. **Video Upload** → Store in Supabase Storage → Create job for transcription
2. **Transcription** → Worker downloads video → Whisper API → Chunk into 45-90s segments with timestamps → Store in `transcript_chunks`
3. **Question Asked** → Retrieve relevant transcript chunks → Send to OpenAI with mode + interest tags → Return response
4. **Animation Mode** → LLM selects template + parameters → Create render job → Manim worker generates MP4 → Store in Supabase Storage

### Database Schema (Supabase)

- `videos` - Uploaded video metadata (id, user_id, title, storage_path, status)
- `transcript_chunks` - Timestamped transcript segments (id, video_id, start_sec, end_sec, text, embedding?)
- `questions` - Student questions and AI responses (id, video_id, user_id, question, mode, interest_tags, answer)
- `jobs` - Background task queue (id, type, payload, status, result_path, error)

See `supabase/migrations/001_initial_schema.sql` for full schema.

### Key Directories

- `app/` - Next.js App Router pages and API routes
- `components/` - Reusable React components
- `lib/` - Client configurations (Supabase, OpenAI)
- `utils/` - Helper functions
- `supabase/migrations/` - Database schema and migrations

### Environment Variables

Required variables (see `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `OPENAI_API_KEY` - OpenAI API key
- `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` - For Zoom integration

## Implementation Notes

### MVP Constraints (Hackathon-Ready)

- **Retrieval**: Use simple keyword/tf-idf matching for transcript chunks. Skip vector embeddings unless time permits.
- **Animations**: Use only 3-5 predefined Manim templates (graph, vector, probability tree). LLM fills parameters, NOT arbitrary code generation.
- **Async Jobs**: Simple polling approach - worker process checks `jobs` table every few seconds. Upgrade to Redis queue only if needed.
- **Zoom Integration**: Use Zoom Apps SDK panel (easier than bot participant). Students open panel, select video, ask questions, see responses.

### Code Patterns

- Use Next.js Server Actions for mutations
- Use API routes for complex operations or webhooks
- Keep Supabase client in `lib/supabase.ts`, OpenAI client in `lib/openai.ts`
- Store uploaded videos in Supabase Storage bucket: `videos/`
- Store rendered animations in bucket: `renders/`

### Testing

When implementing features:
1. Test video upload flow manually
2. Verify transcription job creation and processing
3. Test each Q&A mode (simple, practice, animation)
4. Check that responses reference correct transcript timestamps
