import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * GET /api/live-sessions/[sessionId]
 * Get details of a specific live session
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionId } = await context.params;

    const supabase = getSupabaseServer();

    const { data: session, error } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session,
    });
  } catch (error) {
    console.error('Error in get session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
