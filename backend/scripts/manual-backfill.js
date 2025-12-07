import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { database } from '../src/database.js';
import { BackfillService } from '../src/backfillService.js';

dotenv.config();

/**
 * Manual Backfill Script
 * Usage: node scripts/manual-backfill.js <username>
 * Example: node scripts/manual-backfill.js ByronDonalds
 */

async function manualBackfill(username) {
  try {
    console.log('🚀 Starting manual backfill...');
    console.log(`👤 Target user: @${username}\n`);

    // Test database connection
    console.log('🔌 Testing database connection...');
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Initialize database schema
    console.log('🔧 Initializing database schema...');
    await database.initializeSchema();

    // Initialize Twitter client
    console.log('🐦 Initializing Twitter API client...');
    const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    const backfillService = new BackfillService(twitterClient);

    // Get user info
    console.log(`🔍 Fetching user info for @${username}...`);
    const userResponse = await twitterClient.readOnly.v2.userByUsername(username, {
      'user.fields': ['id', 'name', 'username', 'verified', 'profile_image_url', 'public_metrics', 'description', 'created_at']
    });

    if (!userResponse.data) {
      throw new Error(`User @${username} not found`);
    }

    const userInfo = userResponse.data;
    console.log(`✅ Found: ${userInfo.name} (@${userInfo.username})`);
    console.log(`   Followers: ${userInfo.public_metrics.followers_count.toLocaleString()}`);
    console.log(`   Account created: ${userInfo.created_at}\n`);

    // Store user in database
    console.log('💾 Storing user in database...');
    const dbUser = await database.upsertTrackedUser({
      username: userInfo.username,
      user_id: userInfo.id,
      display_name: userInfo.name,
      profile_image_url: userInfo.profile_image_url,
      verified: userInfo.verified || false,
      followers_count: userInfo.public_metrics.followers_count,
      following_count: userInfo.public_metrics.following_count,
      tweet_count: userInfo.public_metrics.tweet_count,
      description: userInfo.description || ''
    });
    console.log(`✅ User stored with ID: ${dbUser.id}\n`);

    // Start backfill
    console.log('📦 Starting backfill process...');
    console.log('   This will fetch:');
    console.log('   - Last 100 tweets from user');
    console.log('   - Last 100 mentions of user');
    console.log('');

    const tweetCount = await backfillService.backfillUser(
      userInfo.username,
      userInfo.id,
      dbUser.id
    );

    console.log('');
    console.log('✅ BACKFILL COMPLETE!');
    console.log(`📊 Total tweets stored: ${tweetCount}`);
    console.log('');

    // Show summary
    const posts = await database.getRecentPosts(username, 1000);
    const ownPosts = posts.filter(p => p.tweet_type === 'own_post').length;
    const mentions = posts.filter(p => p.tweet_type === 'mention').length;
    const replies = posts.filter(p => p.tweet_type === 'reply').length;
    const quotes = posts.filter(p => p.tweet_type === 'quote').length;

    console.log('📈 Breakdown:');
    console.log(`   Own posts: ${ownPosts}`);
    console.log(`   Mentions: ${mentions}`);
    console.log(`   Replies: ${replies}`);
    console.log(`   Quotes: ${quotes}`);
    console.log('');

    // Geographic breakdown
    const withGeo = posts.filter(p => p.has_geo);
    if (withGeo.length > 0) {
      console.log(`🗺️  Posts with location: ${withGeo.length}`);
      const locations = {};
      withGeo.forEach(p => {
        if (p.geo_full_name) {
          locations[p.geo_full_name] = (locations[p.geo_full_name] || 0) + 1;
        }
      });
      console.log('   Top locations:');
      Object.entries(locations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([loc, count]) => {
          console.log(`   - ${loc}: ${count} posts`);
        });
      console.log('');
    }

    // Sentiment breakdown
    const sentimentCounts = {
      positive: posts.filter(p => p.sentiment === 'positive').length,
      neutral: posts.filter(p => p.sentiment === 'neutral').length,
      negative: posts.filter(p => p.sentiment === 'negative').length
    };
    console.log('😊 Sentiment:');
    console.log(`   Positive: ${sentimentCounts.positive} (${(sentimentCounts.positive / posts.length * 100).toFixed(1)}%)`);
    console.log(`   Neutral: ${sentimentCounts.neutral} (${(sentimentCounts.neutral / posts.length * 100).toFixed(1)}%)`);
    console.log(`   Negative: ${sentimentCounts.negative} (${(sentimentCounts.negative / posts.length * 100).toFixed(1)}%)`);
    console.log('');

    console.log('🎉 Data is now available for real-time tracking!');
    console.log(`🔗 Try searching for "@${username}" on the website`);

    await database.close();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Backfill failed:', error.message);
    console.error(error);
    await database.close();
    process.exit(1);
  }
}

// Get username from command line
const username = process.argv[2];

if (!username) {
  console.error('❌ Error: Username required');
  console.error('Usage: node scripts/manual-backfill.js <username>');
  console.error('Example: node scripts/manual-backfill.js ByronDonalds');
  process.exit(1);
}

// Run backfill
manualBackfill(username);
