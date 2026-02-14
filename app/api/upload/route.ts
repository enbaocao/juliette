import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      );
    }

    // For MVP, we'll use a hardcoded user ID
    // In production, get this from auth session
    const userId = process.env.DEMO_USER_ID || 'demo-user-' + Date.now();

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExt}`;
    const storagePath = `videos/${userId}/${fileName}`;

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from('videos')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file: ' + uploadError.message },
        { status: 500 }
      );
    }

    // Create video record in database
    const { data: video, error: dbError } = await supabaseAdmin
      .from('videos')
      .insert({
        user_id: userId,
        title,
        storage_path: storagePath,
        status: 'uploaded',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabaseAdmin.storage.from('videos').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to create video record: ' + dbError.message },
        { status: 500 }
      );
    }

    // Create transcription job
    const { error: jobError } = await supabaseAdmin.from('jobs').insert({
      type: 'transcribe',
      payload: {
        video_id: video.id,
        storage_path: storagePath,
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
      message: 'Video uploaded successfully. Transcription will begin shortly.',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
