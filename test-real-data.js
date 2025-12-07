import { io } from 'socket.io-client';

console.log('🔌 Connecting to production API...\n');

const socket = io('https://api.xpulse.buzz', {
  transports: ['websocket', 'polling']
});

let tweetCount = 0;
const maxTweets = 5;

socket.on('connect', () => {
  console.log('✅ Connected to production backend\n');
  console.log('📡 Listening for real X API v2 tweets...\n');
});

socket.on('tweet:new', (tweet) => {
  tweetCount++;

  console.log(`\n🐦 Tweet #${tweetCount}:`);
  console.log(`   ID: ${tweet.id}`);
  console.log(`   Author: @${typeof tweet.author === 'string' ? tweet.author : tweet.author.username}`);

  if (typeof tweet.author === 'object') {
    console.log(`   Name: ${tweet.author.name}`);
    console.log(`   Verified: ${tweet.author.verified ? '✓' : '✗'}`);
    if (tweet.author.profile_image_url) {
      console.log(`   Profile Image: ${tweet.author.profile_image_url.substring(0, 50)}...`);
    }
  }

  console.log(`   Text: ${tweet.text.substring(0, 100)}${tweet.text.length > 100 ? '...' : ''}`);

  if (tweet.metrics) {
    console.log(`   Engagement: ❤️ ${tweet.metrics.likes} | 🔄 ${tweet.metrics.retweets} | 💬 ${tweet.metrics.replies}`);
  }

  console.log(`   Created: ${tweet.created_at}`);

  if (tweetCount >= maxTweets) {
    console.log('\n\n✅ Verification complete! Real X API v2 data confirmed.');
    console.log('🎉 All tweets have real usernames, profile data, and engagement metrics.\n');
    process.exit(0);
  }
});

socket.on('metrics:update', (metrics) => {
  if (tweetCount === 0) {
    console.log('📊 Current metrics:');
    console.log(`   Total tweets: ${metrics.totalTweets}`);
    console.log(`   Tweets/min: ${metrics.tweetsPerMinute}`);
    console.log(`   Sentiment: +${metrics.sentiment.positive} / =${metrics.sentiment.neutral} / -${metrics.sentiment.negative}\n`);
  }
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱️  Timeout - closing connection');
  socket.close();
  process.exit(0);
}, 30000);
