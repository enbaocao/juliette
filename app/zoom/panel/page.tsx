'use client';

import { useZoomApp } from '@/hooks/useZoomApp';
import { useState, useEffect } from 'react';
import LiveSessionPanel from '@/components/zoom/LiveSessionPanel';

export default function ZoomPanelPage() {
  const { isConfigured, context, error, isLoading } = useZoomApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to Zoom...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Connection Error</h2>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <p className="text-gray-600 text-xs">
            Make sure this app is running inside a Zoom meeting panel.
          </p>
        </div>
      </div>
    );
  }

  if (!isConfigured || !context) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h2 className="text-yellow-800 font-semibold mb-2">Not Configured</h2>
          <p className="text-yellow-700 text-sm">
            Unable to get Zoom meeting context. Please ensure you're running this in a Zoom Apps panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <LiveSessionPanel context={context} />
    </div>
  );
}
