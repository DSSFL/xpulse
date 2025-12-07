'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import VortexLoader from '@/components/VortexLoader';

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  const [handle, setHandle] = useState('');
  const [topics, setTopics] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if user already logged in - redirect to vitals if so
  // Add ?signout to URL to clear session and show sign-in
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const signout = urlParams.get('signout');

    // If signout param present, clear session and stay on sign-in page
    if (signout) {
      localStorage.removeItem('xpulse_handle');
      localStorage.removeItem('xpulse_topics');
      // Clean up URL
      window.history.replaceState({}, '', '/');
      setCheckingSession(false);
      return;
    }

    const savedHandle = localStorage.getItem('xpulse_handle');
    const savedTopics = localStorage.getItem('xpulse_topics');

    if (savedHandle) {
      const params = new URLSearchParams({ handle: savedHandle });
      if (savedTopics) params.append('topics', savedTopics);
      router.push('/vitals?' + params.toString());
    } else {
      setCheckingSession(false);
    }
  }, [router]);

  const startTracking = async () => {
    if (!handle.trim()) {
      alert('Please enter your X handle');
      return;
    }

    setIsLoading(true);
    setProgress('Connecting to Grok AI...');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://api.xpulse.buzz';
      const socketInstance = io(backendUrl);

      // Progress updates
      setTimeout(() => setProgress(topics.trim() ? 'Teaching Grok what to track...' : 'Setting up your dashboard...'), 800);
      setTimeout(() => setProgress('Searching X in real-time...'), 2000);
      setTimeout(() => setProgress('Building your intelligence dashboard...'), 3500);

      // Emit tracking request to backend
      const topicsArray = topics.trim() ? topics.split(',').map(t => t.trim()) : [];
      socketInstance.emit('tracking:start', {
        handle: handle.replace('@', ''),
        topics: topicsArray
      });

      // After 5 seconds, save to localStorage and navigate to vitals dashboard
      setTimeout(() => {
        socketInstance.disconnect();
        // Save login info to localStorage so user doesn't see login again
        localStorage.setItem('xpulse_handle', handle.replace('@', ''));
        if (topics.trim()) {
          localStorage.setItem('xpulse_topics', topics);
        } else {
          localStorage.removeItem('xpulse_topics');
        }
        const params = new URLSearchParams({ handle: handle.replace('@', '') });
        if (topics.trim()) params.append('topics', topics);
        router.push('/vitals?' + params.toString());
      }, 5000);

    } catch (error) {
      console.error('Error starting tracking:', error);
      setIsLoading(false);
      alert('Failed to start tracking. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      {checkingSession ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#1D9BF0] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isLoading ? (
        <VortexLoader message={progress} />
      ) : (
        <div className="w-full max-w-[600px]">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/xpulse-logo.png"
              alt="XPulse"
              className="h-12 w-auto"
            />
          </div>

          {/* Main Content */}
          <div className="mb-8">
            <h1 className="text-[31px] font-bold text-[#E7E9EA] mb-3 leading-tight">
              Real-time narrative intelligence for X
            </h1>
            <p className="text-[#71767B] text-[15px]">
              Grok-powered monitoring of your X presence. Track threats, sentiment, and narratives in real-time.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Handle Input */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handle && startTracking()}
                  placeholder="Your X handle"
                  className="w-full px-4 py-4 rounded-md bg-black border border-[#333639] text-[#E7E9EA] text-[17px] placeholder-[#71767B] focus:outline-none focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0] transition-colors"
                />
              </div>
            </div>

            {/* Topics Input */}
            <div>
              <input
                type="text"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handle && startTracking()}
                placeholder="Topics to track (optional)"
                className="w-full px-4 py-4 rounded-md bg-black border border-[#333639] text-[#E7E9EA] text-[17px] placeholder-[#71767B] focus:outline-none focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0] transition-colors"
              />
              <p className="text-[#71767B] text-[13px] mt-2">
                Optional: AI, crypto, breaking news, your brand name
              </p>
            </div>

            {/* Start Button */}
            <button
              onClick={startTracking}
              disabled={!handle.trim()}
              className="w-full py-3 rounded-full bg-[#E7E9EA] text-black font-bold text-[17px] hover:bg-[#D7D9DB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#E7E9EA]"
            >
              Start Tracking
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#2F3336]"></div>
            <span className="text-[#71767B] text-[15px]">or</span>
            <div className="flex-1 h-px bg-[#2F3336]"></div>
          </div>

          {/* Demo Button */}
          <button
            onClick={() => {
              setHandle('demo');
              setTopics('AI, technology, breaking news');
              startTracking();
            }}
            className="w-full py-3 rounded-full bg-transparent border border-[#536471] text-[#1D9BF0] font-bold text-[17px] hover:bg-[#1D9BF0]/10 transition-colors"
          >
            Try Demo
          </button>

          {/* Footer */}
          <p className="text-[#71767B] text-[13px] mt-8 text-center">
            By using XPulse, you agree to monitor public X data for legitimate intelligence purposes.
          </p>
        </div>
      )}
    </div>
  );
}
