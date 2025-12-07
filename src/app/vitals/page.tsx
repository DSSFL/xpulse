'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import LiveDashboard from '@/components/LiveDashboard';
import VortexLoader from '@/components/VortexLoader';

function VitalsContent() {
  const searchParams = useSearchParams();
  const handle = searchParams.get('handle');
  const topics = searchParams.get('topics');
  const [showChangeInput, setShowChangeInput] = useState(false);
  const [newHandle, setNewHandle] = useState('');

  useEffect(() => {
    if (handle && topics) {
      const backendUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://api.xpulse.buzz';
      const socketInstance = io(backendUrl);

      socketInstance.emit('tracking:configure', {
        handle,
        topics: topics.split(',').map(t => t.trim())
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [handle, topics]);

  const handleChangeUser = () => {
    if (newHandle.trim()) {
      const cleanHandle = newHandle.trim().replace('@', '');
      window.location.href = `/monitor?handle=${cleanHandle}`;
    }
  };

  return (
    <div>
      {/* Show tracking banner if configured - MOVED TO BOTTOM */}
      {handle && topics && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-pulse-purple to-pulse-blue text-white py-2.5 px-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              {/* Left side - Tracking info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  Tracking @{handle} for: {topics}
                </span>
              </div>

              {/* Right side - Action buttons */}
              <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                {!showChangeInput ? (
                  <>
                    <button
                      onClick={() => window.location.href = `/analyze?handle=${handle}`}
                      className="text-xs px-3 py-1.5 rounded-full bg-white text-pulse-purple hover:bg-white/90 transition-colors font-semibold whitespace-nowrap"
                    >
                      🔍 Analyze
                    </button>
                    <button
                      onClick={() => window.location.href = `/monitor?handle=${handle}`}
                      className="text-xs px-3 py-1.5 rounded-full bg-white text-pulse-purple hover:bg-white/90 transition-colors font-semibold whitespace-nowrap"
                    >
                      📊 Monitor
                    </button>
                    <button
                      onClick={() => setShowChangeInput(true)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors whitespace-nowrap"
                    >
                      Change User
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                    <input
                      type="text"
                      value={newHandle}
                      onChange={(e) => setNewHandle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleChangeUser()}
                      placeholder="@username"
                      className="bg-white/20 text-white placeholder-white/60 text-xs px-3 py-1 rounded-full outline-none w-32 focus:bg-white/30"
                      autoFocus
                    />
                    <button
                      onClick={handleChangeUser}
                      className="text-xs px-3 py-1 rounded-full bg-white text-pulse-purple hover:bg-white/90 transition-colors font-semibold"
                    >
                      Go
                    </button>
                    <button
                      onClick={() => {
                        setShowChangeInput(false);
                        setNewHandle('');
                      }}
                      className="text-xs px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No margin needed - content flows naturally */}
      <div className={handle && topics ? 'pb-16' : ''}>
        <LiveDashboard />
      </div>
    </div>
  );
}

export default function VitalsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><VortexLoader message="Loading dashboard..." /></div>}>
      <VitalsContent />
    </Suspense>
  );
}
