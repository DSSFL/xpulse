'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

interface BotFarmMetrics {
  usCountyBotFarms: Array<{
    location: string;
    stateCode: string;
    fullName: string;
    totalPosts: number;
    newAccounts: number;
    veryNewAccounts: number;
    avgAccountAge: number;
    botFarmScore: number;
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
  }>;
  usStateBotFarms: Array<{
    stateCode: string;
    totalPosts: number;
    newAccounts: number;
    veryNewAccounts: number;
    avgAccountAge: number;
    botFarmScore: number;
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
  }>;
  usHeatMapData: Record<string, number>;
}

interface USBotFarmHeatMapProps {
  metrics: BotFarmMetrics;
  handle?: string;
}

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

export default function USBotFarmHeatMap({ metrics, handle }: USBotFarmHeatMapProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Get color based on bot farm score
  const getColor = (stateCode: string) => {
    const score = metrics.usHeatMapData[stateCode] || 0;

    if (score === 0) return '#1a1a1a'; // No data - dark gray
    if (score < 20) return '#16a34a'; // Low risk - green
    if (score < 40) return '#eab308'; // Medium risk - yellow
    if (score < 60) return '#f97316'; // High risk - orange
    return '#ef4444'; // Critical risk - red
  };

  // Get severity label
  const getSeverityLabel = (score: number) => {
    if (score === 0) return 'No Data';
    if (score < 20) return 'Low Risk';
    if (score < 40) return 'Medium Risk';
    if (score < 60) return 'High Risk';
    return 'CRITICAL';
  };

  // Get severity color class
  const getSeverityColor = (score: number) => {
    if (score === 0) return 'text-x-gray-text';
    if (score < 20) return 'text-vital-healthy';
    if (score < 40) return 'text-vital-warning';
    if (score < 60) return 'text-vital-critical';
    return 'text-red-500';
  };

  const MapContent = ({ fullscreen = false }: { fullscreen?: boolean }) => (
    <div className={`${fullscreen ? 'h-full' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-vital-critical">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-x-gray-text text-sm font-medium uppercase tracking-wider">
              USA Bot Farm Heat Map
            </h3>
            {handle && (
              <p className="text-xs text-x-gray-text/70 mt-0.5">
                Monitoring: @{handle}
              </p>
            )}
          </div>
        </div>
        {!fullscreen && (
          <button
            onClick={() => setIsFullScreen(true)}
            className="px-3 py-1.5 bg-x-gray-border/30 hover:bg-x-gray-border/50 rounded text-xs text-x-gray-text hover:text-white transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Full Screen
          </button>
        )}
      </div>

      {/* Map */}
      <div className={`${fullscreen ? 'h-[60vh]' : 'h-[400px]'} bg-black/20 rounded-lg overflow-hidden relative`}>
        <ComposableMap
          projection="geoAlbersUsa"
          className="w-full h-full"
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateCode = geo.properties.name; // State abbreviation
                const score = metrics.usHeatMapData[stateCode] || 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(stateCode)}
                    stroke="#000"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#60a5fa', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={() => setHoveredState(stateCode)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Hover tooltip */}
        {hoveredState && (
          <div className="absolute top-4 left-4 bg-black/90 border border-x-gray-border rounded-lg p-3 text-sm">
            <div className="font-bold text-white">{hoveredState}</div>
            <div className={`text-xs mt-1 ${getSeverityColor(metrics.usHeatMapData[hoveredState] || 0)}`}>
              {getSeverityLabel(metrics.usHeatMapData[hoveredState] || 0)}
            </div>
            {metrics.usHeatMapData[hoveredState] > 0 && (
              <div className="text-xs text-x-gray-text mt-1">
                Score: {metrics.usHeatMapData[hoveredState]}/100
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-vital-healthy"></div>
          <span className="text-x-gray-text">Low Risk (0-20)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-vital-warning"></div>
          <span className="text-x-gray-text">Medium (20-40)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500"></div>
          <span className="text-x-gray-text">High (40-60)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-vital-critical"></div>
          <span className="text-x-gray-text">Critical (60+)</span>
        </div>
      </div>

      {/* Suspicious Locations List */}
      {metrics.usCountyBotFarms.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-white mb-3">🚨 Suspicious Locations (Bot Farm Probability)</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {metrics.usCountyBotFarms.map((location, idx) => (
              <div
                key={`${location.fullName}-${idx}`}
                className="flex items-center justify-between p-3 bg-x-gray-border/20 rounded-lg hover:bg-x-gray-border/30 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{location.fullName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      location.botFarmScore >= 60 ? 'bg-vital-critical/20 text-vital-critical' :
                      location.botFarmScore >= 40 ? 'bg-orange-500/20 text-orange-500' :
                      'bg-vital-warning/20 text-vital-warning'
                    }`}>
                      {location.botFarmScore}/100
                    </span>
                  </div>
                  <div className="text-xs text-x-gray-text mt-1">
                    {location.totalPosts} posts • {location.veryNewAccounts} accounts &lt;7 days • Avg age: {location.avgAccountAge}d
                  </div>
                </div>
                <div className="flex gap-2 text-xs ml-4">
                  <span className="text-vital-healthy">+{location.sentiment.positive}</span>
                  <span className="text-x-gray-text">{location.sentiment.neutral}</span>
                  <span className="text-vital-critical">-{location.sentiment.negative}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {metrics.usCountyBotFarms.length === 0 && (
        <div className="mt-6 text-center py-8 text-x-gray-text text-sm">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No bot farm activity detected. All clear!
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Regular view */}
      <div className="bg-x-gray-dark border border-x-gray-border rounded-xl p-5">
        <MapContent />
      </div>

      {/* Full screen modal */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="w-full max-w-7xl bg-x-gray-dark border border-x-gray-border rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">USA Bot Farm Heat Map - Full View</h2>
              <button
                onClick={() => setIsFullScreen(false)}
                className="p-2 bg-x-gray-border/30 hover:bg-x-gray-border/50 rounded-lg text-x-gray-text hover:text-white transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <MapContent fullscreen />
          </div>
        </div>
      )}
    </>
  );
}
