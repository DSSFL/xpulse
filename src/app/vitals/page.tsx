'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import LiveDashboard from '@/components/LiveDashboard';
import VortexLoader from '@/components/VortexLoader';
import { useTrackedUser } from '@/contexts/TrackedUserContext';

export const dynamic = 'force-dynamic';

function VitalsContent() {
  const searchParams = useSearchParams();
  const urlHandle = searchParams.get('handle');
  const topics = searchParams.get('topics');
  const { trackedHandle, setTrackedUser } = useTrackedUser();

  // Use URL handle if provided, otherwise fall back to tracked handle from context
  const handle = urlHandle || trackedHandle;

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
      setTrackedUser(cleanHandle);
      setShowChangeInput(false);
      setNewHandle('');
    }
  };

  return (
    <div className="bg-black min-h-screen">
      {/* X-style command bar - bottom, slide-up */}
      {handle && topics && (
        <div className={`fixed bottom-0 left-64 right-0 z-50 transition-transform duration-300 ${isExpanded ? 'translate-y-0' : 'translate-y-full'}`}>
          {/* Slide toggle button */}
          <div className="flex justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute -top-8 bg-[#16181C]/95 backdrop-blur-md text-[#71767B] hover:text-[#E7E9EA] px-4 py-1.5 rounded-t-lg border border-b-0 border-[#2F3336] hover:border-[#1D9BF0] transition-all shadow-lg"
            >
              {isExpanded ? '▼' : '▲'} Command Bar
            </button>
          </div>

          {/* Main command bar */}
          <div className="bg-[#16181C]/95 backdrop-blur-md border-t border-[#2F3336] shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
            <div className="px-6 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* Left side - Tracking info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00BA7C] animate-pulse flex-shrink-0" />
                  <span className="text-sm text-[#71767B] truncate">
                    <span className="text-[#71767B]">Tracking</span> <span className="text-[#E7E9EA] font-medium">@{handle}</span> <span className="text-[#71767B]">for:</span> <span className="text-[#71767B]">{topics}</span>
                  </span>
                </div>

                {/* Right side - Action buttons */}
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  {!showChangeInput ? (
                    <>
                      <button
                        onClick={() => {
                          if (handle && !trackedHandle) setTrackedUser(handle);
                          window.location.href = '/analyze';
                        }}
                        className="text-xs px-4 py-2 rounded-full bg-[#16181C] hover:bg-[#1D9BF0]/10 text-[#71767B] hover:text-[#1D9BF0] border border-[#2F3336] hover:border-[#1D9BF0] transition-all font-medium whitespace-nowrap"
                      >
                        Analyze
                      </button>
                      <button
                        onClick={() => {
                          if (handle && !trackedHandle) setTrackedUser(handle);
                          window.location.href = '/monitor';
                        }}
                        className="text-xs px-4 py-2 rounded-full bg-[#16181C] hover:bg-[#1D9BF0]/10 text-[#71767B] hover:text-[#1D9BF0] border border-[#2F3336] hover:border-[#1D9BF0] transition-all font-medium whitespace-nowrap"
                      >
                        Monitor
                      </button>
                      <button
                        onClick={() => setShowChangeInput(true)}
                        className="text-xs px-4 py-2 rounded-full bg-[#16181C]/50 hover:bg-[#16181C] text-[#71767B] hover:text-[#E7E9EA] border border-[#2F3336]/50 hover:border-[#2F3336] transition-all whitespace-nowrap"
                      >
                        Change User
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#16181C] border border-[#2F3336] rounded-full px-3 py-2">
                      <input
                        type="text"
                        value={newHandle}
                        onChange={(e) => setNewHandle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChangeUser()}
                        placeholder="@username"
                        className="bg-black text-[#E7E9EA] placeholder-[#71767B] text-xs px-3 py-1.5 rounded-md outline-none border border-[#2F3336] focus:border-[#1D9BF0] w-36"
                        autoFocus
                      />
                      <button
                        onClick={handleChangeUser}
                        className="text-xs px-3 py-1.5 rounded-full bg-[#E7E9EA] text-black hover:bg-[#D7D9DB] transition-colors font-semibold"
                      >
                        Go
                      </button>
                      <button
                        onClick={() => {
                          setShowChangeInput(false);
                          setNewHandle('');
                        }}
                        className="text-xs px-2 py-1.5 rounded-full bg-[#2F3336] hover:bg-[#3E4144] text-[#71767B] hover:text-[#E7E9EA] transition-colors"
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
        <LiveDashboard handle={handle || undefined} />
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
