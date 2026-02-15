import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const RTMS_SERVICE_URL = process.env.RTMS_SERVICE_URL || 'http://localhost:4000';

/**
 * Start RTMS transcription for a live session
 * POST /api/rtms/start
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meeting_uuid, rtms_stream_id } = body;

    if (!meeting_uuid || !rtms_stream_id) {
      return NextResponse.json(
        { error: 'Missing required fields: meeting_uuid, rtms_stream_id' },
        { status: 400 }
      );
    }

    // Find active live session for this meeting
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('live_sessions')
      .select('*')
      .eq('meeting_uuid', meeting_uuid)
      .eq('status', 'active')
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No active live session found for this meeting' },
        { status: 404 }
      );
    }

    // Call RTMS service to start transcription
    const rtmsResponse = await fetch(`${RTMS_SERVICE_URL}/rtms/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meetingUUID: meeting_uuid,
        meetingNumber: session.meeting_number,
        rtmsStreamId: rtms_stream_id,
        liveSessionId: session.id
      })
    });

    if (!rtmsResponse.ok) {
      const errorText = await rtmsResponse.text();
      throw new Error(`RTMS service error: ${errorText}`);
    }

    const rtmsData = await rtmsResponse.json();

    // Update live session with RTMS info
    const { error: updateError } = await supabaseAdmin
      .from('live_sessions')
      .update({
        rtms_stream_id: rtms_stream_id,
        rtms_status: 'connecting',
        is_transcribing: true,
        transcription_started_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to update session:', updateError);
    }

    return NextResponse.json({
      message: 'Transcription started',
      session_id: session.id,
      rtms_stream_id: rtms_stream_id
    });

  } catch (error: any) {
    console.error('Failed to start RTMS transcription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start transcription' },
      { status: 500 }
    );
  }
}
