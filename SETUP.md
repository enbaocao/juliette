# Setup Instructions

## Prerequisites

1. **Supabase Account**
   - Sign up at https://supabase.com
   - Create a new project
   - Note down your project URL and API keys

2. **OpenAI Account**
   - Sign up at https://platform.openai.com
   - Create an API key
   - Add credits to your account

3. **Zoom Developer Account** (for Zoom integration later)
   - Sign up at https://marketplace.zoom.us
   - Create a Zoom App

## Step-by-Step Setup

### 1. Supabase Setup

#### A. Create Project
- Go to https://app.supabase.com
- Click "New Project"
- Choose a name (e.g., "juliette-dev")
- Set a strong database password
- Choose a region close to you

#### B. Run Database Migrations
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run the SQL
4. Verify tables were created: videos, transcript_chunks, questions, jobs

#### C. Create Storage Buckets
1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `videos`
   - Make it **private** (not public)
3. Create another bucket named `renders`
   - Make it **private**

#### D. Get Your Credentials
1. Go to **Settings → API**
2. Copy these values:
   - Project URL
   - `anon` public key
   - `service_role` secret key (be careful with this!)

### 2. Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# Zoom (optional for now)
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
```

### 3. Install Dependencies (if not done)

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The app should be running at http://localhost:3001

## What's Next?

Once you've completed the setup above:
1. Test that you can access the app
2. I'll build the video upload feature
3. Test uploading a video
4. I'll build the transcription worker
5. And so on...

## Troubleshooting

### Supabase Connection Issues
- Verify your `.env.local` has the correct URL and keys
- Check that the keys don't have extra spaces or quotes
- Restart the dev server after changing environment variables

### OpenAI API Issues
- Verify your API key is valid
- Check that you have credits in your OpenAI account
- The Whisper API costs about $0.006 per minute of audio

### Storage Upload Issues
- Verify storage buckets are created
- Check bucket permissions (should be private with RLS policies)
- Ensure service role key is set correctly
