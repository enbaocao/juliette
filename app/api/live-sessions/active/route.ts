import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('live_sessions')
      .select('*')
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching active sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch active sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Error in get active sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
