import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { YoutubeTranscript } from 'youtube-transcript';

const CHUNK_DURATION_SECONDS = 60;
const DEFAULT_DEMO_USER_ID = process.env.DEMO_USER_ID || '00000000-0000-0000-0000-000000000000';

function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsedUrl.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = parsedUrl.pathname.split('/').filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      const fromQuery = parsedUrl.searchParams.get('v');

      if (fromQuery && fromQuery.length === 11) return fromQuery;
      if (pathParts[0] === 'shorts' && pathParts[1]?.length === 11) return pathParts[1];
      if (pathParts[0] === 'embed' && pathParts[1]?.length === 11) return pathParts[1];
    }

    return null;
  } catch {
    return null;
  }
}

function validateYouTubeUrl(url: string): { valid: boolean; error?: string; videoId?: string; canonicalUrl?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const videoId = extractYouTubeVideoId(url.trim());
  if (!videoId) {
    return {
      valid: false,
      error: 'Invalid YouTube URL. Please use format: youtube.com/watch?v=... or youtu.be/...',
    };
  }

  return { valid: true, videoId, canonicalUrl: `https://www.youtube.com/watch?v=${videoId}` };
}

function chunkTranscript(
  segments: Array<{ text: string; start: number; duration: number }>,
  chunkDurationSeconds: number = CHUNK_DURATION_SECONDS
): Array<{ start_sec: number; end_sec: number; text: string }> {
  const chunks: Array<{ start_sec: number; end_sec: number; text: string }> = [];
  let currentChunk = {
    start_sec: 0,
    end_sec: 0,
    text: '',
  };

  for (const segment of segments) {
    const segmentText = segment.text.trim();
    if (!segmentText) continue;

    const segmentStart = Number(segment.start);
    const segmentEnd = Number(segment.start) + Number(segment.duration || 0);

    if (currentChunk.text && segmentEnd - currentChunk.start_sec > chunkDurationSeconds) {
      chunks.push({ ...currentChunk });
      currentChunk = {
        start_sec: segmentStart,
        end_sec: segmentEnd,
        text: segmentText,
      };
    } else {
      if (!currentChunk.text) {
        currentChunk.start_sec = segmentStart;
      }
      currentChunk.end_sec = segmentEnd;
      currentChunk.text += (currentChunk.text ? ' ' : '') + segmentText;
    }
  }

  if (currentChunk.text) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtube_url } = body;

    // Validate YouTube URL
    const validation = validateYouTubeUrl(youtube_url);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? DEFAULT_DEMO_USER_ID;
    const canonicalUrl = validation.canonicalUrl!;

    // Check if this YouTube video was already added
    const { data: existingVideos, error: checkError } = await supabaseAdmin
      .from('videos')
      .select('id, status, title')
      .eq('youtube_url', canonicalUrl)
      .eq('user_id', userId);

    if (checkError) {
      console.error('Error checking existing videos:', checkError);
      return NextResponse.json(
        { error: 'Failed to check for duplicate videos' },
        { status: 500 }
      );
    }

    // If video already exists, return it
    if (existingVideos && existingVideos.length > 0) {
      const existingVideo = existingVideos[0];
      return NextResponse.json({
        video_id: existingVideo.id,
        status: existingVideo.status,
        message: 'This video has already been added',
        existing: true,
      });
    }

    // Generate new video ID
    const videoId = randomUUID();

    // Create video record with status='downloading' (fetching transcript)
    const { error: videoError } = await supabaseAdmin
      .from('videos')
      .insert({
        id: videoId,
        user_id: userId,
        title: `YouTube Video (${validation.videoId})`, // Temporary title from video ID
        storage_path: null, // No storage needed - transcript fetched directly from YouTube
        status: 'downloading',
        youtube_url: canonicalUrl,
        source: 'youtube',
      });

    if (videoError) {
      console.error('Error creating video record:', videoError);
      return NextResponse.json(
        { error: 'Failed to create video record' },
        { status: 500 }
      );
    }

    try {
      const transcript = await YoutubeTranscript.fetchTranscript(canonicalUrl);

      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript available for this video.');
      }

      const chunks = chunkTranscript(
        transcript.map((segment: any) => ({
          text: segment.text,
          start: Number(segment.offset ?? 0),
          duration: Number(segment.duration ?? 0),
        }))
      );

      if (chunks.length === 0) {
        throw new Error('Transcript was fetched but no valid chunks were produced.');
      }

      const { error: chunksError } = await supabaseAdmin
        .from('transcript_chunks')
        .insert(
          chunks.map((chunk) => ({
            video_id: videoId,
            start_sec: chunk.start_sec,
            end_sec: chunk.end_sec,
            text: chunk.text,
          }))
        );

      if (chunksError) {
        throw new Error(`Failed to save transcript chunks: ${chunksError.message}`);
      }

      const { error: statusError } = await supabaseAdmin
        .from('videos')
        .update({ status: 'transcribed' })
        .eq('id', videoId);

      if (statusError) {
        throw new Error(`Failed to mark video as transcribed: ${statusError.message}`);
      }
    } catch (transcriptError) {
      console.error('Error fetching YouTube transcript:', transcriptError);
      const rawMessage = transcriptError instanceof Error ? transcriptError.message : 'Unknown transcript error';
      const normalizedMessage = rawMessage.toLowerCase();

      const isRateLimited = normalizedMessage.includes('too many requests') || normalizedMessage.includes('captcha');
      const isUnavailable = normalizedMessage.includes('unavailable') || normalizedMessage.includes('private');

      if (isUnavailable) {
        await supabaseAdmin
          .from('videos')
          .delete()
          .eq('id', videoId);

        return NextResponse.json(
          {
            error: 'This YouTube video is unavailable or private.',
            details: rawMessage,
          },
          { status: 400 }
        );
      }

      // Fallback: queue full download + Whisper transcription pipeline.
      const { error: jobError } = await supabaseAdmin
        .from('jobs')
        .insert({
          type: 'download',
          payload: {
            video_id: videoId,
            youtube_url: canonicalUrl,
            user_id: userId,
          },
          status: 'pending',
        });

      if (jobError) {
        console.error('Failed to create download fallback job:', jobError);
        await supabaseAdmin.from('videos').delete().eq('id', videoId);

        return NextResponse.json(
          {
            error: 'Could not start fallback transcription pipeline.',
            details: jobError.message,
          },
          { status: 500 }
        );
      }

      await supabaseAdmin
        .from('videos')
        .update({ status: 'downloading' })
        .eq('id', videoId);

      return NextResponse.json({
        video_id: videoId,
        status: 'downloading',
        fallback: 'subtitle_fetch_via_ytdlp',
        message: isRateLimited
          ? 'YouTube caption API is rate-limited. Started subtitle-file fallback.'
          : 'No captions found from primary source. Started subtitle-file fallback.',
      });
    }

    console.log(`✓ YouTube transcript fetched and stored for: ${canonicalUrl}`);

    return NextResponse.json({
      video_id: videoId,
      status: 'transcribed',
      message: 'YouTube transcript fetched successfully',
    });
  } catch (error) {
    console.error('Upload YouTube API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
