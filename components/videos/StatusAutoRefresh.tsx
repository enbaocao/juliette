'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StatusAutoRefreshProps {
  enabled: boolean;
  intervalMs?: number;
}

export default function StatusAutoRefresh({
  enabled,
  intervalMs = 4000,
}: StatusAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enabled, intervalMs, router]);

  return null;
}
