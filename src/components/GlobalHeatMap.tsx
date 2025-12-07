'use client';

import { useState, useEffect, memo, useMemo } from 'react';
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

interface CountyBotData {
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
}

interface GlobalHeatMapProps {
  countyBotData?: CountyBotData[];
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

// State FIPS codes to abbreviations (for matching backend data)
const stateAbbreviations: { [key: string]: string } = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC',
  '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL',
  '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA',
  '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV',
  '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY',
  '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR',
  '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
  '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA',
  '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY', '72': 'PR',
};

interface GeoHoverInfo {
  name: string;
  type: 'state' | 'county' | 'country';
  stateName?: string;
}

// US State Capitals
const stateCapitals: { name: string; state: string; coordinates: [number, number]; isNationalCapital?: boolean }[] = [
  { name: 'Washington D.C.', state: 'District of Columbia', coordinates: [-77.0369, 38.9072], isNationalCapital: true },
  { name: 'Montgomery', state: 'Alabama', coordinates: [-86.3006, 32.3770] },
  { name: 'Juneau', state: 'Alaska', coordinates: [-134.4197, 58.3019] },
  { name: 'Phoenix', state: 'Arizona', coordinates: [-112.0740, 33.4484] },
  { name: 'Little Rock', state: 'Arkansas', coordinates: [-92.2896, 34.7465] },
  { name: 'Sacramento', state: 'California', coordinates: [-121.4944, 38.5816] },
  { name: 'Denver', state: 'Colorado', coordinates: [-104.9903, 39.7392] },
  { name: 'Hartford', state: 'Connecticut', coordinates: [-72.6851, 41.7658] },
  { name: 'Dover', state: 'Delaware', coordinates: [-75.5244, 39.1582] },
  { name: 'Tallahassee', state: 'Florida', coordinates: [-84.2807, 30.4383] },
  { name: 'Atlanta', state: 'Georgia', coordinates: [-84.3880, 33.7490] },
  { name: 'Honolulu', state: 'Hawaii', coordinates: [-157.8583, 21.3069] },
  { name: 'Boise', state: 'Idaho', coordinates: [-116.2023, 43.6150] },
  { name: 'Springfield', state: 'Illinois', coordinates: [-89.6501, 39.7817] },
  { name: 'Indianapolis', state: 'Indiana', coordinates: [-86.1581, 39.7684] },
  { name: 'Des Moines', state: 'Iowa', coordinates: [-93.6091, 41.5868] },
  { name: 'Topeka', state: 'Kansas', coordinates: [-95.6890, 39.0473] },
  { name: 'Frankfort', state: 'Kentucky', coordinates: [-84.8733, 38.2009] },
  { name: 'Baton Rouge', state: 'Louisiana', coordinates: [-91.1403, 30.4515] },
  { name: 'Augusta', state: 'Maine', coordinates: [-69.7795, 44.3106] },
  { name: 'Annapolis', state: 'Maryland', coordinates: [-76.4922, 38.9784] },
  { name: 'Boston', state: 'Massachusetts', coordinates: [-71.0589, 42.3601] },
  { name: 'Lansing', state: 'Michigan', coordinates: [-84.5555, 42.7325] },
  { name: 'Saint Paul', state: 'Minnesota', coordinates: [-93.0900, 44.9537] },
  { name: 'Jackson', state: 'Mississippi', coordinates: [-90.1848, 32.2988] },
  { name: 'Jefferson City', state: 'Missouri', coordinates: [-92.1735, 38.5767] },
  { name: 'Helena', state: 'Montana', coordinates: [-112.0391, 46.5884] },
  { name: 'Lincoln', state: 'Nebraska', coordinates: [-96.7026, 40.8258] },
  { name: 'Carson City', state: 'Nevada', coordinates: [-119.7674, 39.1638] },
  { name: 'Concord', state: 'New Hampshire', coordinates: [-71.5376, 43.2081] },
  { name: 'Trenton', state: 'New Jersey', coordinates: [-74.7429, 40.2206] },
  { name: 'Santa Fe', state: 'New Mexico', coordinates: [-105.9378, 35.6870] },
  { name: 'Albany', state: 'New York', coordinates: [-73.7562, 42.6526] },
  { name: 'Raleigh', state: 'North Carolina', coordinates: [-78.6382, 35.7796] },
  { name: 'Bismarck', state: 'North Dakota', coordinates: [-100.7837, 46.8083] },
  { name: 'Columbus', state: 'Ohio', coordinates: [-82.9988, 39.9612] },
  { name: 'Oklahoma City', state: 'Oklahoma', coordinates: [-97.5164, 35.4676] },
  { name: 'Salem', state: 'Oregon', coordinates: [-123.0351, 44.9429] },
  { name: 'Harrisburg', state: 'Pennsylvania', coordinates: [-76.8867, 40.2732] },
  { name: 'Providence', state: 'Rhode Island', coordinates: [-71.4128, 41.8240] },
  { name: 'Columbia', state: 'South Carolina', coordinates: [-81.0348, 34.0007] },
  { name: 'Pierre', state: 'South Dakota', coordinates: [-100.3510, 44.3683] },
  { name: 'Nashville', state: 'Tennessee', coordinates: [-86.7816, 36.1627] },
  { name: 'Austin', state: 'Texas', coordinates: [-97.7431, 30.2672] },
  { name: 'Salt Lake City', state: 'Utah', coordinates: [-111.8910, 40.7608] },
  { name: 'Montpelier', state: 'Vermont', coordinates: [-72.5754, 44.2601] },
  { name: 'Richmond', state: 'Virginia', coordinates: [-77.4360, 37.5407] },
  { name: 'Olympia', state: 'Washington', coordinates: [-122.9007, 47.0379] },
  { name: 'Charleston', state: 'West Virginia', coordinates: [-81.6326, 38.3498] },
  { name: 'Madison', state: 'Wisconsin', coordinates: [-89.4012, 43.0731] },
  { name: 'Cheyenne', state: 'Wyoming', coordinates: [-104.8202, 41.1400] },
];

