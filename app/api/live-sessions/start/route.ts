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

    const meetingNumberKey = typeof meeting_number === 'string'
      ? meeting_number.replace(/\D/g, '')
      : String(meeting_number ?? '').replace(/\D/g, '');

    if (!meetingNumberKey) {
      return NextResponse.json(
        { error: 'meeting_number is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // No-auth MVP: require a real UUID user id from env to satisfy DB uuid columns.
    // Prefer PUBLIC_USER_ID, then DEMO_USER_ID.
    const publicUserId = process.env.PUBLIC_USER_ID;
    const demoUserId = process.env.DEMO_USER_ID;
    const userId = publicUserId ?? demoUserId ?? null;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!userId) {
      return NextResponse.json(
        {
          error:
            'Missing user context. Set PUBLIC_USER_ID (recommended) or DEMO_USER_ID (UUID) in the environment.',
        },
        { status: 500 },
      );
    }

    if (!uuidRegex.test(userId)) {
      console.error('PUBLIC_USER_ID/DEMO_USER_ID is not a valid UUID:', userId);
      return NextResponse.json(
        {
          error:
            'PUBLIC_USER_ID/DEMO_USER_ID env is present but not a valid UUID. Set it to a valid UUID.',
        },
        { status: 500 },
      );
    }

    // Check if there's already an active session for this meeting
    const { data: existingSession } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('meeting_number', meetingNumberKey)
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
        meeting_uuid: meeting_uuid || meetingNumberKey, // keep column populated for legacy/debug
        meeting_number: meetingNumberKey,
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
