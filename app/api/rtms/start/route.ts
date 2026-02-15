import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const BOT_SERVICE_URL = process.env.BOT_SERVICE_URL || process.env.RTMS_SERVICE_URL || 'http://localhost:4000';

/**
 * Start bot transcription for a live session
 * POST /api/rtms/start
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

    // Find the live session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('live_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('status', 'active')
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No active live session found' },
        { status: 404 }
      );
    }

    // Call bot service to start transcription
    const botResponse = await fetch(`${BOT_SERVICE_URL}/bot/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meetingNumber: session.meeting_number,
        password: session.meeting_password,
        liveSessionId: session.id
      })
    });

    if (!botResponse.ok) {
      const errorText = await botResponse.text();
      throw new Error(`Bot service error: ${errorText}`);
    }

    const botData = await botResponse.json();

    // Update live session with transcription status
    const { error: updateError } = await supabaseAdmin
      .from('live_sessions')
      .update({
        rtms_status: 'connecting',
        is_transcribing: true,
        transcription_started_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to update session:', updateError);
    }

    return NextResponse.json({
      message: 'Bot transcription started',
      session_id: session.id
    });

  } catch (error: any) {
    console.error('Failed to start bot transcription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start transcription' },
      { status: 500 }
    );
  }
}
