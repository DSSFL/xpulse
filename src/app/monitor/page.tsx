'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { EnrichedTweet } from '@/types/tweet';
import EnrichedTweetCard from '@/components/EnrichedTweetCard';
import VortexLoader from '@/components/VortexLoader';
import Image from 'next/image';

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
  const [activityFilter, setActivityFilter] = useState<'all' | 'mention' | 'reply' | 'own_post'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
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

    socketInstance.on('monitor:user-info', (data: { user: UserInfo }) => {
      console.log('👤 [MONITOR] User info received:', data.user);
      setUserInfo(data.user);
      setIsLoading(false);
      setIsAnalysisLoading(true);
    });

    socketInstance.on('monitor:activity', (data: { activities: EnrichedTweet[] }) => {
      console.log(`📊 [MONITOR] Received ${data.activities.length} activities`);
      setTweets(prev => {
        const combined = [...data.activities, ...prev];
        const unique = combined.filter((tweet, index, self) =>
          index === self.findIndex((t) => t.id === tweet.id)
        );
        unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return unique.slice(0, 100);
      });
      setIsLoading(false);
    });

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
      setIsAnalysisLoading(false);
    });

    socketInstance.on('monitor:error', (data: { message: string }) => {
      console.error('❌ [MONITOR] Error:', data.message);
      setError(data.message);
      setIsLoading(false);
    });

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

  useEffect(() => {
    setDisplayCount(10);
  }, [activityFilter, sentimentFilter]);

  const handleRefreshMetrics = useCallback(() => {
    if (!socketRef.current || !isConnected || tweets.length === 0 || isRefreshing) return;

    setIsRefreshing(true);
    const postIds = tweets.map(t => t.id);
    console.log('🔄 [MONITOR] Requesting metrics refresh for', postIds.length, 'posts');
    socketRef.current.emit('posts:refresh-metrics', { postIds });
  }, [isConnected, tweets, isRefreshing]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="p-6 border border-[#F4212E]/50 bg-[#F4212E]/10 rounded-2xl max-w-md">
          <h2 className="text-xl font-bold text-[#F4212E] mb-2">Error</h2>
          <p className="text-[#71767B]">{error}</p>
        </div>
      </div>
    );
  }

  const filteredTweets = tweets.filter(tweet => {
    if (handle) {
      const matchesActivity = activityFilter === 'all' || tweet.activityType === activityFilter;
      const matchesSentiment = sentimentFilter === 'all' || tweet.sentiment === sentimentFilter;
      return matchesActivity && matchesSentiment;
    } else {
      if (sentimentFilter === 'all') return true;
      return tweet.sentiment === sentimentFilter;
    }
  });

  const displayedTweets = filteredTweets.slice(0, displayCount);
  const hasMore = filteredTweets.length > displayCount;

  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 10, filteredTweets.length));
  };


  return (
    <div className="min-h-screen bg-black">
      {/* X-style sticky header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-[#2F3336]">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#E7E9EA]">Monitor</h1>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#16181C] border border-[#2F3336]">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00BA7C] animate-pulse' : 'bg-[#F4212E]'}`} />
              <span className="text-sm text-[#71767B]">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            {/* Post count */}
            <div className="px-3 py-1.5 rounded-full bg-[#16181C] border border-[#2F3336]">
              <span className="text-sm font-medium text-[#E7E9EA]">{filteredTweets.length}</span>
              <span className="text-sm text-[#71767B] ml-1">posts</span>
            </div>
            {/* Refresh button */}
            <button
              onClick={handleRefreshMetrics}
              disabled={!isConnected || tweets.length === 0 || isRefreshing}
              className={`p-2 rounded-full transition-colors ${
                isRefreshing
                  ? 'bg-[#1D9BF0]/20 text-[#1D9BF0]'
                  : 'hover:bg-[#1D9BF0]/10 text-[#71767B] hover:text-[#1D9BF0]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Refresh metrics"
            >
              <svg
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
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
            </button>
          </div>
        </div>

        {/* X-style tab filters */}
        <div className="flex border-b border-[#2F3336]">
          {(['all', 'positive', 'negative', 'neutral'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSentimentFilter(filter)}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                sentimentFilter === filter
                  ? 'text-[#E7E9EA]'
                  : 'text-[#71767B] hover:bg-[#E7E9EA]/5'
              }`}
            >
              <span className="capitalize">{filter === 'all' ? 'All' : filter}</span>
              {sentimentFilter === filter && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1D9BF0] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search section - when no handle */}
      {!handle && (
        <div className="border-b border-[#2F3336]">
          <div className="p-4">
            {/* X-style search input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (usernameInput.trim()) {
                  window.location.href = `/monitor?handle=${usernameInput.replace('@', '')}`;
                }
              }}
              className="relative"
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-[#71767B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Search for a user to monitor"
                className="w-full bg-[#202327] border border-transparent focus:border-[#1D9BF0] focus:bg-black rounded-full py-3 pl-12 pr-4 text-[#E7E9EA] placeholder-[#71767B] outline-none transition-colors"
              />
            </form>

            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-[#71767B]">Try:</span>
              {['elonmusk', 'karpathy', 'sama', 'naval'].map((username) => (
                <button
                  key={username}
                  onClick={() => window.location.href = `/monitor?handle=${username}`}
                  className="px-3 py-1 rounded-full bg-transparent border border-[#2F3336] text-[#1D9BF0] text-sm hover:bg-[#1D9BF0]/10 transition-colors"
                >
                  @{username}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User profile header - X style */}
      {userInfo && (
        <div className="border-b border-[#2F3336]">
          {/* Banner placeholder */}
          <div className="h-32 bg-[#333639]" />

          <div className="px-4 pb-4">
            {/* Profile image - overlapping banner */}
            <div className="flex justify-between items-start -mt-16 mb-3">
              <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-[#333639]">
                {!profileImageError && userInfo.profile_image_url ? (
                  <Image
                    src={userInfo.profile_image_url.replace('_normal', '_400x400')}
                    alt={userInfo.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    unoptimized
                    onError={() => setProfileImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-[#E7E9EA]">
                      {userInfo.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => window.location.href = '/monitor'}
                className="mt-20 px-4 py-1.5 rounded-full border border-[#536471] text-[#E7E9EA] text-sm font-bold hover:bg-[#E7E9EA]/10 transition-colors"
              >
                Change
              </button>
            </div>

            {/* User info */}
            <div className="mb-3">
              <div className="flex items-center gap-1">
                <h2 className="text-xl font-extrabold text-[#E7E9EA]">{userInfo.name}</h2>
                {userInfo.verified && (
                  <svg className="w-5 h-5 text-[#1D9BF0]" viewBox="0 0 22 22" fill="currentColor">
                    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                  </svg>
                )}
              </div>
              <p className="text-[#71767B]">@{userInfo.username}</p>
            </div>

            {userInfo.description && (
              <p className="text-[#E7E9EA] text-[15px] mb-3 leading-5">{userInfo.description}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-5 text-sm">
              <div>
                <span className="font-bold text-[#E7E9EA]">{userInfo.following_count.toLocaleString()}</span>
                <span className="text-[#71767B] ml-1">Following</span>
              </div>
              <div>
                <span className="font-bold text-[#E7E9EA]">{userInfo.followers_count.toLocaleString()}</span>
                <span className="text-[#71767B] ml-1">Followers</span>
              </div>
            </div>
          </div>

          {/* Activity type tabs for user-specific mode */}
          {handle && (
            <div className="flex border-t border-[#2F3336]">
              {(['all', 'mention', 'reply', 'own_post'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                    activityFilter === filter
                      ? 'text-[#E7E9EA]'
                      : 'text-[#71767B] hover:bg-[#E7E9EA]/5'
                  }`}
                >
                  <span>
                    {filter === 'all' ? 'All' :
                     filter === 'mention' ? 'Mentions' :
                     filter === 'reply' ? 'Replies' :
                     'Posts'}
                  </span>
                  {activityFilter === filter && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1D9BF0] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Analysis - X style */}
      {(analysis || (isAnalysisLoading && handle)) && (
        <div className="border-b border-[#2F3336] px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#1D9BF0] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[#E7E9EA]">Grok AI</span>
                <svg className="w-5 h-5 text-[#1D9BF0]" viewBox="0 0 22 22" fill="currentColor">
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                </svg>
                <span className="text-[#71767B]">@grok</span>
              </div>

              {isAnalysisLoading && !analysis ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#71767B] text-sm">
                    <div className="w-4 h-4 border-2 border-[#1D9BF0] border-t-transparent rounded-full animate-spin" />
                    Analyzing @{handle}&apos;s activity...
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-[#2F3336] rounded animate-pulse" />
                    <div className="h-4 bg-[#2F3336] rounded animate-pulse w-5/6" />
                    <div className="h-4 bg-[#2F3336] rounded animate-pulse w-4/5" />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[#E7E9EA] text-[15px] leading-5 whitespace-pre-wrap">{analysis?.summary}</p>
                  <p className="text-[#71767B] text-xs mt-2">
                    {analysis && new Date(analysis.timestamp).toLocaleTimeString()}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post stream */}
      <div>
        {isLoading && tweets.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <VortexLoader
              message="Connecting to X API..."
              stage={handle ? `Monitoring @${handle}...` : 'Loading live posts...'}
            />
          </div>
        ) : filteredTweets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <svg className="w-12 h-12 text-[#2F3336] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-[#71767B] text-lg">
              {isConnected ? 'Waiting for posts...' : 'Connecting...'}
            </p>
            <p className="text-[#71767B] text-sm mt-1">
              {isConnected
                ? (handle ? `Monitoring @${handle}` : 'Waiting for live posts')
                : 'Establishing connection'
              }
            </p>
          </div>
        ) : (
          <>
            {displayedTweets.map((tweet) => (
              <div key={tweet.id} className="relative">
                {/* Activity badge for user-specific mode */}
                {handle && tweet.activityType && (
                  <div className="absolute top-3 right-4 z-10">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      tweet.activityType === 'mention' ? 'bg-[#00BA7C]/20 text-[#00BA7C]' :
                      tweet.activityType === 'reply' ? 'bg-[#1D9BF0]/20 text-[#1D9BF0]' :
                      tweet.activityType === 'own_post' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' :
                      'bg-[#2F3336] text-[#71767B]'
                    }`}>
                      {tweet.activityType === 'mention' ? 'Mention' :
                       tweet.activityType === 'reply' ? 'Reply' :
                       tweet.activityType === 'own_post' ? 'Post' :
                       tweet.activityType}
                    </span>
                  </div>
                )}
                <EnrichedTweetCard post={tweet} />
              </div>
            ))}

            {/* Load more - X style */}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-4 text-[#1D9BF0] hover:bg-[#1D9BF0]/10 transition-colors border-b border-[#2F3336]"
              >
                Show more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MonitorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><VortexLoader message="Loading monitor..." /></div>}>
      <MonitorContent />
    </Suspense>
  );
}
