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

const execFileAsync = promisify(execFile);
const POLLING_INTERVAL = 5000; // 5 seconds
const DOWNLOAD_TIMEOUT = 600000; // 10 minutes
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

interface VideoMetadata {
  title: string;
  duration: number;
  filesize?: number;
}

async function getVideoMetadata(youtubeUrl: string): Promise<VideoMetadata> {
  try {
    const { stdout } = await execFileAsync(
      'yt-dlp',
      [
        '--print', '%(title)s',
        '--print', '%(duration)s',
        '--print', '%(filesize,filesize_approx)s',
        '--no-warnings',
        youtubeUrl,
      ],
      { timeout: 30000 }
    );

    const lines = stdout.trim().split('\n');
    const title = lines[0] || 'Untitled Video';
    const duration = parseFloat(lines[1]) || 0;
    const filesize = lines[2] !== 'NA' ? parseFloat(lines[2]) : undefined;

    return { title, duration, filesize };
  } catch (error) {
    console.error('Failed to fetch video metadata:', error);
    throw new Error('Failed to fetch video metadata. The video may be private or unavailable.');
  }
}

async function downloadYouTubeVideo(
  youtubeUrl: string,
  videoId: string
): Promise<{ filePath: string; metadata: VideoMetadata }> {
  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `youtube-${videoId}-${Date.now()}.mp4`);

  try {
    console.log(`Downloading YouTube video: ${youtubeUrl}`);

    // Get metadata first to check file size
    const metadata = await getVideoMetadata(youtubeUrl);

    if (metadata.filesize && metadata.filesize > MAX_FILE_SIZE) {
      throw new Error(`Video file size (${Math.round(metadata.filesize / 1024 / 1024)}MB) exceeds 500MB limit`);
    }

    // Download the video
    // Format: best video+audio in mp4, fallback to best single file
    const { stderr } = await execFileAsync(
      'yt-dlp',
      [
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '-o', outputPath,
        '--no-warnings',
        youtubeUrl,
      ],
      {
        timeout: DOWNLOAD_TIMEOUT,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for stderr
      }
    );

    // Check if file was created and verify size
    if (!fs.existsSync(outputPath)) {
      throw new Error('Video download failed - file not created');
    }

    const stats = fs.statSync(outputPath);
    if (stats.size > MAX_FILE_SIZE) {
      fs.unlinkSync(outputPath);
      throw new Error(`Downloaded video (${Math.round(stats.size / 1024 / 1024)}MB) exceeds 500MB limit`);
    }

    console.log(`✓ Downloaded video: ${stats.size} bytes`);
    return { filePath: outputPath, metadata };
  } catch (error) {
    // Clean up temp file if it exists
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Video download timed out (10 minute limit exceeded)');
      }
      if (error.message.includes('private') || error.message.includes('unavailable')) {
        throw new Error('Video is private or unavailable');
      }
    }

    throw error;
  }
}

async function uploadToStorage(
  filePath: string,
  userId: string,
  videoId: string
): Promise<string> {
  const fileName = `${videoId}.mp4`;
  const storagePath = `${userId}/${fileName}`;

  console.log(`Uploading to Supabase Storage: videos/${storagePath}`);

  const fileBuffer = fs.readFileSync(filePath);

  const { error: uploadError } = await supabaseAdmin.storage
    .from('videos')
    .upload(storagePath, fileBuffer, {
      contentType: 'video/mp4',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload to storage: ${uploadError.message}`);
  }

  console.log(`✓ Uploaded to storage: videos/${storagePath}`);
  return storagePath;
}

async function processDownloadJob(job: Job): Promise<void> {
  const { video_id, youtube_url, user_id } = job.payload;

  if (!video_id || !youtube_url || !user_id) {
    throw new Error('Missing video_id, youtube_url, or user_id in job payload');
  }

  console.log(`Processing download job ${job.id} for video ${video_id}`);

  // Update job status to processing
  await supabaseAdmin
    .from('jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', job.id);

  // Update video status to downloading
  await supabaseAdmin
    .from('videos')
    .update({ status: 'downloading' })
    .eq('id', video_id);

  let tempFile: string | null = null;

  try {
    // Download video from YouTube
    const { filePath, metadata } = await downloadYouTubeVideo(youtube_url, video_id);
    tempFile = filePath;

    // Upload to Supabase Storage
    const storagePath = await uploadToStorage(filePath, user_id, video_id);

    // Update video record with storage path and status
    await supabaseAdmin
      .from('videos')
      .update({
        storage_path: storagePath,
        status: 'uploaded',
        title: metadata.title,
      })
      .eq('id', video_id);

    // Create transcription job
    const { error: transcribeJobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        type: 'transcribe',
        payload: {
          video_id,
          storage_path: storagePath,
        },
        status: 'pending',
      });

    if (transcribeJobError) {
      throw new Error(`Failed to create transcription job: ${transcribeJobError.message}`);
    }

    console.log(`✓ Created transcription job for video ${video_id}`);

    // Mark download job as completed
    await supabaseAdmin
      .from('jobs')
      .update({
        status: 'completed',
        result_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    console.log(`✓ Download job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`✗ Download job ${job.id} failed:`, error);

    // Mark video as failed (keep as uploaded status but with error in job)
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
  } finally {
    // Clean up temp file
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log(`✓ Cleaned up temp file: ${tempFile}`);
    }
  }
}

async function pollJobs(): Promise<void> {
  try {
    // Fetch pending download jobs
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
      await processDownloadJob(job);
    }
  } catch (error) {
    console.error('Error in poll cycle:', error);
  }
}

// Main worker loop
export async function startYouTubeDownloadWorker(): Promise<void> {
  console.log('📥 YouTube download worker started');
  console.log(`Polling every ${POLLING_INTERVAL}ms for new download jobs...`);

  // Initial poll
  await pollJobs();

  // Set up polling interval
  setInterval(async () => {
    await pollJobs();
  }, POLLING_INTERVAL);
}

// For standalone execution
if (require.main === module) {
  startYouTubeDownloadWorker().catch((error) => {
    console.error('Worker crashed:', error);
    process.exit(1);
  });
}
