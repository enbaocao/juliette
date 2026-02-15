import { RTMSClient, AudioQuality, AudioType, AudioChannel } from '@zoom/rtms';
import crypto from 'crypto';
import { CircularAudioBuffer } from './audio-buffer';
import { TranscriptionPipeline } from './transcription-pipeline';
import { DatabaseWriter } from './database-writer';
import { RTMSConfig } from './types';

/**
 * RTMSSessionManager - Manages a single RTMS WebSocket connection
 */
export class RTMSSessionManager {
  private client: RTMSClient;
  private config: RTMSConfig;
  private db: DatabaseWriter;
  private audioBuffer: CircularAudioBuffer;
  private transcriptionPipeline: TranscriptionPipeline;
  private isConnected: boolean = false;
  private totalAudioReceived: bigint = BigInt(0);
  private connectionId: string | null = null;

  constructor(config: RTMSConfig, db: DatabaseWriter) {
    this.config = config;
    this.db = db;

    // Initialize audio buffer
    const bufferSeconds = parseInt(process.env.AUDIO_BUFFER_SECONDS || '10');
    const overlapSeconds = parseInt(process.env.AUDIO_OVERLAP_SECONDS || '2');
    this.audioBuffer = new CircularAudioBuffer(16000, bufferSeconds, overlapSeconds);

    // Initialize transcription pipeline
    this.transcriptionPipeline = new TranscriptionPipeline(config.liveSessionId, db);

    // Initialize RTMS client
    this.client = new RTMSClient();

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for RTMS client
   */
  private setupEventHandlers(): void {
    // Buffer ready event - send to transcription
    this.audioBuffer.on('bufferReady', async (event) => {
      try {
        await this.transcriptionPipeline.processAudioBuffer(
          event.buffer,
          event.sequenceNumber,
          event.sampleRate
        );

        // Update connection stats
        await this.db.updateConnection(this.config.rtmsStreamId, {
          audioBufferSize: this.audioBuffer.getStatus().writePosition,
          totalAudioReceived: this.totalAudioReceived,
          totalChunksProcessed: event.sequenceNumber + 1
        });
      } catch (error) {
        console.error('Failed to process audio buffer:', error);
      }
    });

    // RTMS Client callbacks
    this.client.onJoinConfirm = () => {
      console.log('✅ RTMS connection confirmed');
      this.isConnected = true;
    };

    this.client.onLeave = (reason: string) => {
      console.log(`❌ RTMS connection closed: ${reason}`);
      this.handleDisconnection(reason);
    };

    this.client.onAudioData = (data: Buffer) => {
      // Accumulate audio data
      this.audioBuffer.write(data);
      this.totalAudioReceived += BigInt(data.length);
    };

    this.client.onSessionUpdate = (update: any) => {
      console.log('📡 Session update:', update);
    };
  }

  /**
   * Connect to RTMS stream
   */
  async connect(): Promise<void> {
    try {
      console.log(`\n🔌 Connecting to RTMS stream: ${this.config.rtmsStreamId}`);
      console.log(`   Meeting UUID: ${this.config.meetingUUID}`);
      console.log(`   Live Session ID: ${this.config.liveSessionId}`);

      // Create connection record in database
      this.connectionId = await this.db.createConnection({
        liveSessionId: this.config.liveSessionId,
        meetingUUID: this.config.meetingUUID,
        rtmsStreamId: this.config.rtmsStreamId
      });

      // Update session status
      await this.db.updateSessionTranscriptionStatus(this.config.liveSessionId, {
        isTranscribing: true,
        rtmsStatus: 'connecting',
        rtmsStreamId: this.config.rtmsStreamId
      });

      // Initialize sequence counter from existing chunks
      await this.transcriptionPipeline.initializeSequenceCounter();

      // Generate signature for authentication
      const signature = this.generateSignature();

      // Configure RTMS client
      const clientConfig = {
        // Mixed audio stream (all participants combined)
        audioType: AudioType.AUDIO_MIXED_STREAM,
        audioChannel: AudioChannel.MONO,
        audioQuality: AudioQuality.SR_16K, // 16kHz sample rate
        rawAudioOnly: true, // Get raw PCM data
        signature: signature,
        clientId: process.env.ZOOM_CLIENT_ID!,
        rtmsStreamId: this.config.rtmsStreamId
      };

      // Join RTMS session
      await this.client.join(clientConfig);

      // Update status to streaming
      await this.db.updateSessionTranscriptionStatus(this.config.liveSessionId, {
        rtmsStatus: 'streaming'
      });

      console.log('✅ Successfully connected to RTMS stream');

    } catch (error: any) {
      console.error('❌ Failed to connect to RTMS:', error);

      await this.db.updateConnection(this.config.rtmsStreamId, {
        status: 'error',
        errorMessage: error.message
      });

      await this.db.updateSessionTranscriptionStatus(this.config.liveSessionId, {
        isTranscribing: false,
        rtmsStatus: 'error'
      });

      throw error;
    }
  }

  /**
   * Disconnect from RTMS stream
   */
  async disconnect(): Promise<void> {
    try {
      console.log(`\n🔌 Disconnecting from RTMS stream`);

      // Flush any remaining audio
      this.audioBuffer.forceFlush();

      // Leave RTMS session
      await this.client.leave();

      // Update database
      await this.db.updateConnection(this.config.rtmsStreamId, {
        status: 'disconnected'
      });

      await this.db.updateSessionTranscriptionStatus(this.config.liveSessionId, {
        isTranscribing: false,
        rtmsStatus: 'idle'
      });

      this.isConnected = false;

      console.log('✅ Disconnected from RTMS stream');

    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }

  /**
   * Handle unexpected disconnection
   */
  private async handleDisconnection(reason: string): Promise<void> {
    this.isConnected = false;

    // Flush any remaining audio
    this.audioBuffer.forceFlush();

    // Update database
    await this.db.updateConnection(this.config.rtmsStreamId, {
      status: 'disconnected',
      errorMessage: reason
    });

    await this.db.updateSessionTranscriptionStatus(this.config.liveSessionId, {
      isTranscribing: false,
      rtmsStatus: 'idle'
    });

    console.log(`⚠️  RTMS session disconnected: ${reason}`);
  }

  /**
   * Generate HMAC-SHA256 signature for RTMS authentication
   */
  private generateSignature(): string {
    const clientId = process.env.ZOOM_CLIENT_ID!;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET!;
    const { meetingUUID, rtmsStreamId } = this.config;

    const message = `${clientId},${meetingUUID},${rtmsStreamId}`;

    const signature = crypto
      .createHmac('sha256', clientSecret)
      .update(message)
      .digest('hex');

    return signature;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      totalAudioReceived: this.totalAudioReceived,
      audioBufferStatus: this.audioBuffer.getStatus(),
      transcriptionStatus: this.transcriptionPipeline.getStatus()
    };
  }
}

/**
 * RTMSConnectionManager - Manages multiple RTMS sessions
 */
export class RTMSConnectionManager {
  private sessions: Map<string, RTMSSessionManager> = new Map();
  private db: DatabaseWriter;

