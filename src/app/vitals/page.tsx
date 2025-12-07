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

  const [isExpanded, setIsExpanded] = useState(true);

  const handleChangeUser = () => {
    if (newHandle.trim()) {
      const cleanHandle = newHandle.trim().replace('@', '');
      window.location.href = `/monitor?handle=${cleanHandle}`;
    }
  };

  return (
    <div>
      {/* Sleek modern command bar - bottom right, slide-up */}
      {handle && topics && (
        <div className={`fixed bottom-0 left-64 right-0 z-50 transition-transform duration-300 ${isExpanded ? 'translate-y-0' : 'translate-y-full'}`}>
          {/* Slide toggle button */}
          <div className="flex justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute -top-8 bg-zinc-900/95 backdrop-blur-md text-zinc-400 hover:text-white px-4 py-1.5 rounded-t-lg border border-b-0 border-zinc-800 hover:border-zinc-700 transition-all shadow-lg"
            >
              {isExpanded ? '▼' : '▲'} Command Bar
            </button>
          </div>

          {/* Main command bar */}
          <div className="bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
            <div className="px-6 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* Left side - Tracking info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="text-sm text-zinc-300 truncate">
                    <span className="text-zinc-500">Tracking</span> <span className="text-white font-medium">@{handle}</span> <span className="text-zinc-500">for:</span> <span className="text-zinc-400">{topics}</span>
                  </span>
                </div>

                {/* Right side - Action buttons */}
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  {!showChangeInput ? (
                    <>
                      <button
                        onClick={() => window.location.href = `/analyze?handle=${handle}`}
                        className="text-xs px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 transition-all font-medium whitespace-nowrap"
                      >
                        🔍 Analyze
                      </button>
                      <button
                        onClick={() => window.location.href = `/monitor?handle=${handle}`}
                        className="text-xs px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 transition-all font-medium whitespace-nowrap"
                      >
                        📊 Monitor
                      </button>
                      <button
                        onClick={() => setShowChangeInput(true)}
                        className="text-xs px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 hover:border-zinc-700 transition-all whitespace-nowrap"
                      >
                        Change User
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                      <input
                        type="text"
                        value={newHandle}
                        onChange={(e) => setNewHandle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChangeUser()}
                        placeholder="@username"
                        className="bg-zinc-900 text-zinc-200 placeholder-zinc-500 text-xs px-3 py-1.5 rounded-md outline-none border border-zinc-700 focus:border-zinc-600 w-36"
                        autoFocus
                      />
                      <button
                        onClick={handleChangeUser}
                        className="text-xs px-3 py-1.5 rounded-md bg-white text-black hover:bg-zinc-200 transition-colors font-semibold"
                      >
                        Go
                      </button>
                      <button
                        onClick={() => {
                          setShowChangeInput(false);
                          setNewHandle('');
                        }}
                        className="text-xs px-2 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-400 hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content with bottom padding when command bar is shown */}
      <div className={handle && topics ? 'pb-20' : ''}>
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
