import { EventEmitter } from 'events';
import { AudioFrame } from './types';

/**
 * CircularAudioBuffer - Manages audio buffering with overlap for continuous transcription
 *
 * Collects audio frames from RTMS (20ms each) and accumulates them into larger chunks
 * for efficient Whisper API calls. Uses sliding window with overlap to prevent word cutoff.
 */
export class CircularAudioBuffer extends EventEmitter {
  private buffer: Buffer;
  private writePosition: number = 0;
  private sampleRate: number;
  private bufferDurationSeconds: number;
  private overlapSeconds: number;
  private bytesPerSecond: number;
  private targetBufferSize: number;
  private overlapSize: number;
  private sequenceNumber: number = 0;

  constructor(
    sampleRate: number = 16000,
    bufferDurationSeconds: number = 10,
    overlapSeconds: number = 2
  ) {
    super();

    this.sampleRate = sampleRate;
    this.bufferDurationSeconds = bufferDurationSeconds;
    this.overlapSeconds = overlapSeconds;

    // 16-bit PCM = 2 bytes per sample, mono = 1 channel
    this.bytesPerSecond = sampleRate * 2;

    // Allocate buffer for full duration
    const totalBufferSize = this.bytesPerSecond * bufferDurationSeconds;
    this.buffer = Buffer.alloc(totalBufferSize);

    // Target size before flush (full duration - overlap)
    this.targetBufferSize = this.bytesPerSecond * (bufferDurationSeconds - overlapSeconds);

    // Size of overlap region
    this.overlapSize = this.bytesPerSecond * overlapSeconds;
  }

  /**
   * Write audio chunk to buffer
   */
  write(audioChunk: Buffer): void {
    // Check if chunk would overflow buffer
    if (this.writePosition + audioChunk.length > this.buffer.length) {
      console.warn(`Audio chunk would overflow buffer, flushing early`);
      this.flush();
    }

    // Copy chunk to buffer
    audioChunk.copy(this.buffer, this.writePosition);
    this.writePosition += audioChunk.length;

    // Check if we should flush
    if (this.shouldFlush()) {
      this.flush();
    }
  }

  /**
   * Check if buffer should be flushed
   */
  private shouldFlush(): boolean {
    return this.writePosition >= this.targetBufferSize;
  }

  /**
   * Flush current buffer and emit for transcription
   */
  private flush(): void {
    if (this.writePosition === 0) {
      return; // Nothing to flush
    }

    // Get current buffer content
    const outputBuffer = Buffer.from(this.buffer.subarray(0, this.writePosition));

    // Calculate duration of this chunk
    const durationSeconds = this.writePosition / this.bytesPerSecond;

    // Emit buffer ready event
    this.emit('bufferReady', {
      buffer: outputBuffer,
      sequenceNumber: this.sequenceNumber++,
      durationSeconds,
      sampleRate: this.sampleRate
    });

    // Keep overlap at start of buffer
    if (this.writePosition > this.overlapSize) {
      this.buffer.copy(
        this.buffer,
        0,
        this.writePosition - this.overlapSize,
        this.writePosition
      );
      this.writePosition = this.overlapSize;
    } else {
      // Not enough data for overlap, reset
      this.writePosition = 0;
    }
  }

  /**
   * Get current buffer status
   */
  getStatus() {
    return {
      writePosition: this.writePosition,
      bufferFillPercentage: (this.writePosition / this.targetBufferSize) * 100,
      sequenceNumber: this.sequenceNumber,
      bufferSize: this.buffer.length
    };
  }

  /**
   * Force flush current buffer (for graceful shutdown)
   */
  forceFlush(): void {
    if (this.writePosition > 0) {
      this.flush();
    }
  }

  /**
   * Reset buffer
   */
  reset(): void {
    this.writePosition = 0;
    this.sequenceNumber = 0;
    this.buffer.fill(0);
  }
}

/**
 * Convert PCM buffer to WAV format
 */
export function pcmToWav(pcmBuffer: Buffer, sampleRate: number = 16000): Buffer {
  const numChannels = 1; // Mono
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;

  // WAV header is 44 bytes
  const headerSize = 44;
  const wavBuffer = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + dataSize, 4);
  wavBuffer.write('WAVE', 8);

  // fmt chunk
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16); // fmt chunk size
  wavBuffer.writeUInt16LE(1, 20); // PCM format
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(wavBuffer, headerSize);

  return wavBuffer;
}
