'use client';
// Force rebuild with production URL - v2
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import VitalCard from '@/components/VitalCard';
import EKGLine from '@/components/EKGLine';
import SentimentGauge from '@/components/SentimentGauge';
import GlobalHeatMap from '@/components/GlobalHeatMap';
import ErrorBoundary from '@/components/ErrorBoundary';
import ThreatDetailsModal from '@/components/ThreatDetailsModal';

interface Metrics {
  postsPerMinute: number;
  totalPosts: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  velocity: number;
  // Enhanced threat vitals from backend
  viralityRisk?: number;
  authenticityScore?: number;
  narrativeCoherence?: string;
  responseWindow?: number;
  engagementRate?: number;
  coordinatedActivity?: number;
  topHashtags?: Array<{ tag: string; count: number }>;
  topKeywords?: Array<{ word: string; count: number }>;
}

interface Post {
  id: string;
  text: string;
  author: string | { username: string; name: string; [key: string]: unknown };
  created_at: string;
}

export default function LiveDashboard() {
  const [, setSocket] = useState<Socket | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    postsPerMinute: 0,
    totalPosts: 0,
    sentiment: { positive: 0, neutral: 0, negative: 0 },
    velocity: 0
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<'velocity' | 'sentiment' | 'virality' | 'authenticity' | 'coordination' | 'narrative'>('velocity');

  useEffect(() => {
    // Connect to backend WebSocket - Use env var or hardcoded production URL
    const backendUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://api.xpulse.buzz';

    console.log('🔌 [XPULSE] Connecting to backend:', backendUrl);
    console.log('🔌 [XPULSE] socket.io available:', typeof io);

    try {
      const socketInstance = io(backendUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      socketInstance.on('connect', () => {
        console.log('✅ [XPULSE] Connected to backend - Socket ID:', socketInstance.id);
        setIsConnected(true);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('❌ [XPULSE] Disconnected from backend. Reason:', reason);
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('❌ [XPULSE] Connection error:', error.message, error);
        setIsConnected(false);
      });

      socketInstance.on('error', (error) => {
        console.error('❌ [XPULSE] Socket error:', error);
      });

      socketInstance.on('metrics:update', (data: Metrics) => {
        if (data && typeof data === 'object') {
          setMetrics(data);
          setLastUpdate(new Date().toLocaleTimeString());
        }
      });

      socketInstance.on('tweet:new', (post: Post) => {
        if (post && post.id) {
          setRecentPosts(prev => [post, ...prev].slice(0, 10));
        }
      });

      setSocket(socketInstance);

      return () => {
        console.log('🔌 [XPULSE] Cleaning up socket connection');
        socketInstance.disconnect();
      };
    } catch (error) {
      console.error('❌ [XPULSE] Failed to initialize socket:', error);
      setIsConnected(false);
    }
  }, []);

  // Calculate sentiment percentage with safe defaults
  const totalSentiment = (metrics?.sentiment?.positive || 0) + (metrics?.sentiment?.neutral || 0) + (metrics?.sentiment?.negative || 0);
  const rawSentimentScore = totalSentiment > 0
    ? (((metrics?.sentiment?.positive || 0) - (metrics?.sentiment?.negative || 0)) / totalSentiment) * 100
    : 0;
  const sentimentScore = (typeof rawSentimentScore === 'number' && !isNaN(rawSentimentScore)) ? rawSentimentScore : 0;

  // Use enriched metrics from backend or fallbacks
  const viralityRisk = metrics?.viralityRisk ?? Math.min(Math.floor((metrics?.velocity || 0) / 3), 100);
  const authenticityScore = metrics?.authenticityScore ?? (totalSentiment > 0
    ? Math.min(100, Math.round(((metrics?.sentiment?.neutral || 0) / totalSentiment) * 100))
    : 0);
  const narrativeCoherence = metrics?.narrativeCoherence ?? ((metrics?.velocity || 0) > 150 ? "high" : (metrics?.velocity || 0) > 50 ? "medium" : "low");
  const responseWindow = metrics?.responseWindow ?? Math.max(1, Math.floor(6 - (metrics?.velocity || 0) / 50));

  // Calculate origin percentages - use coordinatedActivity from backend
  const coordinatedPct = metrics?.coordinatedActivity ?? 0;
  const originData = {
    organic: Math.max(0, 70 - coordinatedPct),
    media: Math.min(20, Math.round((metrics?.engagementRate ?? 20) / 4)),
    influencer: Math.min(15, Math.round(viralityRisk / 5)),
    coordinated: coordinatedPct
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-x-white">
              Intelligence Dashboard
            </h1>
            <p className="text-x-gray-text text-sm mt-1">
              Real-time narrative intelligence powered by X
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-x-gray-dark border border-x-gray-border">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-vital-healthy animate-pulse' : 'bg-vital-critical'}`} />
              <span className="text-sm text-x-gray-text">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            <span className="text-x-gray-text text-sm">
              Last updated: <span className="text-x-white">{lastUpdate}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main EKG Banner */}
      <section className="mb-8 p-6 rounded-2xl bg-x-gray-dark border border-x-gray-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <EKGLine color="#1D9BF0" height={200} speed={1.5} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-vital-healthy' : 'bg-vital-critical'} status-pulse`} />
            <span className="text-x-gray-text text-sm uppercase tracking-wider">Global Monitoring {isConnected ? 'Active' : 'Offline'}</span>
          </div>
          <h2 className="text-4xl font-bold gradient-text mb-2">
            {(metrics?.totalPosts || 0) > 0 ? (metrics?.totalPosts || 0).toLocaleString() : 'All Systems Nominal'}
          </h2>
          <p className="text-x-gray-text">
            {(metrics?.totalPosts || 0) > 0 ? 'posts tracked since start' : 'Monitoring active narratives across X'}
          </p>
          <div className="flex gap-8 mt-6">
            <div>
              <p className="text-vital-healthy text-2xl font-bold">{(metrics?.sentiment?.negative || 0) > 50 ? (metrics?.sentiment?.negative || 0) : 0}</p>
              <p className="text-x-gray-text text-sm">critical threats</p>
            </div>
            <div>
              <p className="text-vital-warning text-2xl font-bold">{(metrics?.sentiment?.negative || 0) > 0 ? Math.min((metrics?.sentiment?.negative || 0), 10) : 3}</p>
              <p className="text-x-gray-text text-sm">emerging risks</p>
            </div>
            <div>
              <p className="text-vital-neutral text-2xl font-bold">~{responseWindow.toFixed(1)}h</p>
              <p className="text-x-gray-text text-sm">avg response window</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vitals Grid */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-x-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-pulse-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12h3l2-4 3 8 2-4h3.5" />
          </svg>
          Threat Vitals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VitalCard
            title="Threat Velocity"
            value={(metrics.postsPerMinute || 0).toString()}
            unit="mentions/min"
            status={(metrics.postsPerMinute || 0) > 100 ? "warning" : "healthy"}
            trend={(metrics.postsPerMinute || 0) > 50 ? "up" : "stable"}
            subtitle="Speed of negative narrative spread"
            onClick={() => {
              setSelectedThreat('velocity');
              setModalOpen(true);
            }}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />

          <VitalCard
            title="Sentiment Pressure"
            value={`${metrics?.sentiment?.positive || 68}/${metrics?.sentiment?.negative || 32}`}
            unit="pos/neg"
            status={(metrics?.sentiment?.negative || 0) > (metrics?.sentiment?.positive || 0) ? "warning" : "neutral"}
            trend="stable"
            subtitle="Building tension before eruption"
            onClick={() => {
              setSelectedThreat('sentiment');
              setModalOpen(true);
            }}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />

          <VitalCard
            title="Virality Risk"
            value={viralityRisk.toString()}
            unit="/ 100"
            status={viralityRisk > 75 ? "critical" : viralityRisk > 50 ? "warning" : "neutral"}
            trend={viralityRisk > 60 ? "up" : "stable"}
            subtitle="Likelihood of mainstream pickup"
            onClick={() => {
              setSelectedThreat('virality');
              setModalOpen(true);
            }}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            }
          />

          <VitalCard
            title="Authenticity Score"
            value={authenticityScore.toString()}
            unit="%"
            status={authenticityScore > 80 ? "healthy" : authenticityScore > 50 ? "warning" : "critical"}
            trend="stable"
            subtitle="Real users vs bots/coordinated"
            onClick={() => {
              setSelectedThreat('authenticity');
              setModalOpen(true);
            }}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />

          <VitalCard
            title="Narrative Coherence"
            value={narrativeCoherence.charAt(0).toUpperCase() + narrativeCoherence.slice(1)}
            unit=""
            status={narrativeCoherence === "high" ? "critical" : narrativeCoherence === "medium" ? "warning" : "healthy"}
            trend={narrativeCoherence === "high" ? "up" : "stable"}
            subtitle="Unified story forming?"
            onClick={() => {
              setSelectedThreat('narrative');
              setModalOpen(true);
            }}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
          />

          <VitalCard
            title="Response Window"
            value={`~${responseWindow.toFixed(1)}h`}
            unit="remaining"
            status={responseWindow < 2 ? "critical" : responseWindow < 4 ? "warning" : "neutral"}
            trend={responseWindow < 3 ? "down" : "stable"}
            subtitle="Time before mainstream media pickup"
            onClick={() => {
              setSelectedThreat('coordination');
              setModalOpen(true);
            }}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Sentiment & Origin Analysis Section */}
      <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-x-gray-dark border border-x-gray-border">
          <h3 className="text-lg font-semibold text-x-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-pulse-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Sentiment Analysis
          </h3>
          <div className="flex justify-center">
            <ErrorBoundary>
              <SentimentGauge value={sentimentScore || 24} label="Current Narrative Sentiment" size="lg" />
            </ErrorBoundary>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-x-gray-dark border border-x-gray-border">
          <h3 className="text-lg font-semibold text-x-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-pulse-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Origin Classification
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-x-gray-text">Organic/Grassroots</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-x-gray-light rounded-full overflow-hidden">
                  <div className="h-full bg-vital-healthy rounded-full" style={{ width: `${originData.organic}%` }} />
                </div>
                <span className="text-x-white font-medium">{originData.organic}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-x-gray-text">Media-Driven</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-x-gray-light rounded-full overflow-hidden">
                  <div className="h-full bg-vital-neutral rounded-full" style={{ width: `${originData.media}%` }} />
                </div>
                <span className="text-x-white font-medium">{originData.media}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-x-gray-text">Influencer-Driven</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-x-gray-light rounded-full overflow-hidden">
                  <div className="h-full bg-pulse-purple rounded-full" style={{ width: `${originData.influencer}%` }} />
                </div>
                <span className="text-x-white font-medium">{originData.influencer}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-x-gray-text">Coordinated/Astroturf</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-x-gray-light rounded-full overflow-hidden">
                  <div className="h-full bg-vital-critical rounded-full" style={{ width: `${originData.coordinated}%` }} />
                </div>
                <span className="text-x-white font-medium">{originData.coordinated}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Heat Map */}
      <section className="mb-8">
        <ErrorBoundary>
          <GlobalHeatMap />
        </ErrorBoundary>
      </section>

      {/* Live Post Stream */}
      <section>
        <h2 className="text-lg font-semibold text-x-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-pulse-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Live Post Stream
        </h2>
        <div className="space-y-3">
          {recentPosts.length === 0 ? (
            <div className="p-6 rounded-xl bg-x-gray-dark border border-x-gray-border text-center text-x-gray-text">
              Waiting for posts... Connect to backend to see live data.
            </div>
          ) : (
            recentPosts.map((post) => (
              <div key={post.id} className="p-4 rounded-xl bg-x-gray-dark border border-x-gray-border hover:border-x-blue transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-x-white font-semibold">@{typeof post.author === 'string' ? post.author : post.author?.username || 'Unknown'}</span>
                      <span className="text-x-gray-text text-xs">
                        {new Date(post.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-x-gray-text text-sm">{post.text}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-x-gray-border">
        <div className="flex items-center justify-between text-x-gray-text text-sm">
          <p>XPulse - Real-time Narrative Intelligence</p>
          <p>xpulse.buzz</p>
        </div>
      </footer>

      {/* Threat Details Modal */}
      <ThreatDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        threatType={selectedThreat}
        posts={recentPosts}
        metrics={metrics}
      />
    </div>
  );
}
