import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const BOT_SERVICE_URL = process.env.BOT_SERVICE_URL || process.env.RTMS_SERVICE_URL || 'http://localhost:4000';

/**
 * Get bot transcription status
 * GET /api/rtms/status?session_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: session_id' },
        { status: 400 }
      );
    }

    // Get session status from database
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('live_sessions')
      .select('rtms_status, is_transcribing, transcription_started_at, last_transcript_at')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get status from bot service
    const botResponse = await fetch(`${BOT_SERVICE_URL}/bot/status/${sessionId}`);

    if (!botResponse.ok) {
      if (botResponse.status === 404) {
        // Bot not running, return database status only
        return NextResponse.json({
          session_id: sessionId,
          rtms_status: session.rtms_status || 'idle',
          is_transcribing: session.is_transcribing || false,
          transcription_started_at: session.transcription_started_at,
          last_transcript_at: session.last_transcript_at
        });
      }

      const errorText = await botResponse.text();
      throw new Error(`Bot service error: ${errorText}`);
    }

    const botData = await botResponse.json();

    // Get recent transcript chunks count
    const { count: chunksCount } = await supabaseAdmin
      .from('transcript_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('live_session_id', sessionId)
      .eq('is_realtime', true);

    return NextResponse.json({
      session_id: sessionId,
      rtms_status: session.rtms_status || 'idle',
      is_transcribing: session.is_transcribing || false,
      transcription_started_at: session.transcription_started_at,
      last_transcript_at: session.last_transcript_at,
      total_chunks_processed: chunksCount || 0,
      bot_status: botData
    });

  } catch (error: any) {
    console.error('Failed to get bot status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}
