import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const BOT_SERVICE_URL = process.env.BOT_SERVICE_URL || process.env.RTMS_SERVICE_URL || 'http://localhost:4000';

/**
 * Stop bot transcription
 * POST /api/rtms/stop
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing required field: session_id' },
        { status: 400 }
      );
    }

    // Verify session exists
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('live_sessions')
      .select('id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Call bot service to stop transcription
    const botResponse = await fetch(`${BOT_SERVICE_URL}/bot/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: session_id
      })
    });

    if (!botResponse.ok) {
      const errorText = await botResponse.text();
      console.error('Bot service error:', errorText);
      // Continue anyway to update database
    }

    // Update live session status
    const { error: updateError } = await supabaseAdmin
      .from('live_sessions')
      .update({
        rtms_status: 'idle',
        is_transcribing: false
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Failed to update session:', updateError);
    }

    return NextResponse.json({
      message: 'Bot transcription stopped',
      session_id: session_id
    });

  } catch (error: any) {
    console.error('Failed to stop bot transcription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stop transcription' },
      { status: 500 }
    );
  }
}
