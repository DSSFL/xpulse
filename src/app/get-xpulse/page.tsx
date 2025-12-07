'use client';

import Link from 'next/link';

const xpulseFeatures = [
  {
    title: 'Celebrities',
    description: 'Monitor mentions, sentiment, and emerging narratives about you across X in real-time.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    title: 'Influencers',
    description: 'Track your brand perception, audience sentiment, and competitor mentions instantly.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
  {
    title: 'Candidates',
    description: 'Stay ahead of political narratives and voter sentiment during campaigns.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    title: 'Public Figures',
    description: 'Protect your reputation with early warning systems for emerging threats.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
];

const enterpriseFeatures = [
  {
    title: 'Private Sector',
    description: 'Enterprise-grade threat intelligence for brand protection, crisis management, and competitive analysis.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: 'Government',
    description: 'Real-time monitoring of public sentiment, policy discussions, and emerging issues affecting constituents.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    title: 'Law Enforcement',
    description: 'Track emerging threats, coordinated campaigns, and potential security incidents in real-time.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Intelligence Agencies',
    description: 'Advanced narrative tracking, influence operation detection, and geopolitical threat assessment.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function GetXPulsePage() {
  return (
    <div className="min-h-screen p-6">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/xpulse-logo.png"
              alt="XPulse"
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-x-white mb-4">
            Real-Time Narrative Intelligence
          </h1>
          <p className="text-xl text-x-gray-text max-w-3xl mx-auto">
            Powered by Grok AI. Built for X. Know what&apos;s being said about you before it trends.
          </p>
        </div>

        {/* XPulse Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pulse-purple to-pulse-blue flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-x-white">XPulse</h2>
              <p className="text-x-gray-text">For individuals who matter</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {xpulseFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-x-gray-dark border border-x-gray-border rounded-xl p-6 hover:border-pulse-purple/50 transition-all hover:shadow-lg hover:shadow-pulse-purple/10 group"
              >
                <div className="text-pulse-purple mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-x-white mb-2">{feature.title}</h3>
                <p className="text-x-gray-text text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-pulse-purple to-pulse-blue text-white font-bold text-lg hover:shadow-lg hover:shadow-pulse-purple/50 transition-all flex items-center gap-3 group"
            >
              <span>Start Free Trial</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-16">
          <div className="flex-1 h-px bg-x-gray-border"></div>
          <div className="flex items-center gap-2 text-x-gray-text">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div className="flex-1 h-px bg-x-gray-border"></div>
        </div>

        {/* XPulse Enterprise Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pulse-green to-pulse-blue flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-x-white">XPulse Enterprise</h2>
              <p className="text-x-gray-text">Mission-critical intelligence at scale</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {enterpriseFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-x-gray-dark border border-x-gray-border rounded-xl p-6 hover:border-pulse-green/50 transition-all hover:shadow-lg hover:shadow-pulse-green/10 group"
              >
                <div className="text-pulse-green mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-x-white mb-2">{feature.title}</h3>
                <p className="text-x-gray-text text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button className="px-8 py-4 rounded-full bg-x-gray-dark border border-pulse-green text-pulse-green font-bold text-lg hover:bg-pulse-green/10 hover:shadow-lg hover:shadow-pulse-green/20 transition-all flex items-center gap-3 group">
              <span>Contact Sales</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-x-gray-dark border border-x-gray-border rounded-2xl p-8 mb-16">
          <h3 className="text-2xl font-bold text-x-white text-center mb-8">
            Why XPulse?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pulse-purple/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-pulse-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-x-white mb-2">Real-Time</h4>
              <p className="text-x-gray-text text-sm">
                Instant alerts when narratives emerge. Be first to know, first to respond.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pulse-blue/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-pulse-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-x-white mb-2">Grok-Powered</h4>
              <p className="text-x-gray-text text-sm">
                Native X intelligence. Grok understands context, sarcasm, and nuance.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pulse-green/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-pulse-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-x-white mb-2">Secure</h4>
              <p className="text-x-gray-text text-sm">
                Enterprise-grade security. Your data stays yours.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <p className="text-x-gray-text mb-4">
            Ready to take control of your narrative?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-pulse-purple to-pulse-blue text-white font-bold hover:shadow-lg hover:shadow-pulse-purple/50 transition-all"
            >
              Get Started Free
            </Link>
            <button className="px-8 py-4 rounded-full bg-x-gray-dark border border-x-gray-border text-x-white font-bold hover:bg-x-gray-light transition-all">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
