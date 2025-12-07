# City-to-County Mapping System for Bot Farm Heat Map

## Overview

This system enables the backend analytics engine to accept Twitter geographic data at the **city level** (e.g., "Los Angeles, CA", "Brooklyn, NY") and automatically map it to the appropriate **county level** (e.g., "Los Angeles County, CA", "Kings County, NY") for display on the heat map.

## Problem Solved

**Before:** Twitter provides city-level geographic data, but our heat map uses county-level GeoJSON boundaries. This caused a mismatch where city data couldn't be displayed on the county heat map.

**After:** City-level data is automatically mapped to parent counties, enabling comprehensive geographic tracking and visualization.

## Implementation Details

### 1. Static Mapping Data File

**Location:** `/Users/admin/xpulse/backend/src/data/city-to-county.json`

**Format:**
```json
{
  "comment": "US City to County mapping - Format: 'City, ST' -> 'County Name County, ST'",
  "mappings": {
    "Los Angeles, CA": "Los Angeles County, CA",
    "Brooklyn, NY": "Kings County, NY",
    "Watertown, WI": "Jefferson County, WI",
    "Sioux Falls, SD": "Minnehaha County, SD",
    ...
  }
}
```

**Coverage:** 227+ major US cities across all 50 states

**Data Source Rationale:**
- Static JSON file (no external API calls - works offline)
- Fast lookups (O(1) hash map)
- No performance impact
- Easy to extend with additional cities
- Based on research from SimpleMaps, US Census Bureau data, and GeoNames

### 2. Backend Implementation

**File Modified:** `/Users/admin/xpulse/backend/src/analytics.js`

**Key Changes:**

#### a. Import Statements (Lines 1-6)
```javascript
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

#### b. Constructor Update (Line 18)
```javascript
// Load city-to-county mapping data
this.cityToCountyMap = this.loadCityToCountyMapping();
```

#### c. New Method: loadCityToCountyMapping() (Lines 235-248)
```javascript
/**
 * Load city-to-county mapping data from JSON file
 */
loadCityToCountyMapping() {
  try {
    const mappingPath = join(__dirname, 'data', 'city-to-county.json');
    const data = readFileSync(mappingPath, 'utf8');
    const json = JSON.parse(data);
    return json.mappings || {};
  } catch (error) {
    console.warn('⚠️ Could not load city-to-county mapping:', error.message);
    return {};
  }
}
```

#### d. New Method: mapCityToCounty() (Lines 250-267)
```javascript
/**
 * Map a city name to its parent county
 * @param {string} cityName - City name (e.g., "Los Angeles")
 * @param {string} stateCode - State code (e.g., "CA")
 * @returns {string|null} - County name in format "County Name County, ST" or null if not found
 */
mapCityToCounty(cityName, stateCode) {
  const cityKey = `${cityName}, ${stateCode}`;
  const countyName = this.cityToCountyMap[cityKey];

  if (countyName) {
    console.log(`✅ Mapped city "${cityKey}" to county "${countyName}"`);
    return countyName;
  }

  console.log(`⚠️ No county mapping found for city: ${cityKey}`);
  return null;
}
```

#### e. Updated Method: trackUSCountyData() (Lines 269-311)
```javascript
/**
 * NEW: Track US county-level data for bot farm heat map
 * Updated to handle both city-level and county-level place data
 */
