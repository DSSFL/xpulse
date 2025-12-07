'use client';

import { useState, useEffect } from 'react';

interface RegionData {
  id: string;
  name: string;
  tweets: number;
  retweets: number;
  quotes: number;
  hashtags: number;
  sentiment: number; // -1 to 1
  coordinates: { x: number; y: number };
}

// Mock data for regions - will be replaced with real X API data
const mockRegions: RegionData[] = [
  { id: 'na', name: 'North America', tweets: 234500, retweets: 89200, quotes: 12300, hashtags: 45600, sentiment: 0.23, coordinates: { x: 22, y: 35 } },
  { id: 'sa', name: 'South America', tweets: 87600, retweets: 34500, quotes: 5600, hashtags: 18900, sentiment: -0.12, coordinates: { x: 30, y: 65 } },
  { id: 'eu', name: 'Europe', tweets: 312000, retweets: 145000, quotes: 23400, hashtags: 67800, sentiment: 0.45, coordinates: { x: 52, y: 30 } },
  { id: 'af', name: 'Africa', tweets: 45600, retweets: 12300, quotes: 2100, hashtags: 8900, sentiment: 0.08, coordinates: { x: 52, y: 55 } },
  { id: 'as', name: 'Asia', tweets: 567000, retweets: 234000, quotes: 45600, hashtags: 123000, sentiment: 0.67, coordinates: { x: 72, y: 40 } },
  { id: 'oc', name: 'Oceania', tweets: 34500, retweets: 12100, quotes: 1800, hashtags: 5600, sentiment: 0.34, coordinates: { x: 85, y: 70 } },
];

type MetricType = 'tweets' | 'retweets' | 'quotes' | 'hashtags';

