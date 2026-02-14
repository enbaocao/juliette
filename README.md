# Juliette - AI Educational Video Assistant

An AI agent that ingests educational videos, answers student questions with Manim-style animations, personalized practice problems, or simple explanations, and integrates with Zoom for live Q&A.

## Features

- **Video Upload & Transcription**: Upload educational videos or provide URLs for automatic transcription with timestamps
- **AI-Powered Q&A**: Three response modes:
  - Simple explanations with check questions
  - Personalized practice problems based on student interests
  - Animated visualizations using Manim templates
- **Zoom Integration**: Live Q&A panel in Zoom meetings for classroom use
- **Teacher Feedback**: Alternative explanations and resource suggestions

## Tech Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth, Postgres, Storage, Vector Search)
- **AI**: OpenAI (Transcription, Q&A, Embeddings)
- **Animations**: Manim (Docker-based render worker)
- **Real-time**: Zoom Apps SDK

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key
- (Optional) Zoom Developer account for Zoom integration

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd juliette
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:
- Supabase URL and keys
- OpenAI API key
- Zoom credentials (if using Zoom integration)

4. Set up Supabase database:

Run the SQL migrations in `supabase/migrations/` to create the necessary tables:
- `videos` - stores uploaded video metadata
- `transcript_chunks` - timestamped transcript segments
- `questions` - student questions and AI responses
- `jobs` - background task queue

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
juliette/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                 # Utilities and configurations
│   ├── supabase.ts     # Supabase client
│   └── openai.ts       # OpenAI client
├── utils/              # Helper functions
├── public/             # Static assets
└── supabase/           # Database migrations and schemas
```

## Architecture

See [Project.md](./Project.md) for detailed MVP architecture and implementation plan.

## License

MIT
