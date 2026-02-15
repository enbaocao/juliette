import { EventEmitter } from 'events';
import { CircularAudioBuffer } from './audio-buffer';
import { TranscriptionPipeline } from './transcription-pipeline';
import { DatabaseWriter } from './database-writer';
import axios from 'axios';
import ZoomVideo from '@zoom/videosdk';

/**
 * ZoomBotClient - Manages Zoom Meeting Bot for audio capture
 * Uses Zoom Meeting SDK instead of RTMS
 */

interface BotConfig {
  meetingNumber: string;
  password?: string;
  userName: string;
  liveSessionId: string;
  sessionId: string;
}

export class ZoomBotSessionManager extends EventEmitter {
  private config: BotConfig;
  private db: DatabaseWriter;
  private audioBuffer: CircularAudioBuffer;
  private transcriptionPipeline: TranscriptionPipeline;
  private isConnected: boolean = false;
  private totalAudioReceived: bigint = BigInt(0);
  private connectionId: string | null = null;
  private audioContext: any = null;
  private mediaStream: any = null;
  private zoomClient: any = null;
  private zoomStream: any = null;
  private audioProcessor: any = null;

  constructor(config: BotConfig, db: DatabaseWriter) {
    super();
    this.config = config;
    this.db = db;

    // Initialize audio buffer
    const bufferSeconds = parseInt(process.env.AUDIO_BUFFER_SECONDS || '10');
    const overlapSeconds = parseInt(process.env.AUDIO_OVERLAP_SECONDS || '2');
    this.audioBuffer = new CircularAudioBuffer(16000, bufferSeconds, overlapSeconds);

    // Initialize transcription pipeline
    this.transcriptionPipeline = new TranscriptionPipeline(config.liveSessionId, db);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Buffer ready event - send to transcription
    this.audioBuffer.on('bufferReady', async (event) => {
      try {
        await this.transcriptionPipeline.processAudioBuffer(
          event.buffer,
          event.sequenceNumber,
          event.sampleRate
        );

        // Update connection stats in database
        const timestamp = new Date().toISOString();
        console.log(`📝 Transcribed buffer ${event.sequenceNumber} at ${timestamp}`);
      } catch (error) {
        console.error('Failed to process audio buffer:', error);
      }
    });
  }

  /**
   * Validate Zoom credentials are present
   */
  private validateZoomCredentials(): void {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing Zoom credentials in environment variables. Need ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET');
    }

