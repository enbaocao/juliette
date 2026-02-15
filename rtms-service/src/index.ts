import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { RTMSConnectionManager } from './rtms-client';
import { DatabaseWriter } from './database-writer';
import { ZoomWebhookEvent, RTMSConfig } from './types';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize connection manager
const connectionManager = new RTMSConnectionManager();
const db = new DatabaseWriter();

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeSessions: connectionManager.getActiveSessions().length
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

    // Handle RTMS started event
    if (event.event === 'meeting.rtms_started') {
      const { uuid: meetingUUID, rtms_stream_id: rtmsStreamId } = event.payload.object;

      if (!rtmsStreamId) {
        console.error('❌ No RTMS stream ID in webhook payload');
        return res.status(400).json({ error: 'Missing RTMS stream ID' });
      }

      // Find active live session for this meeting
      const liveSession = await db.getLiveSessionByMeetingUUID(meetingUUID);

      if (!liveSession) {
        console.log(`⚠️  No active live session found for meeting: ${meetingUUID}`);
        return res.status(200).json({ message: 'No active session, ignoring' });
      }

      console.log(`✅ Found live session: ${liveSession.id}`);

      // Start RTMS session
      const config: RTMSConfig = {
        meetingUUID,
        meetingNumber: liveSession.meeting_number,
        rtmsStreamId,
        liveSessionId: liveSession.id
      };

      await connectionManager.startSession(config);

      return res.status(200).json({ message: 'RTMS session started' });
    }

    // Acknowledge other events
    res.status(200).json({ message: 'Event received' });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start RTMS transcription manually
 * POST /rtms/start
 */
app.post('/rtms/start', async (req: Request, res: Response) => {
  try {
    const { meetingUUID, meetingNumber, rtmsStreamId, liveSessionId } = req.body;

    if (!meetingUUID || !rtmsStreamId || !liveSessionId) {
      return res.status(400).json({
        error: 'Missing required fields: meetingUUID, rtmsStreamId, liveSessionId'
      });
    }

    const config: RTMSConfig = {
      meetingUUID,
      meetingNumber,
      rtmsStreamId,
      liveSessionId
    };

    await connectionManager.startSession(config);

    res.status(200).json({
      message: 'RTMS session started',
      rtmsStreamId
    });

  } catch (error: any) {
    console.error('❌ Failed to start RTMS session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stop RTMS transcription
 * POST /rtms/stop
 */
app.post('/rtms/stop', async (req: Request, res: Response) => {
  try {
    const { rtmsStreamId } = req.body;

    if (!rtmsStreamId) {
      return res.status(400).json({ error: 'Missing rtmsStreamId' });
    }

    await connectionManager.stopSession(rtmsStreamId);

    res.status(200).json({ message: 'RTMS session stopped' });

  } catch (error: any) {
    console.error('❌ Failed to stop RTMS session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get RTMS session status
 * GET /rtms/status/:rtmsStreamId
 */
app.get('/rtms/status/:rtmsStreamId', (req: Request, res: Response) => {
  try {
    const { rtmsStreamId } = req.params;
    const status = connectionManager.getSessionStatus(rtmsStreamId);

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
 * GET /rtms/sessions
 */
app.get('/rtms/sessions', (req: Request, res: Response) => {
  try {
    const activeSessions = connectionManager.getActiveSessions();

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

  await connectionManager.stopAllSessions();

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');

  await connectionManager.stopAllSessions();

  process.exit(0);
});

/**
 * Start server
 */
app.listen(port, () => {
  console.log(`\n🚀 RTMS Service started`);
  console.log(`   Port: ${port}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Webhook endpoint: http://localhost:${port}/webhook/zoom`);
  console.log(`\n✅ Ready to receive RTMS connections\n`);
});