// World Country Capitals
const worldCapitals: { name: string; country: string; coordinates: [number, number] }[] = [
  { name: 'Washington D.C.', country: 'United States', coordinates: [-77.0369, 38.9072] },
  { name: 'Ottawa', country: 'Canada', coordinates: [-75.6972, 45.4215] },
  { name: 'Mexico City', country: 'Mexico', coordinates: [-99.1332, 19.4326] },
  { name: 'London', country: 'United Kingdom', coordinates: [-0.1276, 51.5074] },
  { name: 'Paris', country: 'France', coordinates: [2.3522, 48.8566] },
  { name: 'Berlin', country: 'Germany', coordinates: [13.4050, 52.5200] },
  { name: 'Rome', country: 'Italy', coordinates: [12.4964, 41.9028] },
  { name: 'Madrid', country: 'Spain', coordinates: [-3.7038, 40.4168] },
  { name: 'Moscow', country: 'Russia', coordinates: [37.6173, 55.7558] },
  { name: 'Beijing', country: 'China', coordinates: [116.4074, 39.9042] },
  { name: 'Tokyo', country: 'Japan', coordinates: [139.6917, 35.6895] },
  { name: 'Seoul', country: 'South Korea', coordinates: [126.9780, 37.5665] },
  { name: 'New Delhi', country: 'India', coordinates: [77.2090, 28.6139] },
  { name: 'Canberra', country: 'Australia', coordinates: [149.1300, -35.2809] },
  { name: 'Brasília', country: 'Brazil', coordinates: [-47.8825, -15.7942] },
  { name: 'Buenos Aires', country: 'Argentina', coordinates: [-58.3816, -34.6037] },
  { name: 'Cairo', country: 'Egypt', coordinates: [31.2357, 30.0444] },
  { name: 'Pretoria', country: 'South Africa', coordinates: [28.1871, -25.7461] },
  { name: 'Ankara', country: 'Turkey', coordinates: [32.8597, 39.9334] },
  { name: 'Riyadh', country: 'Saudi Arabia', coordinates: [46.6753, 24.7136] },
  { name: 'Tehran', country: 'Iran', coordinates: [51.3890, 35.6892] },
  { name: 'Jakarta', country: 'Indonesia', coordinates: [106.8456, -6.2088] },
  { name: 'Bangkok', country: 'Thailand', coordinates: [100.5018, 13.7563] },
  { name: 'Hanoi', country: 'Vietnam', coordinates: [105.8342, 21.0278] },
  { name: 'Manila', country: 'Philippines', coordinates: [120.9842, 14.5995] },
  { name: 'Kuala Lumpur', country: 'Malaysia', coordinates: [101.6869, 3.1390] },
  { name: 'Singapore', country: 'Singapore', coordinates: [103.8198, 1.3521] },
  { name: 'Wellington', country: 'New Zealand', coordinates: [174.7762, -41.2865] },
  { name: 'Athens', country: 'Greece', coordinates: [23.7275, 37.9838] },
  { name: 'Amsterdam', country: 'Netherlands', coordinates: [4.9041, 52.3676] },
  { name: 'Brussels', country: 'Belgium', coordinates: [4.3517, 50.8503] },
  { name: 'Vienna', country: 'Austria', coordinates: [16.3738, 48.2082] },
  { name: 'Warsaw', country: 'Poland', coordinates: [21.0122, 52.2297] },
  { name: 'Prague', country: 'Czech Republic', coordinates: [14.4378, 50.0755] },
  { name: 'Budapest', country: 'Hungary', coordinates: [19.0402, 47.4979] },
  { name: 'Stockholm', country: 'Sweden', coordinates: [18.0686, 59.3293] },
  { name: 'Oslo', country: 'Norway', coordinates: [10.7522, 59.9139] },
  { name: 'Copenhagen', country: 'Denmark', coordinates: [12.5683, 55.6761] },
  { name: 'Helsinki', country: 'Finland', coordinates: [24.9384, 60.1699] },
  { name: 'Dublin', country: 'Ireland', coordinates: [-6.2603, 53.3498] },
  { name: 'Lisbon', country: 'Portugal', coordinates: [-9.1393, 38.7223] },
  { name: 'Bern', country: 'Switzerland', coordinates: [7.4474, 46.9480] },
  { name: 'Kyiv', country: 'Ukraine', coordinates: [30.5234, 50.4501] },
  { name: 'Bucharest', country: 'Romania', coordinates: [26.1025, 44.4268] },
  { name: 'Sofia', country: 'Bulgaria', coordinates: [23.3219, 42.6977] },
  { name: 'Belgrade', country: 'Serbia', coordinates: [20.4489, 44.7866] },
  { name: 'Zagreb', country: 'Croatia', coordinates: [15.9819, 45.8150] },
  { name: 'Nairobi', country: 'Kenya', coordinates: [36.8219, -1.2921] },
  { name: 'Lagos', country: 'Nigeria', coordinates: [3.3792, 6.5244] },
  { name: 'Accra', country: 'Ghana', coordinates: [-0.1870, 5.6037] },
  { name: 'Addis Ababa', country: 'Ethiopia', coordinates: [38.7578, 9.0320] },
  { name: 'Lima', country: 'Peru', coordinates: [-77.0428, -12.0464] },
  { name: 'Bogotá', country: 'Colombia', coordinates: [-74.0721, 4.7110] },
  { name: 'Santiago', country: 'Chile', coordinates: [-70.6693, -33.4489] },
  { name: 'Caracas', country: 'Venezuela', coordinates: [-66.9036, 10.4806] },
];

