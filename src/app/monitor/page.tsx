'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { EnrichedTweet } from '@/types/tweet';
import EnrichedTweetCard from '@/components/EnrichedTweetCard';
import VortexLoader from '@/components/VortexLoader';

export const dynamic = 'force-dynamic';

interface UserInfo {
  id: string;
  username: string;
  name: string;
  verified: boolean;
  profile_image_url?: string;
  description: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
}

interface Analysis {
  summary: string;
  timestamp: string;
}

function MonitorContent() {
  const searchParams = useSearchParams();
  const handle = searchParams.get('handle');

  const [tweets, setTweets] = useState<EnrichedTweet[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Filter states - both available for user-specific mode
  const [activityFilter, setActivityFilter] = useState<'all' | 'mention' | 'reply' | 'own_post'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://api.xpulse.buzz';
    console.log('🔌 [MONITOR] Connecting to backend:', backendUrl);

    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('✅ [MONITOR] Connected to backend');
      setIsConnected(true);
      setIsLoading(true);

      // If handle is provided, start user-specific monitoring
      if (handle) {
        console.log(`🎯 [MONITOR] Starting monitoring for @${handle}`);
        socketInstance.emit('monitor:start', { username: handle.replace('@', '') });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ [MONITOR] Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('monitor:started', (data: { username: string }) => {
      console.log('✅ [MONITOR] Monitoring started for:', data.username);
    });

    // User-specific monitoring events
    socketInstance.on('monitor:user-info', (data: { user: UserInfo }) => {
      console.log('👤 [MONITOR] User info received:', data.user);
      setUserInfo(data.user);
      setIsLoading(false);
      setIsAnalysisLoading(true); // Start loading analysis
    });

    socketInstance.on('monitor:activity', (data: { activities: EnrichedTweet[] }) => {
      console.log(`📊 [MONITOR] Received ${data.activities.length} activities`);
      setTweets(prev => {
        const combined = [...data.activities, ...prev];
        // Remove duplicates based on ID
        const unique = combined.filter((tweet, index, self) =>
          index === self.findIndex((t) => t.id === tweet.id)
        );
        // Sort by created_at descending
        unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return unique.slice(0, 100); // Keep max 100 tweets
      });
      setIsLoading(false);
    });

    // General post stream events (ONLY when no handle provided)
    if (!handle) {
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
          const limitedTweets = bulkTweets.slice(0, 50);
          setTweets([...limitedTweets].reverse());
          setIsLoading(false);
        }
      });
    }

    socketInstance.on('monitor:analysis', (data: { analysis: Analysis, metrics: Record<string, unknown>, timestamp: string }) => {
      console.log('🤖 [MONITOR] AI analysis received');
      setAnalysis({
        summary: data.analysis.summary,
        timestamp: data.timestamp
      });
      setIsAnalysisLoading(false); // Stop loading when analysis arrives
    });

    socketInstance.on('monitor:error', (data: { message: string }) => {
      console.error('❌ [MONITOR] Error:', data.message);
      setError(data.message);
      setIsLoading(false);
    });

    // Handle metrics refresh response
    socketInstance.on('posts:metrics-updated', (updatedPosts: Array<{ id: string; public_metrics: EnrichedTweet['public_metrics'] }>) => {
      console.log('📊 [MONITOR] Metrics updated for', updatedPosts.length, 'posts');
      setTweets(prev => prev.map(tweet => {
        const updated = updatedPosts.find(p => p.id === tweet.id);
        if (updated) {
          return { ...tweet, public_metrics: updated.public_metrics };
        }
        return tweet;
      }));
      setIsRefreshing(false);
    });

    return () => {
      socketInstance.emit('monitor:stop');
      socketInstance.disconnect();
    };
  }, [handle]);

  // Reset display count when filter changes
  useEffect(() => {
    setDisplayCount(10);
  }, [activityFilter, sentimentFilter]);

  // Refresh engagement metrics for all displayed posts
  const handleRefreshMetrics = useCallback(() => {
    if (!socketRef.current || !isConnected || tweets.length === 0 || isRefreshing) return;

    setIsRefreshing(true);
    const postIds = tweets.map(t => t.id);
    console.log('🔄 [MONITOR] Requesting metrics refresh for', postIds.length, 'posts');
    socketRef.current.emit('posts:refresh-metrics', { postIds });
  }, [isConnected, tweets, isRefreshing]);

  if (error) {
    return (
      <div className="min-h-screen p-6 lg:p-8 flex items-center justify-center">
        <div className="p-8 rounded-xl bg-x-gray-dark border border-vital-critical">
          <h2 className="text-xl font-bold text-vital-critical mb-2">Error</h2>
          <p className="text-x-gray-text">{error}</p>
        </div>
      </div>
    );
  }

  // Enhanced filter system
  const filteredTweets = tweets.filter(tweet => {
    if (handle) {
      // User-specific mode: filter by BOTH activity type AND sentiment
      const matchesActivity = activityFilter === 'all' || tweet.activityType === activityFilter;
      const matchesSentiment = sentimentFilter === 'all' || tweet.sentiment === sentimentFilter;
      return matchesActivity && matchesSentiment;
    } else {
      // General mode: filter by sentiment only
      if (sentimentFilter === 'all') return true;
      return tweet.sentiment === sentimentFilter;
    }
  });

  const displayedTweets = filteredTweets.slice(0, displayCount);
  const hasMore = filteredTweets.length > displayCount;

  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 10, filteredTweets.length));
  };

  // Count by activity type (user-specific mode only)
  const activityCounts = handle ? {
    all: tweets.length,
    mention: tweets.filter(t => t.activityType === 'mention').length,
    reply: tweets.filter(t => t.activityType === 'reply').length,
    own_post: tweets.filter(t => t.activityType === 'own_post').length
  } : {};

  // Count by sentiment (both modes)
  const sentimentCounts = {
    all: tweets.length,
    positive: tweets.filter(t => t.sentiment === 'positive').length,
    negative: tweets.filter(t => t.sentiment === 'negative').length,
    neutral: tweets.filter(t => t.sentiment === 'neutral').length
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-x-white flex items-center gap-3">
              <svg className="w-7 h-7 text-pulse-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {handle ? (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                )}
              </svg>
              {handle ? 'User Activity Monitor' : 'Live Post Monitor'}
            </h1>
            <p className="text-x-gray-text text-sm mt-1">
              {handle
                ? `Monitoring @${handle} for mentions, replies, and posts`
                : 'Real-time enriched post stream with full X API data'
              }
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-x-gray-dark border border-x-gray-border">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-vital-healthy animate-pulse' : 'bg-vital-critical'}`} />
              <span className="text-sm text-x-gray-text">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-x-gray-dark border border-x-gray-border">
              <span className="text-sm text-x-white font-medium">{filteredTweets.length}</span>
              <span className="text-sm text-x-gray-text ml-1">activities</span>
            </div>
            {/* Refresh Metrics Button */}
            <button
              onClick={handleRefreshMetrics}
              disabled={!isConnected || tweets.length === 0 || isRefreshing}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                isRefreshing
                  ? 'bg-pulse-blue/20 border-pulse-blue text-pulse-blue'
                  : 'bg-x-gray-dark border-x-gray-border text-x-gray-text hover:border-pulse-blue hover:text-pulse-blue'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Refresh engagement metrics"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm font-medium">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* User Selector - Show when no handle is provided */}
        {!handle && (
          <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-pulse-purple/10 to-pulse-blue/10 border border-pulse-blue/30">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-pulse-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-x-white">Monitor Specific User</h3>
            </div>
            <p className="text-x-gray-text text-sm mb-4">
              Enter a X username to monitor their activity, mentions, replies, and posts with AI-powered analysis
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (usernameInput.trim()) {
                  window.location.href = `/monitor?handle=${usernameInput.replace('@', '')}`;
                }
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter username (e.g., elonmusk)"
                className="flex-1 px-4 py-3 rounded-lg bg-x-gray-dark border border-x-gray-border text-x-white placeholder-x-gray-text focus:outline-none focus:border-pulse-blue transition-colors"
              />
              <button
                type="submit"
                disabled={!usernameInput.trim()}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-pulse-purple to-pulse-blue text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Monitoring
              </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs text-x-gray-text">Quick start:</span>
              {['elonmusk', 'karpathy', 'sama', 'naval'].map((username) => (
                <button
                  key={username}
                  onClick={() => window.location.href = `/monitor?handle=${username}`}
                  className="px-3 py-1 rounded-full bg-x-gray-dark border border-x-gray-border text-x-gray-text text-xs hover:border-pulse-blue hover:text-pulse-blue transition-colors"
                >
                  @{username}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Info Card */}
        {userInfo && (
          <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-pulse-purple/10 to-pulse-blue/10 border border-pulse-blue/30">
            <div className="flex items-center gap-4">
              {userInfo.profile_image_url && (
                <img
                  src={userInfo.profile_image_url}
                  alt={userInfo.name}
                  className="w-16 h-16 rounded-full border-2 border-pulse-blue"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-x-white">{userInfo.name}</h2>
                  {userInfo.verified && (
                    <svg className="w-5 h-5 text-pulse-blue" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <p className="text-x-gray-text">@{userInfo.username}</p>
                {userInfo.description && (
                  <p className="text-x-white text-sm mt-2">{userInfo.description}</p>
                )}
                <div className="flex items-center gap-6 mt-3 text-sm">
                  <div>
                    <span className="text-x-white font-semibold">{userInfo.followers_count.toLocaleString()}</span>
                    <span className="text-x-gray-text ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="text-x-white font-semibold">{userInfo.following_count.toLocaleString()}</span>
                    <span className="text-x-gray-text ml-1">Following</span>
                  </div>
                  <div>
                    <span className="text-x-white font-semibold">{userInfo.tweet_count.toLocaleString()}</span>
                    <span className="text-x-gray-text ml-1">Posts</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/monitor'}
                className="px-4 py-2 rounded-lg bg-x-gray-dark border border-x-gray-border text-x-gray-text text-sm hover:border-pulse-blue hover:text-pulse-blue transition-colors"
              >
                Change User
              </button>
            </div>
          </div>
        )}
      </header>

      {/* AI Analysis */}
      {(analysis || (isAnalysisLoading && handle)) && (
        <div className="mb-6">
          <div className="p-6 rounded-xl bg-gradient-to-br from-pulse-purple/20 to-pulse-blue/20 border border-pulse-purple/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pulse-purple to-pulse-blue flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-x-white">Grok AI Analysis</h3>
                <p className="text-sm text-x-gray-text">Real-time intelligence on @{handle}&apos;s activity</p>
              </div>
            </div>

            {isAnalysisLoading && !analysis ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-5 h-5 border-2 border-pulse-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-x-gray-text text-sm">Analyzing activity with Grok AI...</p>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-x-gray-dark/50 rounded animate-pulse" />
                  <div className="h-4 bg-x-gray-dark/50 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-x-gray-dark/50 rounded animate-pulse w-4/5" />
                  <div className="h-4 bg-x-gray-dark/50 rounded animate-pulse w-full" />
                  <div className="h-4 bg-x-gray-dark/50 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ) : (
              <>
                <p className="text-x-white leading-relaxed whitespace-pre-wrap">{analysis?.summary}</p>
                <p className="text-xs text-x-gray-text mt-4">
                  Last updated: {analysis && new Date(analysis.timestamp).toLocaleTimeString()}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs - Enhanced System */}
      {handle ? (
        // User-specific mode: Activity type filters + Sentiment filters
        <div className="space-y-3 mb-6">
          <div>
            <p className="text-xs text-x-gray-text uppercase tracking-wide mb-2">Activity Type</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActivityFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activityFilter === 'all'
                    ? 'bg-pulse-blue text-x-white'
                    : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
                }`}
              >
                All Activity ({activityCounts.all})
              </button>
              <button
                onClick={() => setActivityFilter('mention')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activityFilter === 'mention'
                    ? 'bg-vital-healthy text-x-white'
                    : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
                }`}
              >
                Mentions ({activityCounts.mention})
              </button>
              <button
                onClick={() => setActivityFilter('reply')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activityFilter === 'reply'
                    ? 'bg-vital-neutral text-x-white'
                    : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
                }`}
              >
                Replies ({activityCounts.reply})
              </button>
              <button
                onClick={() => setActivityFilter('own_post')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activityFilter === 'own_post'
                    ? 'bg-pulse-purple text-x-white'
                    : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
                }`}
              >
                Own Posts ({activityCounts.own_post})
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-x-gray-text uppercase tracking-wide mb-2">Sentiment</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSentimentFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  sentimentFilter === 'all'
                    ? 'bg-pulse-blue text-x-white'
                    : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
                }`}
              >
                All Sentiments ({sentimentCounts.all})
              </button>
              <button
                onClick={() => setSentimentFilter('positive')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  sentimentFilter === 'positive'
                    ? 'bg-vital-healthy text-x-white'
                    : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
                }`}
              >
                Positive ({sentimentCounts.positive})
              </button>
              <button
                onClick={() => setSentimentFilter('neutral')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  sentimentFilter === 'neutral'
                    ? 'bg-vital-neutral text-x-white'
                    : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
                }`}
              >
                Neutral ({sentimentCounts.neutral})
              </button>
              <button
                onClick={() => setSentimentFilter('negative')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  sentimentFilter === 'negative'
                    ? 'bg-vital-critical text-x-white'
                    : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
                }`}
              >
                Negative ({sentimentCounts.negative})
              </button>
            </div>
          </div>
        </div>
      ) : (
        // General mode: Sentiment filters only
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSentimentFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sentimentFilter === 'all'
                  ? 'bg-pulse-blue text-x-white'
                  : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
              }`}
            >
              All Posts ({sentimentCounts.all})
            </button>
            <button
              onClick={() => setSentimentFilter('positive')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sentimentFilter === 'positive'
                  ? 'bg-vital-healthy text-x-white'
                  : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
              }`}
            >
              Positive ({sentimentCounts.positive})
            </button>
            <button
              onClick={() => setSentimentFilter('neutral')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sentimentFilter === 'neutral'
                  ? 'bg-vital-neutral text-x-white'
                  : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
              }`}
            >
              Neutral ({sentimentCounts.neutral})
            </button>
            <button
              onClick={() => setSentimentFilter('negative')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sentimentFilter === 'negative'
                  ? 'bg-vital-critical text-x-white'
                  : 'bg-x-gray-dark text-x-gray-text hover:bg-x-gray-light'
              }`}
            >
              Negative ({sentimentCounts.negative})
            </button>
          </div>
        </div>
      )}

      {/* Activity Stream */}
      <div className="space-y-4">
        {isLoading && tweets.length === 0 ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <VortexLoader
              message="Connecting to X API..."
              stage={handle ? `Monitoring @${handle}...` : 'Loading live posts...'}
            />
          </div>
        ) : filteredTweets.length === 0 ? (
          <div className="p-12 rounded-xl bg-x-gray-dark border border-x-gray-border text-center">
            <div className="flex flex-col items-center gap-4">
              <svg className="w-16 h-16 text-x-gray-text opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div>
                <p className="text-x-gray-text text-lg mb-2">
                  {isConnected ? 'Waiting for activity...' : 'Connecting to backend...'}
                </p>
                <p className="text-x-gray-text text-sm">
                  {isConnected
                    ? (handle ? `Monitoring @${handle} for mentions, replies, and posts` : 'Waiting for live posts from X API')
                    : 'Please wait while we establish connection'
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {displayedTweets.map((tweet) => (
              <div key={tweet.id} className="relative">
                {/* Activity Type Badge - Only show in user-specific mode */}
                {handle && tweet.activityType && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tweet.activityType === 'mention' ? 'bg-vital-healthy text-white' :
                      tweet.activityType === 'reply' ? 'bg-vital-neutral text-white' :
                      tweet.activityType === 'own_post' ? 'bg-pulse-purple text-white' :
                      'bg-x-gray-light text-x-gray-text'
                    }`}>
                      {tweet.activityType === 'mention' ? '@ Mention' :
                       tweet.activityType === 'reply' ? '💬 Reply' :
                       tweet.activityType === 'own_post' ? '✍️ Own Post' :
                       tweet.activityType}
                    </span>
                  </div>
                )}
                <EnrichedTweetCard post={tweet} />
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 rounded-full bg-pulse-blue text-x-white font-medium hover:bg-pulse-blue/80 transition-colors"
                >
                  Load More ({filteredTweets.length - displayCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MonitorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><VortexLoader message="Loading monitor..." /></div>}>
      <MonitorContent />
    </Suspense>
  );
}
