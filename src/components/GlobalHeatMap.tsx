'use client';

import { useState, useEffect, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

// Map data URLs
const worldGeoUrl = '/world-countries.json';
const usStatesUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';
const usCountiesUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';

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
type MapView = 'usa' | 'world';

// State FIPS codes to names
const stateNames: { [key: string]: string } = {
  '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
  '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia',
  '12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois',
  '18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana',
  '23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
  '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
  '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
  '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma', '41': 'Oregon',
  '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina', '46': 'South Dakota',
  '47': 'Tennessee', '48': 'Texas', '49': 'Utah', '50': 'Vermont', '51': 'Virginia',
  '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming', '72': 'Puerto Rico',
};

interface GeoHoverInfo {
  name: string;
  type: 'state' | 'county' | 'country';
  stateName?: string;
}

const GlobalHeatMap = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('tweets');
  const [hoveredHotspot, setHoveredHotspot] = useState<HotspotData | null>(null);
  const [hoveredGeo, setHoveredGeo] = useState<GeoHoverInfo | null>(null);
  const [mapView, setMapView] = useState<MapView>('usa');
  const [showCounties, setShowCounties] = useState(true);
  const [hotspots] = useState<HotspotData[]>(initialHotspots);
  const [mapError, setMapError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [-96, 38],
    zoom: 1,
  });

  // Update position when map view changes
  useEffect(() => {
    if (mapView === 'usa') {
      setPosition({ coordinates: [-96, 38], zoom: 1 });
    } else {
      setPosition({ coordinates: [0, 20], zoom: 1 });
    }
  }, [mapView]);

  // TODO: Connect to backend WebSocket to get real geographic data
  // For now, map is empty until real data is available

  const getMaxValue = () => {
    if (hotspots.length === 0) return 1;
    return Math.max(...hotspots.map(h => h[selectedMetric]));
  };

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
          {mapView === 'usa' ? 'USA' : 'Global'} Engagement Heat Map
        </h3>
        <div className="flex items-center gap-4">
          {/* Map View Toggle */}
          <div className="flex rounded-full bg-x-gray-light p-1">
            <button
              onClick={() => setMapView('usa')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                mapView === 'usa' ? 'bg-x-blue text-white' : 'text-x-gray-text hover:text-x-white'
              }`}
            >
              USA
            </button>
            <button
              onClick={() => setMapView('world')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                mapView === 'world' ? 'bg-x-blue text-white' : 'text-x-gray-text hover:text-x-white'
              }`}
            >
              World
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-vital-healthy animate-pulse" />
            <span className="text-xs text-x-gray-text">Live</span>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between mb-6">
        {/* Metric Selector */}
        <div className="flex gap-2">
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

        {/* County Toggle (USA only) */}
        {mapView === 'usa' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCounties}
              onChange={e => setShowCounties(e.target.checked)}
              className="w-4 h-4 rounded bg-x-gray-light border-x-gray-border text-x-blue focus:ring-x-blue"
            />
            <span className="text-sm text-x-gray-text">Show Counties</span>
          </label>
        )}
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[450px] rounded-lg overflow-hidden border border-x-gray-border">
        {mapError ? (
          <div className="flex items-center justify-center h-full bg-x-gray-dark">
            <div className="text-center">
              <svg className="w-12 h-12 text-x-gray-text mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-x-white mb-2">Map Unavailable</p>
              <p className="text-x-gray-text text-sm">Unable to load geographic data</p>
            </div>
          </div>
        ) : (
        <ComposableMap
          projection={mapView === 'usa' ? 'geoAlbersUsa' : 'geoMercator'}
          projectionConfig={{
            scale: mapView === 'usa' ? 1000 : 140,
          }}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1D9BF0',
          }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={({ coordinates, zoom }) => setPosition({ coordinates: coordinates as [number, number], zoom })}
          >
            {mapView === 'usa' ? (
              <>
                {/* US Counties (optional layer) */}
                {showCounties && (
                  <Geographies geography={usCountiesUrl}>
                    {({ geographies }) =>
                      geographies.map(geo => {
                        const countyName = geo.properties.name || 'Unknown County';
                        const stateCode = String(geo.id).substring(0, 2);
                        const stateName = stateNames[stateCode] || 'Unknown State';
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#4a9b7f"
                            stroke="#3d7a5f"
                            strokeWidth={0.2}
                            onMouseEnter={() => setHoveredGeo({ name: countyName, type: 'county', stateName })}
                            onMouseLeave={() => setHoveredGeo(null)}
                            style={{
                              default: { outline: 'none' },
                              hover: { fill: '#6bc4a6', outline: 'none' },
                              pressed: { outline: 'none' },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                )}

                {/* US States */}
                <Geographies geography={usStatesUrl}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const stateName = geo.properties.name || stateNames[String(geo.id)] || 'Unknown State';
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={showCounties ? 'transparent' : '#4a9b7f'}
                          stroke="#E7E9EA"
                          strokeWidth={showCounties ? 1 : 0.5}
                          onMouseEnter={() => !showCounties && setHoveredGeo({ name: stateName, type: 'state' })}
                          onMouseLeave={() => setHoveredGeo(null)}
                          style={{
                            default: { outline: 'none', pointerEvents: showCounties ? 'none' : 'auto' },
                            hover: { fill: showCounties ? 'transparent' : '#6bc4a6', outline: 'none' },
                            pressed: { outline: 'none' },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </>
            ) : (
              /* World Map - countries only, no internal US borders */
              <Geographies geography={worldGeoUrl}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const countryName = geo.properties.name || geo.properties.NAME || geo.properties.ADMIN || 'Unknown';
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#4a9b7f"
                        stroke="#2F3336"
                        strokeWidth={0.5}
                        onMouseEnter={() => setHoveredGeo({ name: countryName, type: 'country' })}
                        onMouseLeave={() => setHoveredGeo(null)}
                        style={{
                          default: { outline: 'none' },
                          hover: { fill: '#6bc4a6', outline: 'none' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            )}

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
                  <circle
                    r={size + 4}
                    fill="#1D9BF0"
                    opacity={0.2}
                    className="animate-ping"
                    style={{ transformOrigin: 'center', animationDuration: '2s' }}
                  />
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
        )}

        {/* Geographic Hover Tooltip */}
        {hoveredGeo && !hoveredHotspot && (
          <div className="absolute top-4 left-4 px-4 py-3 bg-x-gray-dark/95 border border-x-gray-border rounded-lg shadow-lg backdrop-blur-sm z-10">
            <p className="text-x-white font-semibold">
              {hoveredGeo.name}
              {hoveredGeo.type === 'county' && ' County'}
            </p>
            {hoveredGeo.type === 'county' && hoveredGeo.stateName && (
              <p className="text-x-gray-text text-sm">{hoveredGeo.stateName}</p>
            )}
            {hoveredGeo.type === 'country' && (
              <p className="text-x-gray-text text-xs mt-1">Country</p>
            )}
            {hoveredGeo.type === 'state' && (
              <p className="text-x-gray-text text-xs mt-1">State</p>
            )}
          </div>
        )}

        {/* Hotspot Hover Tooltip */}
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
            onClick={() => setPosition({
              coordinates: mapView === 'usa' ? [-96, 38] : [0, 20],
              zoom: 1
            })}
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
              <span className="text-x-gray-text">Positive</span>
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
              <span className="text-x-gray-text">Negative</span>
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
