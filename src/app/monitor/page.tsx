'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { EnrichedTweet } from '@/types/tweet';
import EnrichedTweetCard from '@/components/EnrichedTweetCard';
import VortexLoader from '@/components/VortexLoader';

export default function MonitorPage() {
  const [tweets, setTweets] = useState<EnrichedTweet[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [displayCount, setDisplayCount] = useState(10); // Start with only 10 tweets
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true); // Show loading state while waiting for first posts
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ [MONITOR] Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('post:new', (tweet: EnrichedTweet) => {
      console.log('📊 [MONITOR] New post:', tweet?.author?.username);
      if (tweet && tweet.id) {
        setTweets(prev => [tweet, ...prev].slice(0, 50));
        setIsLoading(false);
      }
    });

    socketInstance.on('posts:bulk', (bulkTweets: EnrichedTweet[]) => {
      console.log('📦 [MONITOR] Bulk posts received:', bulkTweets?.length || 0);
      if (Array.isArray(bulkTweets) && bulkTweets.length > 0) {
        // Limit initial bulk load to prevent UI overload
        const limitedTweets = bulkTweets.slice(0, 50);
        setTweets([...limitedTweets].reverse());
        setIsLoading(false);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Reset display count when filter changes
  useEffect(() => {
    setDisplayCount(10);
  }, [filter]);

  const filteredTweets = tweets.filter(tweet => {
    if (filter === 'all') return true;
    return tweet.sentiment === filter;
  });

  // Only display a limited number of tweets to prevent UI overload
  const displayedTweets = filteredTweets.slice(0, displayCount);
  const hasMore = filteredTweets.length > displayCount;

  const loadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + 10, filteredTweets.length));
      setIsLoading(false);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* X-style sticky header */}
      <header className="sticky top-0 z-10 border-b border-[#2F3336] bg-black/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-[#E7E9EA]">Monitor</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#16181C]">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00BA7C] animate-pulse' : 'bg-[#F4212E]'}`} />
              <span className="text-[13px] text-[#71767B]">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#16181C]">
              <span className="text-[13px] text-[#E7E9EA] font-medium">{filteredTweets.length}</span>
              <span className="text-[13px] text-[#71767B] ml-1">posts</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4">

      {/* X-style Filter Tabs */}
      <div className="flex border-b border-[#2F3336] mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-4 text-[15px] font-medium transition-colors relative ${
            filter === 'all' ? 'text-[#E7E9EA]' : 'text-[#71767B] hover:bg-[#080808]'
          }`}
        >
          All
          {filter === 'all' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-[#1D9BF0]" />}
        </button>
        <button
          onClick={() => setFilter('positive')}
          className={`flex-1 py-4 text-[15px] font-medium transition-colors relative ${
            filter === 'positive' ? 'text-[#E7E9EA]' : 'text-[#71767B] hover:bg-[#080808]'
          }`}
        >
          Positive
          {filter === 'positive' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-[#00BA7C]" />}
        </button>
        <button
          onClick={() => setFilter('negative')}
          className={`flex-1 py-4 text-[15px] font-medium transition-colors relative ${
            filter === 'negative' ? 'text-[#E7E9EA]' : 'text-[#71767B] hover:bg-[#080808]'
          }`}
        >
          Negative
          {filter === 'negative' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-[#F4212E]" />}
        </button>
        <button
          onClick={() => setFilter('neutral')}
          className={`flex-1 py-4 text-[15px] font-medium transition-colors relative ${
            filter === 'neutral' ? 'text-[#E7E9EA]' : 'text-[#71767B] hover:bg-[#080808]'
          }`}
        >
          Neutral
          {filter === 'neutral' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-[#1D9BF0]" />}
        </button>
      </div>

      {/* Tweet Stream */}
      <div className="space-y-4">
        {/* Loading State - Beautiful Vortex */}
        {isLoading && filteredTweets.length === 0 ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <VortexLoader message="Connecting to X API..." stage="Waiting for real-time posts..." />
          </div>
        ) : filteredTweets.length === 0 ? (
          <div className="p-12 rounded-xl bg-x-gray-dark border border-x-gray-border text-center">
            <div className="flex flex-col items-center gap-4">
              <svg className="w-16 h-16 text-x-gray-text opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div>
                <p className="text-x-gray-text text-lg mb-2">
                  {isConnected ? 'Waiting for posts...' : 'Connecting to backend...'}
                </p>
                <p className="text-x-gray-text text-sm">
                  {isConnected ? 'Real-time posts will appear here' : 'Please wait while we establish connection'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {displayedTweets.map((tweet) => (
              <EnrichedTweetCard key={tweet.id} post={tweet} />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-full bg-pulse-blue text-x-white font-medium hover:bg-pulse-blue/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    `Load More (${filteredTweets.length - displayCount} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
}
