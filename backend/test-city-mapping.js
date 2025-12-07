/**
 * Test City-to-County Mapping
 * Tests the city-to-county mapping functionality with example cities
 */

import { AnalyticsEngine } from './src/analytics.js';

console.log('========================================');
console.log('Testing City-to-County Mapping System');
console.log('========================================\n');

// Create analytics engine instance
const analytics = new AnalyticsEngine();

// Test cases matching the examples from the requirements
const testCases = [
  {
    city: 'Los Angeles',
    state: 'CA',
    expectedCounty: 'Los Angeles County, CA'
  },
  {
    city: 'Brooklyn',
    state: 'NY',
    expectedCounty: 'Kings County, NY'
  },
  {
    city: 'Watertown',
    state: 'WI',
    expectedCounty: 'Jefferson County, WI'
  },
  {
    city: 'Sioux Falls',
    state: 'SD',
    expectedCounty: 'Minnehaha County, SD'
  },
  // Additional test cases
  {
    city: 'Chicago',
    state: 'IL',
    expectedCounty: 'Cook County, IL'
  },
  {
    city: 'Phoenix',
    state: 'AZ',
    expectedCounty: 'Maricopa County, AZ'
  },
  {
    city: 'Houston',
    state: 'TX',
    expectedCounty: 'Harris County, TX'
  },
  {
    city: 'Philadelphia',
    state: 'PA',
    expectedCounty: 'Philadelphia County, PA'
  },
  // Test a city not in our mapping
  {
    city: 'SmallTown',
    state: 'MT',
    expectedCounty: null
  }
];

console.log('Running tests...\n');

let passedTests = 0;
let failedTests = 0;

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.city}, ${test.state}`);
  console.log('─────────────────────────────────────');

  const result = analytics.mapCityToCounty(test.city, test.state);

  if (result === test.expectedCounty) {
    console.log(`✅ PASS: Got expected result: ${result || 'null'}\n`);
    passedTests++;
  } else {
    console.log(`❌ FAIL:`);
    console.log(`   Expected: ${test.expectedCounty || 'null'}`);
    console.log(`   Got:      ${result || 'null'}\n`);
    failedTests++;
  }
});

// Test the full trackUSCountyData function with mock post data
console.log('\n========================================');
console.log('Testing trackUSCountyData Integration');
console.log('========================================\n');

const mockPosts = [
  {
    place: {
      full_name: 'Los Angeles, CA',
      place_type: 'city',
      country_code: 'US'
    },
    author: {
      id: 'user1',
      account_created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days old
    },
    text: 'Test post from Los Angeles'
  },
  {
    place: {
      full_name: 'Brooklyn, NY',
      place_type: 'city',
      country_code: 'US'
    },
    author: {
      id: 'user2',
      account_created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days old
    },
    text: 'Test post from Brooklyn'
  },
  {
    place: {
      full_name: 'Watertown, WI',
      place_type: 'city',
      country_code: 'US'
    },
    author: {
      id: 'user3',
      account_created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days old
    },
    text: 'Test post from Watertown'
  },
  {
    place: {
      full_name: 'Jefferson County, WI',
      place_type: 'admin',
      country_code: 'US'
    },
    author: {
      id: 'user4',
      account_created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() // 100 days old
    },
    text: 'Test post from Jefferson County (admin place)'
  }
];

console.log('Processing mock posts through trackUSCountyData...\n');

mockPosts.forEach((post, index) => {
  console.log(`\nProcessing Post ${index + 1}: ${post.place.full_name} (${post.place.place_type})`);
  console.log('─────────────────────────────────────');

  const sentiment = 'neutral';
  const timestamp = Date.now();

  try {
    analytics.trackUSCountyData(post, sentiment, timestamp);
    console.log('✅ Successfully tracked\n');
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
});

// Display county data that was tracked
console.log('\n========================================');
console.log('County Data Tracked');
console.log('========================================\n');

if (analytics.usCountyData.size > 0) {
  console.log(`Total counties tracked: ${analytics.usCountyData.size}\n`);

  analytics.usCountyData.forEach((data, locationKey) => {
    console.log(`County: ${locationKey}`);
    console.log(`  Posts: ${data.totalPosts}`);
    console.log(`  New accounts (<30 days): ${data.newAccounts}`);
    console.log(`  Very new accounts (<7 days): ${data.veryNewAccounts}`);
    console.log(`  Sentiment: +${data.sentiment.positive} ~${data.sentiment.neutral} -${data.sentiment.negative}`);
    console.log('');
  });
} else {
  console.log('⚠️ No county data was tracked');
}

// Summary
console.log('\n========================================');
console.log('Test Summary');
console.log('========================================\n');
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${failedTests} ❌`);
console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%\n`);

if (failedTests === 0) {
  console.log('🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.log('⚠️ Some tests failed. Please review the output above.\n');
  process.exit(1);
}
