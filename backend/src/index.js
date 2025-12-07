import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

dotenv.config();

// Initialize X API v2 client
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
const roClient = twitterClient.readOnly;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['https://xpulse.buzz', 'https://www.xpulse.buzz', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: ['https://xpulse.buzz', 'https://www.xpulse.buzz', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Metrics tracking
let metrics = {
  tweetsPerMinute: 0,
  totalTweets: 0,
  sentiment: { positive: 0, neutral: 0, negative: 0 },
  velocity: 0,
  lastMinuteTweets: []
};

// Track processed tweets to avoid duplicates
const processedTweetIds = new Set();

// Simple sentiment analysis
function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();
  const positiveWords = ['amazing', 'great', 'awesome', 'love', 'excellent', 'incredible', 'fantastic', 'wonderful', 'breakthrough', 'innovation'];
  const negativeWords = ['terrible', 'bad', 'awful', 'hate', 'concern', 'worried', 'disaster', 'crisis', 'problem', 'issue'];

  let score = 0;
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score++;
  });
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score--;
  });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// Fetch real tweets from X API v2
async function fetchRealTweets() {
  try {
    console.log('🔍 Fetching real tweets from X API v2...');

    // Search for recent tweets about tech, AI, crypto, markets (trending topics)
    const searchQuery = '(tech OR AI OR crypto OR bitcoin OR market OR breaking) -is:retweet lang:en';

    const result = await roClient.v2.search(searchQuery, {
      max_results: 10,
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      'user.fields': ['username', 'name', 'profile_image_url', 'verified'],
      expansions: ['author_id']
    });

    // Check if we have tweets
    if (!result || !result.data || !result.data.data) {
      console.log('⚠️  No tweets returned from API');
      return;
    }

    // Extract users map
    const users = {};
    if (result.includes?.users) {
      result.includes.users.forEach(user => {
        users[user.id] = user;
      });
    }

    // Get tweets array
    const tweetsArray = Array.isArray(result.data.data) ? result.data.data : [result.data.data];

    // Process each tweet
    for (const tweet of tweetsArray) {
      // Skip if already processed
      if (processedTweetIds.has(tweet.id)) continue;

      processedTweetIds.add(tweet.id);

      // Get author info
      const author = users[tweet.author_id] || {
        username: 'unknown',
        name: 'Unknown User',
        profile_image_url: null,
        verified: false
      };

      // Analyze sentiment
      const sentiment = analyzeSentiment(tweet.text);

      // Update metrics
      metrics.totalTweets++;
      metrics.lastMinuteTweets.push(Date.now());

      if (sentiment === 'positive') metrics.sentiment.positive++;
      else if (sentiment === 'negative') metrics.sentiment.negative++;
      else metrics.sentiment.neutral++;

      // Broadcast to clients with enriched data
      io.emit('tweet:new', {
        id: tweet.id,
        text: tweet.text,
        author: {
          id: author.id,
          username: author.username,
          name: author.name,
          profile_image_url: author.profile_image_url,
          verified: author.verified || false
        },
        created_at: tweet.created_at,
        public_metrics: {
          like_count: tweet.public_metrics?.like_count || 0,
          retweet_count: tweet.public_metrics?.retweet_count || 0,
          reply_count: tweet.public_metrics?.reply_count || 0,
          impression_count: tweet.public_metrics?.impression_count || 0
        }
      });

      console.log(`✅ Broadcasted tweet from @${author.username}: ${tweet.text.substring(0, 50)}...`);
    }

    // Cleanup old IDs to prevent memory leak (keep last 1000)
    if (processedTweetIds.size > 1000) {
      const idsArray = Array.from(processedTweetIds);
      processedTweetIds.clear();
      idsArray.slice(-1000).forEach(id => processedTweetIds.add(id));
    }

  } catch (error) {
    console.error('❌ Error fetching tweets:', error.message);
    console.error('Error details:', error);
    if (error.code === 429) {
      console.log('⚠️  Rate limit reached. Waiting before next request...');
    }
  }
}

// Start real tweet stream
function startRealTweetStream() {
  console.log('🚀 Starting REAL X API v2 tweet stream...');
  console.log('📡 Using bearer token authentication');

  // Fetch immediately
  fetchRealTweets();

  // Then poll every 10 seconds (respects rate limits)
  setInterval(() => {
    fetchRealTweets();
  }, 10000);
}

// Calculate velocity every second
setInterval(() => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  metrics.lastMinuteTweets = metrics.lastMinuteTweets.filter(
    timestamp => timestamp > oneMinuteAgo
  );

  metrics.tweetsPerMinute = metrics.lastMinuteTweets.length;
  metrics.velocity = metrics.tweetsPerMinute;

  // Broadcast updated metrics
  io.emit('metrics:update', metrics);
}, 1000);

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    mode: 'REAL_X_API_V2',
    message: 'Backend running with REAL X API v2 data',
    totalTweets: metrics.totalTweets,
    processedTweets: processedTweetIds.size
  });
});

app.get('/api/metrics', (req, res) => {
  res.json(metrics);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id, 'from', socket.handshake.headers.origin);
  socket.emit('metrics:update', metrics);

  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 X Pulse Backend running on port ${PORT}`);
  console.log(`✅ Running in REAL X API v2 mode`);
  console.log(`✅ CORS enabled for: xpulse.buzz, www.xpulse.buzz`);
  console.log(`🔑 Bearer token configured: ${process.env.TWITTER_BEARER_TOKEN ? 'YES' : 'NO'}`);
  startRealTweetStream();
});
