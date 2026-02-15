import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { session_id, video_id } = await request.json();

    if (!session_id || !video_id) {
      return NextResponse.json(
        { error: 'session_id and video_id are required' },
        { status: 400 }
      );
    }

    // Update the live session with the video_id
    const { error } = await supabaseAdmin
      .from('live_sessions')
      .update({ video_id })
      .eq('id', session_id);

    if (error) {
      console.error('Error linking video to session:', error);
      return NextResponse.json(
        { error: 'Failed to link video to session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Video linked to session successfully',
    });
  } catch (error) {
    console.error('Error in link-video:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
