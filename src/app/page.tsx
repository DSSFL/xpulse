'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import VortexLoader from '@/components/VortexLoader';

export default function Home() {
  const router = useRouter();
  const [handle, setHandle] = useState('');
  const [topics, setTopics] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if user already logged in - redirect to vitals if so
  useEffect(() => {
    const savedHandle = localStorage.getItem('xpulse_handle');
    const savedTopics = localStorage.getItem('xpulse_topics');

    if (savedHandle && savedTopics) {
      router.push('/vitals?handle=' + encodeURIComponent(savedHandle) + '&topics=' + encodeURIComponent(savedTopics));
    } else {
      setCheckingSession(false);
    }
  }, [router]);

  const startTracking = async () => {
    if (!handle.trim() || !topics.trim()) {
      alert('Please enter both your handle and topics to track');
      return;
    }

    setIsLoading(true);
    setProgress('Connecting to Grok AI...');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://api.xpulse.buzz';
      const socketInstance = io(backendUrl);

      // Progress updates
      setTimeout(() => setProgress('Teaching Grok what to track...'), 800);
      setTimeout(() => setProgress('Searching X in real-time...'), 2000);
      setTimeout(() => setProgress('Building your intelligence dashboard...'), 3500);

      // Emit tracking request to backend
      socketInstance.emit('tracking:start', {
        handle: handle.replace('@', ''),
        topics: topics.split(',').map(t => t.trim())
      });

      // After 5 seconds, save to localStorage and navigate to vitals dashboard
      setTimeout(() => {
        socketInstance.disconnect();
        // Save login info to localStorage so user doesn't see login again
        localStorage.setItem('xpulse_handle', handle.replace('@', ''));
        localStorage.setItem('xpulse_topics', topics);
        router.push('/vitals?handle=' + encodeURIComponent(handle.replace('@', '')) + '&topics=' + encodeURIComponent(topics));
      }, 5000);

    } catch (error) {
      console.error('Error starting tracking:', error);
      setIsLoading(false);
      alert('Failed to start tracking. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-pulse-purple/10 via-transparent to-pulse-blue/10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pulse-purple/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pulse-blue/20 rounded-full blur-3xl animate-pulse delay-700 pointer-events-none" />

      {checkingSession ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-pulse-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isLoading ? (
        <VortexLoader message={progress} />
      ) : (
        <div className="max-w-2xl w-full z-10">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/xpulse-logo.png"
                alt="XPulse"
                className="h-16 w-auto"
              />
            </div>

            <h2 className="text-3xl font-bold text-x-white mb-4">
              Real-Time Threat Intelligence for X
            </h2>
            <p className="text-xl text-x-gray-text">
              Grok-powered monitoring of your X presence. Track threats, sentiment, and narratives in real-time.
            </p>
          </div>

          {/* CTA Form */}
          <div className="bg-x-gray-dark/80 backdrop-blur-xl border border-x-gray-border rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-x-white mb-6 text-center">
              Start Tracking in Seconds
            </h3>

            <div className="space-y-6">
              {/* Handle Input */}
              <div>
                <label className="block text-x-white font-medium mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-pulse-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Your X Handle
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-x-gray-text text-lg">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && topics && startTracking()}
                    placeholder="elonmusk"
                    className="w-full pl-10 pr-4 py-4 rounded-xl bg-x-gray-light border border-x-gray-border text-x-white placeholder-x-gray-text text-lg focus:outline-none focus:border-pulse-purple focus:ring-2 focus:ring-pulse-purple/20 transition-all"
                  />
                </div>
              </div>

              {/* Topics Input */}
              <div>
                <label className="block text-x-white font-medium mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-pulse-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  What to Track
                </label>
                <input
                  type="text"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handle && startTracking()}
                  placeholder="AI, crypto, tech news, breaking news..."
                  className="w-full px-4 py-4 rounded-xl bg-x-gray-light border border-x-gray-border text-x-white placeholder-x-gray-text text-lg focus:outline-none focus:border-pulse-green focus:ring-2 focus:ring-pulse-green/20 transition-all"
                />
                <p className="text-x-gray-text text-sm mt-2">
                  Separate topics with commas. Grok AI will intelligently find relevant posts.
                </p>
              </div>

              {/* Start Button */}
              <button
                onClick={startTracking}
                disabled={!handle.trim() || !topics.trim()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-pulse-purple to-pulse-blue text-white font-bold text-lg hover:shadow-lg hover:shadow-pulse-purple/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-3 group"
              >
                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Real-Time Tracking
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-x-gray-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-pulse-purple mb-1">&lt;10s</div>
                <div className="text-xs text-x-gray-text">Setup Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pulse-blue mb-1">Real-time</div>
                <div className="text-xs text-x-gray-text">Updates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pulse-green mb-1">Grok AI</div>
                <div className="text-xs text-x-gray-text">Powered</div>
              </div>
            </div>
          </div>

          {/* Social Proof / Features */}
          <div className="mt-8 text-center">
            <p className="text-x-gray-text text-sm">
              Trusted by security teams, journalists, and public figures to monitor X in real-time
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
