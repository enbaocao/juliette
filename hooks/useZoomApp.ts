'use client';

import { useEffect, useState } from 'react';
import zoomSdk from '@zoom/appssdk';

export interface ZoomMeetingContext {
  meetingUUID: string;
  meetingNumber: string;
  userName: string;
  userEmail?: string;
  role: 'host' | 'attendee';
}

export function useZoomApp() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [context, setContext] = useState<ZoomMeetingContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const configureZoomApp = async () => {
      try {
        // Configure the Zoom App SDK
        const configResponse = await zoomSdk.config({
          capabilities: [
            'getMeetingContext',
            'getMeetingUUID',
            'getRunningContext',
          ],
          version: '0.16.0',
        });

        console.log('Zoom SDK configured:', configResponse);
        setIsConfigured(true);

        // Get meeting context
        const meetingContext = await zoomSdk.getMeetingContext();
        const runningContext = await zoomSdk.getRunningContext();

        console.log('Meeting context:', meetingContext);
        console.log('Running context:', runningContext);

        // Type assertion needed as SDK types might be incomplete
        const contextAny = meetingContext as any;

        // Extract context information
        setContext({
          meetingUUID: contextAny.meetingUUID || '',
          meetingNumber: contextAny.meetingID?.toString() || '',
          userName: (runningContext as any).context?.user?.userName || 'Guest',
          userEmail: (runningContext as any).context?.user?.email,
          role: (runningContext as any).context?.user?.role === 1 ? 'host' : 'attendee',
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error configuring Zoom SDK:', err);
        setError(err instanceof Error ? err.message : 'Failed to configure Zoom');
        setIsLoading(false);
      }
    };

    configureZoomApp();
  }, []);

  return {
    isConfigured,
    context,
    error,
    isLoading,
    zoomSdk,
  };
}