  constructor() {
    this.db = new DatabaseWriter();
  }

  /**
   * Start a new RTMS session
   */
  async startSession(config: RTMSConfig): Promise<void> {
    if (this.sessions.has(config.rtmsStreamId)) {
      throw new Error(`Session already exists for stream: ${config.rtmsStreamId}`);
    }

    const session = new RTMSSessionManager(config, this.db);
    await session.connect();

    this.sessions.set(config.rtmsStreamId, session);

    console.log(`📊 Active sessions: ${this.sessions.size}`);
  }

  /**
   * Stop an existing RTMS session
   */
  async stopSession(rtmsStreamId: string): Promise<void> {
    const session = this.sessions.get(rtmsStreamId);

    if (!session) {
      throw new Error(`No session found for stream: ${rtmsStreamId}`);
    }

    await session.disconnect();
    this.sessions.delete(rtmsStreamId);

    console.log(`📊 Active sessions: ${this.sessions.size}`);
  }

  /**
   * Get session status
   */
  getSessionStatus(rtmsStreamId: string) {
    const session = this.sessions.get(rtmsStreamId);
    return session ? session.getStatus() : null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Stop all sessions (for graceful shutdown)
   */
  async stopAllSessions(): Promise<void> {
    const promises = Array.from(this.sessions.keys()).map(streamId =>
      this.stopSession(streamId)
    );

    await Promise.all(promises);
  }
}
