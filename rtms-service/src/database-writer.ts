import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TranscriptChunk, RTMSConnection, TranscriptionSegment } from './types';

/**
 * DatabaseWriter - Handles all database operations for RTMS service
 */
export class DatabaseWriter {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Create RTMS connection record
   */
  async createConnection(connection: {
    liveSessionId: string;
    meetingUUID: string;
    rtmsStreamId: string;
  }): Promise<string> {
    const { data, error } = await this.supabase
      .from('rtms_connections')
      .insert({
        live_session_id: connection.liveSessionId,
        meeting_uuid: connection.meetingUUID,
        rtms_stream_id: connection.rtmsStreamId,
        status: 'active',
        connected_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create RTMS connection:', error);
      throw error;
    }

    return data.id;
  }

  /**
   * Update RTMS connection status and metrics
   */
  async updateConnection(
    rtmsStreamId: string,
    updates: {
      status?: 'active' | 'disconnected' | 'error';
      audioBufferSize?: number;
      totalAudioReceived?: bigint;
      totalChunksProcessed?: number;
      errorMessage?: string;
    }
  ): Promise<void> {
    const updateData: any = {
      last_audio_at: new Date().toISOString()
    };

    if (updates.status) updateData.status = updates.status;
    if (updates.audioBufferSize !== undefined) updateData.audio_buffer_size = updates.audioBufferSize;
    if (updates.totalAudioReceived !== undefined) updateData.total_audio_received = updates.totalAudioReceived.toString();
    if (updates.totalChunksProcessed !== undefined) updateData.total_chunks_processed = updates.totalChunksProcessed;
    if (updates.errorMessage) updateData.error_message = updates.errorMessage;

    if (updates.status === 'disconnected' || updates.status === 'error') {
      updateData.disconnected_at = new Date().toISOString();
    }

    const { error } = await this.supabase
      .from('rtms_connections')
      .update(updateData)
      .eq('rtms_stream_id', rtmsStreamId);

    if (error) {
      console.error('Failed to update RTMS connection:', error);
      throw error;
    }
  }

  /**
   * Write transcript chunks to database
   */
  async writeTranscriptChunks(
    liveSessionId: string,
    segments: TranscriptionSegment[],
    baseSequenceNumber: number,
    speakerName: string = 'Mixed Audio'
  ): Promise<void> {
    const chunks = segments.map((segment, index) => ({
      live_session_id: liveSessionId,
      start_sec: segment.start,
      end_sec: segment.end,
      text: segment.text,
      is_realtime: true,
      sequence_number: baseSequenceNumber + index,
      speaker_name: speakerName,
      confidence: segment.confidence,
      created_at: new Date().toISOString()
    }));

    const { error } = await this.supabase
      .from('transcript_chunks')
      .insert(chunks);

    if (error) {
      console.error('Failed to write transcript chunks:', error);
      throw error;
    }

    console.log(`✅ Wrote ${chunks.length} transcript chunks (sequence ${baseSequenceNumber}-${baseSequenceNumber + segments.length - 1})`);
  }

  /**
   * Update live session transcription status
   */
  async updateSessionTranscriptionStatus(
    liveSessionId: string,
    status: {
      isTranscribing?: boolean;
      rtmsStatus?: string;
      rtmsStreamId?: string;
    }
  ): Promise<void> {
    const updateData: any = {
      last_transcript_at: new Date().toISOString()
    };

    if (status.isTranscribing !== undefined) {
      updateData.is_transcribing = status.isTranscribing;
      if (status.isTranscribing) {
        updateData.transcription_started_at = new Date().toISOString();
      }
    }

    if (status.rtmsStatus) updateData.rtms_status = status.rtmsStatus;
    if (status.rtmsStreamId) updateData.rtms_stream_id = status.rtmsStreamId;

    const { error } = await this.supabase
      .from('live_sessions')
      .update(updateData)
      .eq('id', liveSessionId);

    if (error) {
      console.error('Failed to update session transcription status:', error);
      throw error;
    }
  }

  /**
   * Get live session by meeting UUID
   */
  async getLiveSessionByMeetingUUID(meetingUUID: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('live_sessions')
      .select('*')
      .eq('meeting_uuid', meetingUUID)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Failed to get live session:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get RTMS connection by stream ID
   */
  async getConnectionByStreamId(rtmsStreamId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('rtms_connections')
      .select('*')
      .eq('rtms_stream_id', rtmsStreamId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Failed to get RTMS connection:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get latest sequence number for a live session
   */
  async getLatestSequenceNumber(liveSessionId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('transcript_chunks')
      .select('sequence_number')
      .eq('live_session_id', liveSessionId)
      .eq('is_realtime', true)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No chunks yet
        return 0;
      }
      console.error('Failed to get latest sequence number:', error);
      return 0;
    }

    return data?.sequence_number ?? 0;
  }
}
