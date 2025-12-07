'use client';

import { useState, useEffect, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

const geoUrl = 'https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json';

interface HotspotData {
  id: string;
  name: string;
  coordinates: [number, number];
  tweets: number;
  retweets: number;
  quotes: number;
  hashtags: number;
  sentiment: number;
}

// Initial hotspot data - will be populated with real data from backend
const initialHotspots: HotspotData[] = [];

type MetricType = 'tweets' | 'retweets' | 'quotes' | 'hashtags';

const GlobalHeatMap = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('tweets');
  const [hoveredHotspot, setHoveredHotspot] = useState<HotspotData | null>(null);
  const [hotspots, setHotspots] = useState<HotspotData[]>(initialHotspots);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1,
  });

  // TODO: Connect to backend WebSocket to get real geographic data
  // For now, map is hidden until real data is available
  useEffect(() => {
    // Will be replaced with real backend data stream
  }, []);

  const getMaxValue = () => Math.max(...hotspots.map(h => h[selectedMetric]));

  const getMarkerSize = (value: number) => {
    const max = getMaxValue();
    const intensity = value / max;
    return 4 + intensity * 16;
  };

  const getMarkerOpacity = (value: number) => {
    const max = getMaxValue();
    return 0.4 + (value / max) * 0.6;
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
        {metrics.map(metric => (
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

      {/* Map Container */}
      <div className="relative w-full h-[450px] rounded-lg overflow-hidden border border-x-gray-border">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 140,
          }}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1D9BF0', // X blue for water
          }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={({ coordinates, zoom }) => setPosition({ coordinates: coordinates as [number, number], zoom })}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#2d5a47" // Light green for land
                    stroke="#2F3336" // Border color
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#3d7a5f', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Hotspot Markers */}
            {hotspots.map(hotspot => {
              const size = getMarkerSize(hotspot[selectedMetric]);
              const opacity = getMarkerOpacity(hotspot[selectedMetric]);
              return (
                <Marker
                  key={hotspot.id}
                  coordinates={hotspot.coordinates}
                  onMouseEnter={() => setHoveredHotspot(hotspot)}
                  onMouseLeave={() => setHoveredHotspot(null)}
                >
                  {/* Pulse animation ring */}
                  <circle
                    r={size + 4}
                    fill="#1D9BF0"
                    opacity={0.2}
                    className="animate-ping"
                    style={{ transformOrigin: 'center', animationDuration: '2s' }}
                  />
                  {/* Main marker */}
                  <circle
                    r={size}
                    fill="#1D9BF0"
                    opacity={opacity}
                    stroke="#fff"
                    strokeWidth={1}
                    style={{
                      cursor: 'pointer',
                      filter: `drop-shadow(0 0 ${size}px rgba(29, 155, 240, 0.5))`,
                    }}
                  />
                  {/* Sentiment indicator */}
                  <circle
                    r={3}
                    fill={getSentimentColor(hotspot.sentiment)}
                    stroke="#000"
                    strokeWidth={0.5}
                  />
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Hover Tooltip */}
        {hoveredHotspot && (
          <div className="absolute top-4 right-4 p-4 bg-x-gray-dark/95 border border-x-gray-border rounded-lg shadow-lg min-w-[220px] backdrop-blur-sm">
            <h4 className="text-x-white font-semibold mb-3 flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSentimentColor(hoveredHotspot.sentiment) }}
              />
              {hoveredHotspot.name}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-x-gray-text">Tweets</span>
                <span className="text-x-white font-medium">{formatNumber(hoveredHotspot.tweets)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-x-gray-text">Retweets</span>
                <span className="text-x-white font-medium">{formatNumber(hoveredHotspot.retweets)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-x-gray-text">Quotes</span>
                <span className="text-x-white font-medium">{formatNumber(hoveredHotspot.quotes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-x-gray-text">Hashtags</span>
                <span className="text-x-white font-medium">{formatNumber(hoveredHotspot.hashtags)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-x-gray-border">
                <span className="text-x-gray-text">Sentiment</span>
                <span
                  className="font-medium"
                  style={{ color: getSentimentColor(hoveredHotspot.sentiment) }}
                >
                  {hoveredHotspot.sentiment > 0 ? '+' : ''}
                  {(hoveredHotspot.sentiment * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2">
          <button
            onClick={() => setPosition(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.5, 8) }))}
            className="w-8 h-8 rounded bg-x-gray-dark/90 border border-x-gray-border text-x-white hover:bg-x-gray-light transition-colors flex items-center justify-center"
          >
            +
          </button>
          <button
            onClick={() => setPosition(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.5, 1) }))}
            className="w-8 h-8 rounded bg-x-gray-dark/90 border border-x-gray-border text-x-white hover:bg-x-gray-light transition-colors flex items-center justify-center"
          >
            -
          </button>
          <button
            onClick={() => setPosition({ coordinates: [0, 20], zoom: 1 })}
            className="w-8 h-8 rounded bg-x-gray-dark/90 border border-x-gray-border text-x-white hover:bg-x-gray-light transition-colors flex items-center justify-center text-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 p-3 bg-x-gray-dark/90 border border-x-gray-border rounded-lg backdrop-blur-sm">
          <p className="text-xs text-x-gray-text mb-2">Sentiment</p>
          <div className="flex flex-col gap-1 text-[10px]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-vital-healthy" />
              <span className="text-x-gray-text">Positive (&gt;30%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pulse-blue" />
              <span className="text-x-gray-text">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-vital-warning" />
              <span className="text-x-gray-text">Mixed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-vital-critical" />
              <span className="text-x-gray-text">Negative (&lt;-30%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hotspot Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
        {hotspots.slice(0, 6).map(hotspot => (
          <div
            key={hotspot.id}
            className="p-3 rounded-lg bg-x-gray-light border border-x-gray-border hover:border-x-blue transition-colors cursor-pointer"
            onMouseEnter={() => setHoveredHotspot(hotspot)}
            onMouseLeave={() => setHoveredHotspot(null)}
          >
            <p className="text-x-gray-text text-xs truncate">{hotspot.name}</p>
            <p className="text-x-white font-bold text-lg">{formatNumber(hotspot[selectedMetric])}</p>
            <div className="flex items-center gap-1 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSentimentColor(hotspot.sentiment) }}
              />
              <span className="text-[10px] text-x-gray-text">
                {hotspot.sentiment > 0 ? '+' : ''}
                {(hotspot.sentiment * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(GlobalHeatMap);
