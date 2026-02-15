import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const RTMS_SERVICE_URL = process.env.RTMS_SERVICE_URL || 'http://localhost:4000';

/**
 * Get RTMS transcription status
 * GET /api/rtms/status?session_id=xxx
 * GET /api/rtms/status?rtms_stream_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const rtmsStreamId = searchParams.get('rtms_stream_id');

    if (!sessionId && !rtmsStreamId) {
      return NextResponse.json(
        { error: 'Missing required parameter: session_id or rtms_stream_id' },
        { status: 400 }
      );
    }

    let streamId = rtmsStreamId;

    // If session_id provided, get rtms_stream_id from session
    if (sessionId && !rtmsStreamId) {
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('live_sessions')
        .select('rtms_stream_id, rtms_status, is_transcribing')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      streamId = session.rtms_stream_id || null;

      // If no stream ID, return session status only
      if (!streamId) {
        return NextResponse.json({
          session_id: sessionId,
          rtms_status: session.rtms_status || 'idle',
          is_transcribing: session.is_transcribing || false,
          rtms_stream_id: null
        });
      }
    }

    // Get status from RTMS service
    const rtmsResponse = await fetch(`${RTMS_SERVICE_URL}/rtms/status/${streamId}`);

    if (!rtmsResponse.ok) {
      if (rtmsResponse.status === 404) {
        // Stream not found in RTMS service
        return NextResponse.json({
          session_id: sessionId,
          rtms_stream_id: streamId,
          rtms_status: 'idle',
          is_transcribing: false
        });
      }

      const errorText = await rtmsResponse.text();
      throw new Error(`RTMS service error: ${errorText}`);
    }

    const rtmsData = await rtmsResponse.json();

    // Get database status
    const { data: connection } = await supabaseAdmin
      .from('rtms_connections')
      .select('*')
      .eq('rtms_stream_id', streamId)
      .single();

    return NextResponse.json({
      session_id: sessionId,
      rtms_stream_id: streamId,
      rtms_status: connection?.status || 'unknown',
      is_transcribing: connection?.status === 'active',
      total_chunks_processed: connection?.total_chunks_processed || 0,
      total_audio_received: connection?.total_audio_received || '0',
      last_audio_at: connection?.last_audio_at,
      connected_at: connection?.connected_at,
      service_status: rtmsData
    });

  } catch (error: any) {
    console.error('Failed to get RTMS status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}
