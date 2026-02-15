import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createClient } from '@/lib/supabase/server';

// Configure route to handle larger uploads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? process.env.DEMO_USER_ID ?? 'demo-user-' + Date.now();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      );
    }

    // NOTE: For the Zoom app flow we do NOT upload the media file to Supabase Storage.
    // We only persist the transcript in DB after Whisper finishes.

    // Create video record in database
    const { data: video, error: dbError } = await supabaseAdmin
      .from('videos')
      .insert({
        user_id: userId,
        title,
        storage_path: null,
        status: 'uploaded',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create video record: ' + dbError.message },
        { status: 500 }
      );
    }

    // Create transcription job (store the uploaded audio bytes directly in the job payload)
    // This avoids any attempt to store the media in Supabase Storage.
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const { error: jobError } = await supabaseAdmin.from('jobs').insert({
      type: 'transcribe',
      payload: {
        video_id: video.id,
        filename: file.name,
        content_type: file.type,
        audio_base64: base64,
      },
      status: 'pending',
    });

    if (jobError) {
      console.error('Job creation error:', jobError);
      // Don't fail the upload, just log it
    }

    return NextResponse.json({
      success: true,
      videoId: video.id,
      message: 'Upload received. Transcription will begin shortly.',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
