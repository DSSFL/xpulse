'use client';

import Link from 'next/link';

export const dynamic = 'force-dynamic';

const xpulseFeatures = [
  {
    title: 'Celebrities',
    description: 'Monitor mentions, sentiment, and emerging narratives about you across X in real-time.',
  },
  {
    title: 'Influencers',
    description: 'Track your brand perception, audience sentiment, and competitor mentions instantly.',
  },
  {
    title: 'Candidates',
    description: 'Stay ahead of political narratives and voter sentiment during campaigns.',
  },
  {
    title: 'Public Figures',
    description: 'Protect your reputation with early warning systems for emerging threats.',
  },
];

const enterpriseFeatures = [
  {
    title: 'Private Sector',
    description: 'Enterprise-grade threat intelligence for brand protection, crisis management, and competitive analysis.',
  },
  {
    title: 'Government',
    description: 'Real-time monitoring of public sentiment, policy discussions, and emerging issues affecting constituents.',
  },
  {
    title: 'Law Enforcement',
    description: 'Track emerging threats, coordinated campaigns, and potential security incidents in real-time.',
  },
  {
    title: 'Intelligence Agencies',
    description: 'Advanced narrative tracking, influence operation detection, and geopolitical threat assessment.',
  },
];

export default function GetXPulsePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-[#2F3336] px-4 py-4 sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-bold text-[#E7E9EA]">Get XPulse</h1>
      </div>

      <div className="max-w-[600px] mx-auto">
        {/* Hero Section */}
        <div className="px-4 py-8 border-b border-[#2F3336]">
          <div className="flex items-center justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/xpulse-logo.png"
              alt="XPulse"
              className="h-12 w-auto"
            />
          </div>
          <h2 className="text-[31px] font-bold text-[#E7E9EA] text-center mb-3">
            Real-Time Narrative Intelligence
          </h2>
          <p className="text-[#71767B] text-[15px] text-center">
            Powered by Grok AI. Built for X. Know what&apos;s being said about you before it trends.
          </p>
        </div>

        {/* XPulse Section */}
        <div className="border-b border-[#2F3336]">
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1D9BF0] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#E7E9EA]">XPulse</h3>
              <p className="text-[13px] text-[#71767B]">For individuals who matter</p>
            </div>
          </div>

          {xpulseFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`px-4 py-4 hover:bg-[#080808] transition-colors cursor-pointer ${
                index !== xpulseFeatures.length - 1 ? '' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#16181C] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1D9BF0] font-bold text-[15px]">{index + 1}</span>
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-[#E7E9EA] mb-1">{feature.title}</h4>
                  <p className="text-[15px] text-[#71767B] leading-5">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="px-4 py-4">
            <Link
              href="/"
              className="block w-full py-3 rounded-full bg-[#E7E9EA] text-black font-bold text-[15px] text-center hover:bg-[#D7D9DB] transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>

        {/* XPulse Enterprise Section */}
        <div className="border-b border-[#2F3336]">
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00BA7C] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#E7E9EA]">XPulse Enterprise</h3>
              <p className="text-[13px] text-[#71767B]">Mission-critical intelligence at scale</p>
            </div>
          </div>

          {enterpriseFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="px-4 py-4 hover:bg-[#080808] transition-colors cursor-pointer"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#16181C] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#00BA7C] font-bold text-[15px]">{index + 1}</span>
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-[#E7E9EA] mb-1">{feature.title}</h4>
                  <p className="text-[15px] text-[#71767B] leading-5">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="px-4 py-4">
            <button className="w-full py-3 rounded-full bg-transparent border border-[#536471] text-[#00BA7C] font-bold text-[15px] hover:bg-[#00BA7C]/10 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>

        {/* Why XPulse */}
        <div className="px-4 py-6">
          <h3 className="text-[17px] font-bold text-[#E7E9EA] mb-4">Why XPulse?</h3>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#16181C] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#1D9BF0]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-[#E7E9EA]">Real-Time</h4>
                <p className="text-[15px] text-[#71767B]">Instant alerts when narratives emerge. Be first to know, first to respond.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#16181C] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#1D9BF0]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-[#E7E9EA]">Grok-Powered</h4>
                <p className="text-[15px] text-[#71767B]">Native X intelligence. Grok understands context, sarcasm, and nuance.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#16181C] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#1D9BF0]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-[#E7E9EA]">Secure</h4>
                <p className="text-[15px] text-[#71767B]">Enterprise-grade security. Your data stays yours.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 py-6 border-t border-[#2F3336]">
          <p className="text-[#71767B] text-[15px] text-center mb-4">
            Ready to take control of your narrative?
          </p>
          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-3 rounded-full bg-[#E7E9EA] text-black font-bold text-[15px] text-center hover:bg-[#D7D9DB] transition-colors"
            >
              Get Started
            </Link>
            <button className="flex-1 py-3 rounded-full bg-transparent border border-[#536471] text-[#E7E9EA] font-bold text-[15px] hover:bg-[#181818] transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
