// Load environment variables FIRST before any imports
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now import everything else
import { createClient } from '@supabase/supabase-js';
import { Job } from '../lib/types';
import * as fs from 'fs';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createFileLogger } from '../lib/file-logger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const execFileAsync = promisify(execFile);
const POLLING_INTERVAL = 5000;
const JOB_TIMEOUT = 180000;
const CHUNK_DURATION = 60;
const logger = createFileLogger('youtube-download-worker');
let lastIdleLogAt = 0;

interface VideoMetadata {
  title: string;
}

interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

async function getVideoMetadata(youtubeUrl: string): Promise<VideoMetadata> {
  const { stdout } = await execFileAsync(
    'yt-dlp',
    [
      '--print', '%(title)s',
      '--no-warnings',
      youtubeUrl,
    ],
    { timeout: 30000 }
  );

  return {
    title: stdout.trim().split('\n')[0] || 'YouTube Video',
  };
}

function parseVttTimestamp(timestamp: string): number {
  const cleaned = timestamp.trim().replace(',', '.');
  const parts = cleaned.split(':').map(Number);

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return Number(cleaned) || 0;
}

function stripVttTags(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseVtt(content: string): SubtitleSegment[] {
  const lines = content.split(/\r?\n/);
  const segments: SubtitleSegment[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line || line === 'WEBVTT' || line.startsWith('NOTE') || line.startsWith('STYLE')) {
      i++;
      continue;
    }

    if (/^\d+$/.test(line) && i + 1 < lines.length && lines[i + 1].includes('-->')) {
      i++;
    }

    if (!lines[i] || !lines[i].includes('-->')) {
      i++;
      continue;
    }

    const timing = lines[i].split('-->');
    const start = parseVttTimestamp(timing[0]);
    const end = parseVttTimestamp((timing[1] || '').trim().split(' ')[0]);
    i++;

    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i]);
      i++;
    }

    const text = stripVttTags(textLines.join(' '));
    if (text) {
      const prev = segments[segments.length - 1];
      if (prev && prev.start === start && prev.end === end && prev.text === text) {
        continue;
      }
      segments.push({ start, end, text });
    }
  }

  return segments;
}

async function downloadSubtitleFile(youtubeUrl: string, videoId: string): Promise<string> {
  const tempDir = os.tmpdir();
  const baseName = `yt-sub-${videoId}-${Date.now()}`;
  const outputTemplate = path.join(tempDir, `${baseName}.%(ext)s`);

  await execFileAsync(
    'yt-dlp',
    [
      '--skip-download',
      '--write-subs',
      '--write-auto-subs',
      '--sub-langs', 'en.*,en',
      '--sub-format', 'vtt',
      '--no-warnings',
      '-o', outputTemplate,
      youtubeUrl,
    ],
    { timeout: JOB_TIMEOUT }
  );

  const candidates = fs
    .readdirSync(tempDir)
    .filter((name) => name.startsWith(baseName) && name.endsWith('.vtt'))
    .map((name) => path.join(tempDir, name));

  if (candidates.length === 0) {
    throw new Error('No subtitle tracks available for this video.');
  }

  return candidates[0];
}

function chunkTranscript(
  segments: SubtitleSegment[],
  chunkDuration: number = CHUNK_DURATION
): Array<{ start_sec: number; end_sec: number; text: string }> {
  const chunks: Array<{ start_sec: number; end_sec: number; text: string }> = [];
  let currentChunk = {
    start_sec: 0,
    end_sec: 0,
    text: '',
  };

  for (const segment of segments) {
    if (!segment.text.trim()) continue;

    if (currentChunk.text && segment.end - currentChunk.start_sec > chunkDuration) {
      chunks.push({ ...currentChunk });
      currentChunk = {
        start_sec: segment.start,
        end_sec: segment.end,
        text: segment.text.trim(),
      };
    } else {
      if (!currentChunk.text) {
        currentChunk.start_sec = segment.start;
      }
      currentChunk.end_sec = segment.end;
      currentChunk.text += (currentChunk.text ? ' ' : '') + segment.text.trim();
    }
  }

  if (currentChunk.text) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function processDownloadJob(job: Job): Promise<void> {
  const { video_id, youtube_url } = job.payload;

  if (!video_id || !youtube_url) {
    throw new Error('Missing video_id or youtube_url in job payload');
  }

  logger.info(`Processing subtitle job ${job.id} for video ${video_id}`);

  await supabaseAdmin
    .from('jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', job.id);

  await supabaseAdmin
    .from('videos')
    .update({ status: 'downloading' })
    .eq('id', video_id);

  let subtitlePath: string | null = null;

  try {
    const metadata = await getVideoMetadata(youtube_url);
    subtitlePath = await downloadSubtitleFile(youtube_url, video_id);
    const subtitleContent = fs.readFileSync(subtitlePath, 'utf-8');

    const segments = parseVtt(subtitleContent);
    const chunks = chunkTranscript(segments);

    if (chunks.length === 0) {
      throw new Error('Subtitle file was found but no transcript chunks were parsed.');
    }

    const { error: chunksError } = await supabaseAdmin
      .from('transcript_chunks')
      .insert(
        chunks.map((chunk) => ({
          video_id,
          start_sec: chunk.start_sec,
          end_sec: chunk.end_sec,
          text: chunk.text,
        }))
      );

    if (chunksError) {
      throw new Error(`Failed to insert transcript chunks: ${chunksError.message}`);
    }

    await supabaseAdmin
      .from('videos')
      .update({
        storage_path: null,
        status: 'transcribed',
        title: metadata.title,
      })
      .eq('id', video_id);

    await supabaseAdmin
      .from('jobs')
      .update({
        status: 'completed',
        result_path: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    logger.info(`✓ Subtitle job ${job.id} completed successfully`);
  } catch (error) {
    logger.error(`✗ Subtitle job ${job.id} failed:`, error);

    await supabaseAdmin
      .from('videos')
      .update({ status: 'uploaded' })
      .eq('id', video_id);

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
    if (subtitlePath && fs.existsSync(subtitlePath)) {
      fs.unlinkSync(subtitlePath);
      logger.info(`✓ Cleaned up subtitle file: ${subtitlePath}`);
    }
  }
}

async function pollJobs(): Promise<void> {
  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('type', 'download')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      logger.error('Error fetching jobs:', error);
      return;
    }

    if (jobs && jobs.length > 0) {
      await processDownloadJob(jobs[0] as Job);
    } else {
      const now = Date.now();
      if (now - lastIdleLogAt >= 60000) {
        logger.info('No pending download jobs.');
        lastIdleLogAt = now;
      }
    }
  } catch (error) {
    logger.error('Error in poll cycle:', error);
  }
}

export async function startYouTubeDownloadWorker(): Promise<void> {
  logger.info('📝 YouTube subtitle worker started');
  logger.info(`Polling every ${POLLING_INTERVAL}ms for subtitle jobs...`);
  logger.info(`Writing logs to ${logger.filePath}`);

  await pollJobs();

  setInterval(async () => {
    await pollJobs();
  }, POLLING_INTERVAL);
}

if (require.main === module) {
  startYouTubeDownloadWorker().catch((error) => {
    logger.error('Worker crashed:', error);
    process.exit(1);
  });
}
