'use client';

import { useState } from 'react';

interface GeoMetrics {
  topCountries: Array<{
    country: string;
    count: number;
    positive: number;
    neutral: number;
    negative: number;
    sentiment_score: number;
  }>;
  topRegions: Array<{
    region: string;
    country: string;
    country_code: string;
    count: number;
    positive: number;
    neutral: number;
    negative: number;
    sentiment_score: number;
  }>;
  geoDistribution: Record<string, number>;
  geoSentiment: Record<string, number>;
}

interface GeographicAttackMapProps {
  metrics: GeoMetrics;
}

export default function GeographicAttackMap({ metrics }: GeographicAttackMapProps) {
  const [activeTab, setActiveTab] = useState<'countries' | 'regions'>('countries');

  const getSentimentColor = (score: number) => {
    const numScore = parseFloat(score.toString());
    if (numScore > 0.3) return 'text-vital-healthy';
    if (numScore < -0.3) return 'text-vital-critical';
    return 'text-vital-warning';
  };

  const getSentimentBg = (score: number) => {
    const numScore = parseFloat(score.toString());
    if (numScore > 0.3) return 'bg-vital-healthy/20';
    if (numScore < -0.3) return 'bg-vital-critical/20';
    return 'bg-vital-warning/20';
  };

  const getSentimentLabel = (score: number) => {
    const numScore = parseFloat(score.toString());
    if (numScore > 0.3) return 'Positive';
    if (numScore < -0.3) return 'Negative';
    return 'Mixed';
  };

  return (
    <div className="bg-x-gray-dark border border-x-gray-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-vital-neutral">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-x-gray-text text-sm font-medium uppercase tracking-wider">
            Geographic Attack Origin
          </h3>
        </div>
        <div className="flex gap-1 bg-x-gray-border/30 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('countries')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              activeTab === 'countries'
                ? 'bg-vital-neutral text-black'
                : 'text-x-gray-text hover:text-white'
            }`}
          >
            Countries
          </button>
          <button
            onClick={() => setActiveTab('regions')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              activeTab === 'regions'
                ? 'bg-vital-neutral text-black'
                : 'text-x-gray-text hover:text-white'
            }`}
          >
            Regions
          </button>
        </div>
      </div>

      {/* Countries Tab */}
      {activeTab === 'countries' && (
        <div className="space-y-2">
          {metrics.topCountries.length === 0 && (
            <div className="text-center py-8 text-x-gray-text text-sm">
              No geographic data available yet. Posts with location enabled will appear here.
            </div>
          )}
          {metrics.topCountries.map((country, idx) => (
            <div
              key={country.country}
              className="flex items-center gap-3 p-3 bg-x-gray-border/20 rounded-lg hover:bg-x-gray-border/30 transition-all"
            >
              {/* Rank */}
              <div className="w-6 text-center text-sm font-bold text-vital-neutral">
                #{idx + 1}
              </div>

              {/* Country name and flag emoji (if available) */}
              <div className="flex-1">
                <div className="font-medium text-white">{country.country}</div>
                <div className="text-xs text-x-gray-text mt-0.5">
                  {country.count} posts
                </div>
              </div>

              {/* Sentiment breakdown */}
              <div className="flex gap-2 text-xs">
                <span className="text-vital-healthy">+{country.positive}</span>
                <span className="text-x-gray-text">{country.neutral}</span>
                <span className="text-vital-critical">-{country.negative}</span>
              </div>

              {/* Sentiment score */}
              <div className={`px-3 py-1.5 rounded-full ${getSentimentBg(country.sentiment_score)} ${getSentimentColor(country.sentiment_score)} text-xs font-bold`}>
                {getSentimentLabel(country.sentiment_score)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regions Tab */}
      {activeTab === 'regions' && (
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {metrics.topRegions.length === 0 && (
            <div className="text-center py-8 text-x-gray-text text-sm">
              No regional data available yet. Posts with location enabled will appear here.
            </div>
          )}
          {metrics.topRegions.map((region, idx) => (
            <div
              key={`${region.region}-${idx}`}
              className="flex items-center gap-3 p-3 bg-x-gray-border/20 rounded-lg hover:bg-x-gray-border/30 transition-all"
            >
              {/* Rank */}
              <div className="w-6 text-center text-sm font-bold text-vital-neutral">
                #{idx + 1}
              </div>

              {/* Region name */}
              <div className="flex-1">
                <div className="font-medium text-white text-sm">{region.region}</div>
                <div className="text-xs text-x-gray-text mt-0.5">
                  {region.country} • {region.count} posts
                </div>
              </div>

              {/* Sentiment breakdown */}
              <div className="flex gap-2 text-xs">
                <span className="text-vital-healthy">+{region.positive}</span>
                <span className="text-x-gray-text">{region.neutral}</span>
                <span className="text-vital-critical">-{region.negative}</span>
              </div>

              {/* Sentiment score */}
              <div className={`px-3 py-1.5 rounded-full ${getSentimentBg(region.sentiment_score)} ${getSentimentColor(region.sentiment_score)} text-xs font-bold whitespace-nowrap`}>
                {getSentimentLabel(region.sentiment_score)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-x-gray-border">
        <div className="flex items-center gap-4 text-xs text-x-gray-text">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-vital-healthy"></div>
            <span>Positive Sentiment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-vital-warning"></div>
            <span>Mixed Sentiment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-vital-critical"></div>
            <span>Negative Sentiment</span>
          </div>
        </div>
      </div>
    </div>
  );
}
