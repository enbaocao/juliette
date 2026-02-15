import { supabaseAdmin } from '@/lib/supabase-server';
import { TranscriptChunk } from '@/lib/types';

/**
 * Simple keyword-based retrieval for MVP
 * For production, consider using embeddings and vector search
 */
export async function retrieveRelevantChunks(
  videoId: string,
  query: string,
  topK: number = 5
): Promise<TranscriptChunk[]> {
  // Fetch all chunks for the video
  const { data: chunks, error } = await supabaseAdmin
    .from('transcript_chunks')
    .select('*')
    .eq('video_id', videoId)
    .order('start_sec', { ascending: true });

  if (error || !chunks) {
    throw new Error(`Failed to fetch chunks: ${error?.message}`);
  }

  // Simple keyword matching (case-insensitive)
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3); // Ignore short words

  // Score each chunk based on keyword overlap
  const scoredChunks = chunks.map((chunk) => {
    const chunkText = chunk.text.toLowerCase();
    const score = queryWords.reduce((acc, word) => {
      // Count occurrences of each keyword
      const regex = new RegExp(word, 'g');
      const matches = chunkText.match(regex);
      return acc + (matches ? matches.length : 0);
    }, 0);

    return { chunk, score };
  });

  // Sort by score and return top K
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk);
}

/**
 * Retrieve latest real-time chunks from a live session
 * Used for live Q&A to get recent meeting context
 */
export async function retrieveLatestLiveChunks(
  liveSessionId: string,
  limit: number = 10
): Promise<TranscriptChunk[]> {
  const { data: chunks, error } = await supabaseAdmin
    .from('transcript_chunks')
    .select('*')
    .eq('live_session_id', liveSessionId)
    .eq('is_realtime', true)
    .order('sequence_number', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch live chunks: ${error.message}`);
  }

  // Return in chronological order (oldest first)
  return (chunks || []).reverse();
}

/**
 * Enhanced retrieval that supports both video chunks and live session chunks
 * Prioritizes real-time chunks for live sessions
 */
export async function retrieveRelevantChunksEnhanced(
  query: string,
  options: {
    videoId?: string;
    liveSessionId?: string;
    topK?: number;
  }
): Promise<TranscriptChunk[]> {
  const { videoId, liveSessionId, topK = 5 } = options;

  // If live session exists, prioritize recent live chunks
  if (liveSessionId) {
    // Get more chunks to score (2x topK for better filtering)
    const liveChunks = await retrieveLatestLiveChunks(liveSessionId, topK * 2);

    if (liveChunks.length === 0) {
      // No live chunks yet, fall back to video if provided
      if (videoId) {
        return retrieveRelevantChunks(videoId, query, topK);
      }
      return [];
    }

    // Score and filter live chunks using keyword matching
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const scoredChunks = liveChunks.map((chunk) => {
      const chunkText = chunk.text.toLowerCase();
      const score = queryWords.reduce((acc, word) => {
        const regex = new RegExp(word, 'g');
        const matches = chunkText.match(regex);
        return acc + (matches ? matches.length : 0);
      }, 0);

      return { chunk, score };
    });

    // Sort by score (higher is better) and recency (more recent is better)
    // We give some weight to recency by using sequence number
    const sortedChunks = scoredChunks.sort((a, b) => {
      // If scores are different, prioritize score
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      // If scores are equal, prioritize more recent chunks
      return (b.chunk.sequence_number || 0) - (a.chunk.sequence_number || 0);
    });

    return sortedChunks.slice(0, topK).map((item) => item.chunk);
  }

  // Fall back to existing video-based retrieval
  if (videoId) {
    return retrieveRelevantChunks(videoId, query, topK);
  }

  return [];
}

export function formatChunksForPrompt(chunks: TranscriptChunk[]): string {
  return chunks
    .map((chunk, idx) => {
      const timestamp = chunk.start_sec !== undefined && chunk.end_sec !== undefined
        ? `(${formatTime(chunk.start_sec)} - ${formatTime(chunk.end_sec)})`
        : '';
      const speaker = chunk.speaker_name ? `[${chunk.speaker_name}] ` : '';
      return `[${idx + 1}] ${timestamp}\n${speaker}${chunk.text}`;
    })
    .join('\n\n');
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
