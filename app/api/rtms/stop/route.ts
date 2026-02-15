import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const RTMS_SERVICE_URL = process.env.RTMS_SERVICE_URL || 'http://localhost:4000';

/**
 * Stop RTMS transcription
 * POST /api/rtms/stop
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, rtms_stream_id } = body;

    if (!session_id && !rtms_stream_id) {
      return NextResponse.json(
        { error: 'Missing required field: session_id or rtms_stream_id' },
        { status: 400 }
      );
    }

    let streamId = rtms_stream_id;

    // If session_id provided, get rtms_stream_id from session
    if (session_id && !rtms_stream_id) {
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('live_sessions')
        .select('rtms_stream_id')
        .eq('id', session_id)
        .single();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      streamId = session.rtms_stream_id;

      if (!streamId) {
        return NextResponse.json(
          { error: 'No active RTMS stream for this session' },
          { status: 400 }
        );
      }
    }

    // Call RTMS service to stop transcription
    const rtmsResponse = await fetch(`${RTMS_SERVICE_URL}/rtms/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rtmsStreamId: streamId
      })
    });

    if (!rtmsResponse.ok) {
      const errorText = await rtmsResponse.text();
      console.error('RTMS service error:', errorText);
      // Continue anyway to update database
    }

    // Update live session status
    if (session_id) {
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
    }

    return NextResponse.json({
      message: 'Transcription stopped',
      session_id: session_id,
      rtms_stream_id: streamId
    });

  } catch (error: any) {
    console.error('Failed to stop RTMS transcription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stop transcription' },
      { status: 500 }
    );
  }
}
