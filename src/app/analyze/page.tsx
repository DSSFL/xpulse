'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { EnrichedPost } from '@/types/tweet';
import EnrichedTweetCard from '@/components/EnrichedTweetCard';
import VortexLoader from '@/components/VortexLoader';
import { useTrackedUser } from '@/contexts/TrackedUserContext';

export const dynamic = 'force-dynamic';

interface PersonalAnalysis {
  handle: string;
  analysis: {
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    sentimentScore: number;
    viralityRisk: number;
    authenticityScore: number;
    narrativeCoherence: string;
    topThreats: Array<{
      type: string;
      severity: number;
      description: string;
    }>;
    grokInsights: string;
    recommendations: string[];
  };
  recentPosts: EnrichedPost[];
  metrics: {
    totalMentions: number;
    sentimentBreakdown: { positive: number; neutral: number; negative: number };
    engagementRate: number;
    botActivityPercentage: number;
  };
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const urlHandle = searchParams.get('handle');

  // Get tracked user from context
  const { trackedHandle } = useTrackedUser();

  // Pre-fill with tracked handle if available, otherwise use URL
  const [handle, setHandle] = useState(urlHandle || trackedHandle || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PersonalAnalysis | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<string>('');

  // Update handle if tracked user changes
  useEffect(() => {
    if (trackedHandle && !handle) {
      setHandle(trackedHandle);
    }
  }, [trackedHandle, handle]);

  const analyzeHandle = async () => {
    if (!handle.trim()) {
      setError('Please enter an X handle');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setProgress('Connecting to X API...');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://api.xpulse.buzz';

      // Connect to backend for real-time analysis
      const socketInstance = io(backendUrl);

      // Progress updates
      setTimeout(() => setProgress('Searching for mentions...'), 500);
      setTimeout(() => setProgress('Analyzing with Grok AI...'), 3000);
      setTimeout(() => setProgress('Generating threat report...'), 8000);

      socketInstance.emit('analyze:user', { handle: handle.replace('@', '') });

      socketInstance.on('analysis:complete', (data: PersonalAnalysis) => {
        console.log('📊 Analysis complete:', data);
        setAnalysis(data);
        setIsAnalyzing(false);
        setProgress('');
        socketInstance.disconnect();
      });

      socketInstance.on('analysis:error', (err: { message: string }) => {
        console.error('❌ Analysis error:', err);
        setError(err.message || 'Failed to analyze handle');
        setIsAnalyzing(false);
        setProgress('');
        socketInstance.disconnect();
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        if (isAnalyzing) {
          setError('Analysis timed out. Please try again.');
          setIsAnalyzing(false);
          setProgress('');
          socketInstance.disconnect();
        }
      }, 15000);

    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to analysis service');
      setIsAnalyzing(false);
    }
  };

  // Auto-trigger analysis if handle is in URL
  useEffect(() => {
    if (urlHandle && !analysis && !isAnalyzing) {
      console.log('🚀 Auto-triggering analysis for:', urlHandle);
      analyzeHandle();
    }
  }, [urlHandle]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-black">
      {/* X-style sticky header */}
      <header className="sticky top-0 z-10 border-b border-[#2F3336] bg-black/80 backdrop-blur-md">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-[#E7E9EA]">Analyze</h1>
        </div>
      </header>

      {/* X-style search section */}
      <div className="border-b border-[#2F3336]">
        <div className="p-4">
          {/* X-style search input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              analyzeHandle();
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
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="Enter username to analyze"
              disabled={isAnalyzing}
              className="w-full bg-[#202327] border border-transparent focus:border-[#1D9BF0] focus:bg-black rounded-full py-3 pl-12 pr-32 text-[#E7E9EA] placeholder-[#71767B] outline-none transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isAnalyzing || !handle.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-[#1D9BF0] text-white text-sm font-bold hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Analyzing</span>
                </>
              ) : (
                'Analyze'
              )}
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-[#71767B]">Try:</span>
            {['elonmusk', 'karpathy', 'sama', 'naval'].map((username) => (
              <button
                key={username}
                onClick={() => {
                  setHandle(username);
                  setTimeout(() => {
                    const event = new Event('submit', { bubbles: true, cancelable: true });
                    document.querySelector('form')?.dispatchEvent(event);
                  }, 100);
                }}
                disabled={isAnalyzing}
                className="px-3 py-1 rounded-full bg-transparent border border-[#2F3336] text-[#1D9BF0] text-sm hover:bg-[#1D9BF0]/10 transition-colors disabled:opacity-50"
              >
                @{username}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-3 text-[#F4212E] text-sm">{error}</p>
          )}
        </div>
      </div>

      {/* Loading State - Beautiful Vortex */}
      {isAnalyzing && (
        <div className="flex items-center justify-center min-h-[500px]">
          <VortexLoader message={progress || 'Connecting to X...'} />
        </div>
      )}

      {/* Analysis Results */}
      {!isAnalyzing && analysis && (
        <>
          {/* User profile header - X style */}
          <div className="border-b border-[#2F3336]">
            {/* Banner with threat level color */}
            <div className={`h-32 ${
              analysis.analysis.threatLevel === 'critical' ? 'bg-gradient-to-r from-[#F4212E]/30 to-[#F4212E]/10' :
              analysis.analysis.threatLevel === 'high' ? 'bg-gradient-to-r from-[#FFD400]/30 to-[#FFD400]/10' :
              analysis.analysis.threatLevel === 'medium' ? 'bg-gradient-to-r from-[#1D9BF0]/30 to-[#1D9BF0]/10' :
              'bg-gradient-to-r from-[#00BA7C]/30 to-[#00BA7C]/10'
            }`} />

            <div className="px-4 pb-4">
              {/* Profile section */}
              <div className="flex justify-between items-start -mt-16 mb-3">
                <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-[#333639] flex items-center justify-center">
                  <span className="text-4xl font-bold text-[#E7E9EA]">
                    {analysis.handle.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="mt-20 flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                    analysis.analysis.threatLevel === 'critical' ? 'bg-[#F4212E]/20 text-[#F4212E]' :
                    analysis.analysis.threatLevel === 'high' ? 'bg-[#FFD400]/20 text-[#FFD400]' :
                    analysis.analysis.threatLevel === 'medium' ? 'bg-[#1D9BF0]/20 text-[#1D9BF0]' :
                    'bg-[#00BA7C]/20 text-[#00BA7C]'
                  }`}>
                    {analysis.analysis.threatLevel.toUpperCase()} THREAT
                  </span>
                </div>
              </div>

              {/* User info */}
              <div className="mb-3">
                <h2 className="text-xl font-extrabold text-[#E7E9EA]">@{analysis.handle}</h2>
                <p className="text-[#71767B] text-sm mt-1">Threat analysis report</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-5 text-sm">
                <div>
                  <span className="font-bold text-[#E7E9EA]">{analysis.metrics.totalMentions.toLocaleString()}</span>
                  <span className="text-[#71767B] ml-1">Mentions</span>
                </div>
                <div>
                  <span className="font-bold text-[#E7E9EA]">{analysis.metrics.engagementRate.toFixed(1)}%</span>
                  <span className="text-[#71767B] ml-1">Engagement</span>
                </div>
                <div>
                  <span className="font-bold text-[#E7E9EA]">{analysis.analysis.authenticityScore}%</span>
                  <span className="text-[#71767B] ml-1">Authenticity</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grok AI Insights - X style */}
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
                <p className="text-[#E7E9EA] text-[15px] leading-5 whitespace-pre-wrap">{analysis.analysis.grokInsights}</p>
              </div>
            </div>
          </div>

          {/* Threat Vitals - X style cards */}
          <div className="px-4 py-4">
            <h3 className="text-lg font-bold text-[#E7E9EA] mb-4">Threat Intelligence</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Sentiment Score */}
              <div className="p-4 rounded-2xl bg-[#16181C] border border-[#2F3336]">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    analysis.analysis.sentimentScore < -20 ? 'bg-[#F4212E]/20' :
                    analysis.analysis.sentimentScore < 0 ? 'bg-[#FFD400]/20' : 'bg-[#00BA7C]/20'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      analysis.analysis.sentimentScore < -20 ? 'text-[#F4212E]' :
                      analysis.analysis.sentimentScore < 0 ? 'text-[#FFD400]' : 'text-[#00BA7C]'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#71767B] text-sm">Sentiment</p>
                    <p className="text-[#E7E9EA] text-xl font-bold">{analysis.analysis.sentimentScore}</p>
                  </div>
                </div>
              </div>

              {/* Virality Risk */}
              <div className="p-4 rounded-2xl bg-[#16181C] border border-[#2F3336]">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    analysis.analysis.viralityRisk > 75 ? 'bg-[#F4212E]/20' :
                    analysis.analysis.viralityRisk > 50 ? 'bg-[#FFD400]/20' : 'bg-[#1D9BF0]/20'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      analysis.analysis.viralityRisk > 75 ? 'text-[#F4212E]' :
                      analysis.analysis.viralityRisk > 50 ? 'text-[#FFD400]' : 'text-[#1D9BF0]'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#71767B] text-sm">Virality Risk</p>
                    <p className="text-[#E7E9EA] text-xl font-bold">{analysis.analysis.viralityRisk}%</p>
                  </div>
                </div>
              </div>

              {/* Authenticity */}
              <div className="p-4 rounded-2xl bg-[#16181C] border border-[#2F3336]">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    analysis.analysis.authenticityScore > 80 ? 'bg-[#00BA7C]/20' :
                    analysis.analysis.authenticityScore > 50 ? 'bg-[#FFD400]/20' : 'bg-[#F4212E]/20'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      analysis.analysis.authenticityScore > 80 ? 'text-[#00BA7C]' :
                      analysis.analysis.authenticityScore > 50 ? 'text-[#FFD400]' : 'text-[#F4212E]'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#71767B] text-sm">Authenticity</p>
                    <p className="text-[#E7E9EA] text-xl font-bold">{analysis.analysis.authenticityScore}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Breakdown - X style */}
          <div className="px-4 py-4 border-b border-[#2F3336]">
            <h3 className="text-lg font-bold text-[#E7E9EA] mb-4">Sentiment Breakdown</h3>
            <div className="flex gap-3">
              <div className="flex-1 p-3 rounded-xl bg-[#00BA7C]/10 border border-[#00BA7C]/30">
                <p className="text-[#00BA7C] text-2xl font-bold">{analysis.metrics.sentimentBreakdown.positive}%</p>
                <p className="text-[#71767B] text-sm">Positive</p>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-[#1D9BF0]/10 border border-[#1D9BF0]/30">
                <p className="text-[#1D9BF0] text-2xl font-bold">{analysis.metrics.sentimentBreakdown.neutral}%</p>
                <p className="text-[#71767B] text-sm">Neutral</p>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-[#F4212E]/10 border border-[#F4212E]/30">
                <p className="text-[#F4212E] text-2xl font-bold">{analysis.metrics.sentimentBreakdown.negative}%</p>
                <p className="text-[#71767B] text-sm">Negative</p>
              </div>
            </div>
          </div>

          {/* Top Threats - X style */}
          {analysis.analysis.topThreats.length > 0 && (
            <div className="px-4 py-4 border-b border-[#2F3336]">
              <h3 className="text-lg font-bold text-[#E7E9EA] mb-4">Threats Detected</h3>
              <div className="space-y-3">
                {analysis.analysis.topThreats.map((threat, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#16181C] border border-[#2F3336]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#E7E9EA] font-bold">{threat.type}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        threat.severity > 75 ? 'bg-[#F4212E]/20 text-[#F4212E]' :
                        threat.severity > 50 ? 'bg-[#FFD400]/20 text-[#FFD400]' :
                        'bg-[#1D9BF0]/20 text-[#1D9BF0]'
                      }`}>
                        {threat.severity}%
                      </span>
                    </div>
                    <p className="text-[#71767B] text-sm">{threat.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations - X style */}
          {analysis.analysis.recommendations.length > 0 && (
            <div className="px-4 py-4 border-b border-[#2F3336]">
              <h3 className="text-lg font-bold text-[#E7E9EA] mb-4">Recommendations</h3>
              <div className="space-y-3">
                {analysis.analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#16181C] border border-[#2F3336]">
                    <div className="w-6 h-6 rounded-full bg-[#00BA7C]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-[#00BA7C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-[#E7E9EA] text-[15px]">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Posts About User */}
          {analysis.recentPosts.length > 0 && (
            <div className="px-4 py-4">
              <h3 className="text-lg font-bold text-[#E7E9EA] mb-4">Recent Mentions</h3>
              <div>
                {analysis.recentPosts.map((post) => (
                  <EnrichedTweetCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State - X style */}
      {!analysis && !isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#16181C] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#71767B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#E7E9EA] mb-2">Ready to Analyze</h3>
          <p className="text-[#71767B] max-w-sm">Enter an X handle above to get AI-powered threat analysis and reputation insights</p>
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><VortexLoader message="Loading analysis..." /></div>}>
      <AnalyzeContent />
    </Suspense>
  );
}
