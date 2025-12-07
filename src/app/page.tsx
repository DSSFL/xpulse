import VitalCard from '@/components/VitalCard';
import TopicCard from '@/components/TopicCard';
import EKGLine from '@/components/EKGLine';
import SentimentGauge from '@/components/SentimentGauge';
import VelocityMeter from '@/components/VelocityMeter';

// Mock data for demonstration - B2B use cases
const mockTopics = [
  {
    topic: 'Your Brand Name',
    tweetCount: 8420,
    velocity: 47,
    sentiment: 0.62,
    status: 'stable' as const,
    category: 'Brand Monitor',
  },
  {
    topic: 'Competitor A',
    tweetCount: 12300,
    velocity: 89,
    sentiment: -0.15,
    status: 'growing' as const,
    category: 'Competitor Intel',
  },
  {
    topic: 'Industry Crisis',
    tweetCount: 45000,
    velocity: 234,
    sentiment: -0.67,
    status: 'viral' as const,
    category: 'Crisis Watch',
  },
  {
    topic: '$TICKER',
    tweetCount: 23400,
    velocity: 156,
    sentiment: 0.34,
    status: 'growing' as const,
    category: 'Market Signal',
  },
];

export default function Home() {
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
              <div className="w-2 h-2 rounded-full bg-vital-healthy animate-pulse" />
              <span className="text-sm text-x-gray-text">Live</span>
            </div>
            <span className="text-x-gray-text text-sm">
              Last updated: <span className="text-x-white">Just now</span>
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
            <div className="w-3 h-3 rounded-full bg-vital-healthy status-pulse" />
            <span className="text-x-gray-text text-sm uppercase tracking-wider">Global Monitoring Active</span>
          </div>
          <h2 className="text-4xl font-bold gradient-text mb-2">
            All Systems Nominal
          </h2>
          <p className="text-x-gray-text">
            Monitoring 847K active narratives across X
          </p>
          <div className="flex gap-8 mt-6">
            <div>
              <p className="text-vital-healthy text-2xl font-bold">0</p>
              <p className="text-x-gray-text text-sm">critical threats</p>
            </div>
            <div>
              <p className="text-vital-warning text-2xl font-bold">3</p>
              <p className="text-x-gray-text text-sm">emerging risks</p>
            </div>
            <div>
              <p className="text-vital-neutral text-2xl font-bold">~4h</p>
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
            value="127"
            unit="mentions/min"
            status="healthy"
            trend="stable"
            subtitle="Speed of negative narrative spread"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />

          <VitalCard
            title="Sentiment Pressure"
            value="68/32"
            unit="pos/neg"
            status="neutral"
            trend="stable"
            subtitle="Building tension before eruption"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />

          <VitalCard
            title="Virality Risk"
            value="34"
            unit="/ 100"
            status="warning"
            trend="up"
            subtitle="Likelihood of mainstream pickup"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            }
          />

          <VitalCard
            title="Authenticity Score"
            value="91"
            unit="%"
            status="healthy"
            trend="stable"
            subtitle="Real users vs bots/coordinated"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />

          <VitalCard
            title="Narrative Coherence"
            value="Low"
            unit=""
            status="healthy"
            trend="stable"
            subtitle="Unified story forming? Not yet."
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
          />

          <VitalCard
            title="Response Window"
            value="~6h"
            unit="remaining"
            status="neutral"
            trend="stable"
            subtitle="Time before mainstream media pickup"
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
            <SentimentGauge value={24} label="Current Narrative Sentiment" size="lg" />
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
                  <div className="h-full bg-vital-healthy rounded-full" style={{ width: '65%' }} />
                </div>
                <span className="text-x-white font-medium">65%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-x-gray-text">Media-Driven</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-x-gray-light rounded-full overflow-hidden">
                  <div className="h-full bg-vital-neutral rounded-full" style={{ width: '20%' }} />
                </div>
                <span className="text-x-white font-medium">20%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-x-gray-text">Influencer-Driven</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-x-gray-light rounded-full overflow-hidden">
                  <div className="h-full bg-pulse-purple rounded-full" style={{ width: '10%' }} />
                </div>
                <span className="text-x-white font-medium">10%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-x-gray-text">Coordinated/Astroturf</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-x-gray-light rounded-full overflow-hidden">
                  <div className="h-full bg-vital-critical rounded-full" style={{ width: '5%' }} />
                </div>
                <span className="text-x-white font-medium">5%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Monitors */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-x-white flex items-center gap-2">
            <svg className="w-5 h-5 text-pulse-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Active Monitors
          </h2>
          <button className="px-4 py-2 rounded-full bg-x-blue text-white text-sm font-medium hover:bg-x-blue/90 transition-colors">
            + Add Monitor
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockTopics.map((topic) => (
            <TopicCard key={topic.topic} {...topic} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-x-gray-border">
        <div className="flex items-center justify-between text-x-gray-text text-sm">
          <p>XPulse - Real-time Narrative Intelligence</p>
          <p>xpulse.buzz</p>
        </div>
      </footer>
    </div>
  );
}