trackUSCountyData(post, sentiment, timestamp) {
  const fullName = post.place.full_name;
  const placeType = post.place.place_type;

  // Parse location: "Los Angeles, CA" or "Los Angeles County, CA" format
  const parts = fullName.split(',').map(p => p.trim());
  if (parts.length < 2) return;

  let location = parts[0]; // City, County, or State name
  const stateCode = parts[parts.length - 1]; // State abbreviation

  // Handle city-level places by mapping to their parent county
  if (placeType === 'city') {
    const countyName = this.mapCityToCounty(location, stateCode);
    if (!countyName) {
      // City not in our mapping - skip this data point
      console.log(`⚠️ Skipping unmapped city: ${location}, ${stateCode}`);
      return;
    }

    // Extract just the county name from "County Name County, ST" format
    // e.g., "Jefferson County, WI" -> "Jefferson County"
    const countyParts = countyName.split(',').map(p => p.trim());
    location = countyParts[0];

    console.log(`🗺️ City "${fullName}" mapped to county "${location}, ${stateCode}"`);
  }
  // Handle admin-level places (counties/states)
  else if (placeType === 'admin') {
    // Only track county-level data (not state-level)
    if (!location.includes('County') && !location.includes('Parish')) {
      return; // Skip state-level admin places
    }
  }
  // Skip other place types (poi, neighborhood, etc.)
  else {
    return;
  }

  // ... rest of the tracking logic continues unchanged ...
}
```

## How It Works

### Data Flow

1. **Twitter Post Received** with place data:
   ```json
   {
     "place": {
       "full_name": "Los Angeles, CA",
       "place_type": "city",
       "country_code": "US"
     }
   }
   ```

2. **trackUSCountyData()** detects `place_type === 'city'`

3. **mapCityToCounty()** looks up "Los Angeles, CA" in the static mapping

4. **Result:** "Los Angeles County, CA" is returned

5. **County name extracted:** "Los Angeles County"

6. **Data tracked** under county key: "Los Angeles County, CA"

7. **Heat map displays** the data on Los Angeles County boundary

### Supported Place Types

- **`city`** - Mapped to parent county using static data
- **`admin`** - Assumed to be county-level (filtered to exclude states)
- **Other types** - Ignored (poi, neighborhood, etc.)

## Testing

### Test File

**Location:** `/Users/admin/xpulse/backend/test-city-mapping.js`

### Run Tests

```bash
cd /Users/admin/xpulse/backend
node test-city-mapping.js
```

### Test Results

All 9 tests passed (100% success rate):

✅ Los Angeles, CA → Los Angeles County, CA
✅ Brooklyn, NY → Kings County, NY
✅ Watertown, WI → Jefferson County, WI
✅ Sioux Falls, SD → Minnehaha County, SD
✅ Chicago, IL → Cook County, IL
✅ Phoenix, AZ → Maricopa County, AZ
✅ Houston, TX → Harris County, TX
✅ Philadelphia, PA → Philadelphia County, PA
✅ SmallTown, MT → null (correctly handles unmapped cities)

### Integration Test Results

Successfully tracked county data from mock posts:
- Los Angeles, CA (city) → Los Angeles County, CA ✅
- Brooklyn, NY (city) → Kings County, NY ✅
- Watertown, WI (city) → Jefferson County, WI ✅
- Jefferson County, WI (admin) → Jefferson County, WI ✅

## Files Modified/Created

### Created
1. `/Users/admin/xpulse/backend/src/data/city-to-county.json` - Static mapping data (227 cities)
2. `/Users/admin/xpulse/backend/test-city-mapping.js` - Test suite
3. `/Users/admin/xpulse/backend/CITY_TO_COUNTY_MAPPING.md` - This documentation

### Modified
1. `/Users/admin/xpulse/backend/src/analytics.js` - Added city-to-county mapping logic

## Extending the Mapping

To add more cities to the mapping:

1. Open `/Users/admin/xpulse/backend/src/data/city-to-county.json`
2. Add new entries in the format:
   ```json
   "CityName, ST": "CountyName County, ST"
   ```
3. Save the file
4. Restart the backend server
5. Test with `node test-city-mapping.js`

### Example

```json
{
  "mappings": {
    ...existing mappings...,
    "Bozeman, MT": "Gallatin County, MT",
    "Ann Arbor, MI": "Washtenaw County, MI"
  }
}
```

## Performance Characteristics

- **Lookup Speed:** O(1) hash map lookup
- **Memory Usage:** ~50KB for 227 cities (negligible)
- **Initialization:** Loaded once at server startup
- **Runtime Impact:** Zero external API calls, zero latency
- **Offline Support:** Fully functional without internet

## Edge Cases Handled

1. **Unmapped Cities:** Logged with warning, data point skipped
2. **Missing Mapping File:** Warning logged, continues with empty map
3. **Invalid JSON:** Error caught, continues with empty map
4. **Multiple Counties:** Single primary county assigned per city
5. **Independent Cities:** (e.g., Baltimore city, MD) mapped correctly

## Known Limitations

1. **Coverage:** Only 227+ major US cities included
   - **Solution:** Add more cities to mapping file as needed
   - **Alternative:** Could integrate geocoding API for full coverage (but loses offline capability)

2. **Multi-County Cities:** Some cities span multiple counties
   - **Current Behavior:** Maps to primary/largest county
   - **Example:** New York City boroughs each map to their own counties correctly

3. **City Name Collisions:** Same city name in different states
   - **Handled:** State code included in lookup key ("Springfield, IL" vs "Springfield, MO")

## Future Enhancements

### Potential Improvements (if needed)

1. **Expand Coverage:**
   - Add all US cities with population > 10,000
   - Use SimpleMaps database or US Census data
   - Estimated: 3,000+ cities total

2. **Fallback Geocoding:**
   - Add optional geocoding API fallback for unmapped cities
   - Only called for unmapped cities (cached after first lookup)
   - Maintains offline-first approach

3. **GeoJSON Integration:**
   - Add GeoJSON county boundary polygons
   - Point-in-polygon lookup for exact city→county mapping
   - More accurate but higher computational cost

## References

### Data Sources Researched
- SimpleMaps US Cities Database (https://simplemaps.com/data/us-cities)
- US Census Bureau FIPS codes
- GeoNames Gazetteer
- US Department of Transportation FIPS Reference Table

### Alternative Approaches Considered
1. ❌ Geocoding API (e.g., Google Maps) - Requires internet, API costs
2. ❌ NPM packages (cities.json, zipcodes) - Incomplete county data
3. ✅ Static JSON mapping - Fast, offline, zero dependencies

## Support

For issues or questions:
1. Check console logs for mapping warnings
2. Verify city is in `/Users/admin/xpulse/backend/src/data/city-to-county.json`
3. Run test suite: `node test-city-mapping.js`
4. Add missing cities to mapping file if needed
