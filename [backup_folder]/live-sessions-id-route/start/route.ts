import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * POST /api/live-sessions/start
 * Start a new live session for a Zoom meeting
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meeting_uuid, meeting_number, video_id, title } = body;

    if (!meeting_uuid || !meeting_number) {
      return NextResponse.json(
        { error: 'meeting_uuid and meeting_number are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Use demo user ID for MVP (replace with actual auth later)
    const userId = process.env.DEMO_USER_ID || 'demo-user-123';

    // Check if there's already an active session for this meeting
    const { data: existingSession } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('meeting_uuid', meeting_uuid)
      .eq('status', 'active')
      .single();

    if (existingSession) {
      return NextResponse.json({
        session: existingSession,
      });
    }

    // Create new session
    const { data: session, error } = await supabase
      .from('live_sessions')
      .insert({
        meeting_uuid,
        meeting_number,
        video_id: video_id || null,
        title: title || null,
        host_user_id: userId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session,
    });
  } catch (error) {
    console.error('Error in start session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
