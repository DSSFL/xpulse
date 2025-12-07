import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { database } from '../src/database.js';

dotenv.config();

/**
 * MASSIVE DATA DUMP - Grab as much historical data as possible
 * - Thousands of geo-tagged tweets
 * - Time-stamped for temporal analysis
 * - Multiple search angles
 * - Analytics snapshots for tracking spikes over time
 */

// Comprehensive search queries for maximum data coverage
const SEARCH_QUERIES = [
  // Political terms
  'politics has:geo place_country:US -is:retweet',
  'election has:geo place_country:US -is:retweet',
  'vote has:geo place_country:US -is:retweet',
  'congress has:geo place_country:US -is:retweet',
  'senate has:geo place_country:US -is:retweet',
  'government has:geo place_country:US -is:retweet',
  'policy has:geo place_country:US -is:retweet',
  'democrat has:geo place_country:US -is:retweet',
  'republican has:geo place_country:US -is:retweet',
  'biden has:geo place_country:US -is:retweet',
  'trump has:geo place_country:US -is:retweet',

  // News and breaking
  'breaking has:geo place_country:US -is:retweet',
  'news has:geo place_country:US -is:retweet',
  'breaking news has:geo place_country:US -is:retweet',
  'latest has:geo place_country:US -is:retweet',
  'update has:geo place_country:US -is:retweet',

  // State-specific for better geographic coverage
  'Alabama has:geo place_country:US',
  'Texas has:geo place_country:US',
  'California has:geo place_country:US',
  'Florida has:geo place_country:US',
  'New York has:geo place_country:US',

  // High engagement topics
  'trending has:geo place_country:US -is:retweet',
  'viral has:geo place_country:US -is:retweet',
  'important has:geo place_country:US -is:retweet',
];

const TARGET_USERS = ['ByronDonalds', 'elonmusk'];

function analyzeSentiment(text) {
  if (!text) return { sentiment: 'neutral', score: 0 };
  const lowerText = text.toLowerCase();
  const positiveWords = ['love', 'great', 'amazing', 'awesome', 'excellent', 'good', 'happy', 'wonderful', 'fantastic', 'best', 'thanks', 'thank', 'appreciate', 'support', 'agree', 'perfect', 'brilliant', 'win', 'success'];
  const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'worst', 'horrible', 'disgusting', 'shit', 'fuck', 'damn', 'sucks', 'angry', 'mad', 'disagree', 'wrong', 'fail', 'stupid', 'idiot', 'corrupt', 'lie', 'liar', 'fraud'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  const score = positiveCount - negativeCount;
  if (score > 0) return { sentiment: 'positive', score: 0.5 };
  if (score < 0) return { sentiment: 'negative', score: -0.5 };
  return { sentiment: 'neutral', score: 0 };
}