export default function GlobalHeatMap() {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('tweets');
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);
  const [regions, setRegions] = useState<RegionData[]>(mockRegions);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRegions(prev => prev.map(region => ({
        ...region,
        tweets: region.tweets + Math.floor(Math.random() * 100) - 30,
        retweets: region.retweets + Math.floor(Math.random() * 50) - 15,
        quotes: region.quotes + Math.floor(Math.random() * 20) - 5,
        hashtags: region.hashtags + Math.floor(Math.random() * 30) - 10,
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getMaxValue = () => {
    return Math.max(...regions.map(r => r[selectedMetric]));
  };

  const getIntensity = (value: number) => {
    const max = getMaxValue();
    return value / max;
  };

  const getColor = (intensity: number) => {
    // X blue gradient based on intensity
    if (intensity > 0.8) return '#1D9BF0';
    if (intensity > 0.6) return '#3BABF2';
    if (intensity > 0.4) return '#5BBBF4';
    if (intensity > 0.2) return '#7BCBF6';
    return '#9BDBF8';
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return '#00FF88';
    if (sentiment > 0) return '#1D9BF0';
    if (sentiment > -0.3) return '#FFD700';
    return '#FF3B3B';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const metrics: { key: MetricType; label: string; icon: JSX.Element }[] = [
    {
      key: 'tweets',
      label: 'Tweets',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      key: 'retweets',
      label: 'Retweets',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      key: 'quotes',
      label: 'Quotes',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      key: 'hashtags',
      label: 'Hashtags',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6 rounded-xl bg-x-gray-dark border border-x-gray-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-x-white flex items-center gap-2">
          <svg className="w-5 h-5 text-pulse-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Global Engagement Heat Map
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-vital-healthy animate-pulse" />
          <span className="text-xs text-x-gray-text">Live</span>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex gap-2 mb-6">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            onClick={() => setSelectedMetric(metric.key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors ${
              selectedMetric === metric.key
                ? 'bg-x-blue text-white'
                : 'bg-x-gray-light text-x-gray-text hover:bg-x-gray-border'
            }`}
          >
            {metric.icon}
            {metric.label}
          </button>
        ))}
      </div>

      {/* World Map Container */}
      <div className="relative w-full h-[400px] bg-x-black rounded-lg overflow-hidden border border-x-gray-border">
        {/* Simplified SVG World Map */}
        <svg
          viewBox="0 0 100 60"
          className="w-full h-full"
          style={{ background: '#0F1419' }}
        >
          {/* Grid lines for reference */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1D1F23" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100" height="60" fill="url(#grid)" />

          {/* Simplified continent outlines */}
          {/* North America */}
          <path
            d="M10,15 Q15,10 25,12 L30,18 Q32,25 28,32 L20,35 Q12,32 10,25 Z"
            fill="#2F3336"
            stroke="#3E4144"
            strokeWidth="0.3"
          />
          {/* South America */}
          <path
            d="M22,38 Q28,36 32,42 L30,55 Q25,58 22,55 L20,45 Z"
            fill="#2F3336"
            stroke="#3E4144"
            strokeWidth="0.3"
          />
          {/* Europe */}
          <path
            d="M45,15 Q52,12 58,15 L56,25 Q50,28 45,25 Z"
            fill="#2F3336"
            stroke="#3E4144"
            strokeWidth="0.3"
          />
          {/* Africa */}
          <path
            d="M45,30 Q55,28 58,35 L55,50 Q48,55 45,50 L42,40 Z"
            fill="#2F3336"
            stroke="#3E4144"
            strokeWidth="0.3"
          />
          {/* Asia */}
          <path
            d="M60,12 Q75,8 88,15 L90,30 Q85,38 75,40 L65,35 Q58,28 60,20 Z"
            fill="#2F3336"
            stroke="#3E4144"
            strokeWidth="0.3"
          />
          {/* Oceania */}
          <path
            d="M78,45 Q85,42 90,48 L88,55 Q82,58 78,52 Z"
            fill="#2F3336"
            stroke="#3E4144"
            strokeWidth="0.3"
          />

          {/* Heat map circles for each region */}
          {regions.map((region) => {
            const intensity = getIntensity(region[selectedMetric]);
            const radius = 2 + intensity * 6;
            return (
              <g key={region.id}>
                {/* Outer glow */}
                <circle
                  cx={region.coordinates.x}
                  cy={region.coordinates.y}
                  r={radius + 2}
                  fill={getColor(intensity)}
                  opacity={0.2}
                  className="animate-pulse"
                />
                {/* Main circle */}
                <circle
                  cx={region.coordinates.x}
                  cy={region.coordinates.y}
                  r={radius}
                  fill={getColor(intensity)}
                  opacity={0.8}
                  onMouseEnter={() => setHoveredRegion(region)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className="cursor-pointer transition-all hover:opacity-100"
                  style={{ filter: `drop-shadow(0 0 ${intensity * 10}px ${getColor(intensity)})` }}
                />
                {/* Sentiment indicator dot */}
                <circle
                  cx={region.coordinates.x}
                  cy={region.coordinates.y}
                  r={1.5}
                  fill={getSentimentColor(region.sentiment)}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredRegion && (
          <div className="absolute top-4 right-4 p-4 bg-x-gray-dark border border-x-gray-border rounded-lg shadow-lg min-w-[200px]">
            <h4 className="text-x-white font-semibold mb-3">{hoveredRegion.name}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-x-gray-text">Tweets</span>
                <span className="text-x-white font-medium">{formatNumber(hoveredRegion.tweets)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-x-gray-text">Retweets</span>
                <span className="text-x-white font-medium">{formatNumber(hoveredRegion.retweets)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-x-gray-text">Quotes</span>
                <span className="text-x-white font-medium">{formatNumber(hoveredRegion.quotes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-x-gray-text">Hashtags</span>
                <span className="text-x-white font-medium">{formatNumber(hoveredRegion.hashtags)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-x-gray-border">
                <span className="text-x-gray-text">Sentiment</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getSentimentColor(hoveredRegion.sentiment) }}
                  />
                  <span className="text-x-white font-medium">
                    {hoveredRegion.sentiment > 0 ? '+' : ''}{(hoveredRegion.sentiment * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 p-3 bg-x-gray-dark/90 border border-x-gray-border rounded-lg">
          <p className="text-xs text-x-gray-text mb-2">Engagement Intensity</p>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: '#9BDBF8' }} />
            <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: '#7BCBF6' }} />
            <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: '#5BBBF4' }} />
            <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: '#3BABF2' }} />
            <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: '#1D9BF0' }} />
          </div>
          <div className="flex justify-between text-[10px] text-x-gray-text mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Sentiment Legend */}
        <div className="absolute bottom-4 right-4 p-3 bg-x-gray-dark/90 border border-x-gray-border rounded-lg">
          <p className="text-xs text-x-gray-text mb-2">Sentiment</p>
          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-vital-healthy" />
              <span className="text-x-gray-text">Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-pulse-blue" />
              <span className="text-x-gray-text">Neutral</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-vital-critical" />
              <span className="text-x-gray-text">Negative</span>
            </div>
          </div>
        </div>
      </div>

      {/* Region Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
        {regions.map((region) => (
          <div
            key={region.id}
            className="p-3 rounded-lg bg-x-gray-light border border-x-gray-border hover:border-x-blue transition-colors cursor-pointer"
            onMouseEnter={() => setHoveredRegion(region)}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <p className="text-x-gray-text text-xs truncate">{region.name}</p>
            <p className="text-x-white font-bold text-lg">{formatNumber(region[selectedMetric])}</p>
            <div className="flex items-center gap-1 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSentimentColor(region.sentiment) }}
              />
              <span className="text-[10px] text-x-gray-text">
                {region.sentiment > 0 ? '+' : ''}{(region.sentiment * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
