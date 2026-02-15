import OpenAI from 'openai';
import { pcmToWav } from './audio-buffer';
import { DatabaseWriter } from './database-writer';
import { TranscriptionSegment, WhisperResponse } from './types';
import { Readable } from 'stream';

/**
 * TranscriptionPipeline - Handles audio transcription using OpenAI Whisper API
 */
export class TranscriptionPipeline {
  private openai: OpenAI;
  private db: DatabaseWriter;
  private liveSessionId: string;
  private sequenceCounter: number = 0;
  private lastProcessedTimestamp: number = 0;

  constructor(liveSessionId: string, db: DatabaseWriter) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    this.openai = new OpenAI({ apiKey });
    this.db = db;
    this.liveSessionId = liveSessionId;
  }

  /**
   * Process audio buffer and transcribe with Whisper API
   */
  async processAudioBuffer(
    pcmBuffer: Buffer,
    sequenceNumber: number,
    sampleRate: number = 16000
  ): Promise<void> {
    try {
      console.log(`\n🎙️  Processing audio buffer ${sequenceNumber} (${pcmBuffer.length} bytes)`);

      // Convert PCM to WAV
      const wavBuffer = pcmToWav(pcmBuffer, sampleRate);

      // Transcribe with Whisper
      const transcription = await this.transcribeWithRetry(wavBuffer, sequenceNumber);

      if (!transcription || !transcription.segments || transcription.segments.length === 0) {
        console.log(`⚠️  No transcription segments returned for buffer ${sequenceNumber}`);
        return;
      }

      console.log(`📝 Transcribed: "${transcription.text}"`);
      console.log(`   Segments: ${transcription.segments.length}`);

      // Deduplicate overlapping segments
      const deduplicatedSegments = this.deduplicateSegments(transcription.segments);

      if (deduplicatedSegments.length === 0) {
        console.log(`⚠️  All segments were duplicates, skipping`);
        return;
      }

      // Write to database
      await this.db.writeTranscriptChunks(
        this.liveSessionId,
        deduplicatedSegments,
        this.sequenceCounter
      );

      this.sequenceCounter += deduplicatedSegments.length;

      // Update last processed timestamp
      if (deduplicatedSegments.length > 0) {
        const lastSegment = deduplicatedSegments[deduplicatedSegments.length - 1];
        this.lastProcessedTimestamp = lastSegment.end;
      }

    } catch (error) {
      console.error(`❌ Failed to process audio buffer ${sequenceNumber}:`, error);
      throw error;
    }
  }

  /**
   * Transcribe audio with retry logic
   */
  private async transcribeWithRetry(
    wavBuffer: Buffer,
    bufferNumber: number,
    maxRetries: number = 3
  ): Promise<WhisperResponse | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Create a file-like object from buffer
        const file = new File([wavBuffer], `audio-${bufferNumber}.wav`, {
          type: 'audio/wav'
        });

        const transcription = await this.openai.audio.transcriptions.create({
          file: file,
          model: process.env.WHISPER_MODEL || 'whisper-1',
          response_format: 'verbose_json',
          timestamp_granularities: ['segment'],
          language: 'en',
          temperature: 0 // Deterministic for consistency
        });

        return {
          text: transcription.text,
          segments: (transcription.segments || []).map(seg => ({
            start: seg.start,
            end: seg.end,
            text: seg.text,
            confidence: undefined // Whisper doesn't return confidence in current API
          })),
          language: transcription.language,
          duration: transcription.duration
        };

      } catch (error: any) {
        console.error(`Whisper API attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt === maxRetries) {
          console.error(`❌ All retry attempts exhausted for buffer ${bufferNumber}`);
          return null;
        }

        // Exponential backoff
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return null;
  }

  /**
   * Deduplicate segments from overlapping buffers
   *
   * Since we use 2-second overlap, segments in the overlap region
   * may appear in consecutive buffers. We skip segments that we've
   * already processed based on their end timestamp.
   */
  private deduplicateSegments(segments: TranscriptionSegment[]): TranscriptionSegment[] {
    if (this.lastProcessedTimestamp === 0) {
      // First buffer, no deduplication needed
      return segments;
    }

    // Filter out segments that end before our last processed timestamp
    // We use a small tolerance (0.1s) to account for timing variations
    const tolerance = 0.1;
    const deduplicated = segments.filter(
      seg => seg.end > this.lastProcessedTimestamp + tolerance
    );

    const skippedCount = segments.length - deduplicated.length;
    if (skippedCount > 0) {
      console.log(`🔄 Deduplicated ${skippedCount} overlapping segments`);
    }

    return deduplicated;
  }

  /**
   * Get current pipeline status
   */
  getStatus() {
    return {
      liveSessionId: this.liveSessionId,
      sequenceCounter: this.sequenceCounter,
      lastProcessedTimestamp: this.lastProcessedTimestamp
    };
  }

  /**
   * Initialize sequence counter from database
   */
  async initializeSequenceCounter(): Promise<void> {
    const latestSequence = await this.db.getLatestSequenceNumber(this.liveSessionId);
    this.sequenceCounter = latestSequence + 1;
    console.log(`📊 Initialized sequence counter to ${this.sequenceCounter}`);
  }
}
