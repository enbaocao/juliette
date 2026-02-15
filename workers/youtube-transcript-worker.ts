// Load environment variables FIRST before any imports
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now import everything else
import { createClient } from '@supabase/supabase-js';
import { Job } from '../lib/types';
import { YoutubeTranscript } from 'youtube-transcript';

// Create Supabase client after env vars are loaded
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const POLLING_INTERVAL = 5000; // 5 seconds
const CHUNK_DURATION = 60; // 60 seconds per chunk

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

function extractVideoId(youtubeUrl: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = youtubeUrl.match(regex);
  return match ? match[1] : null;
}

async function fetchYouTubeTranscript(youtubeUrl: string): Promise<TranscriptSegment[]> {
  try {
    console.log(`Fetching YouTube transcript: ${youtubeUrl}`);

    const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl);

    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript available for this video. The video may not have captions.');
    }

    console.log(`✓ Fetched ${transcript.length} transcript segments`);

    return transcript.map((segment: any) => ({
      text: segment.text,
      start: segment.offset / 1000, // Convert ms to seconds
      duration: segment.duration / 1000, // Convert ms to seconds
    }));
  } catch (error) {
    console.error('Failed to fetch transcript:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to fetch transcript. The video may not have captions or may be private.'
    );
  }
}

function chunkTranscript(
  segments: TranscriptSegment[],
  chunkDuration: number = CHUNK_DURATION
): Array<{ start_sec: number; end_sec: number; text: string }> {
  const chunks: Array<{ start_sec: number; end_sec: number; text: string }> = [];
  let currentChunk = {
    start_sec: 0,
    end_sec: 0,
    text: '',
  };

  for (const segment of segments) {
    const segmentStart = segment.start;
    const segmentEnd = segment.start + segment.duration;
    const segmentText = segment.text;

    // If this segment would make the chunk too long, save current chunk and start new one
    if (currentChunk.text && segmentEnd - currentChunk.start_sec > chunkDuration) {
      chunks.push({ ...currentChunk });
      currentChunk = {
        start_sec: segmentStart,
        end_sec: segmentEnd,
        text: segmentText.trim(),
      };
    } else {
      // Add to current chunk
      if (!currentChunk.text) {
        currentChunk.start_sec = segmentStart;
      }
      currentChunk.end_sec = segmentEnd;
      currentChunk.text += (currentChunk.text ? ' ' : '') + segmentText.trim();
    }
  }

  // Add final chunk
  if (currentChunk.text) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function processYouTubeJob(job: Job): Promise<void> {
  const { video_id, youtube_url } = job.payload;

  if (!video_id || !youtube_url) {
    throw new Error('Missing video_id or youtube_url in job payload');
  }

  console.log(`Processing YouTube transcript job ${job.id} for video ${video_id}`);

  // Update job status to processing
  await supabaseAdmin
    .from('jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', job.id);

  try {
    // Fetch transcript from YouTube
    const segments = await fetchYouTubeTranscript(youtube_url);

    // Chunk the transcript
    const chunks = chunkTranscript(segments, CHUNK_DURATION);
    console.log(`Created ${chunks.length} chunks from transcript`);

    // Insert chunks into database
    const chunksToInsert = chunks.map((chunk) => ({
      video_id,
      start_sec: chunk.start_sec,
      end_sec: chunk.end_sec,
      text: chunk.text,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('transcript_chunks')
      .insert(chunksToInsert);

    if (insertError) {
      throw new Error(`Failed to insert transcript chunks: ${insertError.message}`);
    }

    // Update video status to transcribed
    await supabaseAdmin
      .from('videos')
      .update({ status: 'transcribed' })
      .eq('id', video_id);

    // Mark job as completed
    await supabaseAdmin
      .from('jobs')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    console.log(`✓ YouTube transcript job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`✗ YouTube transcript job ${job.id} failed:`, error);

    // Mark video as failed (or keep as uploaded with error in job)
    await supabaseAdmin
      .from('videos')
      .update({ status: 'uploaded' })
      .eq('id', video_id);

    // Mark job as failed
    await supabaseAdmin
      .from('jobs')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    throw error;
  }
}

async function pollJobs(): Promise<void> {
  try {
    // Fetch pending download jobs (reusing the same job type)
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('type', 'download')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error fetching jobs:', error);
      return;
    }

    if (jobs && jobs.length > 0) {
      const job = jobs[0] as Job;
      await processYouTubeJob(job);
    }
  } catch (error) {
    console.error('Error in poll cycle:', error);
  }
}

// Main worker loop
export async function startYouTubeTranscriptWorker(): Promise<void> {
  console.log('📝 YouTube transcript worker started');
  console.log(`Polling every ${POLLING_INTERVAL}ms for new jobs...`);

  // Initial poll
  await pollJobs();

  // Set up polling interval
  setInterval(async () => {
    await pollJobs();
  }, POLLING_INTERVAL);
}

// For standalone execution
if (require.main === module) {
  startYouTubeTranscriptWorker().catch((error) => {
    console.error('Worker crashed:', error);
    process.exit(1);
  });
}
