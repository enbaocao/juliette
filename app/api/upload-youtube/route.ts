import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { randomUUID } from 'crypto';

// YouTube URL validation regex
const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

// Demo user ID (MVP hardcoded)
const DEMO_USER_ID = process.env.DEMO_USER_ID || '00000000-0000-0000-0000-000000000000';

function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_URL_REGEX);
  return match ? match[4] : null;
}

function validateYouTubeUrl(url: string): { valid: boolean; error?: string; videoId?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return {
      valid: false,
      error: 'Invalid YouTube URL. Please use format: youtube.com/watch?v=... or youtu.be/...',
    };
  }

  return { valid: true, videoId };
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

    // Check if this YouTube video was already added
    const { data: existingVideos, error: checkError } = await supabaseAdmin
      .from('videos')
      .select('id, status, title')
      .eq('youtube_url', youtube_url)
      .eq('user_id', DEMO_USER_ID);

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

    // Create video record with status='downloading'
    const { error: videoError } = await supabaseAdmin
      .from('videos')
      .insert({
        id: videoId,
        user_id: DEMO_USER_ID,
        title: `YouTube Video (${validation.videoId})`, // Temporary title, will be updated by worker
        storage_path: '', // Will be set by download worker
        status: 'downloading',
        youtube_url: youtube_url,
        source: 'youtube',
      });

    if (videoError) {
      console.error('Error creating video record:', videoError);
      return NextResponse.json(
        { error: 'Failed to create video record' },
        { status: 500 }
      );
    }

    // Create download job
    const { error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        type: 'download',
        payload: {
          video_id: videoId,
          youtube_url: youtube_url,
          user_id: DEMO_USER_ID,
        },
        status: 'pending',
      });

    if (jobError) {
      console.error('Error creating download job:', jobError);

      // Clean up video record if job creation failed
      await supabaseAdmin
        .from('videos')
        .delete()
        .eq('id', videoId);

      return NextResponse.json(
        { error: 'Failed to create download job' },
        { status: 500 }
      );
    }

    console.log(`✓ Created download job for YouTube video: ${youtube_url}`);

    return NextResponse.json({
      video_id: videoId,
      status: 'downloading',
      message: 'YouTube video download started',
    });
  } catch (error) {
    console.error('Upload YouTube API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
