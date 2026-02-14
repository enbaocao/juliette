REALISTIC MVP
Got it — for a 33-hour hackathon MVP, Supabase is the right move. Here’s a fastest-possible MVP stack + build plan that still hits your 3 features and Zoom.
MVP scope (what you can реально ship)
Upload/URL a video → auto transcript + “ask questions”
For each question, user picks a mode:
Explain simply
Practice problems personalized (pick interest tags)
Animation (Manim template, not arbitrary)
Zoom integration (hackathon-friendly):
Zoom App panel: students type Qs, see responses + links to animation output
Skip (for MVP):
“Pull other videos from the internet and live teacher feedback” (too much integration + trust issues). If you must demo it, do it as a single button: “Find alternative explanation” that runs a web search and returns 2–3 suggestions with sources.

Tech stack (Supabase-first)
Frontend
Next.js (App Router) + Tailwind
Zoom Apps SDK (same Next app can host the Zoom panel UI)
Backend
Next.js API routes / Server Actions (fastest, no separate backend)
Optional: Supabase Edge Functions if you want isolated compute, but not required.
Supabase (the speed layer)
Auth: magic link / OAuth
Postgres: store users, videos, transcripts, Q&A
Storage: store uploaded videos + rendered animation MP4s
Vector search: either
pgvector in Supabase (best if you know it), or
skip vectors and do timestamped keyword retrieval for MVP (fastest).
AI
OpenAI:
Transcription (audio → transcript with timestamps)
Q&A generation (simple/practice/animation script)
Embeddings only if you do vector search
Animation
Manim inside a Docker render worker
In hackathon time, constrain it:
only support 3–5 “scene templates” (graph, vector, probability tree, derivative/integral, geometry)
agent fills parameters instead of generating free-form code
Async jobs
Cheapest hackathon version:
Supabase Edge Function or Next route triggers
For background rendering/transcription: use a simple in-process queue or a single worker process (Render/Railway/Fly) that polls Supabase “jobs” table.
If you have time: Upstash Redis + QStash for queues.

Database (Supabase tables you need)
Keep it tiny:
videos
id, user_id, title, storage_path, status (uploaded/transcribed), created_at
transcript_chunks
id, video_id, start_sec, end_sec, text
optional: embedding vector if using pgvector
questions
id, video_id, user_id, question, mode (simple/practice/animation), interest_tags, answer, created_at
jobs
id, type (transcribe/render), payload jsonb, status, result_path, error

MVP flow (end-to-end)
1) Upload video
Next.js uploads to Supabase Storage
Insert row in videos with status='uploaded'
Create jobs row: {type:'transcribe', payload:{video_id, storage_path}}
2) Transcribe job
Worker:
Downloads audio (or video) from Supabase Storage
Calls transcription
Splits into chunks (e.g., 45–90s) with timestamps
Inserts into transcript_chunks
Mark videos.status='transcribed'
3) Ask a question
API route:
Retrieve top relevant transcript chunks (fast MVP approach):
keyword match / simple tf-idf / “best 5 chunks by overlap”
(or embeddings if you implement)
Call LLM with:
question
relevant chunks with timestamps
mode + interest tags
Return answer
4) If mode = animation
LLM outputs:
chosen template + parameters (NOT raw arbitrary code)
Create jobs row: {type:'render', payload:{template, params, video_id, question_id}}
UI shows “Rendering…” and polls job status
When done, show MP4 from Supabase Storage

Zoom integration (fastest)
Use Zoom Apps SDK panel
In the meeting, students open your app panel
They select the class video (or teacher pins it)
They ask a question and see the response
For animation responses: show link/embedded player from your hosted Next.js page with the Supabase Storage signed URL
This is much easier than building a “bot participant”.

33-hour build plan (brutal and realistic)
Hour 0–4: Skeleton + Supabase
Next.js app + Supabase project
Auth + protected pages
Storage bucket: videos, renders
Create tables (videos, transcript_chunks, questions, jobs)
Hour 4–12: Transcription pipeline
Upload → jobs row
Simple worker script (Node or Python) polling jobs
Transcribe → chunk → insert transcript_chunks
Hour 12–20: Q&A modes (simple + practice)
Retrieval: quick keyword scoring
Mode prompts:
simple: short explanation + 1 check question
practice: 3 problems + solutions + hints + interest theming
Hour 20–28: Animation templates
Implement 3 templates:
function graph + tangent line
vector addition
probability tree / Markov step
LLM picks template + fills params
Render in Docker → upload MP4 to Storage
Hour 28–33: Zoom App panel + polish demo
Zoom Apps SDK panel UI
Connect to same Q&A endpoints
Demo script: teacher plays video → students ask → animation pops

“Cheat codes” to finish in time
Don’t implement embeddings unless you already know pgvector well.
Don’t generate arbitrary manim code: template fill only.
Don’t do live “teacher missed something” beyond a single “Find alternate explanation” button.

If you tell me what topic your hackathon demo video will be (e.g., derivatives, Bayes, physics), I can give you:
the exact 3 Manim templates that will look most impressive,
the Supabase SQL schema you can paste in,
and copy-paste prompt templates for the 3 response modes.
