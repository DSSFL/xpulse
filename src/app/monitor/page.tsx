'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { EnrichedTweet } from '@/types/tweet';
import EnrichedTweetCard from '@/components/EnrichedTweetCard';

export default function MonitorPage() {
  const [tweets, setTweets] = useState<EnrichedTweet[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://api.xpulse.buzz';

    console.log('🔌 [MONITOR] Connecting to backend:', backendUrl);

    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('✅ [MONITOR] Connected to backend');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ [MONITOR] Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('tweet:new', (tweet: EnrichedTweet) => {
      console.log('📊 [MONITOR] New tweet:', tweet?.author?.username);
      if (tweet && tweet.id) {
        setTweets(prev => [tweet, ...prev].slice(0, 50));
      }
    });

    socketInstance.on('tweets:bulk', (bulkTweets: EnrichedTweet[]) => {
      console.log('📦 [MONITOR] Bulk tweets received:', bulkTweets?.length || 0);
      if (Array.isArray(bulkTweets) && bulkTweets.length > 0) {
        // Create a copy before reversing to avoid mutation
        setTweets([...bulkTweets].reverse());
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const filteredTweets = tweets.filter(tweet => {
    if (filter === 'all') return true;
    return tweet.sentiment === filter;
  });

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-x-white flex items-center gap-3">
              <svg className="w-7 h-7 text-pulse-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Live Tweet Monitor
            </h1>
            <p className="text-x-gray-text text-sm mt-1">
              Real-time enriched tweet stream with full X API data
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-x-gray-dark border border-x-gray-border">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-vital-healthy animate-pulse' : 'bg-vital-critical'}`} />
              <span className="text-sm text-x-gray-text">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-x-gray-dark border border-x-gray-border">
              <span className="text-sm text-x-white font-medium">{filteredTweets.length}</span>
              <span className="text-sm text-x-gray-text ml-1">tweets</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-pulse-blue text-x-white'
              : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
          }`}
        >
          All Tweets
        </button>
        <button
          onClick={() => setFilter('positive')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'positive'
              ? 'bg-vital-healthy text-x-white'
              : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
          }`}
        >
          Positive
        </button>
        <button
          onClick={() => setFilter('negative')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'negative'
              ? 'bg-vital-critical text-x-white'
              : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
          }`}
        >
          Negative
        </button>
        <button
          onClick={() => setFilter('neutral')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'neutral'
              ? 'bg-vital-neutral text-x-white'
              : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
          }`}
        >
          Neutral
        </button>
      </div>

      {/* Tweet Stream */}
      <div className="space-y-4">
        {filteredTweets.length === 0 ? (
          <div className="p-12 rounded-xl bg-x-gray-dark border border-x-gray-border text-center">
            <div className="flex flex-col items-center gap-4">
              <svg className="w-16 h-16 text-x-gray-text opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div>
                <p className="text-x-gray-text text-lg mb-2">
                  {isConnected ? 'Waiting for tweets...' : 'Connecting to backend...'}
                </p>
                <p className="text-x-gray-text text-sm">
                  {isConnected ? 'Real-time tweets will appear here' : 'Please wait while we establish connection'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          filteredTweets.map((tweet) => (
            <EnrichedTweetCard key={tweet.id} tweet={tweet} />
          ))
        )}
      </div>
    </div>
  );
}
