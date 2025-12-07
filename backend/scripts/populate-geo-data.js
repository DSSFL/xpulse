import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { database } from '../src/database.js';

dotenv.config();

/**
 * Populate Database with Geographic Data
 * Fetches tweets from different US states to populate the bot farm heat map
 */

// Target users to track (we'll track mentions and activity around them)
const TARGET_USERS = ['ByronDonalds', 'elonmusk'];

// Search queries for different topics to get diverse geographic data
const SEARCH_QUERIES = [
  'politics has:geo place_country:US',
  'election has:geo place_country:US',
  'breaking has:geo place_country:US',
  'news has:geo place_country:US',
  'vote has:geo place_country:US',
  'congress has:geo place_country:US',
  'senate has:geo place_country:US',
  'government has:geo place_country:US',
];

/**
 * Analyze sentiment from tweet text
 */
function analyzeSentiment(text) {
  if (!text) return { sentiment: 'neutral', score: 0 };

  const lowerText = text.toLowerCase();

  const positiveWords = ['love', 'great', 'amazing', 'awesome', 'excellent', 'good', 'happy', 'wonderful', 'fantastic', 'best', 'thanks', 'thank', 'appreciate', 'support', 'agree', 'perfect', 'brilliant'];
  const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'worst', 'horrible', 'disgusting', 'shit', 'fuck', 'damn', 'sucks', 'angry', 'mad', 'disagree', 'wrong', 'fail', 'stupid', 'idiot', 'corrupt'];

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

/**
 * Calculate account age in days
 */
function getAccountAge(accountCreatedAt) {
  if (!accountCreatedAt) return null;
  const created = new Date(accountCreatedAt);
  const now = new Date();
  const diffMs = now - created;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Fetch and store geo-tagged tweets
 */
async function populateGeoData() {
  const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN).readOnly;
  let totalStored = 0;
  let tweetsProcessed = 0;

  try {
    console.log('🚀 Starting geographic data population...\n');

    // Test database connection
    console.log('🔌 Testing database connection...');
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Get tracked users from database
    console.log('📋 Getting tracked users...');
    const trackedUsers = {};

    for (const username of TARGET_USERS) {
      const user = await database.getTrackedUser(username);
      if (user) {
        trackedUsers[username.toLowerCase()] = user;
        console.log(`   ✅ Found tracked user: @${username} (ID: ${user.id})`);
      }
    }

    console.log(`\n🔍 Fetching geo-tagged tweets from across the US...\n`);

    // Fetch tweets for each search query
    for (const query of SEARCH_QUERIES) {
      console.log(`\n📥 Searching: "${query}"`);

      try {
        const result = await client.v2.search(query, {
          max_results: 100,
          'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'geo', 'referenced_tweets'],
          'user.fields': ['username', 'name', 'created_at', 'location', 'public_metrics'],
          expansions: ['author_id', 'geo.place_id', 'referenced_tweets.id'],
          'place.fields': ['full_name', 'country', 'country_code', 'geo', 'place_type']
        });

        if (!result?.data?.data) {
          console.log('   ⚠️  No results found');
          continue;
        }

        // Build maps
        const users = {};
        if (result.includes?.users) {
          result.includes.users.forEach(u => {
            users[u.id] = u;
          });
        }

        const places = {};
        if (result.includes?.places) {
          result.includes.places.forEach(p => {
            places[p.id] = p;
          });
        }

        let storedInQuery = 0;

        // Process each tweet
        for (const tweet of result.data.data) {
          tweetsProcessed++;

          const author = users[tweet.author_id];
          const place = tweet.geo?.place_id ? places[tweet.geo.place_id] : null;

          // Skip if no author or no place data
          if (!author || !place) continue;

          // Only process US tweets
          if (place.country_code !== 'US') continue;

          // Determine if this tweet mentions or relates to tracked users
          let trackedUserId = null;
          const tweetText = tweet.text.toLowerCase();

          for (const [username, userData] of Object.entries(trackedUsers)) {
            if (tweetText.includes(`@${username}`) || tweetText.includes(username)) {
              trackedUserId = userData.id;
              break;
            }
          }

          // If no tracked user mentioned, assign to first tracked user (ByronDonalds) as general political data
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

          const stored = await database.storePost(post, trackedUserId);
          if (stored) {
            storedInQuery++;
            totalStored++;

            // Show progress
            if (storedInQuery % 10 === 0) {
              console.log(`   📍 Stored ${storedInQuery} tweets with location data...`);
            }
          }
        }

        console.log(`   ✅ Stored ${storedInQuery} geo-tagged tweets from this query`);

        // Rate limiting - wait 2 seconds between queries
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`   ❌ Error with query "${query}":`, error.message);
        continue;
      }
    }

    console.log('\n✅ GEOGRAPHIC DATA POPULATION COMPLETE!\n');
    console.log(`📊 Summary:`);
    console.log(`   Total tweets processed: ${tweetsProcessed}`);
    console.log(`   Geo-tagged tweets stored: ${totalStored}`);
    console.log('');

    // Show geographic breakdown
    console.log('📍 Fetching geographic distribution...');
    const client2 = await database.pool.connect();
    const geoResult = await client2.query(`
      SELECT geo_full_name, COUNT(*) as count,
             SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
             SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
             SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
             AVG(author_account_age_days) as avg_account_age
      FROM user_posts
      WHERE has_geo = true AND geo_full_name IS NOT NULL
      GROUP BY geo_full_name
      ORDER BY count DESC
      LIMIT 20;
    `);
    client2.release();

    if (geoResult.rows.length > 0) {
      console.log('\n🗺️  Top 20 Locations:');
      geoResult.rows.forEach((row, idx) => {
        const accountAge = row.avg_account_age ? Math.round(row.avg_account_age) : 'N/A';
        console.log(`   ${idx + 1}. ${row.geo_full_name}`);
        console.log(`      Posts: ${row.count} | Sentiment: +${row.positive} =${row.neutral} -${row.negative} | Avg Account Age: ${accountAge}d`);
      });
    }

    console.log('\n🎉 Bot farm heat map is now populated with real geographic data!');
    console.log('🔗 Visit https://xpulse.buzz and search for ByronDonalds or ElonMusk to see the heat map!\n');

    await database.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    await database.close();
    process.exit(1);
  }
}

// Run the script
populateGeoData();
