import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { ZoomBotManager } from './bot-client';
import { DatabaseWriter } from './database-writer';
import { ZoomWebhookEvent } from './types';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize bot manager
const botManager = new ZoomBotManager();
const db = new DatabaseWriter();

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeSessions: botManager.getActiveSessions().length
  });
});

/**
 * Zoom webhook endpoint
 * Receives meeting.rtms_started event from Zoom
 */
app.post('/webhook/zoom', async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-zm-signature'] as string;
    const timestamp = req.headers['x-zm-request-timestamp'] as string;

    if (process.env.ZOOM_WEBHOOK_SECRET_TOKEN) {
      const isValid = verifyWebhookSignature(
        req.body,
        signature,
        timestamp,
        process.env.ZOOM_WEBHOOK_SECRET_TOKEN
      );

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event: ZoomWebhookEvent = req.body;

    console.log(`\n📨 Received Zoom webhook: ${event.event}`);

    // Handle endpoint verification (Zoom sends this when setting up webhook)
    if (req.body.event === 'endpoint.url_validation') {
      const plainToken = req.body.payload.plainToken;
      const encryptedToken = crypto
        .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN || '')
        .update(plainToken)
        .digest('hex');

      return res.status(200).json({
        plainToken: plainToken,
        encryptedToken: encryptedToken
      });
    }

    // Handle meeting started event (for bot joining)
    if (event.event === 'meeting.started' || event.event === 'meeting.rtms_started') {
      const { uuid: meetingUUID } = event.payload.object;

      // Find active live session for this meeting
      const liveSession = await db.getLiveSessionByMeetingUUID(meetingUUID);

      if (!liveSession) {
        console.log(`⚠️  No active live session found for meeting: ${meetingUUID}`);
        return res.status(200).json({ message: 'No active session, ignoring' });
      }

      console.log(`✅ Found live session: ${liveSession.id}`);

      // Start bot session
      const config = {
        meetingNumber: liveSession.meeting_number,
        password: liveSession.meeting_password || undefined,
        userName: 'Juliette AI Assistant',
        liveSessionId: liveSession.id,
        sessionId: liveSession.id
      };

      await botManager.startSession(config);

      return res.status(200).json({ message: 'Bot session started' });
    }

    // Acknowledge other events
    res.status(200).json({ message: 'Event received' });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start bot transcription manually
 * POST /bot/start
 */
app.post('/bot/start', async (req: Request, res: Response) => {
  try {
    const { meetingNumber, password, liveSessionId } = req.body;

    if (!meetingNumber || !liveSessionId) {
      return res.status(400).json({
        error: 'Missing required fields: meetingNumber, liveSessionId'
      });
    }

    const config = {
      meetingNumber,
      password,
      userName: 'Juliette AI Assistant',
      liveSessionId,
      sessionId: liveSessionId
    };

    await botManager.startSession(config);

    res.status(200).json({
      message: 'Bot session started',
      sessionId: liveSessionId
    });

  } catch (error: any) {
    console.error('❌ Failed to start bot session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stop bot transcription
 * POST /bot/stop
 */
app.post('/bot/stop', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    await botManager.stopSession(sessionId);

    res.status(200).json({ message: 'Bot session stopped' });

  } catch (error: any) {
    console.error('❌ Failed to stop bot session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get bot session status
 * GET /bot/status/:sessionId
 */
app.get('/bot/status/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const status = botManager.getSessionStatus(sessionId);

    if (!status) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json(status);

  } catch (error: any) {
    console.error('❌ Failed to get status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all active sessions
 * GET /bot/sessions
 */
app.get('/bot/sessions', (req: Request, res: Response) => {
  try {
    const activeSessions = botManager.getActiveSessions();

    res.status(200).json({
      count: activeSessions.length,
      sessions: activeSessions
    });

  } catch (error: any) {
    console.error('❌ Failed to get sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify Zoom webhook signature
 */
function verifyWebhookSignature(
  payload: any,
  signature: string,
  timestamp: string,
  secretToken: string
): boolean {
  const message = `v0:${timestamp}:${JSON.stringify(payload)}`;
  const computedSignature = crypto
    .createHmac('sha256', secretToken)
    .update(message)
    .digest('hex');

  return `v0=${computedSignature}` === signature;
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');

  await botManager.stopAllSessions();

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');

  await botManager.stopAllSessions();

  process.exit(0);
});

/**
 * Start server
 */
app.listen(port, () => {
  console.log(`\n🚀 Zoom Bot Service started`);
  console.log(`   Port: ${port}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Webhook endpoint: http://localhost:${port}/webhook/zoom`);
  console.log(`\n✅ Ready to connect bot to Zoom meetings\n`);
});