const GlobalHeatMap = ({ countyBotData = [] }: GlobalHeatMapProps) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('tweets');
  const [hoveredHotspot, setHoveredHotspot] = useState<HotspotData | null>(null);
  const [hoveredGeo, setHoveredGeo] = useState<GeoHoverInfo | null>(null);
  const [mapView, setMapView] = useState<MapView>('usa');
  const [showCounties, setShowCounties] = useState(true);
  const [hotspots] = useState<HotspotData[]>(initialHotspots);
  const [mapError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [-96, 38],
    zoom: 1,
  });

  // Create lookup map for county bot scores
  const countyBotLookup = useMemo(() => {
    const lookup: Record<string, number> = {};
    countyBotData.forEach(county => {
      // Key by "Location, ST" format (e.g., "Watertown, WI")
      lookup[county.fullName] = county.botFarmScore;
    });

    // Debug: Log backend data format
    if (countyBotData.length > 0) {
      console.log('🔍 Backend county bot data format:');
      console.log('Sample entries:', countyBotData.slice(0, 3).map(c => ({
        fullName: c.fullName,
        location: c.location,
        stateCode: c.stateCode,
        score: c.botFarmScore
      })));
      console.log('Total entries:', countyBotData.length);
      console.log('Lookup keys (first 10):', Object.keys(lookup).slice(0, 10));

      console.warn('⚠️ IMPORTANT: Backend appears to send city/place names, NOT county names.');
      console.warn('   Example: "Watertown, WI" is a city, but GeoJSON has "Jefferson County, WI"');
      console.warn('   Direct matching may not work if backend data uses cities instead of counties.');
    }

    return lookup;
  }, [countyBotData]);

  // Get color based on bot farm score
  const getBotFarmColor = (score: number) => {
    if (score === 0 || !score) return '#4a9b7f'; // Default green for no data
    if (score < 20) return '#16a34a'; // Low risk - green
    if (score < 40) return '#eab308'; // Medium risk - yellow
    if (score < 60) return '#f97316'; // High risk - orange
    return '#ef4444'; // Critical risk - red
  };

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
      label: 'Posts',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      key: 'retweets',
      label: 'Reposts',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      key: 'quotes',
      label: 'Quote Posts',
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
                    {({ geographies }) => {
                      // Debug: Log first few counties to understand GeoJSON structure
                      if (geographies.length > 0) {
                        const samples = geographies.slice(0, 3).map(geo => ({
                          id: geo.id,
                          name: geo.properties.name,
                          stateFIPS: String(geo.id).substring(0, 2),
                          stateAbbrev: stateAbbreviations[String(geo.id).substring(0, 2)],
                        }));
                        console.log('🗺️ GeoJSON county structure samples:', samples);
                      }

                      return geographies.map(geo => {
                        const countyName = geo.properties.name || 'Unknown County';
                        const stateFIPS = String(geo.id).substring(0, 2);
                        const stateAbbrev = stateAbbreviations[stateFIPS] || '';
                        const stateName = stateNames[stateFIPS] || 'Unknown State';

                        // Try multiple naming formats to match backend data
                        // Backend sends: "City/Place, ST" (e.g., "Watertown, WI")
                        // GeoJSON has: county name only (e.g., "Jefferson")

                        // Strategy 1: Try "CountyName, ST" format
                        const format1 = `${countyName}, ${stateAbbrev}`;

                        // Strategy 2: Try "CountyName County, ST" format
                        const format2 = `${countyName} County, ${stateAbbrev}`;

                        // Strategy 3: Try without "County" suffix if it exists
                        const cleanName = countyName.replace(/ County$/i, '');
                        const format3 = `${cleanName}, ${stateAbbrev}`;

                        // Look up bot farm score
                        let botScore = countyBotLookup[format1] ||
                                      countyBotLookup[format2] ||
                                      countyBotLookup[format3] ||
                                      0;

                        // Debug: Log successful matches
                        if (botScore > 0) {
                          console.log('✅ County match found:', {
                            geoCounty: countyName,
                            state: stateAbbrev,
                            matchedFormat: countyBotLookup[format1] ? format1 :
                                          countyBotLookup[format2] ? format2 : format3,
                            score: botScore
                          });
                        }

                        const fillColor = getBotFarmColor(botScore);

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={fillColor}
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
                      });
                    }}
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

            {/* Capital Star Markers */}
            {mapView === 'usa' ? (
              stateCapitals.map((capital) => {
                const baseSize = capital.isNationalCapital ? 12 : 7;
                const scaledSize = baseSize / position.zoom;
                const starPoints = `${scaledSize},0 ${scaledSize*1.3},${scaledSize*0.95} ${scaledSize*2.1},${scaledSize*0.95} ${scaledSize*1.5},${scaledSize*1.55} ${scaledSize*1.75},${scaledSize*2.45} ${scaledSize},${scaledSize*1.9} ${scaledSize*0.25},${scaledSize*2.45} ${scaledSize*0.5},${scaledSize*1.55} ${-scaledSize*0.1},${scaledSize*0.95} ${scaledSize*0.7},${scaledSize*0.95}`;
                return (
                  <Marker key={capital.name} coordinates={capital.coordinates}>
                    <polygon
                      points={starPoints}
                      fill="#FFD700"
                      stroke="#000"
                      strokeWidth={0.5 / position.zoom}
                      style={{ transform: `translate(${-scaledSize}px, ${-scaledSize*1.2}px)` }}
                    />
                  </Marker>
                );
              })
            ) : (
              worldCapitals.map((capital) => {
                const baseSize = 6;
                const scaledSize = baseSize / position.zoom;
                const starPoints = `${scaledSize},0 ${scaledSize*1.3},${scaledSize*0.95} ${scaledSize*2.1},${scaledSize*0.95} ${scaledSize*1.5},${scaledSize*1.55} ${scaledSize*1.75},${scaledSize*2.45} ${scaledSize},${scaledSize*1.9} ${scaledSize*0.25},${scaledSize*2.45} ${scaledSize*0.5},${scaledSize*1.55} ${-scaledSize*0.1},${scaledSize*0.95} ${scaledSize*0.7},${scaledSize*0.95}`;
                return (
                  <Marker key={capital.name} coordinates={capital.coordinates}>
                    <polygon
                      points={starPoints}
                      fill="#FFD700"
                      stroke="#000"
                      strokeWidth={0.5 / position.zoom}
                      style={{ transform: `translate(${-scaledSize}px, ${-scaledSize*1.2}px)` }}
                    />
                  </Marker>
                );
              })
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
                <span className="text-x-gray-text">Posts</span>
                <span className="text-x-white font-medium">{formatNumber(hoveredHotspot.tweets)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-x-gray-text">Reposts</span>
                <span className="text-x-white font-medium">{formatNumber(hoveredHotspot.retweets)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-x-gray-text">Quote Posts</span>
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
