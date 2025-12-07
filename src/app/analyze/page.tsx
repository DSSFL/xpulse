'use client';

import { useState } from 'react';
import { io } from 'socket.io-client';
import { EnrichedPost } from '@/types/tweet';
import VitalCard from '@/components/VitalCard';
import SentimentGauge from '@/components/SentimentGauge';
import EnrichedTweetCard from '@/components/EnrichedTweetCard';
import VortexLoader from '@/components/VortexLoader';

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

export default function AnalyzePage() {
  const [handle, setHandle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PersonalAnalysis | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<string>('');

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

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-vital-critical';
      case 'high': return 'text-vital-warning';
      case 'medium': return 'text-vital-neutral';
      case 'low': return 'text-vital-healthy';
      default: return 'text-x-gray-text';
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-x-white flex items-center gap-3 mb-2">
          <svg className="w-8 h-8 text-pulse-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Personal Threat Analysis
        </h1>
        <p className="text-x-gray-text">
          Grok-powered AI analysis of your X presence and threat landscape
        </p>
      </header>

      {/* Input Section */}
      <div className="mb-8 p-6 rounded-xl bg-x-gray-dark border border-x-gray-border">
        <label className="block text-x-white font-medium mb-3">Enter X Handle</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-x-gray-text text-lg">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeHandle()}
              placeholder="elonmusk"
              disabled={isAnalyzing}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-x-gray-light border border-x-gray-border text-x-white placeholder-x-gray-text focus:outline-none focus:border-pulse-blue disabled:opacity-50"
            />
          </div>
          <button
            onClick={analyzeHandle}
            disabled={isAnalyzing}
            className="px-8 py-3 rounded-lg bg-pulse-purple text-x-white font-medium hover:bg-pulse-purple/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {progress || 'Analyzing...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Analyze
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-vital-critical text-sm">{error}</p>
        )}
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
          {/* Threat Level Banner */}
          <div className={`mb-8 p-6 rounded-xl border-2 ${
            analysis.analysis.threatLevel === 'critical' ? 'bg-vital-critical/10 border-vital-critical' :
            analysis.analysis.threatLevel === 'high' ? 'bg-vital-warning/10 border-vital-warning' :
            analysis.analysis.threatLevel === 'medium' ? 'bg-vital-neutral/10 border-vital-neutral' :
            'bg-vital-healthy/10 border-vital-healthy'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-x-white mb-2">
                  @{analysis.handle}
                </h2>
                <p className={`text-lg font-semibold ${getThreatColor(analysis.analysis.threatLevel)}`}>
                  Threat Level: {analysis.analysis.threatLevel.toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-x-gray-text text-sm">Total Mentions</p>
                <p className="text-3xl font-bold text-x-white">{analysis.metrics.totalMentions}</p>
              </div>
            </div>
          </div>

          {/* Grok Insights */}
          <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-pulse-purple/20 to-pulse-blue/20 border border-pulse-purple/30">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-pulse-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-xl font-bold text-x-white">Grok AI Insights</h3>
            </div>
            <p className="text-x-white leading-relaxed whitespace-pre-wrap">{analysis.analysis.grokInsights}</p>
          </div>

          {/* Threat Vitals */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-x-white mb-4">Threat Intelligence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <VitalCard
                title="Sentiment Score"
                value={analysis.analysis.sentimentScore.toString()}
                unit="/ 100"
                status={analysis.analysis.sentimentScore < -20 ? "critical" : analysis.analysis.sentimentScore < 0 ? "warning" : "healthy"}
                subtitle="Overall sentiment analysis"
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <VitalCard
                title="Virality Risk"
                value={analysis.analysis.viralityRisk.toString()}
                unit="/ 100"
                status={analysis.analysis.viralityRisk > 75 ? "critical" : analysis.analysis.viralityRisk > 50 ? "warning" : "neutral"}
                subtitle="Potential for viral spread"
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              <VitalCard
                title="Authenticity"
                value={analysis.analysis.authenticityScore.toString()}
                unit="%"
                status={analysis.analysis.authenticityScore > 80 ? "healthy" : analysis.analysis.authenticityScore > 50 ? "warning" : "critical"}
                subtitle="Bot activity detection"
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
              />
            </div>
          </section>

          {/* Sentiment Gauge */}
          <section className="mb-8">
            <div className="p-6 rounded-xl bg-x-gray-dark border border-x-gray-border">
              <h3 className="text-lg font-semibold text-x-white mb-6">Sentiment Analysis</h3>
              <SentimentGauge value={analysis.analysis.sentimentScore} label="Conversation Sentiment" size="lg" />
            </div>
          </section>

          {/* Top Threats */}
          {analysis.analysis.topThreats.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-x-white mb-4">Top Threats Detected</h3>
              <div className="space-y-3">
                {analysis.analysis.topThreats.map((threat, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-x-gray-dark border border-x-gray-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-x-white font-medium">{threat.type}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        threat.severity > 75 ? 'bg-vital-critical/20 text-vital-critical' :
                        threat.severity > 50 ? 'bg-vital-warning/20 text-vital-warning' :
                        'bg-vital-neutral/20 text-vital-neutral'
                      }`}>
                        Severity: {threat.severity}%
                      </span>
                    </div>
                    <p className="text-x-gray-text text-sm">{threat.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {analysis.analysis.recommendations.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-x-white mb-4">AI Recommendations</h3>
              <div className="p-6 rounded-xl bg-x-gray-dark border border-x-gray-border space-y-3">
                {analysis.analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-pulse-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-x-white">{rec}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Posts About User */}
          {analysis.recentPosts.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-x-white mb-4">Recent Posts Mentioning @{analysis.handle}</h3>
              <div className="space-y-4">
                {analysis.recentPosts.map((post) => (
                  <EnrichedTweetCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <div className="text-center py-20">
          <svg className="w-24 h-24 mx-auto mb-6 text-x-gray-text opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-xl font-medium text-x-gray-text mb-2">No Analysis Yet</h3>
          <p className="text-x-gray-text">Enter an X handle above to get started with AI-powered threat analysis</p>
        </div>
      )}
    </div>
  );
}
