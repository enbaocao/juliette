/**
 * Zoom Apps SDK Configuration
 */

export const zoomConfig = {
  clientId: process.env.ZOOM_CLIENT_ID || '',
  clientSecret: process.env.ZOOM_CLIENT_SECRET || '',
  webhookSecretToken: process.env.ZOOM_WEBHOOK_SECRET_TOKEN || '',
  redirectUrl: process.env.NEXT_PUBLIC_ZOOM_REDIRECT_URL || 'http://localhost:3001/zoom/auth',
};

export interface ZoomContext {
  meetingUUID: string;
  meetingNumber: string;
  userName: string;
  userEmail?: string;
  role: 'host' | 'attendee';
}

export interface LiveSession {
  id: string;
  meeting_uuid: string;
  meeting_number: string;
  video_id: string;
  host_user_id: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'ended';
}
