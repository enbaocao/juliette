import { supabaseAdmin } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';
import { Job } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const POLLING_INTERVAL = 5000; // 5 seconds
const CHUNK_DURATION = 60; // 60 seconds per chunk

async function downloadVideo(storagePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('videos')
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download video: ${error?.message}`);
  }

  // Save to temp file
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `video-${Date.now()}.mp4`);
  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(tempFile, buffer);

  return tempFile;
}

async function transcribeVideo(filePath: string): Promise<{ text: string; duration?: number }> {
  try {
    // Open the file as a stream
    const fileStream = fs.createReadStream(filePath);

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    return {
      text: transcription.text,
      duration: (transcription as any).duration,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

function chunkTranscript(
  segments: any[],
  chunkDuration: number = CHUNK_DURATION
): Array<{ start_sec: number; end_sec: number; text: string }> {
  const chunks: Array<{ start_sec: number; end_sec: number; text: string }> = [];
  let currentChunk = {
    start_sec: 0,
    end_sec: 0,
    text: '',
  };

  for (const segment of segments) {
    const segmentStart = segment.start || 0;
    const segmentEnd = segment.end || segmentStart + 1;
    const segmentText = segment.text || '';

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

async function processTranscriptionJob(job: Job): Promise<void> {
  const { video_id, storage_path } = job.payload;

  if (!video_id || !storage_path) {
    throw new Error('Missing video_id or storage_path in job payload');
  }

  console.log(`Processing transcription job ${job.id} for video ${video_id}`);

  // Update job status to processing
  await supabaseAdmin
    .from('jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', job.id);

  let tempFile: string | null = null;

  try {
    // Download video
    console.log('Downloading video...');
    tempFile = await downloadVideo(storage_path);

    // Transcribe
    console.log('Transcribing video...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFile),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    const segments = (transcription as any).segments || [];
    console.log(`Transcribed ${segments.length} segments`);

    // Chunk the transcript
    const chunks = chunkTranscript(segments, CHUNK_DURATION);
    console.log(`Created ${chunks.length} chunks`);

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
      throw new Error(`Failed to insert chunks: ${insertError.message}`);
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

    console.log(`✓ Transcription job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`✗ Transcription job ${job.id} failed:`, error);

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
  } finally {
    // Clean up temp file
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

async function pollJobs(): Promise<void> {
  try {
    // Fetch pending transcription jobs
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('type', 'transcribe')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error fetching jobs:', error);
      return;
    }

    if (jobs && jobs.length > 0) {
      const job = jobs[0] as Job;
      await processTranscriptionJob(job);
    }
  } catch (error) {
    console.error('Error in poll cycle:', error);
  }
}

// Main worker loop
export async function startTranscriptionWorker(): Promise<void> {
  console.log('🎬 Transcription worker started');
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
  startTranscriptionWorker().catch((error) => {
    console.error('Worker crashed:', error);
    process.exit(1);
  });
}
