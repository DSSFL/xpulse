'use client';

import { useEffect, useState, useSearchParams as useSearchParamsImport } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import LiveDashboard from '@/components/LiveDashboard';

export default function VitalsPage() {
  const searchParams = useSearchParams();
  const handle = searchParams.get('handle');
  const topics = searchParams.get('topics');
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (handle && topics) {
      const backendUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://api.xpulse.buzz';
      const socketInstance = io(backendUrl);

      socketInstance.emit('tracking:configure', {
        handle,
        topics: topics.split(',').map(t => t.trim())
      });

      setIsTracking(true);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [handle, topics]);

  return (
    <div>
      {/* Show tracking banner if configured */}
      {handle && topics && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-pulse-purple to-pulse-blue text-white py-2 px-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-medium">
              Tracking @{handle} for: {topics}
            </span>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="text-xs px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            Change Tracking
          </button>
        </div>
      )}

      <div className={handle && topics ? 'mt-10' : ''}>
        <LiveDashboard />
      </div>
    </div>
  );
}
