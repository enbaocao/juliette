import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * GET /api/live-sessions/check
 * Check if there's an active session for a meeting UUID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const meetingUuid = searchParams.get('meeting_uuid');

    if (!meetingUuid) {
      return NextResponse.json(
        { error: 'meeting_uuid is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Find active session for this meeting
    const { data: session, error } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('meeting_uuid', meetingUuid)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine
      console.error('Error checking session:', error);
      return NextResponse.json(
        { error: 'Failed to check session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session: session || null,
    });
  } catch (error) {
    console.error('Error in check session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