function getAccountAge(accountCreatedAt) {
  if (!accountCreatedAt) return null;
  const created = new Date(accountCreatedAt);
  const now = new Date();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

/**
 * Fetch with pagination to get MUCH more data
 */
async function fetchWithPagination(client, query, maxResults = 500) {
  let allTweets = [];
  let nextToken = null;
  let requestCount = 0;
  const maxRequests = 5; // 5 requests × 100 tweets = 500 tweets per query

  console.log(`   📥 Fetching up to ${maxResults} tweets...`);

  try {
    while (requestCount < maxRequests) {
      const params = {
        max_results: 100,
        'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'geo', 'referenced_tweets'],
        'user.fields': ['username', 'name', 'created_at', 'location', 'public_metrics'],
        expansions: ['author_id', 'geo.place_id', 'referenced_tweets.id'],
        'place.fields': ['full_name', 'country', 'country_code', 'geo', 'place_type']
      };

      if (nextToken) {
        params.next_token = nextToken;
      }

      const result = await client.v2.search(query, params);

      if (!result?.data?.data || result.data.data.length === 0) {
        break;
      }

      allTweets.push({
        tweets: result.data.data,
        users: result.includes?.users || [],
        places: result.includes?.places || []
      });

      requestCount++;
      console.log(`      Batch ${requestCount}: ${result.data.data.length} tweets (total: ${allTweets.reduce((sum, batch) => sum + batch.tweets.length, 0)})`);

      // Check if there's more data
      if (!result.data.meta?.next_token) {
        break;
      }

      nextToken = result.data.meta.next_token;

      // Rate limiting - wait 3 seconds between requests
      if (requestCount < maxRequests) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    return allTweets;
  } catch (error) {
    console.error(`   ❌ Pagination error:`, error.message);
    return allTweets; // Return what we have so far
  }
}

/**
 * Process and store tweets
 */
async function processTweets(batches, trackedUsers) {
  let stored = 0;

  for (const batch of batches) {
    const users = {};
    batch.users.forEach(u => {
      users[u.id] = u;
    });

    const places = {};
    batch.places.forEach(p => {
      places[p.id] = p;
    });

    for (const tweet of batch.tweets) {
      const author = users[tweet.author_id];
      const place = tweet.geo?.place_id ? places[tweet.geo.place_id] : null;

      if (!author || !place || place.country_code !== 'US') continue;

      // Assign to tracked user
      let trackedUserId = null;
      const tweetText = tweet.text.toLowerCase();

      for (const [username, userData] of Object.entries(trackedUsers)) {
        if (tweetText.includes(`@${username}`) || tweetText.includes(username)) {
          trackedUserId = userData.id;
          break;
        }
      }

      if (!trackedUserId) {
        trackedUserId = trackedUsers['byrondonalds']?.id || Object.values(trackedUsers)[0]?.id;
      }

      if (!trackedUserId) continue;

      // Determine tweet type
      let tweetType = 'mention';
      if (tweet.referenced_tweets) {
        const hasReply = tweet.referenced_tweets.some(ref => ref.type === 'replied_to');
        const hasQuote = tweet.referenced_tweets.some(ref => ref.type === 'quoted');
        if (hasReply) tweetType = 'reply';
        else if (hasQuote) tweetType = 'quote';
      }

      const sentimentAnalysis = analyzeSentiment(tweet.text);
      const accountAge = author?.created_at ? getAccountAge(author.created_at) : null;

      const post = {
        tweet_id: tweet.id,
        author_username: author?.username || 'unknown',
        author_user_id: tweet.author_id,
        tweet_text: tweet.text,
        tweet_type: tweetType,
        created_at: new Date(tweet.created_at),
        like_count: tweet.public_metrics?.like_count || 0,
        retweet_count: tweet.public_metrics?.retweet_count || 0,
        reply_count: tweet.public_metrics?.reply_count || 0,
        quote_count: tweet.public_metrics?.quote_count || 0,
        impression_count: tweet.public_metrics?.impression_count || 0,
        sentiment: sentimentAnalysis.sentiment,
        sentiment_score: sentimentAnalysis.score,
        has_geo: true,
        geo_place_id: place.id,
        geo_full_name: place.full_name,
        geo_country: place.country,
        geo_country_code: place.country_code,
        author_account_age_days: accountAge
      };

      const result = await database.storePost(post, trackedUserId);
      if (result) stored++;
    }
  }

  return stored;
}

/**
 * Create analytics snapshot for temporal analysis
 */
async function createAnalyticsSnapshot(trackedUserId, username) {
  try {
    const client = await database.pool.connect();

    // Get comprehensive stats
    const stats = await client.query(`
      SELECT
        COUNT(*) as total_posts,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
        AVG(author_account_age_days) as avg_account_age,
        SUM(CASE WHEN author_account_age_days < 7 THEN 1 ELSE 0 END) as very_new_accounts,
        SUM(CASE WHEN author_account_age_days < 30 THEN 1 ELSE 0 END) as new_accounts
      FROM user_posts
      WHERE tracked_user_id = $1;
    `, [trackedUserId]);

    const snapshot = stats.rows[0];

    // Calculate risks
    const accountAgeRisk = snapshot.very_new_accounts > 0
      ? Math.min(Math.round((snapshot.very_new_accounts / snapshot.total_posts) * 100), 100)
      : 0;

    await database.storeAnalyticsSnapshot(trackedUserId, {
      totalPosts: parseInt(snapshot.total_posts),
      velocity: 0,
      viralityRisk: 0,
      authenticityScore: 100 - accountAgeRisk,
      engagementRate: 0,
      coordinatedActivity: 0,
      accountAgeRisk: accountAgeRisk,
      sentiment: {
        positive: parseInt(snapshot.positive),
        neutral: parseInt(snapshot.neutral),
        negative: parseInt(snapshot.negative)
      }
    });

    client.release();
    console.log(`   ✅ Created analytics snapshot for @${username}`);

  } catch (error) {
    console.error(`   ❌ Error creating snapshot:`, error.message);
  }
}

/**
 * Main execution
 */
async function massiveDataDump() {
  const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN).readOnly;
  let totalStored = 0;
  let totalProcessed = 0;

  try {
    console.log('🚀 MASSIVE DATA DUMP INITIATED\n');
    console.log('🎯 Target: Thousands of geo-tagged tweets');
    console.log('⏱️  Time-stamped for temporal spike analysis\n');

    // Test database
    console.log('🔌 Testing database connection...');
    const connected = await database.testConnection();
    if (!connected) throw new Error('Database connection failed');

    // Get tracked users
    console.log('📋 Loading tracked users...');
    const trackedUsers = {};
    for (const username of TARGET_USERS) {
      const user = await database.getTrackedUser(username);
      if (user) {
        trackedUsers[username.toLowerCase()] = user;
        console.log(`   ✅ ${user.display_name} (@${username})`);
      }
    }

    console.log(`\n📡 Starting massive data fetch across ${SEARCH_QUERIES.length} queries...\n`);

    // Process each query with pagination
    for (let i = 0; i < SEARCH_QUERIES.length; i++) {
      const query = SEARCH_QUERIES[i];
      console.log(`\n[${i + 1}/${SEARCH_QUERIES.length}] Query: "${query}"`);

      try {
        // Fetch with pagination
        const batches = await fetchWithPagination(client, query, 500);

        if (batches.length === 0) {
          console.log('   ⚠️  No results');
          continue;
        }

        const tweetsCount = batches.reduce((sum, batch) => sum + batch.tweets.length, 0);
        totalProcessed += tweetsCount;

        // Process and store
        console.log(`   💾 Processing ${tweetsCount} tweets...`);
        const stored = await processTweets(batches, trackedUsers);
        totalStored += stored;

        console.log(`   ✅ Stored ${stored} geo-tagged tweets`);

        // Show progress
        console.log(`   📊 Running total: ${totalStored} stored, ${totalProcessed} processed`);

        // Rate limiting between queries
        if (i < SEARCH_QUERIES.length - 1) {
          console.log(`   ⏳ Cooling down for 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

      } catch (error) {
        console.error(`   ❌ Query failed:`, error.message);
        continue;
      }
    }

    console.log('\n\n✅ DATA DUMP COMPLETE!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 FINAL STATISTICS:`);
    console.log(`   Tweets processed: ${totalProcessed.toLocaleString()}`);
    console.log(`   Geo-tagged stored: ${totalStored.toLocaleString()}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Create analytics snapshots
    console.log('📸 Creating analytics snapshots for temporal analysis...\n');
    for (const [username, userData] of Object.entries(trackedUsers)) {
      await createAnalyticsSnapshot(userData.id, username);
    }

    // Final database stats
    console.log('\n📈 Fetching final database statistics...\n');
    const dbClient = await database.pool.connect();

    const totalResult = await dbClient.query('SELECT COUNT(*) as count FROM user_posts');
    console.log(`📝 Total Posts in Database: ${parseInt(totalResult.rows[0].count).toLocaleString()}`);

    const geoResult = await dbClient.query('SELECT COUNT(*) as count FROM user_posts WHERE has_geo = true');
    console.log(`🗺️  Geo-tagged Posts: ${parseInt(geoResult.rows[0].count).toLocaleString()}`);

    const statesResult = await dbClient.query(`
      SELECT COUNT(DISTINCT geo_full_name) as count
      FROM user_posts
      WHERE has_geo = true AND geo_country_code = 'US';
    `);
    console.log(`🏛️  Unique US Locations: ${statesResult.rows[0].count}`);

    // Temporal analysis
    const temporalResult = await dbClient.query(`
      SELECT
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as posts,
        SUM(CASE WHEN author_account_age_days < 7 THEN 1 ELSE 0 END) as bot_suspects
      FROM user_posts
      WHERE has_geo = true
      GROUP BY hour
      ORDER BY hour DESC
      LIMIT 24;
    `);

    console.log('\n⏱️  Last 24 Hours Activity (Temporal Spikes):');
    temporalResult.rows.forEach(row => {
      const hour = new Date(row.hour).toLocaleString();
      const botRatio = (row.bot_suspects / row.posts * 100).toFixed(1);
      const spike = row.posts > 50 ? '📈 SPIKE' : '';
      console.log(`   ${hour}: ${row.posts} posts | Bot suspects: ${row.bot_suspects} (${botRatio}%) ${spike}`);
    });

    // Hot zones
    const hotZonesResult = await dbClient.query(`
      SELECT
        geo_full_name,
        COUNT(*) as posts,
        AVG(author_account_age_days) as avg_age,
        SUM(CASE WHEN author_account_age_days < 7 THEN 1 ELSE 0 END) as very_new
      FROM user_posts
      WHERE has_geo = true AND geo_full_name IS NOT NULL
      GROUP BY geo_full_name
      HAVING COUNT(*) >= 5
      ORDER BY very_new DESC, posts DESC
      LIMIT 15;
    `);

    console.log('\n🚨 TOP BOT FARM HOT ZONES (Sorted by suspicious activity):');
    hotZonesResult.rows.forEach((row, idx) => {
      const avgAge = Math.round(row.avg_age);
      const botScore = Math.min(Math.round((row.very_new / row.posts) * 100), 100);
      const warning = botScore > 50 ? '🔴 CRITICAL' : botScore > 20 ? '🟡 HIGH' : '🟢 LOW';
      console.log(`   ${idx + 1}. ${row.geo_full_name}`);
      console.log(`      Posts: ${row.posts} | Very New (<7d): ${row.very_new} | Avg Age: ${avgAge}d | Bot Score: ${botScore}% ${warning}`);
    });

    dbClient.release();

    console.log('\n🎉 Database is LOADED with historical data!');
    console.log('🔗 Visit https://xpulse.buzz to see the heat maps come alive!\n');

    await database.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    await database.close();
    process.exit(1);
  }
}

// Run it
massiveDataDump();