    console.log('✅ Zoom credentials validated');
  }

  /**
   * Generate JWT signature for Zoom Meeting SDK
   */
  private generateSignature(meetingNumber: string, role: number): string {
    const crypto = require('crypto');
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 2; // 2 hours

    const payload = {
      sdkKey: process.env.ZOOM_CLIENT_ID,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      appKey: process.env.ZOOM_CLIENT_ID,
      tokenExp: exp
    };

    const header = { alg: 'HS256', typ: 'JWT' };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', process.env.ZOOM_CLIENT_SECRET!)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Join Zoom meeting using the Video SDK
   */
  private async joinMeeting(): Promise<void> {
    try {
      console.log(`🔗 Joining meeting ${this.config.meetingNumber}...`);

      // Generate JWT signature for meeting join
      const signature = this.generateSignature(this.config.meetingNumber, 0);
      console.log(`✅ Generated JWT signature for Video SDK`);

      // Initialize Zoom Video SDK client
      this.zoomClient = ZoomVideo.createClient();

      await this.zoomClient.init('en-US', 'Global', {
        patchJsMedia: true,
        enforceMultipleVideos: false
      });

      console.log('✅ Zoom Video SDK initialized');

      // Join the session
      await this.zoomClient.join(
        this.config.meetingNumber,
        signature,
        this.config.userName,
        this.config.password || ''
      );

      console.log('✅ Successfully joined Zoom meeting');

      // Get media stream
      this.zoomStream = this.zoomClient.getMediaStream();

      // Start receiving audio
      await this.zoomStream.startAudio();
      console.log('✅ Audio stream started');

      // Set up audio capture
      await this.setupVideoSDKAudioCapture();

      console.log('✅ Bot connected and capturing audio');
    } catch (error: any) {
      console.error('❌ Failed to join meeting:', error);
      throw new Error(`Failed to join Zoom meeting: ${error.message}`);
    }
  }

  /**
   * Set up audio capture from Zoom Video SDK
   */
  private async setupVideoSDKAudioCapture(): Promise<void> {
    try {
      console.log('🎤 Setting up audio capture...');

      // Subscribe to all audio streams in the meeting
      const participants = this.zoomClient.getAllUser();

      for (const participant of participants) {
        if (participant.audio === 'computer') {
          await this.zoomStream.subscribeAudioStream(participant.userId);
          console.log(`✅ Subscribed to audio from: ${participant.displayName}`);
        }
      }

      // Listen for new participants joining
      this.zoomClient.on('user-added', async (payload: any[]) => {
        for (const user of payload) {
          if (user.audio === 'computer') {
            await this.zoomStream.subscribeAudioStream(user.userId);
            console.log(`✅ Subscribed to audio from new participant: ${user.displayName}`);
          }
        }
      });

      // Listen for audio status changes
      this.zoomClient.on('user-updated', async (payload: any[]) => {
        for (const user of payload) {
          if (user.audio === 'computer' && !this.zoomStream.isAudioStreamSubscribed(user.userId)) {
            await this.zoomStream.subscribeAudioStream(user.userId);
            console.log(`✅ Subscribed to audio from: ${user.displayName}`);
          }
        }
      });

      // Get the audio media stream from Zoom
      const audioElement = this.zoomStream.getAudioElement();

      if (audioElement && audioElement.srcObject) {
        // Create Web Audio API context
        this.audioContext = new (require('web-audio-api').AudioContext)({
          sampleRate: 16000
        });

        // Create source from media stream
        const source = this.audioContext.createMediaStreamSource(audioElement.srcObject);

        // Create processor for audio chunks
        this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

        this.audioProcessor.onaudioprocess = (event: any) => {
          const audioData = event.inputBuffer.getChannelData(0);

          // Convert Float32Array to Buffer for our pipeline
          const buffer = Buffer.alloc(audioData.length * 2); // 16-bit PCM

          for (let i = 0; i < audioData.length; i++) {
            // Convert float (-1 to 1) to 16-bit PCM (-32768 to 32767)
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            buffer.writeInt16LE(pcm, i * 2);
          }

          // Send to processing pipeline
          this.processAudioData(buffer);
        };

        // Connect nodes
        source.connect(this.audioProcessor);
        this.audioProcessor.connect(this.audioContext.destination);

        console.log('✅ Audio processing pipeline connected');
      } else {
        console.warn('⚠️  No audio element available yet, will retry when audio is activated');
      }
    } catch (error: any) {
      console.error('❌ Failed to set up audio capture:', error);
      throw error;
    }
  }

  /**
   * Connect to Zoom meeting as bot
   */
  async connect(): Promise<void> {
    try {
      console.log(`\n🤖 Starting Zoom Bot for meeting: ${this.config.meetingNumber}`);
      console.log(`   Bot Name: ${this.config.userName}`);
      console.log(`   Live Session ID: ${this.config.liveSessionId}`);

      // Update session status
      await this.db.updateSessionTranscriptionStatus(this.config.liveSessionId, {
        isTranscribing: true,
        rtmsStatus: 'connecting'
      });

      // Initialize sequence counter from existing chunks
      await this.transcriptionPipeline.initializeSequenceCounter();

      // Validate credentials
      this.validateZoomCredentials();

      // Join the Zoom meeting with Video SDK
      await this.joinMeeting();

      // Mark as connected
      this.isConnected = true;

      // Update database status
      await this.db.updateSessionTranscriptionStatus(this.config.liveSessionId, {
        rtmsStatus: 'streaming'
      });

      console.log('✅ Bot connected and ready to capture audio');

    } catch (error: any) {
      console.error('❌ Failed to connect bot:', error);

      await this.db.updateSessionTranscriptionStatus(this.config.liveSessionId, {
        isTranscribing: false,
        rtmsStatus: 'error'
      });

      throw error;
    }
  }

  /**
   * Process incoming audio data
   * This would be called by the Zoom Meeting SDK audio callback
   */
  processAudioData(audioData: Buffer): void {
    if (!this.isConnected) return;

    // Accumulate audio data
    this.audioBuffer.write(audioData);
    this.totalAudioReceived += BigInt(audioData.length);
  }

  /**
   * Disconnect bot from meeting
   */
  async disconnect(): Promise<void> {
    try {
      console.log(`\n🔌 Disconnecting bot from meeting`);

      // Flush any remaining audio
      this.audioBuffer.forceFlush();

      // Cleanup audio processor
      if (this.audioProcessor) {
        this.audioProcessor.disconnect();
        this.audioProcessor = null;
      }

      // Cleanup audio context
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      // Stop audio stream
      if (this.zoomStream) {
        try {
          await this.zoomStream.stopAudio();
          console.log('✅ Stopped audio stream');
        } catch (err) {
          console.warn('⚠️  Error stopping audio stream:', err);
        }
      }

      // Leave Zoom meeting
      if (this.zoomClient) {
        try {
          await this.zoomClient.leave();
          console.log('✅ Left Zoom meeting');
        } catch (err) {
          console.warn('⚠️  Error leaving meeting:', err);
        }
        this.zoomClient = null;
        this.zoomStream = null;
      }

      // Update database
      await this.db.updateSessionTranscriptionStatus(this.config.liveSessionId, {
        isTranscribing: false,
        rtmsStatus: 'idle'
      });

      this.isConnected = false;

      console.log('✅ Bot disconnected');

    } catch (error) {
      console.error('Error during disconnect:', error);
    }
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
 * ZoomBotManager - Manages multiple bot sessions
 */
export class ZoomBotManager {
  private sessions: Map<string, ZoomBotSessionManager> = new Map();
  private db: DatabaseWriter;

  constructor() {
    this.db = new DatabaseWriter();
  }

  /**
   * Start a new bot session
   */
  async startSession(config: BotConfig): Promise<void> {
    const sessionKey = `${config.liveSessionId}`;

    if (this.sessions.has(sessionKey)) {
      throw new Error(`Bot session already exists for: ${sessionKey}`);
    }

    const session = new ZoomBotSessionManager(config, this.db);
    await session.connect();

    this.sessions.set(sessionKey, session);

    console.log(`📊 Active bot sessions: ${this.sessions.size}`);
  }

  /**
   * Stop an existing bot session
   */
  async stopSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`No bot session found for: ${sessionId}`);
    }

    await session.disconnect();
    this.sessions.delete(sessionId);

    console.log(`📊 Active bot sessions: ${this.sessions.size}`);
  }

  /**
   * Process audio data for a session
   * This would be called from the Zoom Meeting SDK audio callback
   */
  processAudio(sessionId: string, audioData: Buffer): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.processAudioData(audioData);
    }
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string) {
    const session = this.sessions.get(sessionId);
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
    const promises = Array.from(this.sessions.keys()).map(sessionId =>
      this.stopSession(sessionId)
    );

    await Promise.all(promises);
  }
}
