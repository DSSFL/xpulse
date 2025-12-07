'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { EnrichedTweet } from '@/types/tweet';

// Types
export interface UserInfo {
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

export interface Analysis {
  summary: string;
  timestamp: string;
}

interface TrackedUserContextType {
  // State
  trackedHandle: string | null;
  userInfo: UserInfo | null;
  tweets: EnrichedTweet[];
  analysis: Analysis | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;

  // Actions
  setTrackedUser: (handle: string) => void;
  clearTrackedUser: () => void;
}

// Create context
const TrackedUserContext = createContext<TrackedUserContextType | undefined>(undefined);

// Provider component
export function TrackedUserProvider({ children }: { children: ReactNode }) {
  const [trackedHandle, setTrackedHandle] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tweets, setTweets] = useState<EnrichedTweet[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize socket connection when tracked handle changes
  useEffect(() => {
    if (!trackedHandle) {
      // No user tracked, disconnect if connected
      if (socket) {
        console.log('🔌 [CONTEXT] Disconnecting socket...');
        socket.emit('monitor:stop');
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Start tracking the user
    console.log(`🎯 [CONTEXT] Tracking user: @${trackedHandle}`);
    setIsLoading(true);
    setError(null);

    const backendUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://api.xpulse.buzz';
    console.log('🔌 [CONTEXT] Connecting to backend:', backendUrl);

    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Socket event handlers
    socketInstance.on('connect', () => {
      console.log('✅ [CONTEXT] Connected to backend');
      setIsConnected(true);

      // Start monitoring
      socketInstance.emit('monitor:start', { username: trackedHandle });
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ [CONTEXT] Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('monitor:started', (data: { username: string }) => {
      console.log('✅ [CONTEXT] Monitoring started for:', data.username);
    });

    // User info
    socketInstance.on('monitor:user-info', (data: { user: UserInfo }) => {
      console.log('👤 [CONTEXT] User info received:', data.user);
      setUserInfo(data.user);
      setIsLoading(false);
    });

    // Activity/tweets
    socketInstance.on('monitor:activity', (data: { activities: EnrichedTweet[] }) => {
      console.log(`📊 [CONTEXT] Received ${data.activities.length} activities`);
      setTweets(prev => {
        const combined = [...data.activities, ...prev];
        // Remove duplicates
        const unique = combined.filter((tweet, index, self) =>
          index === self.findIndex((t) => t.id === tweet.id)
        );
        // Sort by created_at descending
        unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return unique.slice(0, 100); // Keep max 100 tweets
      });
      setIsLoading(false);
    });

    // AI Analysis
    socketInstance.on('monitor:analysis', (data: { analysis: Analysis, metrics: Record<string, unknown>, timestamp: string }) => {
      console.log('🤖 [CONTEXT] AI analysis received');
      setAnalysis({
        summary: data.analysis.summary,
        timestamp: data.timestamp
      });
    });

    // Error handling
    socketInstance.on('monitor:error', (data: { message: string }) => {
      console.error('❌ [CONTEXT] Error:', data.message);
      setError(data.message);
      setIsLoading(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount or when handle changes
    return () => {
      console.log('🧹 [CONTEXT] Cleaning up socket connection');
      socketInstance.emit('monitor:stop');
      socketInstance.disconnect();
    };
  }, [trackedHandle]);

  // Action: Set tracked user
  const setTrackedUser = useCallback((handle: string) => {
    const cleanHandle = handle.replace('@', '').trim();
    if (cleanHandle === trackedHandle) {
      console.log('⚠️  [CONTEXT] Already tracking this user');
      return;
    }

    console.log(`🔄 [CONTEXT] Switching to track: @${cleanHandle}`);

    // Clear previous data
    setUserInfo(null);
    setTweets([]);
    setAnalysis(null);
    setError(null);

    // Set new handle (this will trigger useEffect)
    setTrackedHandle(cleanHandle);
  }, [trackedHandle]);

  // Action: Clear tracked user
  const clearTrackedUser = useCallback(() => {
    console.log('🗑️  [CONTEXT] Clearing tracked user');
    setTrackedHandle(null);
    setUserInfo(null);
    setTweets([]);
    setAnalysis(null);
    setError(null);
  }, []);

  const value: TrackedUserContextType = {
    trackedHandle,
    userInfo,
    tweets,
    analysis,
    isLoading,
    isConnected,
    error,
    setTrackedUser,
    clearTrackedUser,
  };

  return (
    <TrackedUserContext.Provider value={value}>
      {children}
    </TrackedUserContext.Provider>
  );
}

// Hook to use the context
export function useTrackedUser() {
  const context = useContext(TrackedUserContext);
  if (context === undefined) {
    throw new Error('useTrackedUser must be used within a TrackedUserProvider');
  }
  return context;
}
