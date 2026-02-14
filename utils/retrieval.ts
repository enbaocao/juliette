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

export function formatChunksForPrompt(chunks: TranscriptChunk[]): string {
  return chunks
    .map(
      (chunk, idx) =>
        `[${idx + 1}] (${formatTime(chunk.start_sec)} - ${formatTime(chunk.end_sec)})\n${chunk.text}`
    )
    .join('\n\n');
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
